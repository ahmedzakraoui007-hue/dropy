export const RESERVED_SLUGS = new Set([
  "admin", "api", "auth", "creator", "forgot-password", "help", "inscription", "login", "preview", "seller",
  "supplier", "track", "dashboard", "settings", "register", "reset-password", "a-propos", "aide", "carrieres",
  "conditions-utilisation", "contact", "createurs", "demande-en-attente", "faq", "fournisseurs",
  "mentions-legales", "politique-confidentialite", "tarifs", "vendeurs", "themes", "shop", "sitemap",
  "robots", "favicon", "dropy", "www", "blog", "static", "app", "mail", "cdn", "p",
]);

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export type SlugErrorCode = "slug_short" | "slug_long" | "slug_chars" | "slug_reserved";

export function slugError(slug: string): SlugErrorCode | null {
  if (slug.length < 3) return "slug_short";
  if (slug.length > 40) return "slug_long";
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return "slug_chars";
  if (RESERVED_SLUGS.has(slug)) return "slug_reserved";
  return null;
}
