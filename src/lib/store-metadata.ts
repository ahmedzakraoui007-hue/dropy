import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";

export async function storeMetadata(storeSlug: string, pageSlug?: string): Promise<Metadata> {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
  const { data: store } = await supabase
    .from("stores")
    .select("id, name, description, seo_title, seo_description, logo_url")
    .eq("slug", storeSlug)
    .maybeSingle();
  if (!store) return { title: "Boutique introuvable" };

  let page: { title?: string | null; seo_title?: string | null; seo_description?: string | null; seo_image?: string | null; no_index?: boolean | null } | null = null;
  if (pageSlug) {
    const { data } = await supabase
      .from("store_pages")
      .select("title, seo_title, seo_description, seo_image, no_index")
      .eq("store_id", store.id)
      .eq("slug", pageSlug)
      .eq("is_published", true)
      .maybeSingle();
    page = data;
  }

  const storeTitle = store.seo_title || store.name;
  const title = page ? page.seo_title || `${page.title} | ${store.name}` : storeTitle;
  const description = page?.seo_description || store.seo_description || store.description || `Découvrez la boutique ${store.name}.`;
  const image = page?.seo_image || store.logo_url || undefined;

  return {
    title: { absolute: title },
    description,
    openGraph: { title, description, siteName: store.name, images: image ? [image] : undefined, type: "website" },
    robots: page?.no_index ? { index: false, follow: false } : undefined,
    icons: store.logo_url ? { icon: store.logo_url } : undefined,
  };
}
