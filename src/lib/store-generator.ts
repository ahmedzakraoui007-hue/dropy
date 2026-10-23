import type { SupabaseClient } from "@supabase/supabase-js";
import { themeHomeSections, themes } from "@/lib/themes";
import { themeLook } from "@/components/store-builder/editor/StylePanel";
import { buildPageTemplate, type PageTemplateKind } from "@/lib/store-page-templates";

export type StoreNiche = {
  id: string;
  themeId: string;
  keywords: string[];
};

export const STORE_NICHES: StoreNiche[] = [
  { id: "fashion", themeId: "bold", keywords: ["robe", "t-shirt", "jean", "pantalon", "chemise", "veste", "sneaker", "basket", "chaussure", "mode", "vêtement", "sweat", "hoodie", "sac"] },
  { id: "beauty", themeId: "glow", keywords: ["crème", "serum", "sérum", "parfum", "maquillage", "rouge", "mascara", "soin", "beauté", "shampoing", "huile"] },
  { id: "jewelry", themeId: "elegant", keywords: ["bijou", "collier", "bracelet", "bague", "boucle", "montre", "argent", "or", "perle", "accessoire", "sac"] },
  { id: "home", themeId: "modern", keywords: ["déco", "maison", "coussin", "lampe", "tapis", "cuisine", "rangement", "vase", "linge", "meuble"] },
  { id: "tech", themeId: "dark", keywords: ["chargeur", "câble", "coque", "support", "gadget", "led", "usb", "souris", "clavier", "gaming"] },
  { id: "electronics", themeId: "electro", keywords: ["écouteur", "casque", "enceinte", "bluetooth", "audio", "montre connectée", "smartwatch", "power bank", "batterie"] },
  { id: "sport", themeId: "pulse", keywords: ["sport", "fitness", "yoga", "haltère", "gourde", "legging", "brassière", "running", "musculation"] },
  { id: "craft", themeId: "artisan", keywords: ["artisanat", "poterie", "céramique", "fait main", "osier", "bois", "tapis", "laine", "terroir", "huile d'olive"] },
  { id: "general", themeId: "minimal", keywords: [] },
];

export const nicheTheme = (nicheId: string) => themes.find((t) => t.id === STORE_NICHES.find((n) => n.id === nicheId)?.themeId);

export function nicheScore(nicheId: string, text: string) {
  const niche = STORE_NICHES.find((n) => n.id === nicheId);
  if (!niche) return 0;
  const haystack = text.toLowerCase();
  return niche.keywords.reduce((score, word) => (haystack.includes(word) ? score + 1 : score), 0);
}

const GENERATED_PAGES: Exclude<PageTemplateKind, "blank">[] = ["shop", "about", "contact", "shipping_policy", "refund_policy", "terms_conditions"];

const EQUIVALENT_SLUGS: Record<string, string[]> = {
  shop: ["shop", "boutique"],
  about: ["a-propos", "about"],
  contact: ["contact"],
  shipping_policy: ["livraison", "shipping-policy"],
  refund_policy: ["retours", "refund-policy"],
  terms_conditions: ["cgv", "terms-conditions"],
};

type StoreRow = { id: string; theme_config: Record<string, any> | null };

export async function generateStore(
  supabase: SupabaseClient,
  store: StoreRow,
  options: { niche: string; lang: "fr" | "ar"; replaceHome: boolean; applyLook: boolean }
) {
  const theme = nicheTheme(options.niche);
  if (!theme) throw new Error("unknown_niche");

  const themeConfig = options.applyLook ? themeLook(theme, store.theme_config || {}) : store.theme_config || {};
  if (options.applyLook) {
    const { error: storeError } = await supabase.from("stores").update({ theme_config: themeConfig }).eq("id", store.id);
    if (storeError) throw storeError;
  }

  const { data: pages, error: pagesError } = await supabase
    .from("store_pages")
    .select("id, slug, is_homepage, sections, sort_order")
    .eq("store_id", store.id);
  if (pagesError) throw pagesError;

  const homeSections = themeHomeSections(theme, options.lang).map((s: any, position: number) => ({
    ...s,
    id: crypto.randomUUID(),
    position,
    is_visible: true,
  }));
  const home = (pages || []).find((p) => p.is_homepage) || (pages || []).find((p) => p.slug === "home");
  let homeReplaced = false;
  if (!home) {
    const { error } = await supabase.from("store_pages").insert({
      store_id: store.id,
      slug: "home",
      title: options.lang === "ar" ? "الرئيسية" : "Accueil",
      page_type: "content",
      sections: homeSections,
      is_published: true,
      is_homepage: true,
      show_in_navigation: true,
      sort_order: 0,
    });
    if (error) throw error;
    homeReplaced = true;
  } else if (options.replaceHome || !Array.isArray(home.sections) || home.sections.length === 0) {
    const { error } = await supabase.from("store_pages").update({ sections: homeSections }).eq("id", home.id);
    if (error) throw error;
    homeReplaced = true;
  }

  const existing = new Set((pages || []).map((p) => p.slug));
  let sortOrder = Math.max(0, ...(pages || []).map((p) => Number(p.sort_order) || 0)) + 1;
  const created: string[] = [];
  for (const kind of GENERATED_PAGES) {
    if (EQUIVALENT_SLUGS[kind].some((slug) => existing.has(slug))) continue;
    const page = buildPageTemplate(kind, options.lang);
    const { error } = await supabase.from("store_pages").insert({
      store_id: store.id,
      slug: page.slug,
      title: page.title,
      page_type: kind === "shop" ? "shop" : "content",
      sections: page.sections,
      is_published: true,
      is_homepage: false,
      show_in_navigation: page.showInMenu,
      sort_order: sortOrder++,
    });
    if (error) throw error;
    created.push(page.slug);
  }

  return { themeId: theme.id, themeConfig, homeReplaced, pagesCreated: created.length };
}
