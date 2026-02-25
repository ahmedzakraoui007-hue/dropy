import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const { email, password, fullName, phone, role, additionalData, lang = "fr" } = await req.json();

    const supabase = createAdminClient();

    // 1. Create user with admin client to ensure metadata is set correctly
    // We use admin client because we need to bypass some client-side restrictions if any
    const { data: { user }, error: signUpError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // User must confirm their email
      user_metadata: {
        full_name: fullName,
        phone,
        role,
      },
    });

    if (signUpError) {
      return NextResponse.json({ error: signUpError.message }, { status: 400 });
    }

    if (!user) {
      return NextResponse.json({ error: "User creation failed" }, { status: 500 });
    }

    // 2. Send confirmation email via Resend
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email: email,
      options: {
        redirectTo: `${new URL(req.url).origin}/auth/callback?next=/demande-en-attente`,
      }
    });

    if (linkError) {
      console.error("Error generating confirmation link:", linkError);
    } else if (linkData?.properties?.action_link) {
      const { sendConfirmationEmail } = await import("@/lib/mail");
      await sendConfirmationEmail(email, linkData.properties.action_link);
    }

    // 4. Create profile and role-specific data
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: user.id,
      email,
      full_name: fullName,
      phone,
      role,
      status: "pending",
    });

    if (profileError) console.error("Profile error:", profileError);

    if (role === "creator") {
      await supabase.from("creator_profiles").upsert({
        user_id: user.id,
        portfolio_url: additionalData?.portfolio || "",
        instagram_username: additionalData?.instagram || "",
        instagram_handle: (additionalData?.instagram || "").replace("@", ""),
        specialty: additionalData?.specialty || "",
        specialties: additionalData?.specialty ? [additionalData.specialty] : [],
        status: "pending"
      });
    } else if (role === "supplier") {
      await supabase.from("supplier_profiles").upsert({
        user_id: user.id,
        company_name: additionalData?.companyName || "",
        tax_id: additionalData?.taxId || "",
        product_type: additionalData?.productType || "",
        status: "pending"
      });
    } else if (role === "seller") {
      const storeName = additionalData?.storeName || "Ma Boutique";
      const slug = storeName.toLowerCase().replace(/[^a-z0-9]/g, "-");
      await supabase.from("stores").insert({
        seller_id: user.id,
        name: storeName,
        slug: `${slug}-${Math.floor(Math.random() * 1000)}`,
        is_active: true
      });
    }

    return NextResponse.json({ success: true, user: { id: user.id } });
  } catch (error: any) {
    console.error("Signup API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
