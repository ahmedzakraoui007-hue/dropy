import type { Metadata } from "next";
import { PortfolioDirectory } from "@/components/portfolio/PortfolioDirectory";
import { publicCreators } from "@/lib/creator-portfolio";

export const revalidate = 300;

const title = "Créateurs UGC en Tunisie : portfolios | Dropy";
const description = "Parcourez les portfolios de créateurs de contenu UGC en Tunisie : photos et vidéos pour vos produits et vos publicités.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/createurs/portfolios" },
  openGraph: { title, description, url: "/createurs/portfolios" },
};

export default async function PortfoliosPage() {
  return <PortfolioDirectory creators={await publicCreators()} />;
}
