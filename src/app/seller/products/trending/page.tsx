"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BadgePercent, Flame, Loader2, Star, Store, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { fetchProfileCards } from "@/lib/profile-cards";
import { formatPrice } from "@/lib/utils";
import { useTranslation } from "@/context/LanguageContext";
import { DROPSHIPPING_ENABLED } from "@/lib/launch";
import { DropshippingComingSoon } from "@/components/seller/DropshippingComingSoon";

type TrendingProduct = {
  id: string;
  name: string;
  images: string[] | null;
  base_price: number | null;
  compare_price: number | null;
  categories: { name: string } | null;
  supplierName: string;
  stores: number;
  margin: number | null;
  rating: string | null;
};

function TrendingPageContent() {
  const { t } = useTranslation();
  const tr = (key: string) => t(`seller_app.trending.${key}`);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<TrendingProduct[]>([]);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("products")
        .select("id, name, images, base_price, compare_price, supplier_id, categories:category_id (name)")
        .eq("is_active", true)
        .limit(60);
      if (error) {
        toast.error(tr("load_error"));
        setLoading(false);
        return;
      }
      const rows = data || [];
      const ids = rows.map((p) => p.id);
      const supplierIds = [...new Set(rows.map((p) => p.supplier_id).filter(Boolean))];
      const [cards, listings, reviews] = await Promise.all([
        fetchProfileCards(supabase, supplierIds),
        ids.length ? supabase.from("store_products").select("product_id").in("product_id", ids) : Promise.resolve({ data: [] as { product_id: string }[] }),
        supplierIds.length ? supabase.from("supplier_reviews").select("supplier_id, rating").in("supplier_id", supplierIds) : Promise.resolve({ data: [] as { supplier_id: string; rating: number }[] }),
      ]);
      const listingCount = new Map<string, number>();
      for (const l of listings.data || []) listingCount.set(l.product_id, (listingCount.get(l.product_id) || 0) + 1);
      const ratings = new Map<string, number[]>();
      for (const r of reviews.data || []) ratings.set(r.supplier_id, [...(ratings.get(r.supplier_id) || []), Number(r.rating)]);

      setProducts(
        rows
          .map((p: any) => {
            const base = Number(p.base_price || 0);
            const advised = Number(p.compare_price || 0);
            const supplierRatings = ratings.get(p.supplier_id) || [];
            return {
              ...p,
              supplierName: cards.get(p.supplier_id)?.full_name || tr("supplier"),
              stores: listingCount.get(p.id) || 0,
              margin: advised > base && base > 0 ? Math.round(((advised - base) / advised) * 100) : null,
              rating: supplierRatings.length ? (supplierRatings.reduce((a, b) => a + b, 0) / supplierRatings.length).toFixed(1) : null,
            };
          })
          .sort((a, b) => b.stores - a.stores)
          .slice(0, 30)
      );
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
        <p className="text-muted-foreground">{tr("loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 to-red-600 p-8 text-white md:p-12">
        <div className="relative z-10 max-w-2xl">
          <Badge className="mb-4 border-0 bg-white/20 text-white hover:bg-white/30">
            <Flame className="me-1 h-3 w-3" />
            {tr("badge")}
          </Badge>
          <h1 className="mb-4 text-3xl font-bold md:text-5xl">{tr("title")}</h1>
          <p className="text-lg text-white/80">{tr("subtitle")}</p>
        </div>
        <TrendingUp className="absolute bottom-0 end-8 -mb-12 h-64 w-64 text-white/5" />
      </div>

      {products.length === 0 ? (
        <p className="rounded-2xl border-2 border-dashed p-10 text-center text-muted-foreground">{tr("empty")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {products.map((product, index) => (
            <Card key={product.id} className="group overflow-hidden border-border/50 transition-all hover:border-orange-500/50">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className="relative aspect-square w-full shrink-0 bg-muted md:aspect-auto md:w-64">
                    {product.images?.[0] && <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />}
                    <Badge className="absolute start-2 top-2 gap-1 border-0 bg-orange-500">
                      <TrendingUp className="h-3 w-3" />#{index + 1}
                    </Badge>
                  </div>

                  <div className="flex flex-1 flex-col justify-between gap-6 p-6">
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                      <div>
                        <h3 className="text-2xl font-bold transition-colors group-hover:text-orange-500" dir="auto">{product.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {[product.categories?.name, product.supplierName].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <div className="text-end">
                        <p className="text-2xl font-black text-orange-500">{product.stores}</p>
                        <p className="text-[11px] font-bold uppercase text-muted-foreground">{tr("stores_selling")}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                      <div>
                        <p className="text-xs text-muted-foreground">{tr("cost")}</p>
                        <p className="font-bold">{formatPrice(product.base_price || 0)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{tr("advised_price")}</p>
                        <p className="font-bold">{product.compare_price ? formatPrice(product.compare_price) : "—"}</p>
                      </div>
                      <div>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <BadgePercent className="h-3 w-3" /> {tr("margin")}
                        </p>
                        <p className="font-bold text-emerald-600">{product.margin != null ? `~${product.margin}%` : "—"}</p>
                      </div>
                      <div>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Star className="h-3 w-3" /> {tr("rating")}
                        </p>
                        <p className="font-bold">{product.rating ?? "—"}</p>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button asChild className="gap-2 bg-orange-500 hover:bg-orange-600">
                        <Link href={`/seller/products/catalog/${product.id}`}>
                          <Store className="h-4 w-4" />
                          {tr("view")}
                          <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TrendingPage() {
  return DROPSHIPPING_ENABLED ? <TrendingPageContent /> : <DropshippingComingSoon />;
}
