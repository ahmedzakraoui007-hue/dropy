import { loadStoreProduct, plainText } from "@/lib/store-metadata";
import { storeUrl } from "@/lib/store-url";

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\u003c") }}
    />
  );
}

export async function ProductJsonLd({ storeSlug, productId }: { storeSlug: string; productId: string }) {
  const result = await loadStoreProduct(storeSlug, productId);
  if (!result) return null;
  const { store, product } = result;
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: plainText(product.description, 500) || undefined,
        image: product.images?.length ? product.images : undefined,
        brand: { "@type": "Brand", name: store.name },
        offers: {
          "@type": "Offer",
          url: storeUrl(storeSlug, `/p/${product.id}`),
          price: Number(product.selling_price || 0).toFixed(3),
          priceCurrency: "TND",
          availability:
            product.stock_quantity === null || Number(product.stock_quantity) > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          seller: { "@type": "Organization", name: store.name },
        },
      }}
    />
  );
}
