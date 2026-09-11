"use client";

import { useEffect, useState } from "react";
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Eye, 
  Edit3, 
  Trash2, 
  Package, 
  Truck,
  Store,
  LayoutGrid,
  List,
  ChevronDown,
  ArrowRight,
  TrendingUp,
  Image as ImageIcon,
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function SellerProductsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("list");
  const [activeSubMenu, setActiveSubMenu] = useState("list");

  useEffect(() => {
    async function fetchProducts() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: store } = await supabase
        .from("stores")
        .select("id")
        .eq("seller_id", user.id)
        .single();

      if (store) {
        const { data } = await supabase
          .from("store_products")
          .select("*")
          .eq("store_id", store.id)
          .order("created_at", { ascending: false });
        
        setProducts(data || []);
      }
      setLoading(false);
    }
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleStatus = async (product: any) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("store_products")
      .update({ is_active: !product.is_active })
      .eq("id", product.id);

    if (error) {
      toast.error("Erreur lors de la mise à jour");
    } else {
      setProducts(products.map(p => p.id === product.id ? { ...p, is_active: !p.is_active } : p));
      toast.success(product.is_active ? "Produit désactivé" : "Produit activé");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto">
      {/* Mini Sidebar Sub-menu */}
      <aside className="w-full lg:w-64 shrink-0">
        <div className="bg-white rounded-2xl border border-gray-200 p-2 space-y-1 shadow-sm">
          <button 
            onClick={() => setActiveSubMenu("list")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeSubMenu === "list" ? "bg-primary/5 text-primary" : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <List className="w-4 h-4" />
            Liste produits
          </button>
          <button 
            onClick={() => setActiveSubMenu("categories")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeSubMenu === "categories" ? "bg-primary/5 text-primary" : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <Layers className="w-4 h-4" />
            Catégories
          </button>
          <button 
            onClick={() => setActiveSubMenu("images")}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeSubMenu === "images" ? "bg-primary/5 text-primary" : "text-gray-500 hover:bg-gray-50"
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            Imageries
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Gestion des produits</h1>
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 font-bold px-2 py-0.5 border-blue-100">
              {filteredProducts.length} produit(s)
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-gray-100 p-1 rounded-lg flex items-center gap-1">
              <Button 
                variant={view === "grid" ? "secondary" : "ghost"} 
                size="icon" 
                className={`w-8 h-8 rounded-md ${view === "grid" ? "shadow-sm" : "text-gray-500"}`}
                onClick={() => setView("grid")}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button 
                variant={view === "list" ? "secondary" : "ghost"} 
                size="icon" 
                className={`w-8 h-8 rounded-md ${view === "list" ? "shadow-sm" : "text-gray-500"}`}
                onClick={() => setView("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 px-3 border-gray-200">
                  Actions
                  <ChevronDown className="w-4 h-4 ml-2 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Exporter CSV</DropdownMenuItem>
                <DropdownMenuItem>Changer catégorie</DropdownMenuItem>
                <DropdownMenuItem className="text-red-600 font-medium">Supprimer sélection</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" className="h-9 px-4 bg-primary hover:bg-primary/90" onClick={() => router.push('/seller/products/new')}>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau produit
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Rechercher par nom, référence..." 
              className="pl-10 h-10 border-gray-200 bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <SelectWithIcon placeholder="Tous les types" />
          <SelectWithIcon placeholder="Toutes les catégories" />
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-left">
                  <th className="px-6 py-4 w-[80px] text-[11px] font-bold text-gray-400 uppercase tracking-wider">IMAGE</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">PRODUIT</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">RÉFÉRENCE</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">PRIX</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">STOCK</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-center">STATUT</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-20">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-20 text-gray-500 font-medium">Aucun produit trouvé</td>
                  </tr>
                ) : filteredProducts.map((product) => (
                  <tr key={product.id} className="group hover:bg-gray-50/50 transition-all">
                    <td className="px-6 py-4">
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-5 h-5 text-gray-300" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">{product.name}</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">{product.category || 'Collection 2024'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs font-mono font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded uppercase">
                        {product.sku || product.id.slice(0, 8)}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-black text-emerald-600">{product.selling_price} DT</span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold ${
                        (product.stock_quantity || 0) > 10 
                          ? 'bg-blue-50 text-blue-700 border-blue-100' 
                          : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {product.stock_quantity || 0} en stock
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Switch 
                        checked={product.is_active} 
                        onCheckedChange={() => toggleStatus(product)}
                        className="data-[state=checked]:bg-primary"
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-primary">
                          <TrendingUp className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-primary">
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function SelectWithIcon({ placeholder }: { placeholder: string }) {
  return (
    <div className="relative">
      <select className="w-full h-10 pl-4 pr-10 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 font-medium outline-none focus:ring-2 focus:ring-primary/10 appearance-none">
        <option value="">{placeholder}</option>
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
}
