import type { Metadata } from "next";
import BlogIndex from "@/components/blog/BlogIndex";
import { publishedPosts, readingMinutes } from "@/lib/blog";

export const revalidate = 300;

export const metadata: Metadata = {
  title: { absolute: "Blog Dropy | Conseils pour vendre en ligne en Tunisie" },
  description: "Guides gratuits pour lancer votre boutique en ligne en Tunisie : choisir ses produits, faire de la publicité, confirmer ses commandes, travailler avec des fournisseurs et des créateurs UGC.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Blog Dropy | Conseils pour vendre en ligne en Tunisie",
    description: "Guides gratuits pour lancer et faire grandir votre boutique en ligne en Tunisie.",
    url: "/blog",
  },
};

export default async function BlogPage() {
  const posts = await publishedPosts();
  return (
    <BlogIndex
      posts={posts.map((p) => ({
        slug: p.slug,
        locale: p.locale,
        title: p.title,
        excerpt: p.excerpt,
        cover_url: p.cover_url,
        category: p.category,
        published_at: p.published_at,
        minutes: readingMinutes(p.content),
      }))}
    />
  );
}
