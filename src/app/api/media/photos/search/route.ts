import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";

type PexelsPhoto = {
  id: number;
  alt?: string;
  photographer?: string;
  photographer_url?: string;
  src?: { medium?: string; large2x?: string; large?: string };
};

export async function GET(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("query") || "").trim().slice(0, 100);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const perPage = Math.min(40, Math.max(1, Number(searchParams.get("per_page")) || 24));
  if (!query) return NextResponse.json({ error: "query_required" }, { status: 400 });

  const key = process.env.PEXELS_API_KEY;
  if (!key) return NextResponse.json({ setup_required: true, results: [] });

  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`;
  const response = await fetch(url, { headers: { Authorization: key }, next: { revalidate: 3600 } }).catch(() => null);
  if (!response?.ok) return NextResponse.json({ error: "provider_error", results: [] }, { status: 502 });

  const data = await response.json().catch(() => null);
  const results = ((data?.photos || []) as PexelsPhoto[])
    .filter((p) => p.src?.medium && (p.src.large2x || p.src.large))
    .map((p) => ({
      id: `pexels-${p.id}`,
      thumb: p.src!.medium!,
      full: p.src!.large2x || p.src!.large!,
      alt: p.alt || "",
      credit: p.photographer || "",
      creditUrl: p.photographer_url || "",
    }));

  return NextResponse.json({ results, provider: "pexels" });
}
