"use client";

import { useState, useMemo } from "react";
import { 
  Search, 
  Filter, 
  Grid, 
  List as ListIcon, 
  X, 
  Loader2, 
  TrendingUp, 
  Flame, 
  Shirt,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import ProductCard from "@/components/marketplace/ProductCard";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useQuota } from "@/hooks/use-quota";
import { QuotaAlert } from "@/components/ui/quota-alert";
import { useCatalogProducts } from "@/hooks/useCatalogProducts";
import { CatalogProduct, Filters, PaginationState } from "@/types/catalog";
import { createClient } from "@/lib/supabase/client";

const PAGE_SIZE = 12;

export default function CatalogPage() {
  const router = useRouter();
  const { plan, usage, limits, loading: quotaLoading, check } = useQuota();
  
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [sortBy, setSortBy] = useState("trending");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(0);

  const filters: Filters = useMemo(() => ({
    search: search || undefined,
    category: selectedCategory !== "all" ? selectedCategory : undefined,
    minPrice: priceRange[0] || undefined,
    maxPrice: priceRange[1] < 1000 ? priceRange[1] : undefined,
    sortBy,
  }), [search, selectedCategory, priceRange, sortBy]);

  const pagination: PaginationState = useMemo(() => ({
    page,
    pageSize: PAGE_SIZE,
    total: 0
  }), [page]);

  const { data: products, loading, error, totalCount, refresh } = useCatalogProducts(filters, pagination);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handleAddToStore = async (product: CatalogProduct) => {
    if (!check('maxProducts')) {
      toast.error("Limite de produits atteinte", {
        description: `Votre plan ${plan} est limité à ${limits.maxProducts} produits.`
      });
      return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("vendor_id", user?.id)
      .single();

    if (!store) {
      toast.error("Veuillez d'abord créer une boutique");
      return;
    }

    const { error: insertError } = await supabase
      .from("store_products")
      .insert({
        store_id: store.id,
        product_id: product.id,
        name: product.name,
        description: "", // Catalog items might not have full description in the view
        images: product.images,
        selling_price: Math.round(product.suggested_price),
        is_dropship: true,
        source: 'dropshipping',
        is_active: true
      });

    if (insertError) {
      toast.error("Erreur lors de l'ajout du produit");
    } else {
      toast.success("Produit ajouté à votre boutique !");
    }
  };

  const resetFilters = () => {
    setSelectedCategory("all");
    setPriceRange([0, 1000]);
    setSearch("");
    setPage(0);
  };

  const activeFiltersCount = [
    selectedCategory !== "all",
    priceRange[0] > 0 || priceRange[1] < 1000,
    search !== ""
  ].filter(Boolean).length;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <h2 className="text-xl font-bold">Une erreur est survenue</h2>
        <p className="text-gray-500 max-w-md">Impossible de charger le catalogue. Veuillez vérifier votre connexion ou réessayer plus tard.</p>
        <Button onClick={() => refresh()}>Réessayer</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {!quotaLoading && !check('maxProducts') && (
        <QuotaAlert 
          title="Limite de produits atteinte"
          description={`Vous avez déjà ${usage.products} produit(s). Votre plan ${plan} est limité à ${limits.maxProducts}.`}
          plan={plan}
        />
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold text-gray-900">Catalogue Textile</h1>
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100">
              <Shirt className="w-3 h-3 mr-1" />
              Mode
            </Badge>
          </div>
          <p className="text-gray-500">Importez des produits textile pour votre boutique.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 border-gray-200" onClick={() => router.push('/seller/products/trending')}>
            <TrendingUp className="w-4 h-4 text-orange-500" />
            Tendances
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Rechercher un produit textile..." 
            className="pl-9 h-11 border-gray-200"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="gap-2 h-11 border-gray-200">
                <Filter className="w-4 h-4" />
                Filtres
                {activeFiltersCount > 0 && (
                  <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-primary text-white text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filtres Textile</SheetTitle>
              </SheetHeader>
              <div className="py-6 space-y-6">
                <div className="space-y-3">
                  <Label className="font-semibold">Prix (TND)</Label>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{priceRange[0]} TND</span>
                    <span className="text-sm font-medium">{priceRange[1]} TND</span>
                  </div>
                  <Slider 
                    value={priceRange} 
                    max={1000} 
                    step={10} 
                    onValueChange={(val) => {
                      setPriceRange(val);
                      setPage(0);
                    }}
                    className="mt-2"
                  />
                </div>

                <Button 
                  variant="ghost" 
                  className="w-full gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={resetFilters}
                >
                  <X className="w-4 h-4" />
                  Réinitialiser les filtres
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <Select value={sortBy} onValueChange={(val) => {
            setSortBy(val);
            setPage(0);
          }}>
            <SelectTrigger className="w-[180px] h-11 border-gray-200">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="trending">Tendances</SelectItem>
              <SelectItem value="price_asc">Prix croissant</SelectItem>
              <SelectItem value="price_desc">Prix décroissant</SelectItem>
              <SelectItem value="margin">Meilleure marge</SelectItem>
            </SelectContent>
          </Select>

          <div className="bg-gray-100 p-1 rounded-lg flex items-center h-11">
            <Button 
              variant={viewMode === "grid" ? "secondary" : "ghost"} 
              size="icon" 
              className="h-9 w-9"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button 
              variant={viewMode === "list" ? "secondary" : "ghost"} 
              size="icon" 
              className="h-9 w-9"
              onClick={() => setViewMode("list")}
            >
              <ListIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="aspect-square rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product as any} 
                onAdd={() => handleAddToStore(product)}
                onView={(id) => router.push(`/seller/products/catalog/${id}`)}
              />
            ))}
          </div>

          {products.length === 0 && (
            <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <Shirt className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Aucun produit textile trouvé</h3>
              <p className="text-gray-500 mb-4">Essayez d&apos;ajuster vos filtres ou votre recherche.</p>
              <Button 
                variant="link" 
                onClick={resetFilters}
                className="text-primary"
              >
                Réinitialiser les filtres
              </Button>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="icon"
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  let pageNum = i;
                  if (totalPages > 5 && page > 2) {
                    pageNum = page - 2 + i;
                    if (pageNum >= totalPages) pageNum = totalPages - 5 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? "default" : "outline"}
                      className="w-10 h-10"
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum + 1}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="icon"
                disabled={page === totalPages - 1}
                onClick={() => setPage(p => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
