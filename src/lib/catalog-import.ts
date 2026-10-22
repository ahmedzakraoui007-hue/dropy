import type { SupabaseClient } from "@supabase/supabase-js";

export type CatalogImportResult =
  | { ok: true; storeProductId: string }
  | { ok: false; reason: "no_store" | "not_found" | "duplicate" | "price_below_cost" | "error"; storeProductId?: string };

export function suggestedSellingPrice(basePrice: number) {
  return Math.round(Number(basePrice || 0) * 1.5);
}

export async function importCatalogProduct(
  supabase: SupabaseClient,
  productId: string,
  sellingPrice?: number
): Promise<CatalogImportResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "no_store" };

  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("vendor_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!store) return { ok: false, reason: "no_store" };
  return importCatalogProductIntoStore(supabase, store.id, productId, sellingPrice);
}

export async function importCatalogProductIntoStore(
  supabase: SupabaseClient,
  storeId: string,
  productId: string,
  sellingPrice?: number
): Promise<CatalogImportResult> {
  const store = { id: storeId };

  const { data: product } = await supabase
    .from("products")
    .select("id, name, description, images, base_price, stock_quantity")
    .eq("id", productId)
    .maybeSingle();
  if (!product) return { ok: false, reason: "not_found" };

  const basePrice = Number(product.base_price || 0);
  const price = Math.round((sellingPrice ?? suggestedSellingPrice(basePrice)) * 100) / 100;
  if (!(price > basePrice)) return { ok: false, reason: "price_below_cost" };

  const { data: existing } = await supabase
    .from("store_products")
    .select("id")
    .eq("store_id", store.id)
    .eq("product_id", product.id)
    .limit(1)
    .maybeSingle();
  if (existing) return { ok: false, reason: "duplicate", storeProductId: existing.id };

  const { data: storeProduct, error } = await supabase
    .from("store_products")
    .insert({
      store_id: store.id,
      product_id: product.id,
      name: product.name,
      description: product.description || "",
      images: product.images || [],
      selling_price: price,
      stock_quantity: product.stock_quantity ?? 0,
      is_dropship: true,
      source: "dropshipping",
      is_active: true,
    })
    .select("id")
    .single();
  if (error || !storeProduct) return { ok: false, reason: "error" };

  const { data: variants } = await supabase
    .from("product_variants")
    .select("sku, price_adjustment, stock_quantity, product_variant_values(variant_type_id, variant_option_id)")
    .eq("product_id", product.id);

  for (const variant of variants || []) {
    const { data: newVariant, error: variantError } = await supabase
      .from("store_product_variants")
      .insert({
        product_id: storeProduct.id,
        sku: variant.sku,
        price: price + Number(variant.price_adjustment || 0),
        stock: variant.stock_quantity ?? 0,
        is_active: true,
      })
      .select("id")
      .single();

    const values = (variant.product_variant_values || []).map((vv: any) => ({
      product_variant_id: newVariant?.id,
      variant_type_id: vv.variant_type_id,
      variant_option_id: vv.variant_option_id,
    }));
    const valuesError = newVariant && values.length
      ? (await supabase.from("store_product_variant_values").insert(values)).error
      : null;

    if (variantError || !newVariant || valuesError) {
      await supabase.from("store_products").delete().eq("id", storeProduct.id);
      return { ok: false, reason: "error" };
    }
  }

  return { ok: true, storeProductId: storeProduct.id };
}

export const CATALOG_IMPORT_MESSAGES: Record<Exclude<CatalogImportResult, { ok: true }>["reason"], string> = {
  no_store: "Boutique introuvable, rechargez la page.",
  not_found: "Ce produit n'est plus disponible.",
  duplicate: "Ce produit est déjà dans votre boutique.",
  price_below_cost: "Le prix de vente doit être supérieur au prix fournisseur.",
  error: "Erreur lors de l'ajout du produit.",
};
