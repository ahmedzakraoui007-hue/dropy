import { createClient } from "@supabase/supabase-js";
import { plainText } from "@/lib/store-metadata";
import { storeUrl } from "@/lib/store-url";

export const revalidate = 3600;

function xml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });

  const { data: store } = await supabase
    .from("stores")
    .select("id, name, slug, description, is_active")
    .eq("slug", slug)
    .maybeSingle();
  if (!store || store.is_active === false) return new Response("Not found", { status: 404 });

  const { data: products } = await supabase
    .from("store_products")
    .select("id, name, description, images, selling_price, stock_quantity, category")
    .eq("store_id", store.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(5000);

  const items = (products || [])
    .filter((p) => Array.isArray(p.images) && p.images.length > 0 && Number(p.selling_price) > 0)
    .map((p) => {
      const images = p.images as string[];
      const inStock = p.stock_quantity === null || Number(p.stock_quantity) > 0;
      return [
        "<item>",
        `<g:id>${xml(p.id)}</g:id>`,
        `<g:title>${xml(p.name).slice(0, 150)}</g:title>`,
        `<g:description>${xml(plainText(p.description, 4900) || p.name)}</g:description>`,
        `<g:link>${xml(storeUrl(store.slug, `/p/${p.id}`))}</g:link>`,
        `<g:image_link>${xml(images[0])}</g:image_link>`,
        ...images.slice(1, 10).map((img) => `<g:additional_image_link>${xml(img)}</g:additional_image_link>`),
        `<g:availability>${inStock ? "in stock" : "out of stock"}</g:availability>`,
        "<g:condition>new</g:condition>",
        `<g:price>${Number(p.selling_price).toFixed(2)} TND</g:price>`,
        `<g:brand>${xml(store.name)}</g:brand>`,
        p.category ? `<g:product_type>${xml(p.category)}</g:product_type>` : "",
        "</item>",
      ]
        .filter(Boolean)
        .join("");
    });

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>${xml(store.name)}</title>
<link>${xml(storeUrl(store.slug))}</link>
<description>${xml(plainText(store.description) || store.name)}</description>
${items.join("\n")}
</channel>
</rss>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
