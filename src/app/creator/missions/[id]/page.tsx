"use client";

import { useTranslation } from "@/context/LanguageContext";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Upload,
  MessageSquare,
  FileText,
  Shield,
  AlertCircle,
  Play,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DisputeDialog } from "@/components/content/DisputeDialog";
import { FileUpload } from "@/components/ui/file-upload";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ShieldAlert } from "lucide-react";

export default function MissionDetailsPage() {
  const { t: tt } = useTranslation();
  const tr = (key: string) => tt(`creator_app.mission.${key}`);
  const tc = (key: string) => tt(`creator_app.common.${key}`);
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [brief, setBrief] = useState<any>(null);
  const [myApplication, setMyApplication] = useState<any>(null);
  const [isDelivering, setIsDelivering] = useState(false);
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const [deliveryFiles, setDeliveryFiles] = useState<File[]>([]);
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);
  const [payment, setPayment] = useState<any>(null);
  const [lastDelivery, setLastDelivery] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

        const { data: briefData, error: briefError } = await supabase
          .from("content_briefs")
          .select(`
            *,
            store:stores(name, logo_url, vendor_id)
          `)
          .eq("id", id)
          .single();


      if (briefError) {
        toast.error(tr("mission_introuvable"));
        router.push("/creator/missions");
        return;
      }

      const { data: application } = await supabase
        .from("content_applications")
        .select("*")
        .eq("brief_id", id)
        .eq("creator_id", user.id)
        .maybeSingle();

      const { data: paymentData } = await supabase
        .from("content_payments")
        .select("status, escrowed_at, released_at, stripe_transfer_id, creator_amount")
        .eq("brief_id", id)
        .maybeSingle();

      const { data: deliveryData } = await supabase
        .from("content_deliveries")
        .select("status, revision_count, delivered_at")
        .eq("brief_id", id)
        .order("delivered_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setBrief(briefData);
      setMyApplication(application);
      setPayment(paymentData);
      setLastDelivery(deliveryData);
      setIsLoading(false);
    }

    fetchData();
  }, [id, supabase, router]);

  const handleDeliver = async () => {
    if (deliveryFiles.length === 0) {
      toast.error(tr("veuillez_envoyer_au_moins_un"));
      return;
    }

    setIsDelivering(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(tc("not_signed_in"));
      
      // Upload files to Supabase Storage
      const uploadedFiles = [];
      for (const file of deliveryFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${id}/${user.id}/${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("content-deliverables")
          .upload(fileName, file);
          
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from("content-deliverables")
          .getPublicUrl(fileName);
          
        uploadedFiles.push({
          url: publicUrl,
          filename: file.name,
          type: file.type,
          size: file.size,
          path: fileName
        });
      }

      const response = await fetch(`/api/content/briefs/${id}/deliver`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: uploadedFiles, message: deliveryMessage }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || tr("deliver_error"));

      toast.success(tr("projet_livre_en_attente_de"));
      setBrief({ ...brief, status: "delivered" });
      setLastDelivery({ status: "submitted", revision_count: lastDelivery?.revision_count || 0 });
      setDeliveryFiles([]);
      setDeliveryMessage("");
    } catch (error: any) {
      toast.error(error.message || tr("deliver_error"));
    } finally {
      setIsDelivering(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  const isHired = Boolean(myApplication) && brief.selected_creator_id === myApplication?.creator_id;
  const fundsSecured = Boolean(payment?.escrowed_at);
  const statusLabel: Record<string, string> = {
    published: isHired ? tr("waiting_payment") : tr("open"),
    assigned: tc("brief_assigned"),
    in_progress: tc("brief_in_progress"),
    delivered: tc("brief_delivered"),
    completed: tc("brief_completed"),
    cancelled: tc("brief_cancelled"),
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-6xl mx-auto px-4 pt-8">
        <Button variant="ghost" className="mb-6" onClick={() => router.push("/creator/missions")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            {tr("retour_aux_missions")}
          </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                  <div className="flex justify-between items-start gap-4 w-full">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{tc(`type_${brief.content_type}`)}</Badge>
                        <Badge className={cn(
                          brief.status === "completed" ? "bg-emerald-500" : 
                          brief.status === "delivered" ? "bg-blue-500" :
                          "bg-primary"
                        )}>
                          {statusLabel[brief.status] || brief.status}
                        </Badge>
                        {brief.is_disputed && (
                          <Badge variant="destructive" className="animate-pulse">{tr("en_litige")}</Badge>
                        )}
                      </div>
                      <CardTitle className="text-3xl">{brief.title}</CardTitle>
                      <CardDescription className="mt-2">
                          Mission de {brief.store?.name}
                        </CardDescription>
                    </div>
                    {!brief.is_disputed && (brief.status === "assigned" || brief.status === "delivered") && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => setIsDisputeOpen(true)}
                      >
                        <ShieldAlert className="w-4 h-4 mr-2" />
                          {tr("ouvrir_un_litige")}
                        </Button>
                    )}
                  </div>

              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-border/50">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase font-bold">{tr("mon_prix")}</p>
                      <p className="font-semibold text-primary">{myApplication?.proposed_price} TND</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase font-bold">{tr("date_limite")}</p>
                      <p className="font-semibold">{format(new Date(brief.deadline), "dd/MM/yyyy")}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase font-bold">{tr("statut")}</p>
                      <p className="font-semibold">{statusLabel[brief.status] || brief.status}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase font-bold">{tr("livraison")}</p>
                      <p className="font-semibold">{myApplication?.delivery_days} jours</p>
                    </div>
                  </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-bold">{tr("details_du_brief")}</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{brief.description}</p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-bold">{tr("livrables_specifiques")}</h3>
                  <div className="p-4 rounded-xl bg-muted/50 border border-border">
                    <p className="text-muted-foreground whitespace-pre-wrap">{brief.deliverables}</p>
                  </div>
                </div>

                {brief.products && brief.products.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold">{tr("produits")}</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {brief.products.map((product: any, idx: number) => (
                          <Card key={product.id || idx} className="flex items-center gap-3 p-3 border-border/50">
                            <img src={product.image || product.image_url} alt={product.name} className="w-12 h-12 rounded-md object-cover" />
                            <div>
                              <p className="text-sm font-medium">{product.name}</p>
                              <p className="text-xs text-muted-foreground">{product.price} TND</p>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>

            {isHired && brief.status === "published" && (
              <Card className="border-amber-500/20 bg-amber-500/5 p-8 text-center">
                <Clock className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">{tr("vous_avez_ete_retenu")}</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {payment
                    ? tr("payment_sent")
                    : tr("payment_wait")}
                </p>
              </Card>
            )}

            {isHired && (brief.status === "assigned" || brief.status === "in_progress") && !brief.is_disputed && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                    <CardTitle>{brief.status === "in_progress" ? tr("deliver_revision") : tr("deliver_work")}</CardTitle>
                    <CardDescription>
                      {lastDelivery?.status === "revision_requested"
                        ? tr("revision_help")
                        : tr("deliver_help")}
                    </CardDescription>
                  </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="message">{tr("message_pour_le_vendeur")}</Label>
                      <Textarea 
                        id="message" 
                        placeholder={tr("incluez_des_notes_sur_la")}
                        value={deliveryMessage}
                        onChange={(e) => setDeliveryMessage(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>{tr("fichiers_finaux")}</Label>
                      <FileUpload 
                        onFilesSelected={setDeliveryFiles}
                        maxFiles={10}
                        maxSize={500}
                      />
                    </div>

                    <Button 
                      className="w-full h-12 bg-gradient-to-r from-violet-500 to-purple-600"
                      onClick={handleDeliver}
                      disabled={isDelivering || deliveryFiles.length === 0}
                    >
                      {isDelivering ? tr("sending") : tr("deliver")}
                      <Send className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
              </Card>
            )}

            {brief.status === "delivered" && (
              <Card className="border-blue-500/20 bg-blue-500/5 p-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">{tr("travail_soumis")}</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {tr("votre_travail_a_ete_soumis")}
                </p>
              </Card>
            )}

            {brief.status === "completed" && (
              <Card className="border-emerald-500/20 bg-emerald-500/5 p-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">{tr("projet_termine")}</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {payment?.stripe_transfer_id
                    ? tr("done_paid")
                    : tr("done_pending")}
                </p>
                <Button 
                  variant="outline" 
                  className="mt-6"
                  onClick={() => router.push("/creator/payments")}
                >
                  {tr("voir_mes_revenus")}
                </Button>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            {!isHired && myApplication?.status === "pending" && (
              <Card className="bg-orange-500/10 border-orange-500/20">
                <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-orange-600 mb-2">
                      <Clock className="w-5 h-5" />
                      <p className="font-bold">{tr("proposition_en_attente")}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tr("le_vendeur_examine_encore_les")}
                    </p>
                  </CardContent>
              </Card>
            )}

            {isHired && fundsSecured && (
              <Card className="bg-emerald-500/10 border-emerald-500/20">
                <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-emerald-600 mb-2">
                      <Shield className="w-5 h-5" />
                      <p className="font-bold">{tr("paiement_securise")}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tr("les_fonds_sont_conserves_par")}
                    </p>
                  </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                  <CardTitle>{tr("chat_de_mission")}</CardTitle>
                </CardHeader>
              <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{tr("discutez_des_details_du_projet")}</p>
                  <Button className="w-full gap-2" variant="outline" onClick={() => router.push(`/creator/messages?briefId=${id}`)}>
                    <MessageSquare className="w-4 h-4" />
                    {tr("ouvrir_le_chat")}
                  </Button>
                </CardContent>
            </Card>

            <Card>
              <CardHeader>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-500" />
                    <CardTitle className="text-lg">{tr("conseils_utiles")}</CardTitle>
                  </div>
                </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                  <p>{tr("communiquez_souvent_pour_eviter_les")}</p>
                  <p>{tr("livrez_toujours_avant_la_deadline")}</p>
                  <p>{tr("un_travail_de_qualite_mene")}</p>
                </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <DisputeDialog 
        isOpen={isDisputeOpen} 
        onClose={() => setIsDisputeOpen(false)} 
        briefId={id as string}
        onSuccess={() => {
          setBrief({ ...brief, is_disputed: true });
        }}
      />
    </div>
  );
}
