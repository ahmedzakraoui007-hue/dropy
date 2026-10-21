import { rateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendConfirmationEmail } from "@/lib/mail";
import { confirmLink } from "@/lib/auth-links";

const ALLOWED_ROLES = ["seller", "supplier", "creator"] as const;
type Role = (typeof ALLOWED_ROLES)[number];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function fail(code: string, error: string, status = 400) {
  return NextResponse.json({ code, error }, { status });
}

export async function POST(req: Request) {
  const limited = rateLimit(req, "signup", 5, 3600);
  if (limited) return limited;
  try {
    const body = await req.json().catch(() => null);
    if (!body) return fail("invalid_request", "Invalid request body");

    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const fullName = String(body.fullName || "").trim();
    const phone = body.phone ? String(body.phone).trim() : null;
    const role = body.role as Role;
    const additionalData = body.additionalData || {};

    if (!EMAIL_REGEX.test(email)) return fail("invalid_email", "Invalid email address");
    if (password.length < 8) return fail("weak_password", "Password must be at least 8 characters");
    if (!fullName) return fail("missing_name", "Full name is required");
    if (!ALLOWED_ROLES.includes(role)) return fail("invalid_role", "Invalid role");

    const supabase = createAdminClient();
    const metadata = { full_name: fullName, phone, role };

    let userId: string;
    let hashedToken: string;
    let verificationType: string;
    let isNewUser = true;

    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "signup",
      email,
      password,
      options: { data: metadata },
    });

    if (linkError) {
      const alreadyExists =
        linkError.code === "email_exists" ||
        linkError.code === "user_already_exists" ||
        /already (been )?registered/i.test(linkError.message);

      if (!alreadyExists) {
        console.error("Signup generateLink error:", linkError);
        return fail("signup_failed", linkError.message, 500);
      }

      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (!existingProfile) return fail("email_exists", "An account already exists with this email");

      const { data: existing } = await supabase.auth.admin.getUserById(existingProfile.id);
      if (!existing?.user || existing.user.email_confirmed_at) {
        return fail("email_exists", "An account already exists with this email");
      }

      const { error: updateError } = await supabase.auth.admin.updateUserById(existing.user.id, {
        password,
        user_metadata: metadata,
      });
      if (updateError) return fail("signup_failed", updateError.message, 500);

      const { data: resendLink, error: resendError } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email,
      });
      if (resendError || !resendLink?.properties) {
        return fail("signup_failed", resendError?.message || "Could not generate confirmation link", 500);
      }

      userId = existing.user.id;
      hashedToken = resendLink.properties.hashed_token;
      verificationType = resendLink.properties.verification_type;
      isNewUser = false;
    } else {
      if (!linkData?.user || !linkData.properties) {
        return fail("signup_failed", "User creation failed", 500);
      }
      userId = linkData.user.id;
      hashedToken = linkData.properties.hashed_token;
      verificationType = linkData.properties.verification_type;
    }

    const confirmUrl = confirmLink(req, hashedToken, verificationType);

    try {
      await sendConfirmationEmail(email, confirmUrl);
    } catch (mailError) {
      console.error("Signup confirmation email failed:", mailError);
      if (isNewUser) await supabase.auth.admin.deleteUser(userId);
      return fail("email_send_failed", "Could not send the confirmation email", 502);
    }

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: userId,
      email,
      full_name: fullName,
      phone,
      role,
      status: "pending",
    });
    if (profileError) console.error("Profile error:", profileError);

    if (role === "creator" || role === "supplier") {
      const table = role === "creator" ? "creator_profiles" : "supplier_profiles";
      const row =
        role === "creator"
          ? {
              user_id: userId,
              portfolio_url: additionalData.portfolio || "",
              instagram_username: additionalData.instagram || "",
              instagram_handle: (additionalData.instagram || "").replace("@", ""),
              specialty: additionalData.specialty || "",
              specialties: additionalData.specialty ? [additionalData.specialty] : [],
              status: "pending",
            }
          : {
              user_id: userId,
              company_name: additionalData.companyName || "",
              tax_id: additionalData.taxId || "",
              product_type: additionalData.productType || "",
              status: "pending",
            };

      const { data: existingRow } = await supabase
        .from(table)
        .select("user_id")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();

      const { error } = existingRow
        ? await supabase.from(table).update(row).eq("user_id", userId)
        : await supabase.from(table).insert(row);
      if (error) console.error(`${table} error:`, error);
    } else if (role === "seller") {
      const { data: existingStore } = await supabase
        .from("stores")
        .select("id")
        .eq("vendor_id", userId)
        .limit(1)
        .maybeSingle();

      if (!existingStore) {
        const storeName = additionalData.storeName || "Ma Boutique";
        const slug = storeName.toLowerCase().replace(/[^a-z0-9]/g, "-");
        const { error } = await supabase.from("stores").insert({
          vendor_id: userId,
          name: storeName,
          slug: `${slug}-${Math.floor(Math.random() * 100000)}`,
          is_active: false,
        });
        if (error) console.error("Store creation error:", error);
      }
    }

    return NextResponse.json({ success: true, user: { id: userId } });
  } catch (error: any) {
    console.error("Signup API error:", error);
    return fail("signup_failed", error?.message || "Unexpected error", 500);
  }
}
