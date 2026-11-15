import type { Metadata } from "next";
import fr from "@/locales/fr.json";
import { SITE_URL } from "@/lib/store-url";

type Competitor = "converty" | "shopify";
type Texts = Record<string, string>;

const compare = (fr as unknown as { pages: { compare: Record<string, Texts> } }).pages.compare;

export function compareMetadata(competitor: Competitor): Metadata {
  const texts = compare[competitor];
  const path = `/comparatif/dropy-vs-${competitor}`;
  return {
    title: { absolute: texts.meta_title },
    description: texts.meta_description,
    alternates: { canonical: path },
    openGraph: { title: texts.meta_title, description: texts.meta_description, url: path, type: "article" },
  };
}

export function compareJsonLd(competitor: Competitor) {
  const texts = compare[competitor];
  const url = `${SITE_URL}/comparatif/dropy-vs-${competitor}`;
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: [1, 2, 3].map((n) => ({
          "@type": "Question",
          name: texts[`faq${n}_q`],
          acceptedAnswer: { "@type": "Answer", text: texts[`faq${n}_a`] },
        })),
      },
      {
        "@type": "WebPage",
        "@id": url,
        url,
        name: texts.meta_title,
        description: texts.meta_description,
        dateModified: "2026-11-15",
        inLanguage: "fr",
        isPartOf: { "@type": "WebSite", name: "Dropy", url: SITE_URL },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Dropy", item: SITE_URL },
          { "@type": "ListItem", position: 2, name: texts.meta_title, item: url },
        ],
      },
    ],
  }).replace(/</g, "\u003c");
}
