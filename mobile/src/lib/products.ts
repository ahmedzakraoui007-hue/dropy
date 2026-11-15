export type Variant = { id?: string; stock?: number | null; price?: number | null; [key: string]: unknown };

export type Product = {
  id: string;
  store_id: string;
  name: string;
  images: unknown;
  selling_price: number;
  compare_at_price: number | null;
  stock_quantity: number | null;
  is_dropship: boolean | null;
  is_active: boolean | null;
  has_variants: boolean | null;
  variants: Variant[] | null;
  created_at: string;
};

export const PRODUCT_COLUMNS = "id, store_id, name, images, selling_price, compare_at_price, stock_quantity, is_dropship, is_active, has_variants, variants, created_at";

export const LOW_STOCK = 5;

export function firstImage(images: unknown): string | null {
  const list = Array.isArray(images) ? images : typeof images === "string" ? [images] : [];
  for (const entry of list) {
    if (typeof entry === "string" && entry) return entry;
    if (entry && typeof entry === "object" && typeof (entry as any).url === "string") return (entry as any).url;
  }
  return null;
}

export function totalStock(product: Product): number | null {
  if (product.has_variants && Array.isArray(product.variants) && product.variants.some((v) => v?.stock != null)) {
    return product.variants.reduce((sum, v) => sum + Number(v?.stock || 0), 0);
  }
  return product.stock_quantity;
}
