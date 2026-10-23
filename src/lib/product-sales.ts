export type ProductFaq = { question: string; answer: string };
export type SalesContent = { badge: string; highlights: string[]; faq: ProductFaq[] };

export const MAX_HIGHLIGHTS = 6;
export const MAX_FAQ = 8;

const clean = (value: unknown, max: number) => String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);

export function normalizeSalesContent(raw: unknown): SalesContent {
  const data = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const highlights = Array.isArray(data.highlights) ? data.highlights.map((h) => clean(h, 140)).filter(Boolean).slice(0, MAX_HIGHLIGHTS) : [];
  const faq = Array.isArray(data.faq)
    ? data.faq
        .map((item) => {
          const entry = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
          return { question: clean(entry.question, 200), answer: String(entry.answer ?? "").trim().slice(0, 1000) };
        })
        .filter((item) => item.question && item.answer)
        .slice(0, MAX_FAQ)
    : [];
  return { badge: clean(data.badge, 40), highlights, faq };
}

export function discountPercent(price: unknown, compareAt: unknown) {
  const p = Number(price);
  const c = Number(compareAt);
  if (!Number.isFinite(p) || !Number.isFinite(c) || p <= 0 || c <= p) return 0;
  return Math.round(((c - p) / c) * 100);
}
