import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { SITE_URL, STORE_ROOT_DOMAIN, isPlatformHost, storeSlugFromHost, storeUrl } from "@/lib/store-url";
import { storeSlugForHost } from "@/lib/custom-domain-lookup";
import { publishedPosts } from "@/lib/blog";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

const LANDING_PAGES = [
  "",
  "/vendeurs",
  "/fournisseurs",
  "/createurs",
  "/tarifs",
  "/a-propos",
  "/contact",
  "/faq",
  "/aide",
  "/carrieres",
  "/conditions-utilisation",
  "/politique-confidentialite",
  "/mentions-legales",
  "/blog",
];

const SYSTEM_PAGES = new Set(["checkout", "cart", "panier", "merci", "track", "product-detail"]);

function anonClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
}

async function storeEntries(slugs?: string[]): Promise<MetadataRoute.Sitemap> {
  const supabase = anonClient();
  let query = supabase.from("stores").select("id, slug, created_at, custom_domain, custom_domain_status").eq("is_active", true);
  if (slugs) query = query.in("slug", slugs);
  const { data: stores } = await query;
  if (!stores?.length) return [];

  const ids = stores.map((s) => s.id);
  const [{ data: pages }, { data: products }] = await Promise.all([
    supabase.from("store_pages").select("store_id, slug, is_homepage, updated_at").in("store_id", ids).eq("is_published", true),
    supabase.from("store_products").select("id, store_id, created_at").in("store_id", ids).eq("is_active", true),
  ]);

  const entries: MetadataRoute.Sitemap = [];
  for (const store of stores) {
    if (!(products || []).some((p) => p.store_id === store.id)) continue;
    const domain = store.custom_domain_status === "active" ? store.custom_domain : null;
    entries.push({ url: storeUrl(store.slug, "", domain), changeFrequency: "daily", priority: 0.7 });
    for (const page of (pages || []).filter((p) => p.store_id === store.id)) {
      if (page.is_homepage || page.slug === "home" || SYSTEM_PAGES.has(page.slug)) continue;
      entries.push({
        url: storeUrl(store.slug, `/${page.slug}`, domain),
        lastModified: page.updated_at ? new Date(page.updated_at) : undefined,
        changeFrequency: "weekly",
        priority: 0.5,
      });
    }
    for (const product of (products || []).filter((p) => p.store_id === store.id)) {
      entries.push({
        url: storeUrl(store.slug, `/p/${product.id}`, domain),
        lastModified: product.created_at ? new Date(product.created_at) : undefined,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  }
  return entries;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const host = (await headers()).get("host");
  const storeSlug = await storeSlugForHost(host, storeSlugFromHost, isPlatformHost);
  if (storeSlug) return storeEntries([storeSlug]);

  const now = new Date();
  const landing: MetadataRoute.Sitemap = LANDING_PAGES.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.8,
  }));

  const posts = (await publishedPosts(1000)).map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.updated_at),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return STORE_ROOT_DOMAIN ? [...landing, ...posts] : [...landing, ...posts, ...(await storeEntries())];
}
