"use client";

import { motion } from "framer-motion";
import { 
  Star, 
  MapPin, 
  Truck, 
  Package, 
  TrendingUp, 
  Plus,
  Info,
  DollarSign
} from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatPrice } from "@/lib/utils";

interface ProductCardProps {
  product: any;
  onAdd: (product: any) => void;
  onView: (id: string) => void;
}

export default function ProductCard({ product, onAdd, onView }: ProductCardProps) {
  const estimatedMargin = ((product.market_avg_price - product.base_price) / product.market_avg_price) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="h-full overflow-hidden border-border/50 hover:border-primary/50 transition-all group shadow-sm hover:shadow-md">
        <div 
          className="relative aspect-square overflow-hidden cursor-pointer"
          onClick={() => onView(product.id)}
        >
          <img 
            src={product.images?.[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop"} 
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute top-2 left-2 flex flex-col gap-2">
            {product.is_trending && (
              <Badge className="bg-orange-500 hover:bg-orange-600 border-0 gap-1">
                <TrendingUp className="w-3 h-3" />
                Trending
              </Badge>
            )}
            {product.is_top_seller && (
              <Badge className="bg-violet-500 hover:bg-violet-600 border-0 gap-1">
                <Star className="w-3 h-3 fill-current" />
                Top Seller
              </Badge>
            )}
          </div>
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="glass backdrop-blur-md border-white/20">
              {product.stock_quantity > 0 ? `${product.stock_quantity} en stock` : "Rupture"}
            </Badge>
          </div>
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Button variant="secondary" size="sm" onClick={(e) => {
              e.stopPropagation();
              onView(product.id);
            }}>
              <Info className="w-4 h-4 mr-2" />
              Voir détails
            </Button>
          </div>
        </div>

        <CardContent className="p-4 space-y-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
              {product.categories?.name || "Catégorie"}
            </p>
            <h3 className="font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
          </div>

          <div className="flex items-center justify-between py-2 border-y border-border/50">
            <div className="space-y-0.5">
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Coût</p>
              <p className="text-lg font-bold text-foreground">{formatPrice(product.base_price)}</p>
            </div>
            <div className="text-right space-y-0.5">
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Marge Est.</p>
              <p className="text-lg font-bold text-emerald-600">+{estimatedMargin.toFixed(0)}%</p>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                <img src={product.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${product.profiles?.full_name}`} alt="Supplier" />
              </div>
              <span className="font-medium">{product.profiles?.full_name}</span>
              <div className="flex items-center gap-0.5 text-yellow-500">
                <Star className="w-3 h-3 fill-current" />
                <span className="font-bold">4.8</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {product.profiles?.city || "Tunis"}
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0">
          <Button 
            className="w-full gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-purple-500/20"
            onClick={() => onAdd(product)}
          >
            <Plus className="w-4 h-4" />
            Ajouter à ma boutique
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
