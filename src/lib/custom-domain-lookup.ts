type Entry = { value: string | null; expires: number };

const TTL_MS = 5 * 60 * 1000;
const NEGATIVE_TTL_MS = 60 * 1000;
const byDomain = new Map<string, Entry>();
const bySlug = new Map<string, Entry>();

async function query(params: string): Promise<{ slug: string; custom_domain: string } | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    const res = await fetch(`${url}/rest/v1/stores?select=slug,custom_domain&custom_domain_status=eq.active&${params}&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as { slug: string; custom_domain: string }[];
    return rows[0] || null;
  } catch {
    return null;
  }
}

async function cached(map: Map<string, Entry>, key: string, load: () => Promise<string | null>) {
  const hit = map.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;
  const value = await load();
  if (map.size > 5000) map.clear();
  map.set(key, { value, expires: Date.now() + (value ? TTL_MS : NEGATIVE_TTL_MS) });
  return value;
}

export function storeSlugForDomain(domain: string) {
  return cached(byDomain, domain, async () => (await query(`custom_domain=eq.${encodeURIComponent(domain)}`))?.slug ?? null);
}

export function customDomainForSlug(slug: string) {
  return cached(bySlug, slug, async () => (await query(`slug=eq.${encodeURIComponent(slug)}`))?.custom_domain ?? null);
}

export async function storeSlugForHost(host: string | null | undefined, slugFromSubdomain: (h: string | null | undefined) => string | null, isPlatform: (h: string | null | undefined) => boolean) {
  const fromSubdomain = slugFromSubdomain(host);
  if (fromSubdomain) return fromSubdomain;
  const hostname = String(host || "").split(":")[0].toLowerCase();
  if (!hostname || isPlatform(hostname)) return null;
  return storeSlugForDomain(hostname.replace(/^www\./, ""));
}
