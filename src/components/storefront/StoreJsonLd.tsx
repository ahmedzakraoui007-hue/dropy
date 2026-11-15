import { createClient } from "@supabase/supabase-js";
import { loadStoreProduct, plainText, productInStock } from "@/lib/store-metadata";
import { productPath, storeUrl } from "@/lib/store-url";

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026") }}
    />
  );
}

function anonClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
}

type StoreLike = {
  name: string;
  slug: string;
  custom_domain?: string | null;
  custom_domain_status?: string | null;
  delivery_fee?: number | string | null;
  free_delivery_threshold?: number | string | null;
};

const domainOf = (store: StoreLike) => (store.custom_domain_status === "active" ? store.custom_domain : null);

function shippingDetails(store: StoreLike) {
  const fee = Math.max(0, Number(store.delivery_fee) || 0);
  const threshold = Number(store.free_delivery_threshold);
  const destination = { "@type": "DefinedRegion", addressCountry: "TN" };
  const details: Record<string, unknown>[] = [
    { "@type": "OfferShippingDetails", shippingRate: { "@type": "MonetaryAmount", value: fee.toFixed(3), currency: "TND" }, shippingDestination: destination },
  ];
  return { details, threshold: Number.isFinite(threshold) && threshold > 0 ? threshold : null };
}

export async function ProductJsonLd({ storeSlug, productId }: { storeSlug: string; productId: string }) {
  const result = await loadStoreProduct(storeSlug, productId);
  if (!result) return null;
  const { store, product } = result;
  const domain = domainOf(store);
  const productUrl = storeUrl(storeSlug, productPath(product), domain);
  const price = Number(product.selling_price || 0);

  const { data: reviews } = await anonClient()
    .from("product_reviews")
    .select("customer_name, rating, comment, created_at")
    .eq("store_product_id", product.id)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(50);
  const rated = (reviews || []).filter((r) => Number(r.rating) >= 1 && Number(r.rating) <= 5);

  const shipping = shippingDetails(store);
  const productNode: Record<string, unknown> = {
    "@type": "Product",
    "@id": `${productUrl}#product`,
    name: product.name,
    description: plainText(product.description, 500) || undefined,
    image: product.images?.length ? product.images : undefined,
    url: productUrl,
    brand: { "@type": "Brand", name: store.name },
    offers: {
      "@type": "Offer",
      url: productUrl,
      price: price.toFixed(3),
      priceCurrency: "TND",
      itemCondition: "https://schema.org/NewCondition",
      availability: productInStock(product) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      acceptedPaymentMethod: { "@type": "PaymentMethod", name: "Paiement à la livraison" },
      shippingDetails: shipping.threshold !== null && price >= shipping.threshold
        ? { ...shipping.details[0], shippingRate: { "@type": "MonetaryAmount", value: "0.000", currency: "TND" } }
        : shipping.details[0],
      seller: { "@type": "Organization", name: store.name, url: storeUrl(storeSlug, "", domain) },
    },
  };
  if (rated.length) {
    productNode.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: (rated.reduce((sum, r) => sum + Number(r.rating), 0) / rated.length).toFixed(1),
      reviewCount: rated.length,
      bestRating: 5,
      worstRating: 1,
    };
    productNode.review = rated.slice(0, 5).map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: String(r.customer_name || "").slice(0, 60) || "Client" },
      datePublished: r.created_at?.slice(0, 10),
      reviewRating: { "@type": "Rating", ratingValue: Number(r.rating), bestRating: 5, worstRating: 1 },
      reviewBody: r.comment ? plainText(r.comment, 300) : undefined,
    }));
  }

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@graph": [
          productNode,
          {
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: store.name, item: storeUrl(storeSlug, "", domain) },
              { "@type": "ListItem", position: 2, name: product.name, item: productUrl },
            ],
          },
        ],
      }}
    />
  );
}

export function StoreJsonLd({ store }: { store: Record<string, any> }) {
  const domain = domainOf(store as StoreLike);
  const url = storeUrl(store.slug, "", domain);
  const social = store.social_links && typeof store.social_links === "object" ? Object.values(store.social_links) : [];
  const sameAs = social.filter((v): v is string => typeof v === "string" && /^https?:\/\//.test(v));
  const whatsapp = String(store.whatsapp_number || store.contact_phone || "").replace(/\D/g, "");
  const phone = whatsapp.length === 8 ? `+216${whatsapp}` : whatsapp ? `+${whatsapp}` : undefined;
  const language = store.storefront_language === "ar" ? ["ar"] : store.storefront_language === "both" ? ["fr", "ar"] : ["fr"];

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "OnlineStore",
            "@id": `${url}#store`,
            name: store.name,
            url,
            description: plainText(store.seo_description || store.description, 300) || undefined,
            logo: store.logo_url || undefined,
            image: store.og_image_url || store.logo_url || undefined,
            telephone: phone,
            email: store.contact_email || undefined,
            sameAs: sameAs.length ? sameAs : undefined,
            areaServed: { "@type": "Country", name: "Tunisie" },
            currenciesAccepted: "TND",
            paymentAccepted: "Paiement à la livraison",
          },
          {
            "@type": "WebSite",
            "@id": `${url}#website`,
            name: store.name,
            url,
            inLanguage: language,
            publisher: { "@id": `${url}#store` },
          },
        ],
      }}
    />
  );
}
