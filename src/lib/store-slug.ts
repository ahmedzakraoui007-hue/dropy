const RESERVED_SLUGS = new Set([
  "admin", "api", "auth", "creator", "forgot-password", "help", "inscription", "login", "preview", "seller",
  "supplier", "track", "dashboard", "settings", "register", "reset-password", "a-propos", "aide", "carrieres",
  "conditions-utilisation", "contact", "createurs", "demande-en-attente", "faq", "fournisseurs",
  "mentions-legales", "politique-confidentialite", "tarifs", "vendeurs", "themes", "shop", "sitemap",
  "robots", "favicon", "dropy", "www", "blog", "static",
]);

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function slugError(slug: string): string | null {
  if (slug.length < 3) return "L'adresse doit contenir au moins 3 caractères.";
  if (slug.length > 40) return "L'adresse doit contenir au maximum 40 caractères.";
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return "Utilisez uniquement des lettres minuscules, des chiffres et des tirets.";
  if (RESERVED_SLUGS.has(slug)) return "Cette adresse est réservée par Dropy, choisissez-en une autre.";
  return null;
}
