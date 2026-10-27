"use client";

import { useTranslation } from "@/context/LanguageContext";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  DollarSign,
  Clock,
  Send,
  Upload,
  CheckCircle2,
  Briefcase
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FileUpload } from "@/components/ui/file-upload";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function ApplyPage() {
  const { t: tt } = useTranslation();
  const tr = (key: string) => tt(`creator_app.apply.${key}`);
  const tc = (key: string) => tt(`creator_app.common.${key}`);
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [brief, setBrief] = useState<any>(null);

  // Form State
  const [proposedPrice, setProposedPrice] = useState("");
  const [deliveryDays, setDeliveryDays] = useState("");
  const [message, setMessage] = useState("");
  const [portfolioSamples, setPortfolioSamples] = useState<File[]>([]);

  useEffect(() => {
    async function fetchBrief() {
      const { data, error } = await supabase
        .from("content_briefs")
        .select("*, store:stores(name)")
        .eq("id", id)
        .single();

      if (error) {
        toast.error(tr("brief_introuvable"));
        router.push("/creator/opportunities");
        return;
      }
      setBrief(data);
    }
    fetchBrief();
  }, [id, supabase, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposedPrice || !deliveryDays || !message) {
      toast.error(tr("veuillez_remplir_tous_les_champs"));
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(tc("not_signed_in"));

      const sampleUrls: string[] = [];
      for (const file of portfolioSamples.slice(0, 5)) {
        const path = `${user.id}/applications/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const { error: uploadError } = await supabase.storage.from("store-assets").upload(path, file);
        if (uploadError) throw new Error(tr("sample_error"));
        sampleUrls.push(supabase.storage.from("store-assets").getPublicUrl(path).data.publicUrl);
      }

      const response = await fetch(`/api/content/briefs/${id}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposed_price: proposedPrice,
          delivery_days: deliveryDays,
          message,
          portfolio_samples: sampleUrls,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || tr("send_error"));

      toast.success(tr("proposition_envoyee"));
      router.push("/creator/missions");
    } catch (error: any) {
      toast.error(error.message || tr("send_error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!brief) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{tr("envoyer_la_proposition")}</h1>
          <p className="text-muted-foreground">
            Candidature pour : <span className="font-semibold text-foreground">{brief.title}</span> by {brief.store?.name}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>{tr("details_de_la_proposition")}</CardTitle>
              <CardDescription>{tr("precisez_vos_conditions_pour_cette")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="price">{tr("proposed_price_tnd")}</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="price"
                      type="number"
                      placeholder="0.00"
                      className="pl-10"
                      value={proposedPrice}
                      onChange={(e) => setProposedPrice(e.target.value)}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">Budget range: {brief.budget_min} - {brief.budget_max} TND</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="days">{tr("delai_de_livraison_jours")}</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="days"
                      type="number"
                      placeholder="e.g. 5"
                      className="pl-10"
                      value={deliveryDays}
                      onChange={(e) => setDeliveryDays(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">{tr("pourquoi_etes_vous_le_bon")}</Label>
                <Textarea
                  id="message"
                  placeholder={tr("presentez_votre_experience_au_vendeur")}
                  className="min-h-[150px]"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{tr("exemples_de_travaux")}</CardTitle>
              <CardDescription>{tr("ajoutez_3_a_5_exemples")}</CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload
                onFilesSelected={setPortfolioSamples}
                maxFiles={5}
                acceptedTypes={["image/*", "video/*"]}
              />
            </CardContent>
          </Card>

          <div className="flex flex-col gap-4">
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
              <div className="text-sm">
                <p className="font-bold">{tr("informations_importantes")}</p>
                <p className="text-muted-foreground mt-1">
                  {tr("si_vous_etes_retenu_le")}
                </p>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-14 text-lg bg-gradient-to-r from-violet-500 to-purple-600"
              disabled={isSubmitting}
            >
              {tr(isSubmitting ? "sending" : "send")}
              <Send className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
