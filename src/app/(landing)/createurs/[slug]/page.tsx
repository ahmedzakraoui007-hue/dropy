import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PortfolioView } from "@/components/portfolio/PortfolioView";
import { portfolioUrl, publicPortfolio } from "@/lib/creator-portfolio";

export const revalidate = 300;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const portfolio = await publicPortfolio(slug);
  if (!portfolio) return { title: "Portfolio introuvable", robots: { index: false } };
  const { creator } = portfolio;
  const title = `${creator.name} | Créateur UGC${creator.city ? ` à ${creator.city}` : " en Tunisie"}`;
  const description = creator.bio?.slice(0, 160) || `Découvrez le portfolio UGC de ${creator.name} sur Dropy : photos et vidéos pour les marques tunisiennes.`;
  return {
    title,
    description,
    alternates: { canonical: `/createurs/${slug}` },
    openGraph: { title, description, url: `/createurs/${slug}`, type: "profile" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function PortfolioPage({ params }: Props) {
  const { slug } = await params;
  const portfolio = await publicPortfolio(slug);
  if (!portfolio) notFound();
  const { creator, items } = portfolio;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: portfolioUrl(slug),
    mainEntity: {
      "@type": "Person",
      name: creator.name,
      description: creator.bio || undefined,
      image: creator.avatar || undefined,
      address: creator.city ? { "@type": "PostalAddress", addressLocality: creator.city, addressCountry: "TN" } : undefined,
      sameAs: [creator.instagram && `https://instagram.com/${creator.instagram}`, creator.tiktok && `https://www.tiktok.com/@${creator.tiktok}`].filter(Boolean),
    },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <PortfolioView creator={creator} items={items} url={portfolioUrl(slug)} />
    </>
  );
}
