import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";

type Result = { id: string; thumb: string; full: string; alt: string; credit: string };

async function pixabay(key: string, query: string, page: number, perPage: number): Promise<Result[] | null> {
  const url = `https://pixabay.com/api/?key=${encodeURIComponent(key)}&q=${encodeURIComponent(query)}&image_type=photo&safesearch=true&page=${page}&per_page=${Math.max(3, perPage)}`;
  const response = await fetch(url, { next: { revalidate: 86400 } }).catch(() => null);
  if (!response?.ok) return null;
  const data = await response.json().catch(() => null);
  return (data?.hits || [])
    .filter((h: any) => h.webformatURL && h.largeImageURL)
    .map((h: any) => ({ id: `pixabay-${h.id}`, thumb: h.webformatURL, full: h.largeImageURL, alt: h.tags || "", credit: h.user || "" }));
}

async function pexels(key: string, query: string, page: number, perPage: number): Promise<Result[] | null> {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`;
  const response = await fetch(url, { headers: { Authorization: key }, next: { revalidate: 3600 } }).catch(() => null);
  if (!response?.ok) return null;
  const data = await response.json().catch(() => null);
  return (data?.photos || [])
    .filter((p: any) => p.src?.medium && (p.src.large2x || p.src.large))
    .map((p: any) => ({ id: `pexels-${p.id}`, thumb: p.src.medium, full: p.src.large2x || p.src.large, alt: p.alt || "", credit: p.photographer || "" }));
}

const strip = (html: unknown) => String(html || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, 80);

async function wikimedia(query: string, page: number, perPage: number): Promise<Result[] | null> {
  const search = `${query} filetype:bitmap haswbstatement:P275=Q6938433|P6216=Q19652`;
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    generator: "search",
    gsrnamespace: "6",
    gsrsearch: search,
    gsrlimit: String(perPage),
    gsroffset: String((page - 1) * perPage),
    prop: "imageinfo",
    iiprop: "url|mime|extmetadata",
    iiurlwidth: "1280",
    iiextmetadatafilter: "LicenseShortName|Artist|ObjectName",
  });
  const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
    headers: { "User-Agent": "DropyMediaSearch/1.0 (https://dropy.store)" },
    next: { revalidate: 86400 },
  }).catch(() => null);
  if (!response?.ok) return null;
  const data = await response.json().catch(() => null);
  const pages = Object.values(data?.query?.pages || {}) as any[];
  return pages
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
    .map((p) => ({ p, info: p.imageinfo?.[0] }))
    .filter(({ info }) => info && /^image\/(jpeg|png|webp)$/.test(info.mime) && info.thumburl)
    .filter(({ info }) => /^(cc0|public domain|pdm)/i.test(String(info.extmetadata?.LicenseShortName?.value || "")))
    .map(({ p, info }) => ({
      id: `wikimedia-${p.pageid}`,
      thumb: info.thumburl.split("?")[0].replace(/\/\d+px-/, "/400px-"),
      full: info.thumburl.split("?")[0],
      alt: strip(info.extmetadata?.ObjectName?.value) || String(p.title || "").replace(/^File:/, "").replace(/\.\w+$/, ""),
      credit: strip(info.extmetadata?.Artist?.value),
    }));
}

export async function GET(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("query") || "").trim().slice(0, 100);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const perPage = Math.min(40, Math.max(1, Number(searchParams.get("per_page")) || 24));
  if (!query) return NextResponse.json({ error: "query_required" }, { status: 400 });

  const providers: [string, () => Promise<Result[] | null>][] = [];
  if (process.env.PIXABAY_API_KEY) providers.push(["pixabay", () => pixabay(process.env.PIXABAY_API_KEY!, query, page, perPage)]);
  if (process.env.PEXELS_API_KEY) providers.push(["pexels", () => pexels(process.env.PEXELS_API_KEY!, query, page, perPage)]);
  providers.push(["wikimedia", () => wikimedia(query, page, perPage)]);

  for (const [provider, run] of providers) {
    const results = await run();
    if (results) return NextResponse.json({ results, provider });
  }
  return NextResponse.json({ error: "provider_error", results: [] }, { status: 502 });
}
