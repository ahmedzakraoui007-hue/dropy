export type MenuLink = { id: string; label: string; url: string };

type PageLike = {
  id?: string;
  slug?: string | null;
  title?: string | null;
  name?: string | null;
  is_homepage?: boolean | null;
  is_published?: boolean | null;
  show_in_navigation?: boolean | null;
  show_in_menu?: boolean | null;
};

export function customLinks(raw: unknown): MenuLink[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((i) => i && typeof i === "object" && String((i as MenuLink).label || "").trim())
    .map((i, idx) => {
      const item = i as MenuLink;
      const url = String(item.url || "").trim();
      return { id: String(item.id || `link-${idx}`), label: String(item.label).trim(), url: !url || url === "/" ? "/home" : url };
    });
}

export function autoHeaderLinks(pages: PageLike[], labels: { home: string; products: string }): MenuLink[] {
  const visible = pages.filter((p) => p.is_published !== false && p.show_in_navigation !== false && p.show_in_menu !== false && p.slug);
  if (!visible.length) {
    return [
      { id: "home", label: labels.home, url: "/home" },
      { id: "shop", label: labels.products, url: "/shop" },
    ];
  }
  return visible.map((p) => ({
    id: String(p.id || p.slug),
    label: String(p.title || p.name || p.slug),
    url: p.is_homepage ? "/home" : `/${p.slug}`,
  }));
}

export function autoFooterLinks(pages: PageLike[]): MenuLink[] {
  return pages
    .filter((p) => p.slug && !p.is_homepage && p.is_published !== false && p.show_in_navigation === false)
    .map((p) => ({ id: String(p.id || p.slug), label: String(p.title || p.slug), url: `/${p.slug}` }));
}

export function isExternalUrl(url: string) {
  return /^https?:\/\//i.test(url.trim());
}

export function normalizeExternalUrl(url: string) {
  const value = url.trim();
  if (!value) return "";
  return isExternalUrl(value) ? value : `https://${value.replace(/^\/+/, "")}`;
}
