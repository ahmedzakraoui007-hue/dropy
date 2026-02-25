"use client";

import { useState, useEffect } from "react";
import { Check, Search, Package, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  image_url: string;
  price: number;
}

interface ProductSelectorProps {
  onSelected: (products: Product[]) => void;
  maxSelection?: number;
}

export function ProductSelector({ onSelected, maxSelection = 5 }: ProductSelectorProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError("Vous devez être connecté");
          setIsLoading(false);
          return;
        }

        const { data: store } = await supabase
          .from("stores")
          .select("id")
          .eq("seller_id", user.id)
          .single();

        if (!store) {
          setError("Aucune boutique trouvée");
          setIsLoading(false);
          return;
        }

        const { data, error: fetchError } = await supabase
          .from("store_products")
          .select("id, name, images, selling_price")
          .eq("store_id", store.id)
          .eq("is_active", true)
          .limit(50);

        if (fetchError) {
          setError("Erreur lors du chargement des produits");
        } else if (data) {
          const formattedProducts = data.map(p => ({
            id: p.id,
            name: p.name,
            image_url: Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200",
            price: p.selling_price
          }));
          setProducts(formattedProducts);
        }
      } catch (err) {
        setError("Erreur inattendue");
      }
      setIsLoading(false);
    }

    fetchProducts();
  }, [supabase]);

  const toggleProduct = (product: Product) => {
    let newSelectedIds: string[];
    if (selectedIds.includes(product.id)) {
      newSelectedIds = selectedIds.filter(id => id !== product.id);
    } else {
      if (selectedIds.length >= maxSelection) return;
      newSelectedIds = [...selectedIds, product.id];
    }
    setSelectedIds(newSelectedIds);
    onSelected(products.filter(p => newSelectedIds.includes(p.id)));
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <ScrollArea className="h-[300px] border rounded-lg p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <AlertCircle className="w-12 h-12 mb-2 opacity-50 text-red-400" />
            <p className="text-sm">{error}</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Package className="w-12 h-12 mb-2 opacity-20" />
            <p className="text-sm mb-2">Aucun produit dans votre boutique</p>
            <a href="/seller/products/catalog" className="text-xs text-primary hover:underline">
              + Ajouter des produits
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => toggleProduct(product)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                  selectedIds.includes(product.id)
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted"
                )}
              >
                <div className="w-12 h-12 rounded-md overflow-hidden bg-muted">
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{product.price} TND</p>
                </div>
                {selectedIds.includes(product.id) && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
      <p className="text-xs text-muted-foreground text-right">
        {selectedIds.length} / {maxSelection} products selected
      </p>
    </div>
  );
}
