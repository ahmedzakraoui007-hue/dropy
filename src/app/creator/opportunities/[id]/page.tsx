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
  Shield,
  Briefcase,
  Target,
  ArrowRight,
  Package,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { calculateMatchScore } from "@/lib/matching";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function OpportunityDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [brief, setBrief] = useState<any>(null);
  const [creatorProfile, setCreatorProfile] = useState<any>(null);
  const [matchData, setMatchData] = useState<any>(null);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("creator_profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      setCreatorProfile(profile);

      const { data: briefData, error: briefError } = await supabase
        .from("content_briefs")
        .select(`
          *,
          store:stores(name, logo_url)
        `)
        .eq("id", id)
        .single();

      if (briefError) {
        toast.error("Opportunity not found");
        router.push("/creator/opportunities");
        return;
      }

      setBrief(briefData);

      if (profile && briefData) {
        const match = await calculateMatchScore(profile, briefData);
        setMatchData(match);
      }

      // Check if already applied
      const { data: application } = await supabase
        .from("content_applications")
        .select("id")
        .eq("brief_id", id)
        .eq("creator_id", user.id)
        .single();

      if (application) setHasApplied(true);
      
      setIsLoading(false);
    }

    fetchData();
  }, [id, supabase, router]);

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
          <Button variant="ghost" className="mb-6" onClick={() => router.push("/creator/opportunities")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux opportunités
          </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="capitalize">{brief.content_type}</Badge>
                      <Badge variant="secondary">{brief.store?.name}</Badge>
                    </div>
                    <CardTitle className="text-3xl">{brief.title}</CardTitle>
                    <CardDescription className="mt-2">
                        Publié le {format(new Date(brief.created_at), "PPP", { locale: fr })}
                      </CardDescription>
                  </div>
                  {matchData && (
                    <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-primary/5 border border-primary/20">
                      <span className="text-2xl font-bold text-primary">{matchData.score}%</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Match Score</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-8">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-border/50">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase font-bold">Budget</p>
                      <p className="font-semibold text-primary">
                        {brief.budget_min && brief.budget_max 
                          ? `${brief.budget_min} - ${brief.budget_max} TND`
                          : brief.budget_min 
                            ? `${brief.budget_min} TND`
                            : "À négocier"}
                      </p>
                    </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-bold">Deadline</p>
                    <p className="font-semibold">{format(new Date(brief.deadline), "PP", { locale: fr })}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-bold">Lieu</p>
                    <p className="font-semibold">{brief.preferred_city || "À distance"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-bold">Droits d&apos;usage</p>
                    <p className="font-semibold capitalize">{brief.rights_type?.replace("_", " ") || "Standard"}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold">Description du projet</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{brief.description}</p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold">Livrables attendus</h3>
                  <div className="p-4 rounded-xl bg-muted/50 border border-border">
                    <p className="text-muted-foreground whitespace-pre-wrap">{brief.deliverables}</p>
                  </div>
                </div>

                  {brief.products && brief.products.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        Produits à promouvoir
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {brief.products.map((product: any, idx: number) => (
                          <Card key={product.id || idx} className="flex items-center gap-4 p-4 border-border/50">
                            <img 
                              src={product.image || product.image_url} 
                              alt={product.name} 
                              className="w-16 h-16 rounded-lg object-cover" 
                            />
                            <div>
                              <p className="font-medium">{product.name}</p>
                              {product.price && (
                                <p className="text-sm text-primary font-bold">{product.price} TND</p>
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>

            {matchData && matchData.reasons.length > 0 && (
              <Card className="border-emerald-500/20 bg-emerald-500/5">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <Target className="w-5 h-5" />
                    <CardTitle className="text-lg">Pourquoi vous correspondez</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {matchData.reasons.map((reason: string, i: number) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        {reason}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card className={cn(
              "sticky top-24",
              hasApplied ? "bg-muted" : "bg-primary text-primary-foreground"
            )}>
              <CardHeader>
                <CardTitle>{hasApplied ? "Déjà postulé" : "Intéressé ?"}</CardTitle>
                <CardDescription className={hasApplied ? "" : "text-primary-foreground/70"}>
                  {hasApplied 
                    ? "Vous avez déjà soumis une proposition pour cette mission." 
                    : "Soumettez votre proposition maintenant."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {hasApplied ? (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => router.push("/creator/missions")}
                  >
                    Voir mes candidatures
                  </Button>
                ) : (
                  <Button 
                    className="w-full bg-white text-primary hover:bg-white/90"
                    onClick={() => router.push(`/creator/opportunities/${id}/apply`)}
                  >
                    Postuler maintenant
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-500" />
                  <CardTitle className="text-lg">Protection Escrow</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <p>Le paiement est sécurisé par Dropy dès que vous êtes embauché. Travaillez l&apos;esprit tranquille.</p>
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  85% pour le créateur
                </div>
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  15% frais plateforme
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-500" />
                  <CardTitle className="text-lg">Exigences</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="space-y-2">
                  <p className="font-bold">À fournir:</p>
                  <ul className="space-y-1 list-disc list-inside text-muted-foreground">
                    <li>Fichiers HD (4K préféré pour vidéo)</li>
                    <li>2 révisions incluses</li>
                    <li>Communication rapide</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
