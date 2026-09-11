"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Sparkles,
  ArrowRight,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { calculateMatchScore } from "@/lib/matching";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function OpportunitiesPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [briefs, setBriefs] = useState<any[]>([]);
  const [creatorProfile, setCreatorProfile] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

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

      const { data: briefsData } = await supabase
        .from("content_briefs")
        .select(`
          *,
          store:stores(name, logo_url)
        `)
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (briefsData && profile) {
        const briefsWithScores = await Promise.all(
          briefsData.map(async (brief) => {
            const match = await calculateMatchScore(profile, brief);
            return { ...brief, matchScore: match.score, matchReasons: match.reasons };
          })
        );
        setBriefs(briefsWithScores.sort((a, b) => b.matchScore - a.matchScore));
      } else {
        setBriefs(briefsData || []);
      }
      setIsLoading(false);
    }

    fetchData();
  }, [supabase]);

  const filteredBriefs = briefs.filter(brief => 
    brief.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    brief.content_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-20">
        <div className="max-w-7xl mx-auto px-4 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-black mb-1">Opportunités de projets</h1>
              <p className="text-muted-foreground">Trouvez les missions parfaites correspondant à vos compétences</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Rechercher des missions..." 
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filtres
              </Button>
            </div>
          </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
              </div>
            ) : filteredBriefs.length === 0 ? (
              <Card className="flex flex-col items-center justify-center py-20 text-center border-border/50">
                <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center mb-4">
                  <Target className="w-10 h-10 text-muted-foreground opacity-20" />
                </div>
                <h3 className="text-xl font-bold mb-2">Aucune opportunité pour le moment</h3>
                <p className="text-muted-foreground max-w-sm">
                  Revenez plus tard pour de nouvelles missions ou mettez à jour votre profil.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBriefs.map((brief) => (
                  <Card 
                    key={brief.id} 
                    className="group hover:shadow-xl transition-all border-border/50 overflow-hidden flex flex-col bg-card"
                  >
                    <CardHeader className="relative pb-4">
                      {brief.matchScore >= 70 && (
                        <div className="absolute top-4 right-4">
                          <Badge className="bg-primary text-primary-foreground border-none gap-1 shadow-lg shadow-primary/20">
                            <Sparkles className="w-3 h-3" />
                            {brief.matchScore}% Match
                          </Badge>
                        </div>
                      )}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-lg text-primary">
                          {brief.store?.name[0]}
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{brief.store?.name}</p>
                          <Badge variant="outline" className="capitalize mt-1 text-[10px] py-0">{brief.content_type}</Badge>
                        </div>
                      </div>
                      <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors line-clamp-1">
                        {brief.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-4 pb-4">
                      <p className="text-muted-foreground text-sm line-clamp-3">
                        {brief.description}
                      </p>
                      
                      {brief.products && brief.products.length > 0 && (
                        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                          <div className="flex -space-x-2">
                            {brief.products.slice(0, 3).map((product: any, idx: number) => (
                              <img 
                                key={idx}
                                src={product.image || product.image_url} 
                                alt={product.name}
                                className="w-8 h-8 rounded-lg object-cover border-2 border-background"
                              />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {brief.products.length} produit{brief.products.length > 1 ? 's' : ''} à promouvoir
                          </span>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-4 text-sm font-bold">
                          <div className="flex items-center gap-1.5 text-primary">
                            <DollarSign className="w-4 h-4" />
                            {brief.budget_min && brief.budget_max 
                              ? `${brief.budget_min} - ${brief.budget_max} TND`
                              : brief.budget_min 
                                ? `${brief.budget_min} TND`
                                : "À négocier"}
                          </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(brief.deadline), "PP", { locale: fr })}
                        </div>
                        {brief.preferred_city && (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            {brief.preferred_city}
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <Button 
                        className="w-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                        variant="ghost"
                        onClick={() => router.push(`/creator/opportunities/${brief.id}`)}
                      >
                        Détails & Postuler
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
        </div>
    </div>
  );
}
