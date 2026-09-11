"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Star, 
  MapPin, 
  Truck, 
  Package, 
  TrendingUp, 
  Plus,
  ChevronLeft,
  Loader2,
  Check,
  ShieldCheck,
  Zap,
  ArrowRight,
  Info,
  Scale,
  Palette
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { formatPrice } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ProductDetailPage() {
  const { productId } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);
  const [variants, setVariants] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [otherSuppliers, setOtherSuppliers] = useState<any[]>([]);
  const [supplierReviews, setSupplierReviews] = useState<any[]>([]);
  
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [currentVariant, setCurrentVariant] = useState<any>(null);

  useEffect(() => {
    async function loadProduct() {
      const supabase = createClient();
      
      // 1. Fetch product basic info
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          profiles:supplier_id (id, full_name, avatar_url, city, bank_name),
          categories:category_id (name)
        `)
        .eq("id", productId)
        .single();

      if (error || !data) {
        toast.error("Produit introuvable");
        router.push("/seller/products/catalog");
        return;
      }

      setProduct(data);
      setSellingPrice(Math.round(data.base_price * 1.5));
      
      // 2. Fetch product variants and their values
      const { data: variantData } = await supabase
        .from("product_variants")
        .select(`
          *,
          product_variant_values (
            variant_type_id,
            variant_option_id,
            variant_types (name, slug),
            variant_options (value, label)
          )
        `)
        .eq("product_id", productId);
      
      setVariants(variantData || []);

      // Initialize selected options with the first variant if available
      if (variantData && variantData.length > 0) {
        const firstVariant = variantData[0];
        const initialOptions: Record<string, string> = {};
        firstVariant.product_variant_values.forEach((vv: any) => {
          initialOptions[vv.variant_types.slug] = vv.variant_options.label;
        });
        setSelectedOptions(initialOptions);
        setCurrentVariant(firstVariant);
      }
      
      // 3. Fetch real supplier reviews
      const { data: reviews } = await supabase
        .from("supplier_reviews")
        .select("*")
        .eq("supplier_id", data.supplier_id)
        .eq("status", "published")
        .order("created_at", { ascending: false });
      
      setSupplierReviews(reviews || []);

      // Mock other suppliers for comparison
      setOtherSuppliers([
        { id: '1', supplier: 'Tunis Trade', price: data.base_price - 2, rating: 4.5, delivery: '3 jours', city: 'Tunis' },
        { id: '2', supplier: 'Sfax Grossiste', price: data.base_price + 3, rating: 4.9, delivery: '2 jours', city: 'Sfax' },
        { id: '3', supplier: 'Sahel Distribution', price: data.base_price - 1, rating: 4.7, delivery: '4 jours', city: 'Monastir' },
      ]);
      
      setLoading(false);
    }
    loadProduct();
  }, [productId, router]);

  // Group variant options by type for the selector UI
  const variantSelectorGroups = variants.reduce((acc: any, variant) => {
    variant.product_variant_values.forEach((vv: any) => {
      const typeSlug = vv.variant_types.slug;
      const typeName = vv.variant_types.name;
      const optionLabel = vv.variant_options.label;
      const optionValue = vv.variant_options.value;

      if (!acc[typeSlug]) {
        acc[typeSlug] = {
          name: typeName,
          options: new Map()
        };
      }
      acc[typeSlug].options.set(optionLabel, optionValue);
    });
    return acc;
  }, {});

  const handleOptionSelect = (typeSlug: string, optionLabel: string) => {
    const newOptions = { ...selectedOptions, [typeSlug]: optionLabel };
    setSelectedOptions(newOptions);

    // Find the variant that matches all selected options
    const matchingVariant = variants.find(variant => {
      return variant.product_variant_values.every((vv: any) => {
        return newOptions[vv.variant_types.slug] === vv.variant_options.label;
      });
    });

    setCurrentVariant(matchingVariant || null);
  };

  const handleImport = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("seller_id", user?.id)
      .single();

    if (!store) {
      toast.error("Créez d'abord une boutique");
      return;
    }

    // Import the product
    const { data: importedProduct, error } = await supabase
      .from("store_products")
      .insert({
        store_id: store.id,
        product_id: product.id,
        name: product.name,
        description: product.description,
        images: product.images,
        selling_price: sellingPrice,
        is_dropship: true,
        source: 'dropshipping',
        is_active: true
      })
      .select()
      .single();

    if (error) {
      toast.error("Erreur lors de l'importation");
      return;
    }

    // Import variants if they exist
    if (variants.length > 0) {
      for (const variant of variants) {
        const { data: newVariant, error: varError } = await supabase
          .from("store_product_variants")
          .insert({
            product_id: importedProduct.id,
            sku: variant.sku,
            price: sellingPrice + (variant.price_adjustment || 0),
            stock: variant.stock_quantity,
            is_active: true
          })
          .select()
          .single();
        
        if (varError) continue;

        // Import variant values mapping
        const valuesToImport = variant.product_variant_values.map((vv: any) => ({
          product_variant_id: newVariant.id,
          variant_type_id: vv.variant_type_id,
          variant_option_id: vv.variant_option_id
        }));

        await supabase.from("store_product_variant_values").insert(valuesToImport);
      }
    }

    toast.success("Produit et variantes importés !");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Chargement des détails...</p>
      </div>
    );
  }

  const basePrice = product.base_price + (currentVariant?.price_adjustment || 0);
  const margin = sellingPrice - basePrice;
  const marginPercent = ((margin / sellingPrice) * 100).toFixed(1);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <Button variant="ghost" className="gap-2" onClick={() => router.back()}>
        <ChevronLeft className="w-4 h-4" />
        Retour au catalogue
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left: Gallery */}
        <div className="space-y-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="aspect-square rounded-3xl overflow-hidden border border-border/50 bg-white shadow-sm"
          >
            <img 
              src={product.images?.[selectedImage] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop"} 
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </motion.div>
          <div className="grid grid-cols-5 gap-4">
            {product.images?.map((img: string, i: number) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${selectedImage === i ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"}`}
              >
                <img src={img} className="w-full h-full object-cover" alt="" />
              </button>
            ))}
          </div>
        </div>

        {/* Right: Info */}
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-0 font-bold">
                {product.categories?.name}
              </Badge>
              {(currentVariant?.stock_quantity ?? product.stock_quantity) > 0 ? (
                <Badge variant="outline" className="text-emerald-600 border-emerald-600/20 bg-emerald-50 font-bold">
                  <Check className="w-3 h-3 mr-1" />
                  En Stock ({(currentVariant?.stock_quantity ?? product.stock_quantity)})
                </Badge>
              ) : (
                <Badge variant="outline" className="text-red-600 border-red-600/20 bg-red-50 font-bold">
                  Rupture de stock
                </Badge>
              )}
            </div>
            <h1 className="text-4xl font-bold text-gray-900">{product.name}</h1>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < 4 ? "fill-current" : ""}`} />
                  ))}
                </div>
                <span className="text-sm font-bold">4.8 ({supplierReviews.length} avis)</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                <Package className="w-4 h-4" />
                {Math.floor(Math.random() * 500) + 100} imports
              </div>
            </div>
          </div>

          {/* Variant Selector */}
          {Object.entries(variantSelectorGroups).map(([typeSlug, group]: [string, any]) => (
            <div key={typeSlug} className="space-y-3">
              <Label className="text-sm font-bold text-gray-700 uppercase tracking-wider">{group.name}</Label>
              <div className="flex flex-wrap gap-2">
                {Array.from(group.options.entries() as Iterable<[string, any]>).map(([label, value]) => (
                  <button
                    key={label}
                    onClick={() => handleOptionSelect(typeSlug, label)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${
                      selectedOptions[typeSlug] === label
                        ? "border-primary bg-primary text-white shadow-md shadow-primary/20"
                        : "border-gray-100 hover:border-gray-200 text-gray-600 bg-white"
                    }`}
                  >
                    {typeSlug === 'couleur' && (
                      <span 
                        className="inline-block w-3 h-3 rounded-full border border-white/20 mr-2" 
                        style={{ backgroundColor: value }}
                      />
                    )}
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}

          <Card className="border-gray-200 bg-gray-50 shadow-sm overflow-hidden">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Prix Fournisseur</p>
                  <p className="text-3xl font-black text-gray-900">{formatPrice(basePrice)}</p>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 rounded-full font-bold border-gray-200 bg-white">
                      <Scale className="w-4 h-4" />
                      Comparer
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl rounded-3xl">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold">Comparatif Fournisseurs</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      <div className="border border-gray-100 rounded-2xl overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr className="text-left">
                              <th className="p-4 font-bold text-gray-700">Fournisseur</th>
                              <th className="p-4 font-bold text-gray-700">Prix</th>
                              <th className="p-4 font-bold text-gray-700">Note</th>
                              <th className="p-4 font-bold text-gray-700">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            <tr className="bg-primary/5">
                              <td className="p-4 font-bold text-gray-900">{product.profiles?.full_name}</td>
                              <td className="p-4 font-black">{formatPrice(basePrice)}</td>
                              <td className="p-4 text-yellow-500 font-bold">⭐ 4.9</td>
                              <td className="p-4"><Badge className="bg-primary">Actuel</Badge></td>
                            </tr>
                            {otherSuppliers.map((s) => (
                              <tr key={s.id}>
                                <td className="p-4 font-medium">{s.supplier}</td>
                                <td className="p-4 font-bold">{formatPrice(s.price)}</td>
                                <td className="p-4 text-gray-500">⭐ {s.rating}</td>
                                <td className="p-4"><Button variant="ghost" size="sm" className="font-bold">Choisir</Button></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-4 pt-6 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <Label htmlFor="selling-price" className="font-bold text-gray-700">Prix de vente souhaité</Label>
                  <div className="relative w-32">
                    <Input 
                      id="selling-price"
                      type="number" 
                      value={sellingPrice} 
                      onChange={(e) => setSellingPrice(Number(e.target.value))}
                      className="pr-10 h-11 rounded-xl font-bold text-right"
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">TND</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-white border border-gray-200 shadow-sm">
                  <div>
                    <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-1">Marge brute</p>
                    <p className="text-lg font-black text-emerald-600">+{formatPrice(margin)}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-1">Taux de marge</p>
                    <p className="text-lg font-black text-emerald-600">{marginPercent}%</p>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleImport}
                className="w-full h-14 text-lg font-bold gap-3 rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 transition-all active:scale-95"
              >
                <Plus className="w-5 h-5" />
                Importer dans ma boutique
              </Button>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl border border-gray-100 bg-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Truck className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-black">Expédition</p>
                <p className="text-sm font-bold text-gray-700">24-48h</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl border border-gray-100 bg-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-black">Qualité</p>
                <p className="text-sm font-bold text-gray-700">Certifiée</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="pt-12 border-t border-gray-100">
        <Tabs defaultValue="description" className="space-y-8">
          <TabsList className="bg-gray-100/50 p-1 h-12 rounded-xl gap-2">
            <TabsTrigger value="description" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm px-8">Description</TabsTrigger>
            <TabsTrigger value="specs" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm px-8">Fiche Technique</TabsTrigger>
            <TabsTrigger value="supplier" className="rounded-lg font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm px-8">Fournisseur</TabsTrigger>
          </TabsList>
          
          <TabsContent value="description" className="space-y-6">
            <div className="prose prose-slate max-w-none">
              <p className="text-gray-600 leading-relaxed text-lg whitespace-pre-line">
                {product.description || "Aucune description disponible."}
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="specs" className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 flex justify-between items-center">
              <span className="text-gray-500 font-medium">Référence (SKU)</span>
              <span className="font-bold text-gray-900">{currentVariant?.sku || product.sku || "N/A"}</span>
            </div>
            <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 flex justify-between items-center">
              <span className="text-gray-500 font-medium">Catégorie</span>
              <span className="font-bold text-gray-900">{product.categories?.name}</span>
            </div>
            <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 flex justify-between items-center">
              <span className="text-gray-500 font-medium">Poids</span>
              <span className="font-bold text-gray-900">{product.weight || "0.5"} kg</span>
            </div>
            <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 flex justify-between items-center">
              <span className="text-gray-500 font-medium">Statut</span>
              <Badge className="bg-emerald-500">Actif</Badge>
            </div>
          </TabsContent>

          <TabsContent value="supplier" className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
              <Avatar className="w-24 h-24 rounded-2xl border-4 border-gray-50 shadow-sm">
                <AvatarImage src={product.profiles?.avatar_url} />
                <AvatarFallback className="text-2xl font-black bg-primary text-white">
                  {product.profiles?.full_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{product.profiles?.full_name}</h3>
                    <p className="text-gray-500 font-medium flex items-center gap-1.5 mt-1">
                      <MapPin className="w-4 h-4 text-red-400" />
                      {product.profiles?.city || "Tunis"}, Tunisie
                    </p>
                  </div>
                  <Button variant="outline" className="rounded-full px-6 font-bold border-gray-200">Contacter le fournisseur</Button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Livraison</p>
                    <p className="text-lg font-black text-blue-600">98%</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Temps réponse</p>
                    <p className="text-lg font-black text-emerald-600">&lt; 2h</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Produits</p>
                    <p className="text-lg font-black text-gray-900">42</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Sur Dropy</p>
                    <p className="text-lg font-black text-gray-900">1 an</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
