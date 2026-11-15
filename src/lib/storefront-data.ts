import { createClient } from "@supabase/supabase-js";

export type StorefrontInitial = { store: Record<string, any>; pages: any[]; product?: Record<string, any> | null };

export async function loadStorefront(slug: string, productId?: string | null): Promise<StorefrontInitial | null> {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
  const { data: store } = await supabase.from("stores").select("*").eq("slug", slug).maybeSingle();
  if (!store) return null;
  const wantsProduct = Boolean(productId && /^[0-9a-f-]{36}$/i.test(productId));
  const [{ data: pages }, { data: nav }, { data: productRow }] = await Promise.all([
    supabase.from("store_pages").select("*").eq("store_id", store.id).eq("is_published", true).order("sort_order", { ascending: true }),
    supabase.from("store_navigation").select("type, items").eq("store_id", store.id),
    wantsProduct
      ? supabase.from("store_products").select("*").eq("store_id", store.id).eq("id", productId!).eq("is_active", true).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const navItems = (type: string) => (nav || []).find((n: any) => n.type === type)?.items || [];
  const product = productRow
    ? {
        id: productRow.id,
        title: productRow.name,
        price: productRow.selling_price,
        description: productRow.description,
        image: productRow.images?.[0],
        images: productRow.images || [],
        variants: productRow.variants,
        has_variants: productRow.has_variants,
        compare_at_price: productRow.compare_at_price,
        sales_content: productRow.sales_content,
        prefetched: true,
      }
    : null;
  return { store: { ...store, headerLinks: navItems("header"), footerLinks: navItems("footer") }, pages: pages || [], product };
}
