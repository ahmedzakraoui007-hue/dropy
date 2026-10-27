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
import { useTranslation } from "@/context/LanguageContext";
import { formatPrice } from "@/lib/utils";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { ProductSalesFields } from "@/components/seller/ProductSalesFields";
import { discountPercent, normalizeSalesContent, type SalesContent } from "@/lib/product-sales";

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
  compare_at_price?: number | null;
  sales_content?: unknown;
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
  const { t } = useTranslation();
  const router = useRouter();
  const { plan, usage, limits, loading: quotaLoading, check } = useQuota();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [search, setSearch] = useState("");
  const [filterSource, setFilterSource] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<StoreProduct | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<StoreProduct | null>(null);
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
    compareAt: "",
    sales: { badge: "", highlights: [], faq: [] } as SalesContent,
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
      .order("created_at", { ascending: true }).limit(1).maybeSingle();

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
      toast.error(t("seller_app.products.load_error"));
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
      toast.error(t("seller_app.products.must_login"));
      setUploadingImage(false);
      return;
    }

    const newImages: string[] = [];

    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t("seller_app.products.too_big").replace("{name}", file.name));
        continue;
      }

      const fileExt = file.name.split(".").pop()?.toLowerCase();
      if (!["jpg", "jpeg", "png", "webp", "gif"].includes(fileExt || "")) {
        toast.error(t("seller_app.products.bad_format").replace("{ext}", String(fileExt)));
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
        toast.error(t("seller_app.products.upload_error").replace("{message}", uploadError.message));
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
      toast.success(t("seller_app.products.uploaded").replace("{count}", String(newImages.length)));
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
      toast.error(t("seller_app.products.variant_exists"));
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
      compareAt: "",
      sales: { badge: "", highlights: [], faq: [] },
    });
    setShowProductDialog(true);
  };

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("new") === "1") openCreateDialog();
  }, []);

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
      compareAt: product.compare_at_price != null ? String(Number(product.compare_at_price)) : "",
      sales: normalizeSalesContent(product.sales_content),
    });
    setShowProductDialog(true);
  };

  const handleSaveProduct = async () => {
    if (!productForm.name || !productForm.price) {
      toast.error(t("seller_app.products.required"));
      return;
    }

    const price = parseFloat(productForm.price.replace(",", "."));
    const supplierPrice = Number(editingProduct?.products?.base_price || 0);
    if (!Number.isFinite(price) || price <= 0) {
      toast.error(t("seller_app.products.required"));
      return;
    }
    if (editingProduct?.product_id && supplierPrice > 0 && price <= supplierPrice) {
      toast.error(t("seller_app.products.below_cost").replace("{price}", formatPrice(supplierPrice)));
      return;
    }
    const compareAt = parseFloat(productForm.compareAt.replace(",", "."));
    if (productForm.compareAt.trim() && discountPercent(price, compareAt) === 0) {
      toast.error(t("seller_app.products.sales.compare_invalid"));
      return;
    }

    if (!editingProduct && !check("maxProducts")) {
      toast.error(t("seller_app.products.limit"));
      return;
    }

    setProductLoading(true);
    const supabase = createClient();

    if (!storeId) {
      toast.error(t("seller_app.products.store_not_found"));
      setProductLoading(false);
      return;
    }

    const productData = {
      name: productForm.name,
      description: productForm.description,
      images: productForm.images.length > 0 ? productForm.images : ["/placeholder-product.jpg"],
      selling_price: Math.round(price * 100) / 100,
      compare_at_price: productForm.compareAt.trim() ? Math.round(compareAt * 100) / 100 : null,
      sales_content: normalizeSalesContent(productForm.sales),
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
        toast.error(t("seller_app.products.update_error"));
      } else {
        toast.success(t("seller_app.products.updated"));
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
        toast.error(t("seller_app.products.create_error"));
      } else {
        toast.success(t("seller_app.products.created"));
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
      toast.error(t("seller_app.products.status_error"));
    } else {
      toast.success(product.is_active ? t("seller_app.products.deactivated") : t("seller_app.products.activated"));
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
      toast.error(t("seller_app.products.delete_error"));
    } else {
      toast.success(t("seller_app.products.deleted"));
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
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{t("seller_app.products.no_store_title")}</h2>
        <p className="text-gray-500 mb-6">{t("seller_app.products.no_store_desc")}</p>
        <Button onClick={() => router.push("/seller/store-builder")}>
          {t("seller_app.products.create_store")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!quotaLoading && !check("maxProducts") && (
        <QuotaAlert
          title={t("seller_app.products.limit")}
          description={t("seller_app.products.limit_desc").replace("{count}", String(usage.products)).replace("{max}", String(limits.maxProducts))}
          plan={plan}
        />
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("seller_app.products.title")}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {t("seller_app.products.summary").replace("{total}", String(products.length)).replace("{imported}", String(dropshippingProducts.length)).replace("{own}", String(ownProducts.length))}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/seller/products/catalog")}
            className="gap-2"
          >
            <Truck className="w-4 h-4" />
            {t("seller_app.products.import_catalog")}
          </Button>
          <Button
            onClick={openCreateDialog}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white gap-2"
          >
            <Plus className="w-4 h-4" />
            {t("seller_app.products.new_product")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <Card className="border-gray-100">
          <CardContent className="p-3 md:p-4 flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4">
            <div className="w-9 h-9 md:w-12 md:h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Package className="w-5 h-5 md:w-6 md:h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-xl md:text-2xl font-bold text-gray-900">{products.length}</p>
              <p className="text-xs md:text-sm text-gray-500 leading-tight">{t("seller_app.products.total")}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-100">
          <CardContent className="p-3 md:p-4 flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4">
            <div className="w-9 h-9 md:w-12 md:h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <Truck className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-xl md:text-2xl font-bold text-gray-900">{dropshippingProducts.length}</p>
              <p className="text-xs md:text-sm text-gray-500 leading-tight">{t("seller_app.products.dropshipping")}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-gray-100">
          <CardContent className="p-3 md:p-4 flex flex-col md:flex-row items-start md:items-center gap-2 md:gap-4">
            <div className="w-9 h-9 md:w-12 md:h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Store className="w-5 h-5 md:w-6 md:h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-xl md:text-2xl font-bold text-gray-900">{ownProducts.length}</p>
              <p className="text-xs md:text-sm text-gray-500 leading-tight">{t("seller_app.products.own_products")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder={t("seller_app.products.search_ph")}
            className="pl-10 h-11 border-gray-200"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterSource} onValueChange={setFilterSource}>
          <SelectTrigger className="w-[180px] h-11 border-gray-200">
            <SelectValue placeholder={t("seller_app.products.source")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("seller_app.products.all")}</SelectItem>
            <SelectItem value="dropshipping">{t("seller_app.products.dropshipping")}</SelectItem>
            <SelectItem value="own">{t("seller_app.products.own")}</SelectItem>
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
          <p className="text-gray-500">{t("seller_app.products.loading")}</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-semibold mb-2 text-gray-900">
            {products.length === 0 ? t("seller_app.products.empty") : t("seller_app.products.no_results")}
          </h3>
          <p className="text-gray-500 mb-6">
            {products.length === 0
              ? t("seller_app.products.empty_desc")
              : t("seller_app.products.no_results_desc")}
          </p>
          {products.length === 0 && (
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => router.push("/seller/products/catalog")}>
                <Truck className="w-4 h-4 mr-2" />
                {t("seller_app.products.import_catalog")}
              </Button>
              <Button onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                {t("seller_app.products.create_product")}
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
                    <Badge className="bg-gray-800 text-white">{t("seller_app.products.inactive")}</Badge>
                  </div>
                )}
                <Badge className={`absolute top-2 start-2 ${product.source === "dropshipping" ? "bg-purple-500" : "bg-emerald-500"} text-white text-xs`}>
                  {product.source === "dropshipping" ? t("seller_app.products.dropshipping") : t("seller_app.products.mine")}
                </Badge>
                {product.has_variants && product.variants && product.variants.length > 0 && (
                  <Badge className="absolute bottom-2 start-2 bg-blue-500 text-white text-xs">
                    {t("seller_app.products.variants_count").replace("{count}", String(product.variants.length))}
                  </Badge>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="absolute top-2 end-2 h-8 w-8 opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 transition-opacity"
                      aria-label={t("seller_app.products.edit")}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditDialog(product)}>
                      <Edit className="w-4 h-4 mr-2" />
                      {t("seller_app.products.edit")}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleToggleActive(product)}>
                      {product.is_active ? (
                        <>
                          <EyeOff className="w-4 h-4 mr-2" />
                          {t("seller_app.products.deactivate")}
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-2" />
                          {t("seller_app.products.activate")}
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setDeletingProduct(product)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t("seller_app.products.delete")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 text-sm truncate">{product.name}</h3>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-lg font-bold text-gray-900">
                    {product.has_variants && product.variants && product.variants.length > 0
                      ? `${formatPrice(Math.min(...product.variants.map(v => v.price || product.selling_price)))} - ${formatPrice(Math.max(...product.variants.map(v => v.price || product.selling_price)))}`
                      : formatPrice(product.selling_price)
                    }
                  </p>
                  {product.source === "dropshipping" && product.products?.base_price && (
                    <p className="text-xs text-gray-500">
                      {t("seller_app.products.cost")} {formatPrice(product.products.base_price)}
                    </p>
                  )}
                </div>
                {product.source === "dropshipping" && product.products?.profiles?.full_name && (
                  <p className="text-xs text-gray-500 mt-1">
                    {t("seller_app.products.supplier_label")} {product.products.profiles.full_name}
                  </p>
                )}
                <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => openEditDialog(product)}>
                  <Edit className="w-4 h-4 me-2" />
                  {t("seller_app.products.edit_page")}
                </Button>
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
                    {product.source === "dropshipping" ? t("seller_app.products.dropshipping") : t("seller_app.products.mine")}
                  </Badge>
                  {!product.is_active && (
                    <Badge variant="secondary" className="text-xs">{t("seller_app.products.inactive")}</Badge>
                  )}
                  {product.has_variants && product.variants && product.variants.length > 0 && (
                    <Badge className="bg-blue-100 text-blue-700 text-xs">
                      {t("seller_app.products.variants_count").replace("{count}", String(product.variants.length))}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-lg font-bold text-gray-900">
                    {product.has_variants && product.variants && product.variants.length > 0
                      ? `${formatPrice(Math.min(...product.variants.map(v => v.price || product.selling_price)))} - ${formatPrice(Math.max(...product.variants.map(v => v.price || product.selling_price)))}`
                      : formatPrice(product.selling_price)
                    }
                  </span>
                  {product.source === "dropshipping" && product.products?.base_price && (
                    <span className="text-sm text-gray-500">
                      {t("seller_app.products.cost")} {formatPrice(product.products.base_price)} • {t("seller_app.products.margin")} {Math.round(((product.selling_price - product.products.base_price) / product.selling_price) * 100)}%
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
                          {t("seller_app.products.deactivate")}
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-2" />
                          {t("seller_app.products.activate")}
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setDeletingProduct(product)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t("seller_app.products.delete")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AlertDialog open={Boolean(deletingProduct)} onOpenChange={(open) => !open && setDeletingProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("seller_app.products.delete_title").replace("{name}", deletingProduct?.name || "")}</AlertDialogTitle>
            <AlertDialogDescription>{t("seller_app.products.delete_body")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("seller_app.products.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (deletingProduct) void handleDeleteProduct(deletingProduct);
                setDeletingProduct(null);
              }}
            >
              {t("seller_app.products.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                {editingProduct ? <Edit className="w-4 h-4 text-emerald-600" /> : <Plus className="w-4 h-4 text-emerald-600" />}
              </div>
              {editingProduct ? t("seller_app.products.edit_product") : t("seller_app.products.new_product")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("seller_app.products.name")}</Label>
                <Input
                  id="name"
                  placeholder={t("seller_app.products.name_ph")}
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">{t("seller_app.products.category")}</Label>
                <Select 
                  value={productForm.category} 
                  onValueChange={(value) => setProductForm({ ...productForm, category: value, variants: [] })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("seller_app.products.category_ph")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vetements">{t("seller_app.products.categories.clothing")}</SelectItem>
                    <SelectItem value="chaussures">{t("seller_app.products.categories.shoes")}</SelectItem>
                    <SelectItem value="accessoires">{t("seller_app.products.categories.accessories")}</SelectItem>
                    <SelectItem value="electronique">{t("seller_app.products.categories.electronics")}</SelectItem>
                    <SelectItem value="maison">{t("seller_app.products.categories.home")}</SelectItem>
                    <SelectItem value="beaute">{t("seller_app.products.categories.beauty")}</SelectItem>
                    <SelectItem value="parfum">{t("seller_app.products.categories.perfume")}</SelectItem>
                    <SelectItem value="alimentaire">{t("seller_app.products.categories.food")}</SelectItem>
                    <SelectItem value="sport">{t("seller_app.products.categories.sport")}</SelectItem>
                    <SelectItem value="autre">{t("seller_app.products.categories.other")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t("seller_app.products.description")}</Label>
              <Textarea
                id="description"
                placeholder={t("seller_app.products.description_ph")}
                rows={3}
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">{t("seller_app.products.price")}</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="0.00"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">{t("seller_app.products.stock")}</Label>
                <Input
                  id="stock"
                  type="number"
                  placeholder={t("seller_app.products.unlimited")}
                  value={productForm.stock}
                  onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t("seller_app.products.images")}</Label>
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
                      <span className="text-xs mt-1">{t("seller_app.products.add")}</span>
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
              <p className="text-xs text-gray-500">{t("seller_app.products.formats")}</p>
            </div>

            {productForm.category && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-semibold">{t("seller_app.products.variants")}</Label>
                    <p className="text-xs text-gray-500">
                      {needsVolume || needsWeight
                        ? t("seller_app.products.variants_volume")
                        : t("seller_app.products.variants_size")
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
                          {t("seller_app.products.sizes")}
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
                          {t("seller_app.products.colors")}
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
                          {t("seller_app.products.volumes")}
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
                            placeholder={t("seller_app.products.custom_volume")}
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
                            placeholder={t("seller_app.products.custom_weight")}
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
                        <Label className="text-sm font-semibold">{t("seller_app.products.variant_config")}</Label>
                        <p className="text-xs text-gray-500">{t("seller_app.products.variant_config_desc")}</p>
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
                                  <span className="text-xs text-gray-500">{t("seller_app.products.price_label")}</span>
                                  <Input
                                    type="number"
                                    placeholder={t("seller_app.products.price_ph")}
                                    className="h-8 w-24"
                                    value={variant.price || ""}
                                    onChange={(e) => updateVariant(variant.id, "price", parseFloat(e.target.value) || 0)}
                                  />
                                  <span className="text-xs text-gray-500">DT</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-xs text-gray-500">{t("seller_app.products.stock_label")}</span>
                                  <Input
                                    type="number"
                                    placeholder={t("seller_app.products.stock_ph")}
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

            <ProductSalesFields
              price={productForm.price}
              compareAt={productForm.compareAt}
              onCompareAtChange={(value) => setProductForm({ ...productForm, compareAt: value })}
              content={productForm.sales}
              onChange={(sales) => setProductForm({ ...productForm, sales })}
            />

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowProductDialog(false)}
                className="flex-1"
              >
                {t("seller_app.products.cancel")}
              </Button>
              <Button
                onClick={handleSaveProduct}
                disabled={productLoading || !productForm.name || !productForm.price}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
              >
                {productLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : editingProduct ? (
                  t("seller_app.products.save")
                ) : (
                  t("seller_app.products.create")
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
