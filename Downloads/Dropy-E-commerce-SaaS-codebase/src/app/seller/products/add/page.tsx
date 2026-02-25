"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search,
  Package,
  Plus,
  Loader2,
  X,
  Store,
  Truck,
  ImagePlus,
  Edit,
  Trash2,
  MoreVertical,
  Eye,
  EyeOff,
  Grid,
  List as ListIcon,
  Palette,
  Ruler,
  Droplets,
  Scale,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useQuota } from "@/hooks/use-quota";
import { QuotaAlert } from "@/components/ui/quota-alert";

interface Variant {
  id: string;
  type: "size" | "color" | "volume" | "weight";
  value: string;
  stock?: number;
  price?: number;
}

interface StoreProduct {
  id: string;
  name: string;
  description: string;
  images: string[];
  selling_price: number;
  stock_quantity: number | null;
  is_dropship: boolean;
  source: string;
  is_active: boolean;
  created_at: string;
  product_id: string | null;
  category?: string;
  variants?: Variant[];
  has_variants?: boolean;
  products?: {
    base_price: number;
    profiles?: { full_name: string };
  };
}

const CATEGORIES_WITH_SIZES = ["vetements", "chaussures", "mode", "clothing", "fashion", "shoes"];
const CATEGORIES_WITH_COLORS = ["vetements", "accessoires", "mode", "clothing", "fashion", "accessories", "decoration", "electronique"];
const CATEGORIES_WITH_VOLUME = ["beaute", "parfum", "cosmetique", "soins", "hygiene", "boisson"];
const CATEGORIES_WITH_WEIGHT = ["alimentaire", "epices", "cafe", "the", "nourriture"];

const PREDEFINED_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45"];
const PREDEFINED_COLORS = [
  { name: "Noir", hex: "#000000" },
  { name: "Blanc", hex: "#FFFFFF" },
  { name: "Rouge", hex: "#EF4444" },
  { name: "Bleu", hex: "#3B82F6" },
  { name: "Vert", hex: "#22C55E" },
  { name: "Jaune", hex: "#EAB308" },
  { name: "Orange", hex: "#F97316" },
  { name: "Rose", hex: "#EC4899" },
  { name: "Violet", hex: "#8B5CF6" },
  { name: "Gris", hex: "#6B7280" },
  { name: "Marron", hex: "#92400E" },
  { name: "Beige", hex: "#D4A574" },
];
const PREDEFINED_VOLUMES = ["30ml", "50ml", "75ml", "100ml", "150ml", "200ml", "250ml", "500ml", "1L"];
const PREDEFINED_WEIGHTS = ["50g", "100g", "150g", "200g", "250g", "500g", "1kg", "2kg"];

export default function MyProductsPage() {
  const router = useRouter();
  const { plan, usage, limits, loading: quotaLoading, check } = useQuota();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [search, setSearch] = useState("");
  const [filterSource, setFilterSource] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<StoreProduct | null>(null);
  const [productLoading, setProductLoading] = useState(false);
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    images: [] as string[],
    category: "",
    hasVariants: false,
    variants: [] as Variant[],
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [customVolume, setCustomVolume] = useState("");
  const [customWeight, setCustomWeight] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("vendor_id", user.id)
      .single();

    if (!store) {
      setLoading(false);
      return;
    }

    setStoreId(store.id);

    const { data: productsData, error } = await supabase
      .from("store_products")
      .select(`
        *,
        products:product_id (
          base_price,
          profiles:supplier_id (full_name)
        )
      `)
      .eq("store_id", store.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Erreur lors du chargement des produits");
    } else {
      setProducts(productsData || []);
    }
    setLoading(false);
  }

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesSource = filterSource === "all" || p.source === filterSource;
    return matchesSearch && matchesSource;
  });

  const dropshippingProducts = products.filter(p => p.source === "dropshipping");
  const ownProducts = products.filter(p => p.source === "own");

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Vous devez être connecté");
      setUploadingImage(false);
      return;
    }

    const newImages: string[] = [];

    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} est trop volumineux (max 5MB)`);
        continue;
      }

      const fileExt = file.name.split(".").pop()?.toLowerCase();
      if (!["jpg", "jpeg", "png", "webp", "gif"].includes(fileExt || "")) {
        toast.error(`Format non supporté: ${fileExt}`);
        continue;
      }

      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        toast.error(`Erreur lors de l'upload: ${uploadError.message}`);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName);

      newImages.push(publicUrl);
    }

    if (newImages.length > 0) {
      setProductForm((prev) => ({
        ...prev,
        images: [...prev.images, ...newImages],
      }));
      toast.success(`${newImages.length} image(s) uploadée(s)`);
    }
    setUploadingImage(false);
  };

  const removeImage = (index: number) => {
    setProductForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const addVariant = (type: "size" | "color" | "volume" | "weight", value: string, price?: number) => {
    const exists = productForm.variants.some(v => v.type === type && v.value === value);
    if (exists) {
      toast.error("Cette variante existe déjà");
      return;
    }
    
    setProductForm((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        { id: crypto.randomUUID(), type, value, stock: 0, price: price || parseFloat(productForm.price) || 0 }
      ],
    }));
  };

  const removeVariant = (id: string) => {
    setProductForm((prev) => ({
      ...prev,
      variants: prev.variants.filter(v => v.id !== id),
    }));
  };

  const updateVariant = (id: string, field: "stock" | "price", value: number) => {
    setProductForm((prev) => ({
      ...prev,
      variants: prev.variants.map(v => v.id === id ? { ...v, [field]: value } : v),
    }));
  };

  const openCreateDialog = () => {
    setEditingProduct(null);
    setProductForm({ 
      name: "", 
      description: "", 
      price: "", 
      stock: "", 
      images: [], 
      category: "",
      hasVariants: false,
      variants: [],
    });
    setShowProductDialog(true);
  };

  const openEditDialog = (product: StoreProduct) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || "",
      price: product.selling_price.toString(),
      stock: product.stock_quantity?.toString() || "",
      images: product.images || [],
      category: product.category || "",
      hasVariants: product.has_variants || false,
      variants: product.variants || [],
    });
    setShowProductDialog(true);
  };

  const handleSaveProduct = async () => {
    if (!productForm.name || !productForm.price) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (!editingProduct && !check("maxProducts")) {
      toast.error("Limite de produits atteinte");
      return;
    }

    setProductLoading(true);
    const supabase = createClient();

    if (!storeId) {
      toast.error("Boutique non trouvée");
      setProductLoading(false);
      return;
    }

    const productData = {
      name: productForm.name,
      description: productForm.description,
      images: productForm.images.length > 0 ? productForm.images : ["/placeholder-product.jpg"],
      selling_price: parseFloat(productForm.price),
      stock_quantity: productForm.stock ? parseInt(productForm.stock) : null,
      category: productForm.category,
      has_variants: productForm.hasVariants,
      variants: productForm.hasVariants ? productForm.variants : [],
    };

    if (editingProduct) {
      const { error } = await supabase
        .from("store_products")
        .update(productData)
        .eq("id", editingProduct.id);

      if (error) {
        toast.error("Erreur lors de la modification");
      } else {
        toast.success("Produit modifié avec succès !");
        fetchProducts();
      }
    } else {
      const { error } = await supabase.from("store_products").insert({
        store_id: storeId,
        ...productData,
        is_dropship: false,
        source: "own",
        is_active: true,
      });

      if (error) {
        toast.error("Erreur lors de la création");
      } else {
        toast.success("Produit créé avec succès !");
        fetchProducts();
      }
    }

    setShowProductDialog(false);
    setProductLoading(false);
  };

  const handleToggleActive = async (product: StoreProduct) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("store_products")
      .update({ is_active: !product.is_active })
      .eq("id", product.id);

    if (error) {
      toast.error("Erreur lors de la mise à jour");
    } else {
      toast.success(product.is_active ? "Produit désactivé" : "Produit activé");
      fetchProducts();
    }
  };

  const handleDeleteProduct = async (product: StoreProduct) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("store_products")
      .delete()
      .eq("id", product.id);

    if (error) {
      toast.error("Erreur lors de la suppression");
    } else {
      toast.success("Produit supprimé");
      fetchProducts();
    }
  };

  const needsSizes = CATEGORIES_WITH_SIZES.some(c => productForm.category.toLowerCase().includes(c));
  const needsColors = CATEGORIES_WITH_COLORS.some(c => productForm.category.toLowerCase().includes(c));
  const needsVolume = CATEGORIES_WITH_VOLUME.some(c => productForm.category.toLowerCase().includes(c));
  const needsWeight = CATEGORIES_WITH_WEIGHT.some(c => productForm.category.toLowerCase().includes(c));

  const getVariantTypeLabel = (type: string) => {
    switch (type) {
      case "size": return "Taille";
      case "color": return "Couleur";
      case "volume": return "Volume";
      case "weight": return "Poids";
      default: return type;
    }
  };

  const getVariantBadgeColor = (type: string) => {
    switch (type) {
      case "size": return "bg-indigo-100 text-indigo-700";
      case "color": return "bg-pink-100 text-pink-700";
      case "volume": return "bg-cyan-100 text-cyan-700";
      case "weight": return "bg-amber-100 text-amber-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  if (!storeId && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Store className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Créez d&apos;abord votre boutique</h2>
        <p className="text-gray-500 mb-6">Vous devez avoir une boutique pour gérer vos produits</p>
        <Button onClick={() => router.push("/seller/store/create")}>
          Créer ma boutique
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!quotaLoading && !check("maxProducts") && (
        <QuotaAlert
          title="Limite de produits atteinte"
          description={`Vous avez ${usage.products} produit(s). Votre plan ${plan} est limité à ${limits.maxProducts}.`}
          plan={plan}
        />
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes Produits</h1>
          <p className="text-gray-500 text-sm mt-1">
            {products.length} produit(s) • {dropshippingProducts.length} importés • {ownProducts.length} propres
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/seller/products/catalog")}
            className="gap-2"
          >
            <Truck className="w-4 h-4" />
            Importer du catalogue
          </Button>
          <Button
            onClick={() => router.push("/seller/products/new")}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white gap-2"
          >
            <Plus className="w-4 h-4" />
            Nouveau produit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-gray-100">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Package className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{products.length}</p>
              <p className="text-sm text-gray-500">Total produits</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-100">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <Truck className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{dropshippingProducts.length}</p>
              <p className="text-sm text-gray-500">Dropshipping</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-100">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Store className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{ownProducts.length}</p>
              <p className="text-sm text-gray-500">Mes propres produits</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Rechercher un produit..."
            className="pl-10 h-11 border-gray-200"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterSource} onValueChange={setFilterSource}>
          <SelectTrigger className="w-[180px] h-11 border-gray-200">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les produits</SelectItem>
            <SelectItem value="dropshipping">Dropshipping</SelectItem>
            <SelectItem value="own">Mes produits</SelectItem>
          </SelectContent>
        </Select>
        <div className="bg-gray-100 p-1 rounded-lg flex items-center">
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

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          <p className="text-gray-500">Chargement des produits...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold mb-2 text-gray-900">
            {products.length === 0 ? "Aucun produit" : "Aucun résultat"}
          </h3>
          <p className="text-gray-500 mb-6">
            {products.length === 0
              ? "Commencez par ajouter des produits à votre boutique"
              : "Essayez de modifier vos critères de recherche"}
          </p>
          {products.length === 0 && (
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => router.push("/seller/products/catalog")}>
                <Truck className="w-4 h-4 mr-2" />
                Importer du catalogue
              </Button>
              <Button onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Créer un produit
              </Button>
            </div>
          )}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-gray-100 overflow-hidden group hover:shadow-lg hover:border-indigo-200 transition-all"
            >
              <div className="aspect-square relative bg-gray-50">
                <img
                  src={product.images?.[0] || "/placeholder-product.jpg"}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {!product.is_active && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Badge className="bg-gray-800 text-white">Désactivé</Badge>
                  </div>
                )}
                <Badge className={`absolute top-2 left-2 ${product.source === "dropshipping" ? "bg-purple-500" : "bg-emerald-500"} text-white text-xs`}>
                  {product.source === "dropshipping" ? "Dropshipping" : "Mon produit"}
                </Badge>
                {product.has_variants && product.variants && product.variants.length > 0 && (
                  <Badge className="absolute top-2 left-24 bg-blue-500 text-white text-xs">
                    {product.variants.length} variantes
                  </Badge>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditDialog(product)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggleActive(product)}>
                      {product.is_active ? (
                        <>
                          <EyeOff className="w-4 h-4 mr-2" />
                          Désactiver
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-2" />
                          Activer
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteProduct(product)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 text-sm truncate">{product.name}</h3>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-lg font-bold text-gray-900">
                    {product.has_variants && product.variants && product.variants.length > 0
                      ? `${Math.min(...product.variants.map(v => v.price || product.selling_price))} - ${Math.max(...product.variants.map(v => v.price || product.selling_price))} TND`
                      : `${product.selling_price} TND`
                    }
                  </p>
                  {product.source === "dropshipping" && product.products?.base_price && (
                    <p className="text-xs text-gray-500">
                      Coût: {product.products.base_price} TND
                    </p>
                  )}
                </div>
                {product.source === "dropshipping" && product.products?.profiles?.full_name && (
                  <p className="text-xs text-gray-500 mt-1">
                    Fournisseur: {product.products.profiles.full_name}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map((product) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 hover:shadow-md hover:border-indigo-200 transition-all"
            >
              <div className="w-20 h-20 rounded-lg bg-gray-50 overflow-hidden flex-shrink-0 relative">
                <img
                  src={product.images?.[0] || "/placeholder-product.jpg"}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {!product.is_active && (
                  <div className="absolute inset-0 bg-black/50" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                  <Badge className={`${product.source === "dropshipping" ? "bg-purple-100 text-purple-700" : "bg-emerald-100 text-emerald-700"} text-xs`}>
                    {product.source === "dropshipping" ? "Dropshipping" : "Mon produit"}
                  </Badge>
                  {!product.is_active && (
                    <Badge variant="secondary" className="text-xs">Désactivé</Badge>
                  )}
                  {product.has_variants && product.variants && product.variants.length > 0 && (
                    <Badge className="bg-blue-100 text-blue-700 text-xs">
                      {product.variants.length} variantes
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-lg font-bold text-gray-900">
                    {product.has_variants && product.variants && product.variants.length > 0
                      ? `${Math.min(...product.variants.map(v => v.price || product.selling_price))} - ${Math.max(...product.variants.map(v => v.price || product.selling_price))} TND`
                      : `${product.selling_price} TND`
                    }
                  </span>
                  {product.source === "dropshipping" && product.products?.base_price && (
                    <span className="text-sm text-gray-500">
                      Coût: {product.products.base_price} TND • Marge: {Math.round(((product.selling_price - product.products.base_price) / product.selling_price) * 100)}%
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => openEditDialog(product)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleToggleActive(product)}>
                      {product.is_active ? (
                        <>
                          <EyeOff className="w-4 h-4 mr-2" />
                          Désactiver
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-2" />
                          Activer
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteProduct(product)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                {editingProduct ? <Edit className="w-4 h-4 text-emerald-600" /> : <Plus className="w-4 h-4 text-emerald-600" />}
              </div>
              {editingProduct ? "Modifier le produit" : "Nouveau produit"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du produit *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Parfum Royal Oud"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Catégorie</Label>
                <Select 
                  value={productForm.category} 
                  onValueChange={(value) => setProductForm({ ...productForm, category: value, variants: [] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vetements">Vêtements</SelectItem>
                    <SelectItem value="chaussures">Chaussures</SelectItem>
                    <SelectItem value="accessoires">Accessoires</SelectItem>
                    <SelectItem value="electronique">Électronique</SelectItem>
                    <SelectItem value="maison">Maison & Déco</SelectItem>
                    <SelectItem value="beaute">Beauté & Cosmétiques</SelectItem>
                    <SelectItem value="parfum">Parfums</SelectItem>
                    <SelectItem value="alimentaire">Alimentaire</SelectItem>
                    <SelectItem value="sport">Sport & Loisirs</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Décrivez votre produit..."
                rows={3}
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Prix de base (TND) *</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="0.00"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Stock global</Label>
                <Input
                  id="stock"
                  type="number"
                  placeholder="Illimité"
                  value={productForm.stock}
                  onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Images</Label>
              <div className="grid grid-cols-5 gap-2">
                {productForm.images.map((img, i) => (
                  <div key={i} className="aspect-square relative rounded-lg overflow-hidden border border-gray-200">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <label className="aspect-square rounded-lg border-2 border-dashed border-gray-200 hover:border-emerald-300 cursor-pointer flex flex-col items-center justify-center text-gray-400 hover:text-emerald-500 transition-colors">
                  {uploadingImage ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <ImagePlus className="w-5 h-5" />
                      <span className="text-xs mt-1">Ajouter</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500">Formats: JPG, PNG, WebP, GIF. Max 5MB par image.</p>
            </div>

            {productForm.category && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-semibold">Variantes du produit</Label>
                    <p className="text-xs text-gray-500">
                      {needsVolume || needsWeight
                        ? "Ajoutez des volumes/poids avec un prix différent pour chaque variante"
                        : "Ajoutez des tailles et/ou des couleurs disponibles"
                      }
                    </p>
                  </div>
                  <Switch
                    checked={productForm.hasVariants}
                    onCheckedChange={(checked) => setProductForm({ ...productForm, hasVariants: checked })}
                  />
                </div>

                {productForm.hasVariants && (
                  <div className="space-y-4 bg-gray-50 p-4 rounded-xl">
                    {(needsSizes || productForm.category === "vetements" || productForm.category === "chaussures") && (
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm">
                          <Ruler className="w-4 h-4" />
                          Tailles disponibles
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {PREDEFINED_SIZES.map((size) => {
                            const isSelected = productForm.variants.some(v => v.type === "size" && v.value === size);
                            return (
                              <button
                                key={size}
                                type="button"
                                onClick={() => isSelected ? removeVariant(productForm.variants.find(v => v.type === "size" && v.value === size)?.id || "") : addVariant("size", size)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                  isSelected 
                                    ? "bg-indigo-500 text-white" 
                                    : "bg-white border border-gray-200 text-gray-700 hover:border-indigo-300"
                                }`}
                              >
                                {size}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {(needsColors || productForm.category === "vetements" || productForm.category === "accessoires" || productForm.category === "electronique") && (
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm">
                          <Palette className="w-4 h-4" />
                          Couleurs disponibles
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {PREDEFINED_COLORS.map((color) => {
                            const isSelected = productForm.variants.some(v => v.type === "color" && v.value === color.name);
                            return (
                              <button
                                key={color.name}
                                type="button"
                                onClick={() => isSelected ? removeVariant(productForm.variants.find(v => v.type === "color" && v.value === color.name)?.id || "") : addVariant("color", color.name)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                                  isSelected 
                                    ? "bg-indigo-500 text-white" 
                                    : "bg-white border border-gray-200 text-gray-700 hover:border-indigo-300"
                                }`}
                              >
                                <span 
                                  className="w-4 h-4 rounded-full border border-gray-300" 
                                  style={{ backgroundColor: color.hex }}
                                />
                                {color.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {(needsVolume || productForm.category === "parfum" || productForm.category === "beaute") && (
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm">
                          <Droplets className="w-4 h-4" />
                          Volumes disponibles (ml, L)
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {PREDEFINED_VOLUMES.map((vol) => {
                            const isSelected = productForm.variants.some(v => v.type === "volume" && v.value === vol);
                            return (
                              <button
                                key={vol}
                                type="button"
                                onClick={() => isSelected ? removeVariant(productForm.variants.find(v => v.type === "volume" && v.value === vol)?.id || "") : addVariant("volume", vol)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                  isSelected 
                                    ? "bg-cyan-500 text-white" 
                                    : "bg-white border border-gray-200 text-gray-700 hover:border-cyan-300"
                                }`}
                              >
                                {vol}
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Input
                            placeholder="Volume personnalisé (ex: 75ml)"
                            value={customVolume}
                            onChange={(e) => setCustomVolume(e.target.value)}
                            className="h-9"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (customVolume) {
                                addVariant("volume", customVolume);
                                setCustomVolume("");
                              }
                            }}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {(needsWeight || productForm.category === "alimentaire") && (
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2 text-sm">
                          <Scale className="w-4 h-4" />
                          Poids disponibles (g, kg)
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {PREDEFINED_WEIGHTS.map((weight) => {
                            const isSelected = productForm.variants.some(v => v.type === "weight" && v.value === weight);
                            return (
                              <button
                                key={weight}
                                type="button"
                                onClick={() => isSelected ? removeVariant(productForm.variants.find(v => v.type === "weight" && v.value === weight)?.id || "") : addVariant("weight", weight)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                  isSelected 
                                    ? "bg-amber-500 text-white" 
                                    : "bg-white border border-gray-200 text-gray-700 hover:border-amber-300"
                                }`}
                              >
                                {weight}
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Input
                            placeholder="Poids personnalisé (ex: 750g)"
                            value={customWeight}
                            onChange={(e) => setCustomWeight(e.target.value)}
                            className="h-9"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (customWeight) {
                                addVariant("weight", customWeight);
                                setCustomWeight("");
                              }
                            }}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {productForm.variants.length > 0 && (
                      <div className="space-y-3 pt-4 border-t border-gray-200">
                        <Label className="text-sm font-semibold">Configuration des variantes</Label>
                        <p className="text-xs text-gray-500">Définissez le prix et le stock pour chaque variante</p>
                        <div className="space-y-2">
                          {productForm.variants.map((variant) => (
                            <div key={variant.id} className="flex items-center gap-3 bg-white p-3 rounded-lg border">
                              <Badge className={getVariantBadgeColor(variant.type)}>
                                {variant.value}
                              </Badge>
                              <span className="text-xs text-gray-500">{getVariantTypeLabel(variant.type)}</span>
                              <div className="flex-1" />
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-gray-500">Prix:</span>
                                  <Input
                                    type="number"
                                    placeholder="Prix"
                                    className="h-8 w-24"
                                    value={variant.price || ""}
                                    onChange={(e) => updateVariant(variant.id, "price", parseFloat(e.target.value) || 0)}
                                  />
                                  <span className="text-xs text-gray-500">TND</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-gray-500">Stock:</span>
                                  <Input
                                    type="number"
                                    placeholder="Stock"
                                    className="h-8 w-20"
                                    value={variant.stock || ""}
                                    onChange={(e) => updateVariant(variant.id, "stock", parseInt(e.target.value) || 0)}
                                  />
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeVariant(variant.id)}
                                className="text-gray-400 hover:text-red-500"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowProductDialog(false)}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleSaveProduct}
                disabled={productLoading || !productForm.name || !productForm.price}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
              >
                {productLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : editingProduct ? (
                  "Enregistrer"
                ) : (
                  "Créer"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
