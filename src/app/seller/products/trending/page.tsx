"use client";

import { useState, useEffect } from "react";
import { fetchProfileCards } from "@/lib/profile-cards";
import { 
  Flame, 
  TrendingUp, 
  ArrowRight, 
  Star, 
  Info, 
  Plus,
  Loader2,
  AlertTriangle,
  BadgePercent,
  TrendingDown
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function TrendingPage() {
  const [loading, setLoading] = useState(true);
  const [winningProducts, setWinningProducts] = useState<any[]>([]);

  useEffect(() => {
    async function loadTrending() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          categories:category_id (name)
        `)
        .limit(30);

      if (error) {
        toast.error("Erreur lors du chargement des tendances");
      } else {
        const products = data || [];
        const ids = products.map((p) => p.id);
        const supplierIds = products.map((p) => p.supplier_id);
        const [cards, listings, reviews] = await Promise.all([
          fetchProfileCards(supabase, supplierIds),
          ids.length
            ? supabase.from("store_products").select("product_id").in("product_id", ids)
            : Promise.resolve({ data: [] as any[] }),
          supplierIds.length
            ? supabase.from("supplier_reviews").select("supplier_id, rating").in("supplier_id", supplierIds)
            : Promise.resolve({ data: [] as any[] }),
        ]);
        const listingCount = new Map<string, number>();
        for (const l of listings.data || []) listingCount.set(l.product_id, (listingCount.get(l.product_id) || 0) + 1);
        const ratings = new Map<string, number[]>();
        for (const r of reviews.data || []) ratings.set(r.supplier_id, [...(ratings.get(r.supplier_id) || []), Number(r.rating)]);

        const trending = products.map((p) => {
          const base = Number(p.base_price || 0);
          const advised = Number(p.compare_price || 0);
          const supplierRatings = ratings.get(p.supplier_id) || [];
          return {
            ...p,
            profiles: { full_name: cards.get(p.supplier_id)?.full_name || "Fournisseur" },
            active_dropshippers: listingCount.get(p.id) || 0,
            potential_margin: advised > base && base > 0 ? Math.round(((advised - base) / advised) * 100) : null,
            supplier_rating: supplierRatings.length
              ? (supplierRatings.reduce((a, b) => a + b, 0) / supplierRatings.length).toFixed(1)
              : null,
          };
        }).sort((a, b) => b.active_dropshippers - a.active_dropshippers);
        
        setWinningProducts(trending);
      }
      setLoading(false);
    }
    loadTrending();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
        <p className="text-muted-foreground animate-pulse">Analyse du marché en cours...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 to-red-600 p-8 md:p-12 text-white">
        <div className="relative z-10 max-w-2xl">
          <Badge className="bg-white/20 hover:bg-white/30 border-0 mb-4 text-white">
            <Flame className="w-3 h-3 mr-1" />
            Produits gagnants
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Découvrez les produits qui font le <span className="underline decoration-white/30">buzz</span>
          </h1>
          <p className="text-lg text-white/80 mb-8">
            Notre algorithme analyse les ventes, les retours et les tendances sociales pour vous proposer 
            les meilleures opportunités du moment en Tunisie.
          </p>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
        <TrendingUp className="absolute bottom-0 right-8 w-64 h-64 text-white/5 -mb-12" />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {winningProducts.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="overflow-hidden hover:border-orange-500/50 transition-all border-border/50 group">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-64 aspect-square md:aspect-auto relative shrink-0">
                    <img 
                      src={product.images?.[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop"} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-orange-500 gap-1 border-0">
                        <TrendingUp className="w-3 h-3" />
                        Top {index + 1}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex-1 p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div>
                          <h3 className="text-2xl font-bold group-hover:text-orange-500 transition-colors">
                            {product.name}
                          </h3>
                          <p className="text-muted-foreground text-sm">
                            {product.categories?.name} • Par {product.profiles?.full_name}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-2xl font-black text-orange-500">{product.active_dropshippers}</p>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Boutiques le vendent</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-6">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <BadgePercent className="w-3 h-3" /> Marge Potentielle
                          </p>
                          <p className="font-bold text-emerald-600">{product.potential_margin != null ? `~${product.potential_margin}%` : "—"}</p>
                          <Progress value={product.potential_margin ?? 0} className="h-1 bg-emerald-100" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Plus className="w-3 h-3" /> Dropshippers
                          </p>
                          <p className="font-bold">{product.active_dropshippers}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Star className="w-3 h-3" /> Note Fournisseur
                          </p>
                          <div className="flex items-center gap-1">
                            <span className="font-bold">{product.supplier_rating ?? "—"}</span>
                            <div className="flex text-yellow-500">
                              <Star className="w-3 h-3 fill-current" />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-xl border border-orange-100 dark:border-orange-900/30 flex items-start gap-3">
                        <Info className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-orange-800 dark:text-orange-300">Prix fournisseur : {Number(product.base_price || 0).toFixed(2)} TND</p>
                          <p className="text-xs text-orange-700 dark:text-orange-400 opacity-80">
                            {product.compare_price ? `Prix de revente conseillé : ${Number(product.compare_price).toFixed(2)} TND` : "Fixez votre propre prix de revente."}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-6 pt-6 border-t">
                      <div className="flex items-center gap-4 text-sm font-medium">
                        <div className="text-muted-foreground">Coût: <span className="text-foreground">{product.base_price} TND</span></div>
                        <div className="text-muted-foreground">Prix Suggéré: <span className="text-foreground">{Math.round(product.base_price * 2.2)} TND</span></div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" className="gap-2">
                          Analyser Ads
                        </Button>
                        <Button className="bg-orange-500 hover:bg-orange-600 gap-2">
                          Importer <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
