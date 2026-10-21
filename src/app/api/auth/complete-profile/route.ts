import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const ROLES = ["seller", "supplier", "creator"] as const;
type Role = (typeof ROLES)[number];

export async function POST(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  const { user } = auth;

  const body = await request.json().catch(() => null);
  const role = body?.role as Role;
  const fullName = String(body?.fullName || "").trim();
  const phone = String(body?.phone || "").trim();
  const extra = body?.additionalData || {};

  if (!ROLES.includes(role) || !fullName) {
    return NextResponse.json({ code: "invalid_request", error: "Invalid request" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: profile } = await supabase.from("profiles").select("role, status").eq("id", user.id).maybeSingle();

  if (profile && profile.role && profile.role !== role) {
    return NextResponse.json({ code: "role_mismatch", error: "This account already has another role" }, { status: 409 });
  }

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: user.id,
    email: user.email,
    full_name: fullName,
    phone: phone || null,
    role,
    status: profile?.status && profile.status !== "pending" ? profile.status : "pending",
    updated_at: new Date().toISOString(),
  });
  if (profileError) {
    console.error("complete-profile profile error:", profileError);
    return NextResponse.json({ code: "failed", error: "Could not save profile" }, { status: 500 });
  }

  if (role === "creator" || role === "supplier") {
    const table = role === "creator" ? "creator_profiles" : "supplier_profiles";
    const row =
      role === "creator"
        ? {
            user_id: user.id,
            portfolio_url: String(extra.portfolio || ""),
            instagram_username: String(extra.instagram || ""),
            instagram_handle: String(extra.instagram || "").replace("@", ""),
            specialty: String(extra.specialty || ""),
            specialties: extra.specialty ? [String(extra.specialty)] : [],
          }
        : {
            user_id: user.id,
            company_name: String(extra.companyName || ""),
            tax_id: String(extra.taxId || ""),
            product_type: String(extra.productType || ""),
          };

    const { data: existing } = await supabase.from(table).select("id").eq("user_id", user.id).limit(1).maybeSingle();
    const { error } = existing
      ? await supabase.from(table).update(row).eq("id", existing.id)
      : await supabase.from(table).insert({ ...row, status: "pending" });
    if (error) {
      console.error(`complete-profile ${table} error:`, error);
      return NextResponse.json({ code: "failed", error: "Could not save profile" }, { status: 500 });
    }
  } else {
    const { data: store } = await supabase.from("stores").select("id").eq("vendor_id", user.id).limit(1).maybeSingle();
    if (!store) {
      const storeName = String(extra.storeName || "Ma Boutique").slice(0, 80);
      const slug = storeName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "boutique";
      const { error } = await supabase.from("stores").insert({
        vendor_id: user.id,
        name: storeName,
        slug: `${slug}-${Math.floor(Math.random() * 100000)}`,
        is_active: false,
      });
      if (error) {
        console.error("complete-profile store error:", error);
        return NextResponse.json({ code: "failed", error: "Could not create store" }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ success: true });
}
