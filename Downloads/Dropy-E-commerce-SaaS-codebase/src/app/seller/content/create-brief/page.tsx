"use client";

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
  { id: "photography", label: "Photography", icon: Camera, color: "text-blue-500" },
  { id: "video", label: "Video", icon: Video, color: "text-purple-500" },
  { id: "ugc", label: "UGC Content", icon: Users, color: "text-emerald-500" },
  { id: "design", label: "Design", icon: Palette, color: "text-orange-500" },
  { id: "copywriting", label: "Copywriting", icon: FileText, color: "text-pink-500" },
];

const RIGHTS_TYPES = [
  { id: "posting", label: "Posting Only", description: "Right to post on your social media" },
  { id: "no_posting", label: "Internal Use Only", description: "Right to use internally without posting" },
  { id: "commercial_unlimited", label: "Commercial Unlimited", description: "Full commercial rights forever" },
];

export default function CreateBriefPage() {
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
      toast.error("Please fill in all required fields");
      return;
    }

    if (!check('maxBriefsPerMonth')) {
      toast.error("Brief limit reached", {
        description: `Your ${plan} plan is limited to ${limits.maxBriefsPerMonth} briefs per month.`
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get store_id
      const { data: store } = await supabase
        .from("stores")
        .select("id")
        .eq("seller_id", user.id)
        .single();

      if (!store) throw new Error("Store not found");

      // Upload reference images if any (simplified for now - just logging)
      // In a real app, you'd upload these to Supabase Storage
      const imageUrls: string[] = [];

      const { data, error } = await supabase
        .from("content_briefs")
        .insert({
          store_id: store.id,
          title,
          description,
          content_type: contentType,
          budget_min: parseFloat(budgetMin),
          budget_max: parseFloat(budgetMax),
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

      toast.success("Brief published successfully!");
      router.push("/seller/content/briefs");
    } catch (error: any) {
      toast.error(error.message || "Failed to create brief");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-5xl mx-auto px-4 pt-8 space-y-8">
        {!quotaLoading && !check('maxBriefsPerMonth') && (
          <QuotaAlert 
            title="Limite de briefs atteinte"
            description={`Vous avez déjà créé ${usage.briefsThisMonth} brief(s) ce mois-ci. Votre plan ${plan} est limité à ${limits.maxBriefsPerMonth} par mois.`}
            plan={plan}
          />
        )}
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Create a Content Brief</h1>
            <p className="text-muted-foreground">Define your needs and find the perfect creator</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.push("/seller/content/briefs")}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="bg-gradient-to-r from-violet-500 to-purple-600"
            >
              {isSubmitting ? "Publishing..." : "Publish Brief"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Start with the essentials of your project</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Project Title*</Label>
                  <Input 
                    id="title" 
                    placeholder="e.g. 5 Lifestyle photos for Summer Collection"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Detailed Description*</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Describe your vision, target audience, and any specific requirements..."
                    className="min-h-[150px]"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="space-y-4">
                  <Label>Content Type*</Label>
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
                        <span className="text-sm font-medium">{type.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Budget & Timeline</CardTitle>
                <CardDescription>Set your expectations for cost and delivery</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="budget-min">Budget Range (TND)*</Label>
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          id="budget-min" 
                          type="number" 
                          placeholder="Min" 
                          className="pl-10"
                          value={budgetMin}
                          onChange={(e) => setBudgetMin(e.target.value)}
                        />
                      </div>
                      <span className="text-muted-foreground">to</span>
                      <div className="relative flex-1">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input 
                          id="budget-max" 
                          type="number" 
                          placeholder="Max" 
                          className="pl-10"
                          value={budgetMax}
                          onChange={(e) => setBudgetMax(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Deadline*</Label>
                    <DatePicker 
                      date={deadline} 
                      setDate={setDeadline}
                      placeholder="Select delivery date"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deliverables">Specific Deliverables*</Label>
                  <Textarea 
                    id="deliverables" 
                    placeholder="e.g. 5 high-res JPG photos, 1 edited vertical video (15-30s)..."
                    value={deliverables}
                    onChange={(e) => setDeliverables(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usage Rights & Location</CardTitle>
                <CardDescription>How you intend to use the content</CardDescription>
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
                        <span className="text-sm font-semibold">{type.label}</span>
                        <span className="text-xs text-muted-foreground mt-1 text-center">
                          {type.description}
                        </span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                <div className="space-y-2">
                  <Label htmlFor="city">Preferred City (Optional)</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      id="city" 
                      placeholder="e.g. Tunis, Sousse, Sfax..." 
                      className="pl-10"
                      value={preferredCity}
                      onChange={(e) => setPreferredCity(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Useful if you need products to be picked up or physical presence</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Products</CardTitle>
                <CardDescription>Select products for this mission</CardDescription>
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
                <CardTitle>Reference Images</CardTitle>
                <CardDescription>Mood board or style examples</CardDescription>
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
                  <p className="text-sm font-medium">Safe Escrow Payment</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your payment will be held securely by Dropy and released only after you approve the final content.
                </p>
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-primary shrink-0" />
                  <p className="text-sm font-medium">2 Revisions Included</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  All missions include at least 2 rounds of revisions to ensure you get exactly what you need.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
