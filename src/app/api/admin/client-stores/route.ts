import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { storeUrl } from "@/lib/store-url";

export async function GET() {
  const auth = await requireUser(["admin"]);
  if (!auth.ok) return auth.response;
  const admin = createAdminClient();
  const { data: stores } = await admin
    .from("stores")
    .select("id, name, slug, vendor_id, is_active, handed_over_at, created_at, logo_url")
    .not("agency_created_by", "is", null)
    .order("created_at", { ascending: false });
  const vendorIds = (stores || []).map((s) => s.vendor_id);
  const storeIds = (stores || []).map((s) => s.id);
  const [{ data: owners }, { data: products }] = await Promise.all([
    vendorIds.length ? admin.from("profiles").select("id, email, full_name, phone").in("id", vendorIds) : Promise.resolve({ data: [] as any[] }),
    storeIds.length ? admin.from("store_products").select("store_id").in("store_id", storeIds) : Promise.resolve({ data: [] as any[] }),
  ]);
  const ownerMap = new Map((owners || []).map((o: any) => [o.id, o]));
  const counts = new Map<string, number>();
  for (const p of products || []) counts.set(p.store_id, (counts.get(p.store_id) || 0) + 1);
  return NextResponse.json({
    stores: (stores || []).map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      url: storeUrl(s.slug),
      logo_url: s.logo_url,
      online: s.is_active,
      handed_over_at: s.handed_over_at,
      created_at: s.created_at,
      products: counts.get(s.id) || 0,
      owner: ownerMap.get(s.vendor_id) || null,
    })),
  });
}
