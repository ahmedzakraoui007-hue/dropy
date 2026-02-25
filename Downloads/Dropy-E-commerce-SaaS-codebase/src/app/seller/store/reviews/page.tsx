"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StarRating } from "@/components/reviews/StarRating";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageSquare, 
  Star, 
  ShoppingBag, 
  Store, 
  Loader2,
  CheckCircle,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function SellerReviewsPage() {
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState<any>(null);
  const [productReviews, setProductReviews] = useState<any[]>([]);
  const [storeReviews, setStoreReviews] = useState<any[]>([]);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: storeData } = await supabase
        .from("stores")
        .select("id")
        .eq("owner_id", user.id)
        .single();

      if (storeData) {
        setStore(storeData);

        // Fetch store reviews
        const { data: sReviews } = await supabase
          .from("store_reviews")
          .select("*")
          .eq("store_id", storeData.id)
          .order("created_at", { ascending: false });
        
        setStoreReviews(sReviews || []);

        // Fetch product reviews (this is tricky because product_reviews links to store_products)
        const { data: pReviews } = await supabase
          .from("product_reviews")
          .select(`
            *,
            store_products!inner(
              id,
              store_id,
              title
            )
          `)
          .eq("store_products.store_id", storeData.id)
          .order("created_at", { ascending: false });
        
        setProductReviews(pReviews || []);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReply = async (reviewId: string, type: "product" | "store") => {
    if (!replyText) return;
    setIsSubmittingReply(true);
    try {
      const res = await fetch("/api/reviews/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          review_id: reviewId,
          type,
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
      fetchData();
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

  const ReviewCard = ({ review, type }: { review: any, type: "product" | "store" }) => {
    const isReplying = replyingTo === review.id;
    const existingReply = type === "product" ? review.admin_reply : review.seller_reply;

    return (
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {review.customer_name?.[0]?.toUpperCase() || "C"}
              </div>
              <div>
                <div className="font-bold flex items-center gap-2">
                  {review.customer_name}
                  {review.is_verified_purchase && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Vérifié
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  {format(new Date(review.created_at), "d MMMM yyyy", { locale: fr })}
                  {type === "product" && (
                    <span className="text-primary font-medium">
                      • {review.store_products?.title}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <StarRating rating={review.rating} readonly size="sm" />
          </div>

          <p className="text-sm mb-6 bg-muted/30 p-4 rounded-xl italic">
            "{review.comment}"
          </p>

          {existingReply ? (
            <div className="bg-primary/5 border-l-4 border-primary p-4 rounded-r-xl">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-primary">Votre réponse</span>
              </div>
              <p className="text-sm text-muted-foreground">{existingReply}</p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-2 h-7 text-[10px]"
                onClick={() => {
                  setReplyingTo(review.id);
                  setReplyText(existingReply);
                }}
              >
                Modifier
              </Button>
            </div>
          ) : isReplying ? (
            <div className="space-y-3 animate-in slide-in-from-top-2">
              <Textarea 
                placeholder="Votre réponse au client..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="text-sm min-h-[100px]"
              />
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={() => handleReply(review.id, type)}
                  disabled={isSubmittingReply || !replyText}
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
              className="gap-2"
              onClick={() => setReplyingTo(review.id)}
            >
              <MessageSquare className="w-4 h-4" />
              Répondre
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-black mb-2">Gestion des Avis</h1>
        <p className="text-muted-foreground">Suivez et répondez aux avis de vos clients pour améliorer votre réputation.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-violet-500 to-purple-600 text-white border-none shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-white/80 text-sm font-medium">Note Moyenne</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black mb-2">
              {((productReviews.reduce((acc, r) => acc + r.rating, 0) + storeReviews.reduce((acc, r) => acc + r.rating, 0)) / 
                (productReviews.length + storeReviews.length || 1)).toFixed(1)}
            </div>
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-white text-white" />)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">Total Avis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black">{productReviews.length + storeReviews.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Depuis le début</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">Taux de Réponse</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black">
              {Math.round(((productReviews.filter(r => r.admin_reply).length + storeReviews.filter(r => r.seller_reply).length) / 
                (productReviews.length + storeReviews.length || 1)) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Réponses publiées</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="products" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="products" className="rounded-lg gap-2">
            <ShoppingBag className="w-4 h-4" />
            Produits ({productReviews.length})
          </TabsTrigger>
          <TabsTrigger value="store" className="rounded-lg gap-2">
            <Store className="w-4 h-4" />
            Boutique ({storeReviews.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          {productReviews.length === 0 ? (
            <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed">
              <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground">Aucun avis produit pour le moment.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {productReviews.map((review) => (
                <ReviewCard key={review.id} review={review} type="product" />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="store" className="space-y-4">
          {storeReviews.length === 0 ? (
            <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed">
              <Store className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground">Aucun avis boutique pour le moment.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {storeReviews.map((review) => (
                <ReviewCard key={review.id} review={review} type="store" />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
