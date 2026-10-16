"use client";

import { useState, useEffect } from "react";
import { fetchProfileCards } from "@/lib/profile-cards";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  XCircle,
  MessageSquare,
  ExternalLink,
  Shield,
  Star,
  Package,
  ArrowRight,
  Download,
  Eye,
  Lock,
  ShieldAlert
} from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DisputeDialog } from "@/components/content/DisputeDialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Video, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { AddReviewForm } from "@/components/reviews/AddReviewForm";
import { ReviewList } from "@/components/reviews/ReviewList";

export default function BriefDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [brief, setBrief] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDisputeOpen, setIsDisputeOpen] = useState(false);
  const [existingReviews, setExistingReviews] = useState<any[]>([]);

  useEffect(() => {
    async function fetchBriefDetails() {
      const { data: briefData, error: briefError } = await supabase
        .from("content_briefs")
        .select(`
          *,
          store:stores(*)
        `)
        .eq("id", id)
        .single();

      if (briefError) {
        toast.error("Brief introuvable");
        router.push("/seller/content/briefs");
        return;
      }

      const { data: appsData } = await supabase
        .from("content_applications")
        .select("*")
        .eq("brief_id", id);

      const creatorIds = (appsData || []).map((a: any) => a.creator_id);
      const cards = await fetchProfileCards(supabase, creatorIds);
      const { data: creatorProfiles } = creatorIds.length
        ? await supabase.from("creator_profiles").select("user_id, rating, specialties, specialty").in("user_id", creatorIds)
        : { data: [] as any[] };
      const profileByUser = new Map((creatorProfiles || []).map((c: any) => [c.user_id, c]));
      const appsWithCreators = (appsData || []).map((a: any) => {
        const card = cards.get(a.creator_id);
        const cp: any = profileByUser.get(a.creator_id) || {};
        return {
          ...a,
          creator: {
            id: a.creator_id,
            full_name: card?.full_name || "Créateur",
            avatar_url: card?.avatar_url || null,
            rating: cp.rating ?? null,
            specialties: cp.specialties?.length ? cp.specialties : cp.specialty ? [cp.specialty] : [],
          },
        };
      });

      const { data: delivData } = await supabase
        .from("content_deliveries")
        .select("*")
        .eq("brief_id", id)
        .order("delivered_at", { ascending: false });

      // Fetch existing reviews for this brief
      const { data: reviewsData } = await supabase
        .from("creator_reviews")
        .select("*")
        .eq("brief_id", id);

      setBrief(briefData);
      setApplications(appsWithCreators);
      setDeliveries(delivData || []);
      setExistingReviews(reviewsData || []);
      setIsLoading(false);
    }

    fetchBriefDetails();
  }, [id, supabase, router]);

  const handleAcceptApplication = async (application: any) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/content/briefs/${id}/accept-creator`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorId: application.creator_id,
          applicationId: application.id,
          amount: application.proposed_price
        })
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      // Handle Stripe Payment
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
      if (!stripe) throw new Error("Le paiement n'a pas pu se charger");

      const { error: stripeError } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: { token: 'tok_visa' }, // In real app, use Elements
          billing_details: { name: 'Seller Name' }
        }
      });

      if (stripeError) throw stripeError;

      toast.success("Paiement réussi ! Fonds conservés en séquestre.");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Payment failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReleaseFunds = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/content/briefs/${id}/release-funds`, {
        method: "POST"
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      toast.success("Fonds versés au créateur ! Projet terminé.");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to release funds");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-6xl mx-auto px-4 pt-8">
        <Button variant="ghost" className="mb-6" onClick={() => router.push("/seller/content/briefs")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux briefs
          </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="capitalize">{brief.content_type}</Badge>
                        <Badge>{brief.status}</Badge>
                        {brief.is_disputed && (
                          <Badge variant="destructive" className="animate-pulse">En litige</Badge>
                        )}
                      </div>
                      <CardTitle className="text-3xl">{brief.title}</CardTitle>
                      <CardDescription className="mt-2">
                        Created on {format(new Date(brief.created_at), "PPP")}
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
                    <p className="text-xs text-muted-foreground uppercase font-bold">Budget</p>
                    <p className="font-semibold">{brief.budget_min} - {brief.budget_max} TND</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-bold">Date limite</p>
                    <p className="font-semibold">{format(new Date(brief.deadline), "PP")}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-bold">Lieu</p>
                    <p className="font-semibold">{brief.preferred_city || "Remote"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-bold">Droits</p>
                    <p className="font-semibold capitalize">{brief.rights_type?.replace("_", " ")}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold">Description</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{brief.description}</p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold">Livrables</h3>
                  <div className="p-4 rounded-xl bg-muted/50 border border-border">
                    <p className="text-muted-foreground whitespace-pre-wrap">{brief.deliverables}</p>
                  </div>
                </div>

                {brief.products && brief.products.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold">Produits concernés</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {brief.products.map((product: any) => (
                        <Card key={product.id} className="flex items-center gap-3 p-3 border-border/50">
                          <img src={product.image_url} alt={product.name} className="w-12 h-12 rounded-md object-cover" />
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

                {brief.status === "delivered" && (
                  <Card className="border-blue-500/20 bg-blue-500/5">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-blue-700 flex items-center gap-2">
                          <Package className="w-5 h-5" />
                          Examiner les livrables
                        </CardTitle>
                        <CardDescription>Le créateur a envoyé les fichiers finaux. Examinez-les avant de libérer les fonds.</CardDescription>
                      </div>
                      <Button 
                        onClick={handleReleaseFunds}
                        disabled={isProcessing}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        {isProcessing ? "Releasing..." : "Approve & Release Funds"}
                        <CheckCircle2 className="w-4 h-4 ml-2" />
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {deliveries.map((delivery: any) => (
                        <div key={delivery.id} className="space-y-4">
                          <div className="p-4 rounded-xl bg-white border border-blue-100">
                            <p className="text-sm font-medium mb-3">Message du créateur :</p>
                            <p className="text-sm text-muted-foreground italic">&quot;{delivery.message}&quot;</p>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {delivery.files?.map((file: any, i: number) => (
                              <div key={i} className="group relative aspect-square rounded-xl overflow-hidden border border-border bg-muted">
                                {file.type?.startsWith('image/') ? (
                                  <img src={file.url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                                    <Video className="w-8 h-8 text-muted-foreground" />
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Video</span>
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <a href={file.url} target="_blank" rel="noopener noreferrer">
                                    <Button size="icon" variant="secondary" className="w-8 h-8">
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  </a>
                                  <a href={file.url} download={file.filename}>
                                    <Button size="icon" variant="secondary" className="w-8 h-8">
                                      <Download className="w-4 h-4" />
                                    </Button>
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {brief.status === "completed" && (
                  <Card className="border-emerald-500/20 bg-emerald-500/5">
                    <CardHeader>
                      <CardTitle className="text-emerald-700 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        Projet terminé
                      </CardTitle>
                      <CardDescription>Les fonds ont été versés et le contenu est maintenant dans votre bibliothèque.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" className="w-full gap-2" onClick={() => router.push('/seller/content/library')}>
                        <Package className="w-4 h-4" />
                        Voir dans la bibliothèque
                      </Button>
                    </CardContent>
                  </Card>
                )}

                  {brief.status === "completed" && (
                    <div className="space-y-6 pt-6 border-t border-border">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold">Avis sur la prestation</h3>
                        {existingReviews.length === 0 && (
                          <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">En attente d'avis</Badge>
                        )}
                      </div>
                      
                      {existingReviews.length > 0 ? (
                        <ReviewList reviews={existingReviews} type="creator" />
                      ) : (
                        <Card className="border-primary/20 bg-primary/5">
                          <CardContent className="p-6">
                            <p className="text-sm text-muted-foreground mb-6">
                              Le projet est terminé ! Prenez un moment pour évaluer le travail de {applications.find(a => a.status === 'accepted')?.creator?.full_name}.
                            </p>
                            <AddReviewForm 
                              type="creator"
                              targetId={brief.creator_id}
                              briefId={brief.id}
                              storeId={brief.store_id}
                              onSuccess={() => {
                                // Refresh reviews
                                supabase
                                  .from("creator_reviews")
                                  .select("*")
                                  .eq("brief_id", id)
                                  .then(({ data }) => setExistingReviews(data || []));
                              }}
                            />
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}

                  <div className="space-y-6 pt-12">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Applications ({applications.length})</h2>
                </div>


              {applications.length === 0 ? (
                <Card className="p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-muted-foreground opacity-20" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Aucune candidature pour le moment</h3>
                  <p className="text-muted-foreground">
                    Votre brief est publié. Les créateurs vont bientôt postuler !
                  </p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {applications.map((app) => (
                    <Card key={app.id} className={cn(
                      "transition-all",
                      app.status === "accepted" ? "border-primary bg-primary/5" : "border-border/50"
                    )}>
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row gap-6">
                          <div className="flex-1 space-y-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-4">
                                <Avatar className="w-12 h-12">
                                  <AvatarImage src={app.creator.avatar_url} />
                                  <AvatarFallback>{app.creator.full_name?.[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-lg">{app.creator.full_name}</h4>
                                    <Badge variant="outline" className="flex items-center gap-1">
                                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                      {app.creator.rating || "N/A"}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {app.creator.specialties?.join(", ")}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-primary">{app.proposed_price} TND</p>
                                <p className="text-sm text-muted-foreground">{app.delivery_days} days delivery</p>
                              </div>
                            </div>

                            <p className="text-muted-foreground text-sm italic">
                              &quot;{app.message}&quot;
                            </p>

                            {app.portfolio_samples && app.portfolio_samples.length > 0 && (
                              <div className="grid grid-cols-3 gap-2">
                                {app.portfolio_samples.slice(0, 3).map((sample: string, i: number) => (
                                  <img 
                                    key={i} 
                                    src={sample} 
                                    alt="Portfolio" 
                                    className="w-full h-24 object-cover rounded-lg" 
                                  />
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-2 min-w-[150px]">
                            {brief.status === "published" ? (
                              <>
                                <Button 
                                  className="w-full bg-gradient-to-r from-violet-500 to-purple-600"
                                  onClick={() => handleAcceptApplication(app)}
                                >
                                  Accept & Pay
                                </Button>
                                <Button variant="outline" className="w-full">
                                  Message
                                </Button>
                                <Button variant="ghost" className="w-full text-destructive">
                                  Refuser
                                </Button>
                              </>
                            ) : app.status === "accepted" ? (
                              <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                <CheckCircle2 className="w-8 h-8" />
                                <span className="text-xs font-bold uppercase tracking-wider">Retenu</span>
                              </div>
                            ) : (
                              <Badge variant="outline" className="justify-center py-2">Non retenu</Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <Card className="bg-primary/5 border-primary/20 overflow-hidden">
              <div className="bg-primary p-4 text-white">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-5 h-5" />
                  <p className="font-bold">Séquestre Dropy</p>
                </div>
                <p className="text-xs opacity-90">Votre paiement est 100 % protégé</p>
              </div>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">1</span>
                    </div>
                    <p className="text-sm">Les fonds sont conservés par Dropy dès l'acceptation</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">2</span>
                    </div>
                    <p className="text-sm">Le créateur réalise votre projet et le livre</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">3</span>
                    </div>
                    <p className="text-sm">Vous examinez le travail et demandez des retouches si besoin</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-primary">4</span>
                    </div>
                    <p className="text-sm">Les fonds ne sont versés qu'après votre validation du contenu</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                  <CardTitle>Chronologie</CardTitle>
                </CardHeader>
              <CardContent className="space-y-4">
                  <div className="relative pl-6 pb-6 border-l border-border">
                    <div className="absolute left-[-5px] top-0 w-[9px] h-[9px] rounded-full bg-emerald-500" />
                    <p className="text-xs text-muted-foreground">Publié</p>
                    <p className="text-sm font-medium">{format(new Date(brief.created_at), "PPp")}</p>
                  </div>
                  <div className={cn(
                    "relative pl-6 pb-6 border-l",
                    brief.status === "assigned" || brief.status === "completed" ? "border-emerald-500" : "border-border"
                  )}>
                    <div className={cn(
                      "absolute left-[-5px] top-0 w-[9px] h-[9px] rounded-full",
                      brief.status === "assigned" || brief.status === "completed" ? "bg-emerald-500" : "bg-muted"
                    )} />
                    <p className="text-xs text-muted-foreground">Créateur assigné</p>
                    <p className="text-sm font-medium">
                      {brief.status === "assigned" ? "En cours" : "En attente"}
                    </p>
                  </div>
                  <div className={cn(
                    "relative pl-6 pb-6 border-l",
                    brief.status === "completed" ? "border-emerald-500" : "border-border"
                  )}>
                    <div className={cn(
                      "absolute left-[-5px] top-0 w-[9px] h-[9px] rounded-full",
                      brief.status === "completed" ? "bg-emerald-500" : "bg-muted"
                    )} />
                    <p className="text-xs text-muted-foreground">Terminé</p>
                    <p className="text-sm font-medium">En attente</p>
                  </div>
                </CardContent>
            </Card>

            {brief.selected_creator_id && (
              <Card>
                <CardHeader>
                  <CardTitle>Chat de mission</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">Discutez des détails du projet avec le créateur.</p>
                  <Button className="w-full gap-2" variant="outline" onClick={() => router.push(`/seller/content/messages?briefId=${id}`)}>
                    <MessageSquare className="w-4 h-4" />
                    Ouvrir le chat
                  </Button>
                </CardContent>
              </Card>
            )}
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
