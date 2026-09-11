"use client";

import { useState, useEffect } from "react";
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
          profiles:supplier_id (full_name, avatar_url, city),
          categories:category_id (name)
        `)
        .limit(10);

      if (error) {
        toast.error("Erreur lors du chargement des tendances");
      } else {
        // Mocking winning metrics
        const trending = data.map(p => ({
          ...p,
          growth: Math.floor(Math.random() * 200) + 50,
          return_rate: (Math.random() * 3).toFixed(1),
          active_dropshippers: Math.floor(Math.random() * 50) + 10,
          potential_margin: 65 + Math.floor(Math.random() * 20),
          trend_reason: Math.random() > 0.5 ? "Forte demande TikTok" : "Saisonnalité favorable"
        })).sort((a, b) => b.growth - a.growth);
        
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
            Winning Products Finder
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
                            <p className="text-2xl font-black text-orange-500">+{product.growth}%</p>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Croissance 7j</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <BadgePercent className="w-3 h-3" /> Marge Potentielle
                          </p>
                          <p className="font-bold text-emerald-600">~{product.potential_margin}%</p>
                          <Progress value={product.potential_margin} className="h-1 bg-emerald-100" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Taux de retour
                          </p>
                          <p className="font-bold text-blue-600">{product.return_rate}%</p>
                          <Progress value={product.return_rate * 10} className="h-1 bg-blue-100" />
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
                            <span className="font-bold">4.9</span>
                            <div className="flex text-yellow-500">
                              <Star className="w-3 h-3 fill-current" />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-xl border border-orange-100 dark:border-orange-900/30 flex items-start gap-3">
                        <Info className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-orange-800 dark:text-orange-300">Pourquoi ce produit ?</p>
                          <p className="text-xs text-orange-700 dark:text-orange-400 opacity-80">{product.trend_reason}. Recommandé pour campagnes Facebook Ads.</p>
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
