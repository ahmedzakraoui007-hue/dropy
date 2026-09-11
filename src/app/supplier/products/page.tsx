"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye,
  Package,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";

interface Product {
  id: string;
  name: string;
  description: string;
  base_price: number;
  image_url: string;
  category: string;
  stock_quantity: number;
  status: string;
  rejection_reason?: string;
  images?: any;
}

export default function SupplierProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadProducts() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("supplier_id", user.id)
        .order("created_at", { ascending: false });

      if (data) setProducts(data);
      setLoading(false);
    }
    loadProducts();
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Mes Produits</h1>
          <p className="text-muted-foreground">Gérez votre catalogue de produits pour les vendeurs.</p>
        </div>
        <Link href="/supplier/products/new">
          <Button className="gap-2 bg-gradient-to-r from-cyan-500 to-teal-600">
            <Plus className="w-4 h-4" />
            Nouveau produit
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher un produit..." 
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Filtres
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border text-sm font-medium text-muted-foreground">
                  <th className="pb-4 pr-4">Produit</th>
                  <th className="pb-4 px-4">Catégorie</th>
                  <th className="pb-4 px-4">Prix de base</th>
                  <th className="pb-4 px-4">Stock</th>
                  <th className="pb-4 px-4">Statut</th>
                  <th className="pb-4 pl-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="py-4">
                        <div className="h-12 bg-muted animate-pulse rounded" />
                      </td>
                    </tr>
                  ))
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package className="w-8 h-8 opacity-50" />
                      </div>
                      <p className="text-lg font-semibold">Aucun produit trouvé</p>
                      <p className="text-muted-foreground">Commencez par ajouter votre premier produit.</p>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="group hover:bg-muted/30 transition-colors">
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                              <img 
                                src={product.images?.[0] || product.image_url || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&h=200&fit=crop"} 
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          <div>
                            <p className="font-semibold text-sm">{product.name}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{product.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-secondary">
                          {product.category || "Général"}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-bold text-sm">
                        {product.base_price} TND
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${product.stock_quantity < 10 ? "text-red-500" : ""}`}>
                            {product.stock_quantity}
                          </span>
                          {product.stock_quantity < 10 && <AlertCircle className="w-3 h-3 text-red-500" />}
                        </div>
                      </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col gap-1">
                            <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full w-fit ${
                              product.status === "approved" ? "bg-green-100 text-green-700" : 
                              product.status === "pending" ? "bg-orange-100 text-orange-700" : 
                              "bg-red-100 text-red-700"
                            }`}>
                              {product.status === "approved" ? "Approuvé" : 
                               product.status === "pending" ? "En attente" : "Refusé"}
                            </span>
                            {product.status === "rejected" && product.rejection_reason && (
                              <div className="group relative">
                                <AlertCircle className="w-4 h-4 text-red-500 cursor-help" />
                                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-popover text-popover-foreground text-xs rounded shadow-lg border border-border z-10">
                                  Raison : {product.rejection_reason}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      <td className="py-4 pl-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="gap-2">
                              <Edit className="w-4 h-4" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2">
                              <Eye className="w-4 h-4" />
                              Voir
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2 text-red-600">
                              <Trash2 className="w-4 h-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
