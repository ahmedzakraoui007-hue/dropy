export type Field =
  | { key: string; kind: "text" | "textarea" | "richtext" | "image" | "link" | "color" | "datetime" | "url" | "icon" }
  | { key: string; kind: "select"; options: string[] }
  | { key: string; kind: "number"; min: number; max: number; step?: number }
  | { key: string; kind: "switch" }
  | { key: string; kind: "list"; fields: Field[]; item: Record<string, any>; titleKey: string; max?: number };

const text = (key: string): Field => ({ key, kind: "text" });
const area = (key: string): Field => ({ key, kind: "textarea" });
const link = (key: string): Field => ({ key, kind: "link" });
const image = (key: string): Field => ({ key, kind: "image" });
const columns: Field = { key: "columns", kind: "select", options: ["2", "3", "4"] };

const policy: Field[] = [text("title"), { key: "content", kind: "richtext" }];

export const SECTION_SCHEMAS: Record<string, Field[]> = {
  hero: [
    { key: "variant", kind: "select", options: ["classic", "split", "bold"] },
    text("badge"),
    text("title"),
    area("subtitle"),
    image("backgroundImage"),
    text("ctaText"),
    link("ctaLink"),
    { key: "textPosition", kind: "select", options: ["left", "center", "right"] },
    { key: "height", kind: "number", min: 360, max: 900, step: 20 },
    { key: "overlay", kind: "number", min: 0, max: 0.8, step: 0.1 },
  ],
  promo_banner: [area("text"), link("link"), { key: "backgroundColor", kind: "color" }, { key: "textColor", kind: "color" }],
  cta_banner: [text("title"), area("description"), text("ctaText"), link("ctaLink")],
  countdown: [text("title"), text("message"), { key: "endDate", kind: "datetime" }, text("ctaText"), link("ctaLink"), text("expiredText")],
  footer: [area("description"), text("phone"), text("address"), text("copyright")],
  products: [text("title"), { key: "limit", kind: "number", min: 4, max: 48, step: 4 }, columns],
  store_categories: [text("title"), { key: "limit", kind: "number", min: 2, max: 12, step: 1 }, { key: "showProductCount", kind: "switch" }],
  collections: [
    text("title"),
    columns,
    { key: "items", kind: "list", titleKey: "title", max: 8, item: { title: "", image: "", link: "/shop" }, fields: [text("title"), image("image"), link("link")] },
  ],
  recommended_products: [text("title"), { key: "limit", kind: "number", min: 2, max: 12, step: 1 }, columns],
  image_with_text: [text("title"), area("text"), image("image"), { key: "imagePosition", kind: "select", options: ["left", "right"] }, text("ctaText"), link("ctaLink")],
  features: [
    text("title"),
    columns,
    {
      key: "features",
      kind: "list",
      titleKey: "title",
      max: 8,
      item: { icon: "Sparkles", title: "", description: "" },
      fields: [{ key: "icon", kind: "icon" }, text("title"), area("description")],
    },
  ],
  process_steps: [
    text("title"),
    { key: "steps", kind: "list", titleKey: "title", max: 6, item: { title: "", description: "" }, fields: [text("title"), area("description")] },
  ],
  video: [text("title"), { key: "videoUrl", kind: "url" }, { key: "autoplay", kind: "switch" }],
  newsletter: [text("title"), area("subtitle"), text("placeholder"), text("buttonText"), text("successText")],
  trust_badges: [
    text("title"),
    { key: "layout", kind: "select", options: ["row", "grid"] },
    {
      key: "items",
      kind: "list",
      titleKey: "title",
      max: 6,
      item: { icon: "BadgeCheck", title: "", description: "" },
      fields: [{ key: "icon", kind: "icon" }, text("title"), text("description")],
    },
  ],
  testimonials: [
    text("title"),
    columns,
    {
      key: "testimonials",
      kind: "list",
      titleKey: "name",
      max: 12,
      item: { name: "", location: "", text: "", rating: 5, avatar: "" },
      fields: [text("name"), text("location"), area("text"), { key: "rating", kind: "number", min: 1, max: 5, step: 1 }, image("avatar")],
    },
  ],
  faq: [
    text("title"),
    { key: "faqs", kind: "list", titleKey: "question", max: 20, item: { question: "", answer: "" }, fields: [text("question"), area("answer")] },
  ],
  contact: [text("title"), area("subtitle"), text("phone"), text("whatsapp"), text("email"), text("address"), text("hours")],
  about: policy,
  shipping_policy: policy,
  refund_policy: policy,
  privacy_policy: policy,
  terms_conditions: policy,
  product_detail: [{ key: "expressOrder", kind: "switch" }, text("expressTitle"), text("expressButtonText")],
  checkout: [text("title"), text("buttonText")],
};

export const STYLE_FIELDS: Field[] = [
  { key: "spacing", kind: "select", options: ["compact", "normal", "large"] },
  { key: "backgroundColor", kind: "color" },
  { key: "textColor", kind: "color" },
];

export const SPACING_PX: Record<string, number> = { compact: 48, normal: 96, large: 144 };

export function spacingOf(paddingY: unknown) {
  const value = Number(paddingY);
  if (!Number.isFinite(value) || paddingY === undefined || paddingY === null || paddingY === "") return "normal";
  if (value <= 64) return "compact";
  if (value >= 128) return "large";
  return "normal";
}
