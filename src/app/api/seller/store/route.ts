import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { requireUser } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/store-slug";

export async function POST() {
  const auth = await requireUser(["seller", "admin"]);
  if (!auth.ok) return auth.response;

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("stores")
    .select("id, slug, name")
    .eq("vendor_id", auth.user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existing) {
    const { count } = await admin
      .from("store_pages")
      .select("id", { count: "exact", head: true })
      .eq("store_id", existing.id);
    if (!count) {
      const { error: pagesError } = await admin.rpc("create_default_store_pages", {
        p_store_id: existing.id,
        p_vendor_slug: existing.slug,
        p_store_name: existing.name,
      });
      if (pagesError) console.error("Default pages failed:", pagesError);
    }
    return NextResponse.json({ store: { id: existing.id, slug: existing.slug }, created: false });
  }

  const { data: profile } = await admin.from("profiles").select("full_name, email").eq("id", auth.user.id).maybeSingle();
  const name = `${profile?.full_name || profile?.email?.split("@")[0] || "Ma"} Shop`;
  const slug = `${slugify(name) || "boutique"}-${randomBytes(3).toString("hex")}`;

  const { data: store, error } = await admin
    .from("stores")
    .insert({ vendor_id: auth.user.id, name, slug, is_active: true })
    .select("id, slug")
    .single();
  if (error || !store) {
    console.error("Store creation failed:", error);
    return NextResponse.json({ error: "Impossible de créer la boutique" }, { status: 500 });
  }

  const { error: pagesError } = await admin.rpc("create_default_store_pages", {
    p_store_id: store.id,
    p_vendor_slug: slug,
    p_store_name: name,
  });
  if (pagesError) console.error("Default pages failed:", pagesError);

  return NextResponse.json({ store, created: true });
}
