export const STORE_ROOT_DOMAIN = (process.env.NEXT_PUBLIC_STORE_ROOT_DOMAIN || "").trim().toLowerCase();

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://dropy.store").trim().replace(/\/+$/, "");

const NON_STORE_SUBDOMAINS = new Set(["www", "app", "api", "admin", "mail", "blog", "seller", "supplier", "creator", "static", "cdn"]);

function withLeadingSlash(path: string) {
  if (!path) return "";
  return path.startsWith("/") ? path : `/${path}`;
}

export function storeUrl(slug: string, path = "") {
  const suffix = withLeadingSlash(path);
  return STORE_ROOT_DOMAIN ? `https://${slug}.${STORE_ROOT_DOMAIN}${suffix}` : `${SITE_URL}/${slug}${suffix}`;
}

export function storeDisplayUrl(slug: string) {
  return storeUrl(slug).replace(/^https?:\/\//, "");
}

export function storeSlugFromHost(host: string | null | undefined): string | null {
  if (!STORE_ROOT_DOMAIN || !host) return null;
  const hostname = host.split(":")[0].toLowerCase();
  if (!hostname.endsWith(`.${STORE_ROOT_DOMAIN}`)) return null;
  const sub = hostname.slice(0, -(STORE_ROOT_DOMAIN.length + 1));
  if (!sub || sub.includes(".") || NON_STORE_SUBDOMAINS.has(sub)) return null;
  return sub;
}

export function storeBasePath(slug: string, pathname: string, hostname: string) {
  if (pathname.startsWith("/preview/")) return `/preview/${slug}`;
  if (storeSlugFromHost(hostname) === slug) return "";
  return `/${slug}`;
}

export function productPath(productId: string) {
  return `/p/${productId}`;
}
