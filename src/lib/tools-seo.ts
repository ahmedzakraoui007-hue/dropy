import fr from "@/locales/fr.json";

type ToolTexts = Record<string, string>;

export function toolFaqJsonLd(slug: string) {
  const texts = ((fr as unknown as { tools: Record<string, ToolTexts> }).tools[slug] || {}) as ToolTexts;
  const items = [1, 2, 3]
    .map((n) => ({ q: texts[`faq${n}_q`], a: texts[`faq${n}_a`] }))
    .filter((item) => item.q && item.a);
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })),
  });
}
