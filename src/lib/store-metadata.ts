import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import { storeUrl } from "@/lib/store-url";
import { createAdminClient } from "@/lib/supabase/admin";

function anonClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
}

export function plainText(html: string | null | undefined, max = 160) {
  const text = (html || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

const TOKEN = /^[A-Za-z0-9_-]{8,100}$/;

function storeVerification(store: { google_site_verification?: string | null; facebook_domain_verification?: string | null }): Metadata["verification"] {
  const google = store.google_site_verification?.trim();
  const facebook = store.facebook_domain_verification?.trim();
  const result: NonNullable<Metadata["verification"]> = {};
  if (google && TOKEN.test(google)) result.google = google;
  if (facebook && TOKEN.test(facebook)) result.other = { "facebook-domain-verification": facebook };
  return Object.keys(result).length ? result : undefined;
}

export async function loadStoreProduct(storeSlug: string, productId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(productId)) return null;
  const supabase = anonClient();
  const { data: store } = await supabase
    .from("stores")
    .select("id, name, slug, logo_url, is_active, custom_domain, custom_domain_status")
    .eq("slug", storeSlug)
    .maybeSingle();
  if (!store || store.is_active === false) return null;
  const { data: product } = await supabase
    .from("store_products")
    .select("id, name, description, images, selling_price, stock_quantity, is_active")
    .eq("store_id", store.id)
    .eq("id", productId)
    .eq("is_active", true)
    .maybeSingle();
  return product ? { store, product } : null;
}

export async function storeSlugExists(storeSlug: string) {
  const { data } = await createAdminClient().from("stores").select("id").eq("slug", storeSlug).maybeSingle();
  return Boolean(data);
}

export async function storeMetadata(storeSlug: string, path: string[] = []): Promise<Metadata> {
  const supabase = anonClient();
  const { data: store } = await supabase
    .from("stores")
    .select("id, name, description, seo_title, seo_description, logo_url, is_active, google_site_verification, facebook_domain_verification, storefront_language, custom_domain, custom_domain_status")
    .eq("slug", storeSlug)
    .maybeSingle();
  if (!store) return { title: { absolute: "Page introuvable | Dropy" }, robots: { index: false, follow: false } };

  const offline = store.is_active === false;
  const arabic = store.storefront_language === "ar";
  const domain = store.custom_domain_status === "active" ? store.custom_domain : null;
  const locale = arabic ? "ar_TN" : "fr_TN";
  const verification = storeVerification(store);
  const robots = offline ? { index: false, follow: false } : undefined;
  const [first, second] = path;

  if (first === "p" && second) {
    const result = await loadStoreProduct(storeSlug, second);
    if (result) {
      const { product } = result;
      const title = `${product.name} | ${store.name}`;
      const price = Number(product.selling_price || 0).toFixed(3).replace(".", ",");
      const description =
        plainText(product.description) ||
        (arabic
          ? `${product.name} بسعر ${price} د.ت لدى ${store.name}. الدفع عند الاستلام في كل ولايات تونس.`
          : `${product.name} à ${price} DT chez ${store.name}. Paiement à la livraison partout en Tunisie.`);
      const image = product.images?.[0] || store.logo_url || undefined;
      const url = storeUrl(storeSlug, `/p/${product.id}`, domain);
      return {
        title: { absolute: title },
        description,
        alternates: { canonical: url },
        openGraph: { title, description, url, siteName: store.name, images: image ? [image] : undefined, type: "website", locale },
        twitter: { card: "summary_large_image", title, description, images: image ? [image] : undefined },
        icons: store.logo_url ? { icon: store.logo_url } : undefined,
        robots,
        verification,
      };
    }
  }

  let page: { title?: string | null; seo_title?: string | null; seo_description?: string | null; seo_image?: string | null; no_index?: boolean | null } | null = null;
  if (first && first !== "p") {
    const { data } = await supabase
      .from("store_pages")
      .select("title, seo_title, seo_description, seo_image, no_index")
      .eq("store_id", store.id)
      .eq("slug", first)
      .eq("is_published", true)
      .maybeSingle();
    page = data;
  }

  const storeTitle = store.seo_title || store.name;
  const title = page ? page.seo_title || `${page.title} | ${store.name}` : storeTitle;
  const description = page?.seo_description || store.seo_description || plainText(store.description) || (arabic ? `اكتشف متجر ${store.name}. الدفع عند الاستلام في كل ولايات تونس.` : `Découvrez la boutique ${store.name}. Paiement à la livraison partout en Tunisie.`);
  const image = page?.seo_image || store.logo_url || undefined;
  const url = storeUrl(storeSlug, page && first !== "home" ? `/${first}` : "", domain);

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: store.name, images: image ? [image] : undefined, type: "website", locale },
    robots: page?.no_index ? { index: false, follow: false } : robots,
    icons: store.logo_url ? { icon: store.logo_url } : undefined,
    verification,
  };
}
