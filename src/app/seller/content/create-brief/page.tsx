"use client";

import { useTranslation } from "@/context/LanguageContext";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Camera, 
  Video, 
  Users, 
  Palette, 
  FileText, 
  ArrowLeft,
  Calendar as CalendarIcon,
  DollarSign,
  MapPin,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FileUpload } from "@/components/ui/file-upload";
import { ProductSelector } from "@/components/marketplace/ProductSelector";
import { DatePicker } from "@/components/ui/date-picker";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useQuota } from "@/hooks/use-quota";
import { QuotaAlert } from "@/components/ui/quota-alert";
import { cn } from "@/lib/utils";

const CONTENT_TYPES = [
  { id: "photography", label: "Photo", icon: Camera, color: "text-blue-500" },
  { id: "video", label: "Vidéo", icon: Video, color: "text-purple-500" },
  { id: "ugc", label: "Contenu UGC", icon: Users, color: "text-emerald-500" },
  { id: "design", label: "Design", icon: Palette, color: "text-orange-500" },
  { id: "copywriting", label: "Rédaction", icon: FileText, color: "text-pink-500" },
];

const RIGHTS_TYPES = [
  { id: "posting", label: "Publication uniquement", description: "Droit de publier sur vos réseaux sociaux" },
  { id: "no_posting", label: "Usage interne uniquement", description: "Droit d'utilisation interne sans publication" },
  { id: "commercial_unlimited", label: "Commercial illimité", description: "Droits commerciaux complets et illimités" },
];

export default function CreateBriefPage() {
  const { t } = useTranslation();
  const tr = (key: string) => t(`seller_app.create_brief.${key}`);
  const router = useRouter();
  const { plan, usage, limits, loading: quotaLoading, check } = useQuota();
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contentType, setContentType] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [deadline, setDeadline] = useState<Date>();
  const [deliverables, setDeliverables] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [referenceImages, setReferenceImages] = useState<File[]>([]);
  const [rightsType, setRightsType] = useState("posting");
  const [preferredCity, setPreferredCity] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !contentType || !budgetMin || !budgetMax || !deadline || !deliverables) {
      toast.error(tr("required"));
      return;
    }

    const min = parseFloat(budgetMin);
    const max = parseFloat(budgetMax);
    if (!(min > 0) || !(max > 0) || min > max) {
      toast.error(tr("budget_error"));
      return;
    }

    if (!check('maxBriefsPerMonth')) {
      toast.error(tr("limit_title"), {
        description: tr("limit_text").replace("{max}", String(limits.maxBriefsPerMonth))
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non connecté");

      // Get store_id
      const { data: store } = await supabase
        .from("stores")
        .select("id")
        .eq("vendor_id", user.id)
        .order("created_at", { ascending: true }).limit(1).maybeSingle();

      if (!store) throw new Error("Boutique introuvable");

      const imageUrls: string[] = [];
      for (const file of referenceImages) {
        const path = `${user.id}/briefs/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const { error: uploadError } = await supabase.storage.from("store-assets").upload(path, file);
        if (uploadError) throw new Error("Échec de l'envoi d'une image de référence");
        imageUrls.push(supabase.storage.from("store-assets").getPublicUrl(path).data.publicUrl);
      }

      const { data, error } = await supabase
        .from("content_briefs")
        .insert({
          store_id: store.id,
          title,
          description,
          content_type: contentType,
          budget: max,
          budget_min: min,
          budget_max: max,
          deadline: deadline.toISOString(),
          deliverables,
          products: selectedProducts,
          reference_images: imageUrls,
          rights_type: rightsType,
          preferred_city: preferredCity,
          status: "published"
        })
        .select()
        .single();

      if (error) throw error;

      await fetch(`/api/content/briefs/${data.id}/publish`, { method: "POST" }).catch(() => null);

      toast.success(tr("published"));
      router.push("/seller/content/briefs");
    } catch (error: any) {
      toast.error(error.message || tr("create_error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-5xl mx-auto px-4 pt-8 space-y-8">
        {!quotaLoading && !check('maxBriefsPerMonth') && (
          <QuotaAlert 
            title={tr("limit_title")}
            description={tr("limit_text").replace("{max}", String(limits.maxBriefsPerMonth))}
            plan={plan}
          />
        )}
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4 me-2 rtl:rotate-180" />
          {tr("back")}
        </Button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">{tr("title")}</h1>
            <p className="text-muted-foreground">{tr("subtitle")}</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.push("/seller/content/briefs")}>
              {tr("cancel")}
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="bg-gradient-to-r from-violet-500 to-purple-600"
            >
              {tr(isSubmitting ? "publishing" : "publish")}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>{tr("general")}</CardTitle>
                <CardDescription>{tr("general_help")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">{tr("project_title")} *</Label>
                  <Input 
                    id="title" 
                    placeholder={tr("project_title_ph")}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">{tr("description")} *</Label>
                  <Textarea 
                    id="description" 
                    placeholder={tr("description_ph")}
                    className="min-h-[150px]"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="space-y-4">
                  <Label>{tr("content_type")} *</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {CONTENT_TYPES.map((type) => (
                      <div
                        key={type.id}
                        onClick={() => setContentType(type.id)}
                        className={cn(
                          "flex flex-col items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
                          contentType === type.id 
                            ? "border-primary bg-primary/5" 
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <type.icon className={cn("w-6 h-6", type.color)} />
                        <span className="text-sm font-medium">{tr(`types.${type.id}`)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{tr("budget_title")}</CardTitle>
                <CardDescription>{tr("budget_help")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="budget-min">{tr("budget_range")} *</Label>
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          id="budget-min" 
                          type="number" 
                          placeholder={tr("min")}
                          className="pl-10"
                          value={budgetMin}
                          onChange={(e) => setBudgetMin(e.target.value)}
                        />
                      </div>
                      <span className="text-muted-foreground">à</span>
                      <div className="relative flex-1">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          id="budget-max" 
                          type="number" 
                          placeholder={tr("max")}
                          className="pl-10"
                          value={budgetMax}
                          onChange={(e) => setBudgetMax(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{tr("deadline")} *</Label>
                    <DatePicker 
                      date={deadline} 
                      setDate={setDeadline}
                      placeholder={tr("deadline_ph")}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deliverables">{tr("deliverables")} *</Label>
                  <Textarea 
                    id="deliverables" 
                    placeholder={tr("deliverables_ph")}
                    value={deliverables}
                    onChange={(e) => setDeliverables(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{tr("rights_title")}</CardTitle>
                <CardDescription>{tr("rights_help")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <RadioGroup 
                  defaultValue="posting" 
                  value={rightsType}
                  onValueChange={setRightsType}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  {RIGHTS_TYPES.map((type) => (
                    <div key={type.id}>
                      <RadioGroupItem 
                        value={type.id} 
                        id={type.id} 
                        className="peer sr-only" 
                      />
                      <Label
                        htmlFor={type.id}
                        className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                      >
                        <span className="text-sm font-semibold">{tr(`rights.${type.id}`)}</span>
                        <span className="text-xs text-muted-foreground mt-1 text-center">
                          {tr(`rights.${type.id}_desc`)}
                        </span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                <div className="space-y-2">
                  <Label htmlFor="city">{tr("city")}</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="city" 
                      placeholder={tr("city_ph")}
                      className="pl-10"
                      value={preferredCity}
                      onChange={(e) => setPreferredCity(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{tr("city_help")}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>{tr("products")}</CardTitle>
                <CardDescription>{tr("products_help")}</CardDescription>
              </CardHeader>
              <CardContent>
                <ProductSelector 
                  onSelected={setSelectedProducts}
                  maxSelection={5}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{tr("references")}</CardTitle>
                <CardDescription>{tr("references_help")}</CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload 
                  onFilesSelected={setReferenceImages}
                  maxFiles={5}
                />
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6 space-y-4">
                <div className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                  <p className="text-sm font-medium">{tr("escrow")}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {tr("escrow_help")}
                </p>
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-primary shrink-0" />
                  <p className="text-sm font-medium">{tr("revisions")}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {tr("revisions_help")}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
