"use client";

import { useTranslation } from "@/context/LanguageContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  Upload,
  X,
  Plus,
  AlertCircle,
  Package,
  Save,
  Loader2,
  ChevronRight,
  Sparkles,
  Layers,
  CheckCircle2,
  Trash2,
  Image as ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface Category {
  id: string;
  name: string;
  parent_id: string | null;
  slug: string;
}

interface VariantType {
  id: string;
  name: string;
  slug: string;
  input_type: string;
  options: VariantOption[];
}

interface VariantOption {
  id: string;
  value: string;
  label: string;
  variant_type_id: string;
}

export default function NewSupplierProductPage() {
  const { t: tt } = useTranslation();
  const tr = (key: string) => tt(`supplier_app.product_form.${key}`);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryTree, setCategoryTree] = useState<any[]>([]);
  const [selectedPath, setSelectedPath] = useState<Category[]>([]);
  const [currentLevel, setCurrentLevel] = useState<Category[]>([]);

  const [requiredVariants, setRequiredVariants] = useState<VariantType[]>([]);
  const [selectedVariantOptions, setSelectedVariantOptions] = useState<Record<string, string[]>>({});
  const [variantCombinations, setVariantCombinations] = useState<any[]>([]);
  const [hasVariants, setHasVariants] = useState(false);

  const [images, setImages] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    base_price: "",
    compare_price: "",
    sku: "",
    category_id: "",
    weight: "",
    stock_quantity: "0",
  });

  const supabase = createClient();

  useEffect(() => {
    async function loadCategories() {
      const { data, error } = await supabase
        .from("product_categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (data) {
        // Filter only textile-related categories for suppliers
        const textileCategory = data.find(c => c.slug === 'vetements' || c.slug === 'textile' || c.slug === 'mode' || c.name.toLowerCase().includes('vêtement') || c.name.toLowerCase().includes('textile'));

        if (textileCategory) {
          // Get all children of the textile category
          const getChildCategories = (parentId: string, allCats: Category[]): Category[] => {
            const children = allCats.filter(c => c.parent_id === parentId);
            let result = [...children];
            children.forEach(child => {
              result = [...result, ...getChildCategories(child.id, allCats)];
            });
            return result;
          };

          const textileCategories = [textileCategory, ...getChildCategories(textileCategory.id, data)];
          setCategories(textileCategories);

          // Start with children of textile category
          const firstLevel = textileCategories.filter(c => c.parent_id === textileCategory.id);
          if (firstLevel.length > 0) {
            setSelectedPath([textileCategory]);
            setCurrentLevel(firstLevel);
          } else {
            setCurrentLevel([textileCategory]);
          }
        } else {
          // Fallback: show all categories if no textile found
          setCategories(data);
          const topLevel = data.filter(c => !c.parent_id);
          setCurrentLevel(topLevel);
        }
      }
    }
    loadCategories();
  }, []);

  const handleCategorySelect = async (category: Category) => {
    const children = categories.filter(c => c.parent_id === category.id);
    const newPath = [...selectedPath, category];
    setSelectedPath(newPath);

    if (children.length > 0) {
      setCurrentLevel(children);
    } else {
      setFormData(prev => ({ ...prev, category_id: category.id }));
      fetchCategoryVariants(category.id);
      setStep(2);
    }
  };

  const fetchCategoryVariants = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/categories/${categoryId}/variants`);
      const data = await response.json();
      setRequiredVariants(data || []);

      const initialOptions: Record<string, string[]> = {};
      data.forEach((v: any) => {
        initialOptions[v.id] = [];
      });
      setSelectedVariantOptions(initialOptions);
    } catch (error) {
      console.error("Error fetching variants:", error);
    }
  };

  const resetCategory = () => {
    const textileCategory = categories.find(c => c.slug === 'vetements' || c.slug === 'textile' || c.slug === 'mode' || c.name.toLowerCase().includes('vêtement') || c.name.toLowerCase().includes('textile'));
    if (textileCategory) {
      const firstLevel = categories.filter(c => c.parent_id === textileCategory.id);
      setSelectedPath([textileCategory]);
      setCurrentLevel(firstLevel.length > 0 ? firstLevel : [textileCategory]);
    } else {
      setSelectedPath([]);
      setCurrentLevel(categories.filter(c => !c.parent_id));
    }
    setFormData(prev => ({ ...prev, category_id: "" }));
    setRequiredVariants([]);
    setVariantCombinations([]);
    setStep(1);
  };

  const toggleVariantOption = (variantTypeId: string, optionId: string) => {
    setSelectedVariantOptions(prev => {
      const current = prev[variantTypeId] || [];
      const updated = current.includes(optionId)
        ? current.filter(id => id !== optionId)
        : [...current, optionId];

      const newOptions = { ...prev, [variantTypeId]: updated };
      generateCombinations(newOptions);
      return newOptions;
    });
  };

  const generateCombinations = (options: Record<string, string[]>) => {
    const variantTypesToCombine = requiredVariants.filter(v => options[v.id]?.length > 0);

    if (variantTypesToCombine.length === 0) {
      setVariantCombinations([]);
      return;
    }

    let combinations: any[] = [{}];

    variantTypesToCombine.forEach(vt => {
      const newCombinations: any[] = [];
      const selectedOptionsForType = vt.options.filter(opt => options[vt.id].includes(opt.id));

      combinations.forEach(combo => {
        selectedOptionsForType.forEach(opt => {
          newCombinations.push({
            ...combo,
            [vt.id]: opt
          });
        });
      });
      combinations = newCombinations;
    });

    setVariantCombinations(combinations.map((combo, idx) => ({
      id: `temp-${idx}`,
      options: combo,
      price: formData.base_price,
      stock: "0",
      sku: `${formData.sku || 'SKU'}-${idx}`,
      active: true
    })));
  };

  const handleAddImage = () => {
    if (!imageUrl.trim()) return;
    if (!imageUrl.startsWith("http")) {
      toast.error(tr("veuillez_entrer_une_url_valide"));
      return;
    }
    setImages([...images, imageUrl]);
    setImageUrl("");
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.base_price) {
      toast.error(tr("veuillez_remplir_les_informations_de"));
      return;
    }

    if (images.length === 0) {
      toast.error(tr("veuillez_ajouter_au_moins_une"));
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { data: product, error: productError } = await supabase
        .from("products")
        .insert({
          name: formData.name,
          slug: `${formData.name.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "produit"}-${Math.random().toString(36).slice(2, 8)}`,
          description: formData.description,
          base_price: parseFloat(formData.base_price),
          compare_price: formData.compare_price ? parseFloat(formData.compare_price) : null,
          category_id: null,
          sub_category: selectedPath[selectedPath.length - 1]?.name ?? null,
          gender: selectedPath[1]?.name ?? selectedPath[0]?.name ?? null,
          sku: formData.sku,
          supplier_id: user.id,
          images: images,
          status: "pending",
          is_active: true,
          weight: formData.weight ? parseFloat(formData.weight) : null,
          stock_quantity: hasVariants ? null : parseInt(formData.stock_quantity) || 0
        })
        .select()
        .single();

      if (productError) throw productError;

      if (hasVariants && variantCombinations.length > 0) {
        for (const combo of variantCombinations) {
          const { data: variant, error: variantError } = await supabase
            .from("product_variants")
            .insert({
              product_id: product.id,
              sku: combo.sku,
              price_adjustment: combo.price ? parseFloat(combo.price) - parseFloat(formData.base_price) : 0,
              stock_quantity: parseInt(combo.stock) || 0,
              name: Object.values(combo.options).map((opt: any) => opt.label).join(" / "),
              attributes: combo.options
            })
            .select()
            .single();

          if (variantError) throw variantError;

          const variantValues = Object.entries(combo.options).map(([vtId, opt]: [string, any]) => ({
            product_variant_id: variant.id,
            variant_type_id: vtId,
            variant_option_id: opt.id
          }));

          const { error: valuesError } = await supabase
            .from("product_variant_values")
            .insert(variantValues);

          if (valuesError) throw valuesError;
        }
      }

      toast.success(tr("produit_envoye_il_sera_visible"));
      router.push("/supplier/products");
    } catch (error: any) {
      console.error("Error creating product:", error);
      toast.error(error.message || tr("create_error"));
    } finally {
      setLoading(false);
    }
  };

  const totalSteps = hasVariants && requiredVariants.length > 0 ? 5 : 3;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/supplier/products">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200 uppercase text-[10px] font-bold tracking-wider">{tr("fournisseur_textile")}</Badge>
                <h1 className="text-xl font-bold text-gray-900">{tr("nouveau_produit_textile")}</h1>
              </div>
              <p className="text-sm text-gray-500 font-medium">{tr("ajoutez_vos_vetements_et_articles")}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              className="rounded-full px-8 font-semibold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
              onClick={handleSubmit}
              disabled={loading || step < 3}
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {tr("publish")}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 mt-8">
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-3">
            <div className="sticky top-28 space-y-1">
              {[
                { id: 1, label: tr("step_category"), icon: Layers },
                { id: 2, label: tr("step_info"), icon: Package },
                { id: 3, label: tr("step_images"), icon: ImageIcon },
                ...(hasVariants && requiredVariants.length > 0 ? [
                  { id: 4, label: tr("step_variants"), icon: Sparkles },
                  { id: 5, label: "Stock & Prix", icon: CheckCircle2 },
                ] : []),
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => step >= s.id && setStep(s.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${step === s.id
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : step > s.id
                      ? "text-gray-700 hover:bg-gray-100"
                      : "text-gray-400 cursor-not-allowed"
                    }`}
                >
                  <s.icon className={`w-4 h-4 ${step === s.id ? "text-white" : "text-gray-400"}`} />
                  {s.label}
                  {step > s.id && <CheckCircle2 className="w-4 h-4 ml-auto text-emerald-500" />}
                </button>
              ))}
            </div>
          </div>

          <div className="col-span-9 space-y-8">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <Card className="border-none shadow-sm overflow-hidden">
                    <CardHeader className="bg-white border-b border-gray-100 pb-6">
                      <CardTitle className="text-xl font-bold">{tr("selectionner_une_sous_categorie_textile")}</CardTitle>
                      <CardDescription>{tr("choisissez_le_type_de_vetement")}</CardDescription>

                      {selectedPath.length > 0 && (
                        <div className="flex items-center gap-2 mt-4">
                          {selectedPath.map((cat, i) => (
                            <div key={cat.id} className="flex items-center gap-2">
                              {i > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
                              <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200">
                                {cat.name}
                              </Badge>
                            </div>
                          ))}
                          <Button variant="ghost" size="sm" onClick={resetCategory} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                            {tr("reinitialiser")}
                          </Button>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="grid grid-cols-2 divide-x divide-gray-100">
                        <div className="p-4 space-y-1 max-h-[400px] overflow-y-auto">
                          {currentLevel.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                              <Layers className="w-10 h-10 mx-auto mb-2 opacity-20" />
                              <p className="text-sm">{tr("aucune_categorie_disponible")}</p>
                            </div>
                          ) : (
                            currentLevel.map((cat) => (
                              <button
                                key={cat.id}
                                onClick={() => handleCategorySelect(cat)}
                                className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-primary/5 hover:text-primary transition-all group font-medium text-sm"
                              >
                                {cat.name}
                                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                              </button>
                            ))
                          )}
                        </div>
                        <div className="bg-gray-50/50 p-8 flex flex-col items-center justify-center text-center">
                          <Layers className="w-12 h-12 text-gray-200 mb-4" />
                          <p className="text-sm text-gray-500 font-medium max-w-[200px]">
                            {tr("selectionnez_une_sous_categorie_pour")}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-800">
                      <strong>{tr("note")}</strong> En tant que fournisseur textile, vous ne pouvez ajouter que des produits vestimentaires (T-shirts, robes, pantalons, etc.)
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <Card className="border-none shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-xl font-bold">{tr("informations_de_base")}</CardTitle>
                      <CardDescription>{tr("details_essentiels_sur_votre_produit")}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-bold text-gray-700">{tr("nom_du_produit")}</Label>
                        <Input
                          placeholder={tr("ex_t_shirt_col_rond")}
                          className="h-12 rounded-xl border-gray-200 focus:ring-primary"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-bold text-gray-700">{tr("description_detaillee")}</Label>
                        <Textarea
                          placeholder={tr("decrivez_votre_produit_ses_caracteristiques")}
                          className="min-h-[150px] rounded-xl border-gray-200 focus:ring-primary"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-bold text-gray-700">{tr("prix_de_vente_tnd")}</Label>
                          <Input
                            type="number"
                            placeholder="0.00"
                            className="h-12 rounded-xl border-gray-200"
                            value={formData.base_price}
                            onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-bold text-gray-700">{tr("prix_barre_optionnel")}</Label>
                          <Input
                            type="number"
                            placeholder="0.00"
                            className="h-12 rounded-xl border-gray-200"
                            value={formData.compare_price}
                            onChange={(e) => setFormData({ ...formData, compare_price: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-bold text-gray-700">{tr("sku_de_reference")}</Label>
                          <Input
                            placeholder={tr("ex_prd_001")}
                            className="h-12 rounded-xl border-gray-200"
                            value={formData.sku}
                            onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-bold text-gray-700">{tr("poids_kg")}</Label>
                          <Input
                            type="number"
                            placeholder="0.5"
                            step="0.1"
                            className="h-12 rounded-xl border-gray-200"
                            value={formData.weight}
                            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                          />
                        </div>
                      </div>

                      {!hasVariants && (
                        <div className="space-y-2">
                          <Label className="text-sm font-bold text-gray-700">{tr("quantite_en_stock")}</Label>
                          <Input
                            type="number"
                            placeholder="0"
                            className="h-12 rounded-xl border-gray-200"
                            value={formData.stock_quantity}
                            onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                          />
                        </div>
                      )}

                      {requiredVariants.length > 0 && (
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                          <div>
                            <p className="font-bold text-sm">{tr("ce_produit_a_des_variantes")}</p>
                            <p className="text-xs text-gray-500">{tr("tailles_couleurs_etc")}</p>
                          </div>
                          <Switch checked={hasVariants} onCheckedChange={setHasVariants} />
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <div className="flex justify-end">
                    <Button onClick={() => setStep(3)} className="rounded-full px-8 bg-primary h-12">
                      Continuer <ChevronRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <Card className="border-none shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-xl font-bold">Galerie d&apos;images</CardTitle>
                      <CardDescription>{tr("ajoutez_des_visuels_de_haute")}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex gap-2">
                        <Input
                          placeholder={tr("lien_de_l_image_https")}
                          className="h-12 rounded-xl border-gray-200"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                        />
                        <Button onClick={handleAddImage} variant="secondary" className="h-12 px-6 rounded-xl">
                          <Plus className="w-4 h-4 mr-2" />
                          Ajouter
                        </Button>
                      </div>

                      <div className="grid grid-cols-4 gap-4">
                        {images.map((img, idx) => (
                          <div key={idx} className="aspect-square relative rounded-2xl overflow-hidden border border-gray-100 group shadow-sm bg-white">
                            <img src={img} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button
                                onClick={() => removeImage(idx)}
                                className="p-2 bg-white text-red-500 rounded-full hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            {idx === 0 && (
                              <Badge className="absolute top-2 left-2 bg-primary text-white text-[10px]">{tr("principale")}</Badge>
                            )}
                          </div>
                        ))}
                        <div className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 p-4 text-center">
                          <ImageIcon className="w-8 h-8 mb-2 opacity-20" />
                          <p className="text-[10px] font-bold uppercase tracking-wider">{tr("ajouter")}</p>
                        </div>
                      </div>

                      <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-3">
                        <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                        <div className="text-xs text-blue-800 leading-relaxed">
                          <strong>{tr("conseil")}</strong> Utilisez des images claires sur fond neutre pour mettre en valeur votre produit.
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-between">
                    <Button variant="ghost" onClick={() => setStep(2)} className="rounded-full px-8 h-12">
                      Retour
                    </Button>
                    {hasVariants && requiredVariants.length > 0 ? (
                      <Button onClick={() => setStep(4)} className="rounded-full px-8 bg-primary h-12">
                        Configurer les variantes <ChevronRight className="ml-2 w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        onClick={handleSubmit}
                        className="rounded-full px-12 bg-primary h-12 shadow-lg shadow-primary/20"
                        disabled={loading}
                      >
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        {tr("publish")}
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}

              {step === 4 && hasVariants && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {requiredVariants.map((vt) => (
                    <Card key={vt.id} className="border-none shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-lg font-bold">{vt.name}</CardTitle>
                        <CardDescription>{tr("selectionnez_les_options_disponibles")}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {vt.slug === 'couleur' ? (
                          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                            {vt.options.map((opt) => (
                              <button
                                key={opt.id}
                                onClick={() => toggleVariantOption(vt.id, opt.id)}
                                className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${selectedVariantOptions[vt.id]?.includes(opt.id)
                                  ? "border-primary bg-primary/5"
                                  : "border-gray-100 hover:border-gray-200"
                                  }`}
                              >
                                <div
                                  className="w-8 h-8 rounded-full border border-gray-200 shadow-inner"
                                  style={{ backgroundColor: opt.value }}
                                />
                                <span className="text-[10px] font-bold text-gray-700 truncate w-full text-center">{opt.label}</span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {vt.options.map((opt) => (
                              <button
                                key={opt.id}
                                onClick={() => toggleVariantOption(vt.id, opt.id)}
                                className={`px-4 py-2 rounded-lg border-2 text-sm font-bold transition-all ${selectedVariantOptions[vt.id]?.includes(opt.id)
                                  ? "border-primary bg-primary text-white"
                                  : "border-gray-100 hover:border-gray-200 text-gray-700"
                                  }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}

                  <div className="flex justify-between">
                    <Button variant="ghost" onClick={() => setStep(3)} className="rounded-full px-8 h-12">
                      Retour
                    </Button>
                    <Button
                      onClick={() => setStep(5)}
                      className="rounded-full px-8 bg-primary h-12"
                      disabled={variantCombinations.length === 0}
                    >
                      Gérer le stock ({variantCombinations.length}) <ChevronRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 5 && hasVariants && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <Card className="border-none shadow-sm overflow-hidden">
                    <CardHeader>
                      <CardTitle className="text-xl font-bold">{tr("matrice_des_variantes")}</CardTitle>
                      <CardDescription>{tr("definissez_le_stock_et_ajustez")}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-gray-50/50 border-y border-gray-100">
                            <tr>
                              <th className="px-6 py-4 font-bold text-gray-700">{tr("variante")}</th>
                              <th className="px-6 py-4 font-bold text-gray-700">{tr("sku")}</th>
                              <th className="px-6 py-4 font-bold text-gray-700">{tr("prix_tnd")}</th>
                              <th className="px-6 py-4 font-bold text-gray-700">{tr("stock")}</th>
                              <th className="px-6 py-4 font-bold text-gray-700">{tr("action")}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {variantCombinations.map((combo, idx) => (
                              <tr key={combo.id} className={!combo.active ? "opacity-40" : ""}>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    {Object.values(combo.options).map((opt: any, i) => (
                                      <div key={i} className="flex items-center gap-1">
                                        {i > 0 && <span className="text-gray-300">/</span>}
                                        <Badge variant="outline" className="font-bold text-[11px]">{opt.label}</Badge>
                                      </div>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <Input
                                    value={combo.sku}
                                    onChange={(e) => {
                                      const newCombos = [...variantCombinations];
                                      newCombos[idx].sku = e.target.value;
                                      setVariantCombinations(newCombos);
                                    }}
                                    className="h-9 rounded-lg text-xs w-32 border-gray-100"
                                  />
                                </td>
                                <td className="px-6 py-4">
                                  <Input
                                    type="number"
                                    value={combo.price}
                                    onChange={(e) => {
                                      const newCombos = [...variantCombinations];
                                      newCombos[idx].price = e.target.value;
                                      setVariantCombinations(newCombos);
                                    }}
                                    className="h-9 rounded-lg text-xs w-24 border-gray-100"
                                  />
                                </td>
                                <td className="px-6 py-4">
                                  <Input
                                    type="number"
                                    value={combo.stock}
                                    onChange={(e) => {
                                      const newCombos = [...variantCombinations];
                                      newCombos[idx].stock = e.target.value;
                                      setVariantCombinations(newCombos);
                                    }}
                                    className="h-9 rounded-lg text-xs w-20 border-gray-100"
                                  />
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <Checkbox
                                    checked={combo.active}
                                    onCheckedChange={(checked) => {
                                      const newCombos = [...variantCombinations];
                                      newCombos[idx].active = !!checked;
                                      setVariantCombinations(newCombos);
                                    }}
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-between">
                    <Button variant="ghost" onClick={() => setStep(4)} className="rounded-full px-8 h-12">
                      Retour
                    </Button>
                    <div className="flex gap-3">
                      <Button
                        onClick={handleSubmit}
                        className="rounded-full px-12 bg-primary h-12 shadow-lg shadow-primary/20"
                        disabled={loading}
                      >
                        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Terminer & Publier
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
