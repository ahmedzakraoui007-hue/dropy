"use client";

import { StarRating } from "./StarRating";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CheckCircle, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Review {
  id: string;
  customer_name?: string;
  rating: number;
  comment: string;
  is_verified_purchase?: boolean;
  created_at: string;
  admin_reply?: string;
  seller_reply?: string;
  creator_reply?: string;
  supplier_reply?: string;
  quality_rating?: number;
  communication_rating?: number;
  deadline_rating?: number;
}

interface ReviewListProps {
  reviews: Review[];
  type: "product" | "store" | "creator" | "supplier";
}

export function ReviewList({ reviews, type }: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
        Aucun avis pour le moment.
      </div>
    );
  }

  const getReply = (review: Review) => {
    return review.admin_reply || review.seller_reply || review.creator_reply || review.supplier_reply;
  };

  const getReplyLabel = () => {
    switch (type) {
      case "product":
      case "store":
        return "Réponse du vendeur";
      case "creator":
        return "Réponse du créateur";
      case "supplier":
        return "Réponse du fournisseur";
      default:
        return "Réponse";
    }
  };

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <Card key={review.id} className="border-border/50 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 border border-border">
                  <AvatarFallback className="bg-primary/5 text-primary">
                    {review.customer_name?.[0]?.toUpperCase() || "A"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold flex items-center gap-2">
                    {review.customer_name || "Anonyme"}
                    {review.is_verified_purchase && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Achat vérifié
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(review.created_at), "d MMMM yyyy", { locale: fr })}
                  </div>
                </div>
              </div>
              <StarRating rating={review.rating} readonly size="sm" />
            </div>

            <p className="text-foreground leading-relaxed mb-4">
              {review.comment}
            </p>

            {type === "creator" && (
              <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-muted/30 rounded-lg text-xs">
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground">Qualité</span>
                  <StarRating rating={review.quality_rating || 0} readonly size="sm" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground">Communication</span>
                  <StarRating rating={review.communication_rating || 0} readonly size="sm" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground">Délais</span>
                  <StarRating rating={review.deadline_rating || 0} readonly size="sm" />
                </div>
              </div>
            )}

            {getReply(review) && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg border-l-4 border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-primary">{getReplyLabel()}</span>
                </div>
                <p className="text-sm text-muted-foreground italic">
                  "{getReply(review)}"
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
