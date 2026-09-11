"use client";

import { useState } from "react";
import { StarRating } from "./StarRating";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send } from "lucide-react";

interface AddReviewFormProps {
  type: "product" | "store" | "creator" | "supplier";
  targetId: string;
  onSuccess?: () => void;
  // For product reviews
  storeOrderId?: string;
  // For creator reviews
  briefId?: string;
  storeId?: string;
  // For supplier reviews
  sellerId?: string;
}

export function AddReviewForm({
  type,
  targetId,
  onSuccess,
  storeOrderId,
  briefId,
  storeId,
  sellerId
}: AddReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment || (type !== "creator" && !customerName)) {
      toast({
        title: "Champs manquants",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      let endpoint = `/api/reviews/${type}`;
      let body: any = { rating, comment };

      if (type === "product") {
        body.store_product_id = targetId;
        body.customer_name = customerName;
        body.customer_email = customerEmail;
        body.store_order_id = storeOrderId;
      } else if (type === "store") {
        body.store_id = targetId;
        body.customer_name = customerName;
        body.customer_email = customerEmail;
      } else if (type === "creator") {
        body.creator_id = targetId;
        body.brief_id = briefId;
        body.store_id = storeId;
        // For creators, we could add specific ratings here if needed
      } else if (type === "supplier") {
        body.supplier_id = targetId;
        body.seller_id = sellerId;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!response.ok) throw new Error("Erreur lors de l'envoi de l'avis");

      toast({
        title: "Avis envoyé !",
        description: "Merci pour votre retour.",
      });

      setComment("");
      setRating(5);
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer votre avis. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label>Votre note</Label>
        <StarRating rating={rating} onRatingChange={setRating} size="lg" />
      </div>

      {(type === "product" || type === "store") && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Votre nom *</Label>
            <Input
              id="name"
              placeholder="Ex: Amine B."
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Votre email (optionnel)</Label>
            <Input
              id="email"
              type="email"
              placeholder="Ex: amine@gmail.com"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="comment">Votre commentaire *</Label>
        <Textarea
          id="comment"
          placeholder="Dites-nous ce que vous en pensez..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="min-h-[100px]"
          required
        />
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Envoi en cours...
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            Publier mon avis
          </>
        )}
      </Button>
    </form>
  );
}
