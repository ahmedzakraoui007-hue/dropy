"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ChevronLeft, 
  Plus, 
  Video, 
  Camera, 
  FileText, 
  Calendar,
  DollarSign,
  Loader2,
  Trash2,
  GripVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { ProductSelector } from "@/components/marketplace/ProductSelector";

export default function NewBriefPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contentType, setContentType] = useState("video");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [requirements, setRequirements] = useState<string[]>([""]);

  const handleAddRequirement = () => setRequirements([...requirements, ""]);
  const handleRemoveRequirement = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index));
  };
  const handleRequirementChange = (index: number, value: string) => {
    const newReqs = [...requirements];
    newReqs[index] = value;
    setRequirements(newReqs);
  };

  async function handleSubmit() {
    if (!title || !description || !budget || !deadline || selectedProducts.length === 0) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Get store id
    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("seller_id", user?.id)
      .single();

    if (!store) {
      toast.error("Boutique non trouvée");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase
        .from("content_briefs")
        .insert({
          store_id: store.id,
          title,
          description,
          content_type: contentType,
          budget: parseFloat(budget),
          deadline: new Date(deadline).toISOString(),
          requirements: requirements.filter(r => r.trim() !== ""),
          products: selectedProducts.map(p => ({ id: p.id, name: p.name, image: p.image_url })),
          status: "published"
        });

      if (error) throw error;

      toast.success("Brief publié avec succès !");
      router.push("/seller/creators/briefs");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nouveau Brief Créatif</h1>
          <p className="text-muted-foreground">Définissez vos besoins pour obtenir le meilleur contenu.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Titre du projet</Label>
                <Input 
                  id="title" 
                  placeholder="Ex: Vidéo UGC pour Masque Hydratant" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description & Objectifs</Label>
                <Textarea 
                  id="description" 
                  placeholder="Décrivez ce que vous attendez du créateur..." 
                  className="h-32"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type de contenu</Label>
                  <Select value={contentType} onValueChange={setContentType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Vidéo / UGC</SelectItem>
                      <SelectItem value="photo">Photo / Packshot</SelectItem>
                      <SelectItem value="modeling">Mannequinat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadline">Date limite</Label>
                  <Input 
                    id="deadline" 
                    type="date" 
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="budget">Budget estimé (TND)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="budget" 
                    type="number" 
                    placeholder="0.00" 
                    className="pl-9"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <Label>Exigences spécifiques</Label>
                <Button variant="outline" size="sm" onClick={handleAddRequirement}>
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter
                </Button>
              </div>
              <div className="space-y-3">
                {requirements.map((req, index) => (
                  <div key={index} className="flex gap-2">
                    <Input 
                      placeholder={`Exigence #${index + 1}`} 
                      value={req}
                      onChange={(e) => handleRequirementChange(index, e.target.value)}
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive shrink-0"
                      onClick={() => handleRemoveRequirement(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <Label className="mb-4 block">Produits concernés</Label>
              <ProductSelector onSelected={setSelectedProducts} maxSelection={3} />
              
              <div className="mt-6 space-y-2">
                {selectedProducts.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 p-2 bg-muted rounded-lg">
                    <img src={p.image_url} className="w-10 h-10 rounded object-cover" alt="" />
                    <span className="text-sm font-medium truncate flex-1">{p.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="sticky top-24">
            <Card className="bg-emerald-500 text-white border-0 shadow-lg shadow-emerald-500/20">
              <CardContent className="p-6 text-center">
                <h3 className="font-bold mb-2">Prêt à publier ?</h3>
                <p className="text-sm text-white/80 mb-6">
                  Votre brief sera visible par tous les créateurs de la plateforme.
                </p>
                <Button 
                  className="w-full bg-white text-emerald-600 hover:bg-white/90 font-bold h-12"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Publier le Brief"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
