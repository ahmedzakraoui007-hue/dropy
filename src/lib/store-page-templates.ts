import { getPlaceholderConfig } from "@/lib/builder-sections";
import { PAGE_TITLES_AR } from "@/lib/builder-sections-ar";

export type PageTemplateKind =
  | "shop"
  | "about"
  | "contact"
  | "faq"
  | "shipping_policy"
  | "refund_policy"
  | "privacy_policy"
  | "terms_conditions"
  | "blank";

export const PAGE_TEMPLATE_KINDS: PageTemplateKind[] = [
  "shop",
  "about",
  "contact",
  "faq",
  "shipping_policy",
  "refund_policy",
  "privacy_policy",
  "terms_conditions",
];

type TemplatePage = { slug: string; title: string; showInMenu: boolean; sections: { type: string; config?: Record<string, any> }[] };

const TEMPLATES: Record<Exclude<PageTemplateKind, "blank">, TemplatePage> = {
  shop: {
    slug: "shop",
    title: "Boutique",
    showInMenu: true,
    sections: [{ type: "products", config: { title: "Tous nos produits", limit: 48, columns: 4 } }, { type: "trust_badges" }, { type: "footer" }],
  },
  about: {
    slug: "a-propos",
    title: "À propos",
    showInMenu: true,
    sections: [{ type: "about" }, { type: "image_with_text" }, { type: "trust_badges" }, { type: "footer" }],
  },
  contact: {
    slug: "contact",
    title: "Contact",
    showInMenu: true,
    sections: [{ type: "contact" }, { type: "faq" }, { type: "footer" }],
  },
  faq: {
    slug: "faq",
    title: "FAQ",
    showInMenu: true,
    sections: [{ type: "faq" }, { type: "contact" }, { type: "footer" }],
  },
  shipping_policy: {
    slug: "livraison",
    title: "Livraison",
    showInMenu: false,
    sections: [{ type: "shipping_policy" }, { type: "footer" }],
  },
  refund_policy: {
    slug: "retours",
    title: "Retours et échanges",
    showInMenu: false,
    sections: [{ type: "refund_policy" }, { type: "footer" }],
  },
  privacy_policy: {
    slug: "confidentialite",
    title: "Confidentialité",
    showInMenu: false,
    sections: [{ type: "privacy_policy" }, { type: "footer" }],
  },
  terms_conditions: {
    slug: "cgv",
    title: "Conditions générales",
    showInMenu: false,
    sections: [{ type: "terms_conditions" }, { type: "footer" }],
  },
};

export function makeSection(type: string, config?: Record<string, any>, lang: "fr" | "ar" = "fr") {
  return { id: crypto.randomUUID(), type, config: { ...getPlaceholderConfig(type, lang), ...(config || {}) }, position: 0, is_visible: true };
}

export function buildPageTemplate(kind: Exclude<PageTemplateKind, "blank">, lang: "fr" | "ar" = "fr") {
  const template = TEMPLATES[kind];
  const overrides = (s: { type: string; config?: Record<string, any> }) =>
    lang === "ar" && kind === "shop" && s.type === "products" ? { ...s.config, title: PAGE_TITLES_AR.all_products } : s.config;
  return {
    slug: template.slug,
    title: lang === "ar" ? PAGE_TITLES_AR[kind] || template.title : template.title,
    showInMenu: template.showInMenu,
    sections: template.sections.map((s, position) => ({ ...makeSection(s.type, overrides(s), lang), position })),
  };
}
