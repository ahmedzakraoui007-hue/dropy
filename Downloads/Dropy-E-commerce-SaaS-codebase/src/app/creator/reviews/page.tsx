"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { StarRating } from "@/components/reviews/StarRating";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageSquare, 
  Star, 
  Loader2,
  Clock,
  ThumbsUp,
  Briefcase
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function CreatorReviewsPage() {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<any[]>([]);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("creator_reviews")
        .select(`
          *,
          store:stores(name),
          brief:content_briefs(title)
        `)
        .eq("creator_id", user.id)
        .order("created_at", { ascending: false });
      
      if (!error && data) setReviews(data);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleReply = async (reviewId: string) => {
    if (!replyText) return;
    setIsSubmittingReply(true);
    try {
      const res = await fetch("/api/reviews/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          review_id: reviewId,
          type: "creator",
          reply: replyText
        })
      });

      if (!res.ok) throw new Error("Failed to submit reply");

      toast({
        title: "Réponse publiée",
        description: "Votre réponse a été enregistrée avec succès.",
      });

      setReplyingTo(null);
      setReplyText("");
      fetchReviews();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de publier la réponse.",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingReply(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const averageRating = reviews.length > 0 
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length 
    : 0;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black mb-2">Mes Avis & Réputation</h1>
        <p className="text-muted-foreground">Découvrez ce que les vendeurs pensent de votre travail.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-violet-500 to-purple-600 text-white border-none shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-white/80 text-sm font-medium">Note Globale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black mb-2">
              {averageRating.toFixed(1)}
            </div>
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => <Star key={i} className={`w-4 h-4 ${i < Math.round(averageRating) ? 'fill-white text-white' : 'fill-white/20 text-white/20'}`} />)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">Missions Évaluées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black">{reviews.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Total des avis reçus</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">Satisfaction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black">
              {Math.round((reviews.filter(r => r.rating >= 4).length / (reviews.length || 1)) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Avis 4 ou 5 étoiles</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Clock className="w-5 h-5 text-violet-600" />
          Derniers avis reçus
        </h2>

        {reviews.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed">
            <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <p className="text-muted-foreground">Vous n'avez pas encore reçu d'avis.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {reviews.map((review) => (
              <Card key={review.id} className="border-border/50">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 font-bold">
                        {review.store?.name?.[0]?.toUpperCase() || "S"}
                      </div>
                      <div>
                        <div className="font-bold flex items-center gap-2">
                          {review.store?.name}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <Briefcase className="w-3 h-3" />
                          {review.brief?.title}
                          <span className="opacity-50">•</span>
                          {format(new Date(review.created_at), "d MMMM yyyy", { locale: fr })}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <StarRating rating={review.rating} readonly size="sm" />
                      <div className="grid grid-cols-3 gap-2 mt-2 text-[10px] uppercase font-bold text-muted-foreground">
                        <span title="Qualité">Q: {review.quality_rating}</span>
                        <span title="Communication">C: {review.communication_rating}</span>
                        <span title="Délais">D: {review.deadline_rating}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm mb-6 bg-muted/30 p-4 rounded-xl italic">
                    "{review.comment}"
                  </p>

                  {review.creator_reply ? (
                    <div className="bg-violet-50 dark:bg-violet-900/10 border-l-4 border-violet-500 p-4 rounded-r-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-violet-600" />
                        <span className="text-xs font-bold text-violet-600">Votre réponse</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{review.creator_reply}</p>
                    </div>
                  ) : replyingTo === review.id ? (
                    <div className="space-y-3 animate-in slide-in-from-top-2">
                      <Textarea 
                        placeholder="Votre réponse au vendeur..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="text-sm min-h-[100px]"
                      />
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleReply(review.id)}
                          disabled={isSubmittingReply || !replyText}
                          className="bg-violet-600 hover:bg-violet-700"
                        >
                          {isSubmittingReply && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                          Publier
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyText("");
                          }}
                        >
                          Annuler
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2 hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-600 hover:border-violet-200"
                      onClick={() => setReplyingTo(review.id)}
                    >
                      <MessageSquare className="w-4 h-4" />
                      Répondre
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
