import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { submitToIndexNow } from "@/lib/indexnow";
import { rateLimit } from "@/lib/rate-limit";
import { SITE_URL, storeUrl } from "@/lib/store-url";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SYSTEM_PAGES = new Set(["home", "checkout", "cart", "panier", "merci", "track", "product-detail"]);
const recent = new Map<string, number>();
const THROTTLE_MS = 10 * 60 * 1000;

type Admin = ReturnType<typeof createAdminClient>;
type StoreRow = { id: string; slug: string; is_active: boolean | null; custom_domain: string | null; custom_domain_status: string | null };

async function publicStore(admin: Admin, storeId: string) {
  const { data } = await admin.from("stores").select("id, slug, is_active, custom_domain, custom_domain_status").eq("id", storeId).maybeSingle();
  const store = data as StoreRow | null;
  if (!store || store.is_active === false) return null;
  return { store, url: (path = "") => storeUrl(store.slug, path, store.custom_domain_status === "active" ? store.custom_domain : null) };
}

async function urlsFor(admin: Admin, type: string, id: string): Promise<string[]> {
  if (type === "product") {
    const { data } = await admin.from("store_products").select("id, store_id, is_active").eq("id", id).maybeSingle();
    if (!data?.is_active) return [];
    const ctx = await publicStore(admin, data.store_id);
    return ctx ? [ctx.url(`/p/${data.id}`)] : [];
  }
  if (type === "page") {
    const { data } = await admin.from("store_pages").select("store_id, slug, is_published, is_homepage, no_index").eq("id", id).maybeSingle();
    if (!data?.is_published || data.no_index || !data.store_id) return [];
    const ctx = await publicStore(admin, data.store_id);
    if (!ctx) return [];
    return [data.is_homepage || SYSTEM_PAGES.has(data.slug) ? ctx.url() : ctx.url(`/${data.slug}`)];
  }
  if (type === "store") {
    const ctx = await publicStore(admin, id);
    return ctx ? [ctx.url(), ctx.url("/llms.txt")] : [];
  }
  if (type === "post") {
    const { data } = await admin.from("blog_posts").select("slug, status, published_at").eq("id", id).maybeSingle();
    if (!data || data.status !== "published" || (data.published_at && new Date(data.published_at) > new Date())) return [];
    return [`${SITE_URL}/blog/${data.slug}`, `${SITE_URL}/blog`];
  }
  return [];
}

export async function POST(request: Request) {
  const limited = rateLimit(request, "indexnow", 120, 60);
  if (limited) return limited;
  const body = await request.json().catch(() => null);
  const type = String(body?.type || "");
  const id = String(body?.id || "");
  if (!["product", "page", "store", "post"].includes(type) || !UUID.test(id)) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const key = `${type}:${id}`;
  const now = Date.now();
  if ((recent.get(key) || 0) > now - THROTTLE_MS) return NextResponse.json({ skipped: "throttled" });
  if (recent.size > 5000) recent.clear();
  recent.set(key, now);

  const urls = await urlsFor(createAdminClient(), type, id);
  if (!urls.length) return NextResponse.json({ submitted: 0 });
  const results = await submitToIndexNow(urls);
  return NextResponse.json({ submitted: urls.length, results });
}
