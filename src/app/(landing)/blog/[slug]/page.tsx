import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
import { plainExcerpt, publishedPost, publishedPosts, readingMinutes, renderMarkdown } from "@/lib/blog";
import { SITE_URL } from "@/lib/store-url";

export const revalidate = 300;

const LABELS = {
  fr: { back: "Tous les articles", minutes: "min de lecture", ctaTitle: "Lancez votre boutique en ligne gratuitement", ctaText: "Créez votre boutique, choisissez des produits de fournisseurs tunisiens et vendez avec paiement à la livraison.", cta: "Créer ma boutique", related: "À lire aussi" },
  ar: { back: "كل المقالات", minutes: "دقائق قراءة", ctaTitle: "ابدا متجرك الإلكتروني بلاش", ctaText: "اعمل متجرك، اختار منتجات من مزودين توانسة وبيع بالدفع عند الاستلام.", cta: "اعمل متجري", related: "اقرا زادة" },
};

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = await publishedPost(slug);
  if (!post) return { title: { absolute: "Article introuvable | Dropy" }, robots: { index: false } };
  const title = post.seo_title || `${post.title} | Blog Dropy`;
  const description = post.seo_description || post.excerpt || plainExcerpt(post.content);
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `/blog/${post.slug}`,
      locale: post.locale === "ar" ? "ar_TN" : "fr_TN",
      publishedTime: post.published_at || undefined,
      modifiedTime: post.updated_at,
      ...(post.cover_url ? { images: [{ url: post.cover_url }] } : {}),
    },
  };
}

export default async function BlogPostPage({ params }: Params) {
  const { slug } = await params;
  const post = await publishedPost(slug);
  if (!post) notFound();

  const l = LABELS[post.locale];
  const related = (await publishedPosts(12)).filter((p) => p.slug !== post.slug && p.locale === post.locale).slice(0, 3);
  const date = post.published_at
    ? new Intl.DateTimeFormat(post.locale === "ar" ? "ar-TN" : "fr-TN", { day: "numeric", month: "long", year: "numeric" }).format(new Date(post.published_at))
    : "";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seo_description || post.excerpt || plainExcerpt(post.content),
    inLanguage: post.locale === "ar" ? "ar-TN" : "fr-TN",
    datePublished: post.published_at,
    dateModified: post.updated_at,
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
    ...(post.cover_url ? { image: post.cover_url } : {}),
    author: { "@type": "Organization", name: "Dropy", url: SITE_URL },
    publisher: { "@type": "Organization", name: "Dropy", logo: { "@type": "ImageObject", url: `${SITE_URL}/android-chrome-512x512.png` } },
  };

  return (
    <article className="bg-white px-6 py-12 lg:py-16" dir={post.locale === "ar" ? "rtl" : "ltr"} lang={post.locale}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-3xl">
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {l.back}
        </Link>
        <h1 className="mt-6 text-3xl font-black leading-tight tracking-tight text-slate-900 md:text-5xl">{post.title}</h1>
        <p className="mt-4 flex items-center gap-3 text-sm font-medium text-slate-400">
          <span>{date}</span>
          <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{readingMinutes(post.content)} {l.minutes}</span>
        </p>
        {post.cover_url && <img src={post.cover_url} alt="" className="mt-8 w-full rounded-3xl object-cover" />}
        <div className="blog-content mt-10" dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }} />

        <div className="mt-16 rounded-3xl bg-gradient-to-br from-[#2E3192] to-[#00A99D] p-8 text-white">
          <p className="text-2xl font-black">{l.ctaTitle}</p>
          <p className="mt-2 text-white/80">{l.ctaText}</p>
          <Link href="/inscription" className="mt-6 inline-block rounded-2xl bg-white px-6 py-3 font-black text-slate-900 hover:bg-slate-100">{l.cta}</Link>
        </div>

        {related.length > 0 && (
          <div className="mt-16">
            <p className="mb-4 text-lg font-black text-slate-900">{l.related}</p>
            <ul className="space-y-3">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link href={`/blog/${r.slug}`} className="font-bold text-[#2E3192] hover:underline">{r.title}</Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </article>
  );
}
