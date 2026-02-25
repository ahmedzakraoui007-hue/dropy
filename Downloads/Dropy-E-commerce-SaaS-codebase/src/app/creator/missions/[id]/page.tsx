"use client";

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

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

        const { data: briefData, error: briefError } = await supabase
          .from("content_briefs")
          .select(`
            *,
            store:stores(name, logo_url, seller_id)
          `)
          .eq("id", id)
          .single();


      if (briefError) {
        toast.error("Mission not found");
        router.push("/creator/missions");
        return;
      }

      const { data: application } = await supabase
        .from("content_applications")
        .select("*")
        .eq("brief_id", id)
        .eq("creator_id", user.id)
        .single();

      setBrief(briefData);
      setMyApplication(application);
      setIsLoading(false);
    }

    fetchData();
  }, [id, supabase, router]);

  const handleDeliver = async () => {
    if (deliveryFiles.length === 0) {
      toast.error("Please upload at least one file");
      return;
    }

    setIsDelivering(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
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

      const { error: deliveryError } = await supabase
        .from("content_deliveries")
        .insert({
          brief_id: id,
          creator_id: user.id,
          files: uploadedFiles,
          message: deliveryMessage,
          status: "submitted"
        });

      if (deliveryError) throw deliveryError;

      const { error: briefUpdateError } = await supabase
        .from("content_briefs")
        .update({ status: "delivered" })
        .eq("id", id);

        if (briefUpdateError) throw briefUpdateError;

        // Send notification to seller
        if (brief.store?.seller_id) {
          await fetch("/api/notifications/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: brief.store.seller_id,
              type: "deliverable_submitted",
              title: "🎥 Livrable soumis !",
              message: `Le créateur a soumis son travail pour la mission: ${brief.title}. Vous avez 48h pour l'examiner.`,
              link: `/seller/content/briefs/${id}`,
              sendEmail: true
            }),
          });
        }

        toast.success("Project delivered successfully! Waiting for seller approval.");

      router.refresh();
      // Reset form
      setDeliveryFiles([]);
      setDeliveryMessage("");
    } catch (error: any) {
      toast.error(error.message || "Failed to deliver project");
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

  const isHired = brief.selected_creator_id === myApplication?.creator_id;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-6xl mx-auto px-4 pt-8">
        <Button variant="ghost" className="mb-6" onClick={() => router.push("/creator/missions")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux missions
          </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                  <div className="flex justify-between items-start gap-4 w-full">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="capitalize">{brief.content_type}</Badge>
                        <Badge className={cn(
                          brief.status === "completed" ? "bg-emerald-500" : 
                          brief.status === "delivered" ? "bg-blue-500" :
                          "bg-primary"
                        )}>
                          {brief.status}
                        </Badge>
                        {brief.is_disputed && (
                          <Badge variant="destructive" className="animate-pulse">Disputed</Badge>
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
                          Ouvrir un litige
                        </Button>
                    )}
                  </div>

              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-border/50">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase font-bold">Mon Prix</p>
                      <p className="font-semibold text-primary">{myApplication?.proposed_price} TND</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase font-bold">Deadline</p>
                      <p className="font-semibold">{format(new Date(brief.deadline), "PP")}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase font-bold">Statut</p>
                      <p className="font-semibold capitalize">{brief.status}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase font-bold">Livraison</p>
                      <p className="font-semibold">{myApplication?.delivery_days} jours</p>
                    </div>
                  </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-bold">Détails du brief</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{brief.description}</p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-bold">Livrables spécifiques</h3>
                  <div className="p-4 rounded-xl bg-muted/50 border border-border">
                    <p className="text-muted-foreground whitespace-pre-wrap">{brief.deliverables}</p>
                  </div>
                </div>

                {brief.products && brief.products.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold">Produits</h3>
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

            {isHired && (brief.status === "assigned" || brief.status === "in_progress") && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                    <CardTitle>Livrer votre travail</CardTitle>
                    <CardDescription>Téléchargez les fichiers finaux et envoyez-les au vendeur pour approbation</CardDescription>
                  </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="message">Message pour le vendeur</Label>
                      <Textarea 
                        id="message" 
                        placeholder="Incluez des notes sur la livraison..."
                        value={deliveryMessage}
                        onChange={(e) => setDeliveryMessage(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Fichiers finaux*</Label>
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
                      {isDelivering ? "Envoi en cours..." : "Livrer le projet"}
                      <Send className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
              </Card>
            )}

            {brief.status === "delivered" && (
              <Card className="border-blue-500/20 bg-blue-500/5 p-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Travail soumis</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Votre travail a été soumis au vendeur. Il a 48 heures pour l&apos;examiner et l&apos;approuver. Une fois approuvé, votre paiement sera libéré.
                </p>
              </Card>
            )}

            {brief.status === "completed" && (
              <Card className="border-emerald-500/20 bg-emerald-500/5 p-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Projet terminé</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Cette mission est terminée. Votre paiement a été libéré dans votre portefeuille.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-6"
                  onClick={() => router.push("/creator/payments")}
                >
                  Voir mes revenus
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
                      <p className="font-bold">Proposition en attente</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Le vendeur examine encore les propositions. Vous serez notifié si vous êtes sélectionné.
                    </p>
                  </CardContent>
              </Card>
            )}

            {isHired && (
              <Card className="bg-emerald-500/10 border-emerald-500/20">
                <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-emerald-600 mb-2">
                      <Shield className="w-5 h-5" />
                      <p className="font-bold">Paiement sécurisé</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Les fonds sont sécurisés par Dropy. Vos revenus seront libérés automatiquement après approbation.
                    </p>
                  </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                  <CardTitle>Chat de mission</CardTitle>
                </CardHeader>
              <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">Discutez des détails du projet avec le vendeur.</p>
                  <Button className="w-full gap-2" variant="outline" onClick={() => router.push(`/creator/messages?briefId=${id}`)}>
                    <MessageSquare className="w-4 h-4" />
                    Ouvrir le chat
                  </Button>
                </CardContent>
            </Card>

            <Card>
              <CardHeader>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-500" />
                    <CardTitle className="text-lg">Conseils utiles</CardTitle>
                  </div>
                </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                  <p>• Communiquez souvent pour éviter les révisions.</p>
                  <p>• Livrez toujours avant la deadline.</p>
                  <p>• Un travail de qualité mène à des avis 5 étoiles et plus de missions.</p>
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
