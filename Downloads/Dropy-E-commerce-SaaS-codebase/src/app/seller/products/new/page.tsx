"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronLeft,
  Loader2,
  X,
  ImagePlus,
  Check,
  Package,
  Palette,
  Ruler,
  Droplets,
  Scale,
  Smartphone,
  Baby,
  Shirt,
  Home,
  Sparkles,
  Dumbbell,
  UtensilsCrossed,
  Search,
  ArrowLeft,
  Save,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  children?: Category[];
}

interface VariantOption {
  id: string;
  value: string;
  label: string;
  hexColor?: string;
}

interface VariantType {
  id: string;
  variantTypeId: string;
  name: string;
  slug: string;
  inputType: string;
  isRequired: boolean;
  options: VariantOption[];
}

interface SelectedVariantOption {
  variantTypeId: string;
  optionId: string;
  value: string;
  label: string;
  hexColor?: string;
}

interface VariantCombination {
  id: string;
  options: SelectedVariantOption[];
  sku: string;
  price: number;
  stock: number;
  isActive: boolean;
}

const ICON_MAP: Record<string, any> = {
  Shirt,
  Smartphone,
  Home,
  Sparkles,
  Dumbbell,
  UtensilsCrossed,
  Package,
};

const STEPS = [
  { id: 1, title: "Catégorie", icon: Package },
  { id: 2, title: "Informations", icon: Package },
  { id: 3, title: "Images", icon: ImagePlus },
  { id: 4, title: "Variantes", icon: Palette },
  { id: 5, title: "Stock & Prix", icon: Scale },
];

export default function NewProductPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [storeId, setStoreId] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryPath, setCategoryPath] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categorySearch, setCategorySearch] = useState("");

  const [variants, setVariants] = useState<VariantType[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [variantCombinations, setVariantCombinations] = useState<VariantCombination[]>([]);

  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    basePrice: "",
    comparePrice: "",
    brand: "",
    tags: "",
    images: [] as string[],
  });

  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchStore();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchVariants(selectedCategory.id);
    }
  }, [selectedCategory]);

  useEffect(() => {
    generateCombinations();
  }, [selectedOptions, productForm.basePrice]);

  async function fetchStore() {
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
      toast.error("Vous devez avoir une boutique pour ajouter des produits");
      router.push("/seller/store/create");
      return;
    }

    setStoreId(store.id);
  }

  async function fetchCategories() {
    setLoading(true);
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      toast.error("Erreur lors du chargement des catégories");
    }
    setLoading(false);
  }

  async function fetchVariants(categoryId: string) {
    try {
      const res = await fetch(`/api/categories/${categoryId}/variants`);
      const data = await res.json();
      setVariants(data.variants || []);
      setSelectedOptions({});
    } catch (error) {
      toast.error("Erreur lors du chargement des variantes");
    }
  }

  const handleCategorySelect = (category: Category) => {
    if (category.children && category.children.length > 0) {
      setCategoryPath([...categoryPath, category]);
    } else {
      setSelectedCategory(category);
      setCategoryPath([...categoryPath, category]);
    }
  };

  const handleCategoryBack = () => {
    if (categoryPath.length > 0) {
      const newPath = [...categoryPath];
      newPath.pop();
      setCategoryPath(newPath);
      if (selectedCategory && categoryPath[categoryPath.length - 1]?.id === selectedCategory.id) {
        setSelectedCategory(null);
      }
    }
  };

  const getCurrentCategories = (): Category[] => {
    if (categoryPath.length === 0) return categories;
    const lastCategory = categoryPath[categoryPath.length - 1];
    if (lastCategory.children && lastCategory.children.length > 0 && !selectedCategory) {
      return lastCategory.children;
    }
    return [];
  };

  const toggleOption = (variantTypeId: string, optionId: string) => {
    setSelectedOptions((prev) => {
      const current = prev[variantTypeId] || [];
      if (current.includes(optionId)) {
        return { ...prev, [variantTypeId]: current.filter((id) => id !== optionId) };
      }
      return { ...prev, [variantTypeId]: [...current, optionId] };
    });
  };

  const generateCombinations = useCallback(() => {
    const activeVariants = variants.filter(
      (v) => selectedOptions[v.variantTypeId]?.length > 0
    );

    if (activeVariants.length === 0) {
      setVariantCombinations([]);
      return;
    }

    const optionArrays = activeVariants.map((v) =>
      v.options.filter((opt) => selectedOptions[v.variantTypeId]?.includes(opt.id))
        .map((opt) => ({
          variantTypeId: v.variantTypeId,
          optionId: opt.id,
          value: opt.value,
          label: opt.label,
          hexColor: opt.hexColor,
        }))
    );

    const cartesian = (arrays: SelectedVariantOption[][]): SelectedVariantOption[][] => {
      if (arrays.length === 0) return [[]];
      const [first, ...rest] = arrays;
      const restCombinations = cartesian(rest);
      return first.flatMap((item) =>
        restCombinations.map((combo) => [item, ...combo])
      );
    };

    const combinations = cartesian(optionArrays);
    const basePrice = parseFloat(productForm.basePrice) || 0;

    setVariantCombinations(
      combinations.map((options, index) => ({
        id: `combo-${index}`,
        options,
        sku: options.map((o) => o.value.substring(0, 3).toUpperCase()).join("-"),
        price: basePrice,
        stock: 0,
        isActive: true,
      }))
    );
  }, [variants, selectedOptions, productForm.basePrice]);

  const updateCombination = (id: string, field: string, value: any) => {
    setVariantCombinations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const applyToAll = (field: "price" | "stock", value: number) => {
    setVariantCombinations((prev) =>
      prev.map((c) => ({ ...c, [field]: value }))
    );
  };

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
        .upload(fileName, file, { cacheControl: "3600", upsert: false });

      if (uploadError) {
        toast.error(`Erreur lors de l'upload`);
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

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!selectedCategory;
      case 2:
        return !!productForm.name && !!productForm.basePrice;
      case 3:
        return productForm.images.length > 0;
      case 4:
        const requiredVariants = variants.filter((v) => v.isRequired);
        return requiredVariants.every(
          (v) => selectedOptions[v.variantTypeId]?.length > 0
        );
      case 5:
        return variantCombinations.length === 0 || 
          variantCombinations.some((c) => c.isActive && c.stock > 0);
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    if (!storeId || !selectedCategory) return;

    setSaving(true);
    const supabase = createClient();

    try {
      const hasVariants = variantCombinations.length > 0;
      
      const { data: product, error: productError } = await supabase
        .from("store_products")
        .insert({
          store_id: storeId,
          category_id: selectedCategory.id,
          name: productForm.name,
          description: productForm.description,
          images: productForm.images.length > 0 ? productForm.images : ["/placeholder-product.jpg"],
          selling_price: parseFloat(productForm.basePrice),
          stock_quantity: hasVariants ? null : 0,
          is_dropship: false,
          source: "own",
          is_active: true,
          has_variants: hasVariants,
          category: selectedCategory.name,
        })
        .select()
        .single();

      if (productError) throw productError;

      if (hasVariants && product) {
        for (const combo of variantCombinations.filter((c) => c.isActive)) {
          const { data: variant, error: variantError } = await supabase
            .from("store_product_variants")
            .insert({
              product_id: product.id,
              sku: combo.sku,
              price: combo.price,
              stock: combo.stock,
              is_active: true,
            })
            .select()
            .single();

          if (variantError) throw variantError;

          for (const opt of combo.options) {
            await supabase.from("store_product_variant_values").insert({
              product_variant_id: variant.id,
              variant_type_id: opt.variantTypeId,
              variant_option_id: opt.optionId,
            });
          }
        }
      }

      toast.success("Produit créé avec succès !");
      router.push("/seller/products/add");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création");
    }
    setSaving(false);
  };

  const getVariantIcon = (slug: string) => {
    switch (slug) {
      case "taille":
        return Ruler;
      case "couleur":
        return Palette;
      case "volume":
        return Droplets;
      case "poids":
        return Scale;
      case "pointure":
        return Ruler;
      case "modele-telephone":
        return Smartphone;
      case "age-taille-enfant":
        return Baby;
      default:
        return Package;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/seller/products/add")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Nouveau produit</h1>
            <p className="text-gray-500 text-sm">
              {selectedCategory
                ? categoryPath.map((c) => c.name).join(" → ")
                : "Sélectionnez une catégorie pour commencer"}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-8 bg-white rounded-xl p-4 border border-gray-100">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => step.id <= currentStep && setCurrentStep(step.id)}
                disabled={step.id > currentStep}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  currentStep === step.id
                    ? "bg-primary text-white"
                    : currentStep > step.id
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {currentStep > step.id ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <step.icon className="w-4 h-4" />
                )}
                <span className="font-medium text-sm hidden md:inline">{step.title}</span>
              </button>
              {index < STEPS.length - 1 && (
                <ChevronRight className="w-5 h-5 text-gray-300 mx-2" />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Sélectionnez une catégorie
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {categoryPath.length > 0 && !selectedCategory && (
                    <div className="flex items-center gap-2 mb-4">
                      <Button variant="ghost" size="sm" onClick={handleCategoryBack}>
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Retour
                      </Button>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        {categoryPath.map((c, i) => (
                          <span key={c.id} className="flex items-center">
                            {i > 0 && <ChevronRight className="w-4 h-4 mx-1" />}
                            {c.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedCategory ? (
                    <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                          <Check className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-green-900">
                            {selectedCategory.name}
                          </p>
                          <p className="text-sm text-green-600">
                            {categoryPath.slice(0, -1).map((c) => c.name).join(" → ")}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCategory(null);
                          setCategoryPath([]);
                          setVariants([]);
                          setSelectedOptions({});
                        }}
                      >
                        Changer
                      </Button>
                    </div>
                  ) : loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {getCurrentCategories().map((category) => {
                        const IconComponent = ICON_MAP[category.icon || "Package"] || Package;
                        const hasChildren = category.children && category.children.length > 0;

                        return (
                          <button
                            key={category.id}
                            onClick={() => handleCategorySelect(category)}
                            className="flex flex-col items-center p-4 rounded-xl border border-gray-200 hover:border-primary hover:bg-primary/5 transition-all group"
                          >
                            <div className="w-12 h-12 rounded-xl bg-gray-100 group-hover:bg-primary/10 flex items-center justify-center mb-3">
                              <IconComponent className="w-6 h-6 text-gray-600 group-hover:text-primary" />
                            </div>
                            <span className="font-medium text-sm text-center text-gray-900">
                              {category.name}
                            </span>
                            {hasChildren && (
                              <ChevronRight className="w-4 h-4 text-gray-400 mt-1" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Informations du produit</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom du produit *</Label>
                    <Input
                      id="name"
                      placeholder="Ex: T-shirt Premium Coton Bio"
                      value={productForm.name}
                      onChange={(e) =>
                        setProductForm({ ...productForm, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Décrivez votre produit en détail..."
                      rows={4}
                      value={productForm.description}
                      onChange={(e) =>
                        setProductForm({ ...productForm, description: e.target.value })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="basePrice">Prix de base (TND) *</Label>
                      <Input
                        id="basePrice"
                        type="number"
                        placeholder="0.00"
                        value={productForm.basePrice}
                        onChange={(e) =>
                          setProductForm({ ...productForm, basePrice: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="comparePrice">
                        Prix barré (TND) <span className="text-gray-400">optionnel</span>
                      </Label>
                      <Input
                        id="comparePrice"
                        type="number"
                        placeholder="0.00"
                        value={productForm.comparePrice}
                        onChange={(e) =>
                          setProductForm({ ...productForm, comparePrice: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="brand">Marque</Label>
                      <Input
                        id="brand"
                        placeholder="Ex: Nike, Zara..."
                        value={productForm.brand}
                        onChange={(e) =>
                          setProductForm({ ...productForm, brand: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tags">Tags</Label>
                      <Input
                        id="tags"
                        placeholder="tendance, nouveau, été..."
                        value={productForm.tags}
                        onChange={(e) =>
                          setProductForm({ ...productForm, tags: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Images du produit</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {productForm.images.map((img, i) => (
                      <div
                        key={i}
                        className="aspect-square relative rounded-xl overflow-hidden border border-gray-200 group"
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        {i === 0 && (
                          <Badge className="absolute top-2 left-2 bg-primary text-white text-xs">
                            Principal
                          </Badge>
                        )}
                        <button
                          onClick={() => removeImage(i)}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-primary cursor-pointer flex flex-col items-center justify-center text-gray-400 hover:text-primary transition-all">
                      {uploadingImage ? (
                        <Loader2 className="w-8 h-8 animate-spin" />
                      ) : (
                        <>
                          <ImagePlus className="w-8 h-8 mb-2" />
                          <span className="text-sm font-medium">Ajouter</span>
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
                  <p className="text-xs text-gray-500 mt-4">
                    Formats acceptés: JPG, PNG, WebP, GIF. Max 5MB par image. Jusqu&apos;à 10 images.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Configurer les variantes</CardTitle>
                </CardHeader>
                <CardContent>
                  {variants.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>Cette catégorie n&apos;a pas de variantes spécifiques.</p>
                      <p className="text-sm">Vous pouvez passer à l&apos;étape suivante.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {variants.map((variant) => {
                        const Icon = getVariantIcon(variant.slug);
                        const isColorVariant = variant.slug === "couleur";
                        const selectedCount = selectedOptions[variant.variantTypeId]?.length || 0;

                        return (
                          <div key={variant.id} className="space-y-3">
                            <div className="flex items-center gap-2">
                              <Icon className="w-5 h-5 text-gray-600" />
                              <Label className="text-base font-semibold">
                                {variant.name}
                                {variant.isRequired && (
                                  <span className="text-red-500 ml-1">*</span>
                                )}
                              </Label>
                              {selectedCount > 0 && (
                                <Badge variant="secondary" className="ml-auto">
                                  {selectedCount} sélectionné(s)
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {variant.options.map((option) => {
                                const isSelected = selectedOptions[variant.variantTypeId]?.includes(option.id);

                                if (isColorVariant) {
                                  return (
                                    <button
                                      key={option.id}
                                      onClick={() => toggleOption(variant.variantTypeId, option.id)}
                                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                                        isSelected
                                          ? "border-primary bg-primary/5"
                                          : "border-gray-200 hover:border-gray-300"
                                      }`}
                                    >
                                      <span
                                        className="w-5 h-5 rounded-full border border-gray-300"
                                        style={{ backgroundColor: option.hexColor || "#ccc" }}
                                      />
                                      <span className="text-sm font-medium">{option.label}</span>
                                      {isSelected && (
                                        <Check className="w-4 h-4 text-primary" />
                                      )}
                                    </button>
                                  );
                                }

                                return (
                                  <button
                                    key={option.id}
                                    onClick={() => toggleOption(variant.variantTypeId, option.id)}
                                    className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                                      isSelected
                                        ? "border-primary bg-primary text-white"
                                        : "border-gray-200 hover:border-gray-300 text-gray-700"
                                    }`}
                                  >
                                    {option.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {currentStep === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Stock & Prix par variante</CardTitle>
                    {variantCombinations.length > 0 && (
                      <div className="flex gap-2">
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            placeholder="Prix"
                            className="w-24 h-9"
                            id="bulkPrice"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const input = document.getElementById("bulkPrice") as HTMLInputElement;
                              if (input?.value) applyToAll("price", parseFloat(input.value));
                            }}
                          >
                            Appliquer
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            placeholder="Stock"
                            className="w-24 h-9"
                            id="bulkStock"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const input = document.getElementById("bulkStock") as HTMLInputElement;
                              if (input?.value) applyToAll("stock", parseInt(input.value));
                            }}
                          >
                            Appliquer
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {variantCombinations.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Scale className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>Aucune variante sélectionnée.</p>
                      <p className="text-sm">
                        Le produit sera créé sans variantes avec le prix de base.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-gray-100 rounded-lg text-sm font-semibold text-gray-600">
                        <div className="col-span-5">Variante</div>
                        <div className="col-span-2">SKU</div>
                        <div className="col-span-2">Prix (TND)</div>
                        <div className="col-span-2">Stock</div>
                        <div className="col-span-1">Actif</div>
                      </div>
                      {variantCombinations.map((combo) => (
                        <div
                          key={combo.id}
                          className={`grid grid-cols-12 gap-4 px-4 py-3 border rounded-lg items-center ${
                            combo.isActive ? "border-gray-200" : "border-gray-100 bg-gray-50 opacity-60"
                          }`}
                        >
                          <div className="col-span-5 flex flex-wrap gap-1">
                            {combo.options.map((opt) => (
                              <Badge
                                key={opt.optionId}
                                variant="secondary"
                                className="flex items-center gap-1"
                              >
                                {opt.hexColor && (
                                  <span
                                    className="w-3 h-3 rounded-full border"
                                    style={{ backgroundColor: opt.hexColor }}
                                  />
                                )}
                                {opt.label}
                              </Badge>
                            ))}
                          </div>
                          <div className="col-span-2">
                            <Input
                              value={combo.sku}
                              onChange={(e) =>
                                updateCombination(combo.id, "sku", e.target.value)
                              }
                              className="h-9 text-xs"
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              type="number"
                              value={combo.price}
                              onChange={(e) =>
                                updateCombination(combo.id, "price", parseFloat(e.target.value) || 0)
                              }
                              className="h-9"
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              type="number"
                              value={combo.stock}
                              onChange={(e) =>
                                updateCombination(combo.id, "stock", parseInt(e.target.value) || 0)
                              }
                              className="h-9"
                            />
                          </div>
                          <div className="col-span-1 flex justify-center">
                            <Checkbox
                              checked={combo.isActive}
                              onCheckedChange={(checked) =>
                                updateCombination(combo.id, "isActive", checked)
                              }
                            />
                          </div>
                        </div>
                      ))}
                      <p className="text-sm text-gray-500 mt-4">
                        {variantCombinations.length} combinaison(s) •{" "}
                        {variantCombinations.filter((c) => c.isActive).length} active(s)
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Précédent
          </Button>

          {currentStep < 5 ? (
            <Button
              onClick={() => setCurrentStep((prev) => Math.min(5, prev + 1))}
              disabled={!canProceed()}
              className="bg-primary hover:bg-primary/90"
            >
              Suivant
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={saving || !canProceed()}
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Créer le produit
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
