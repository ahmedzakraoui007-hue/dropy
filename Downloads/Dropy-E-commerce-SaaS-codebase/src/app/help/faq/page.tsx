import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, HelpCircle, MessageCircle } from "lucide-react";

const faqs = [
  {
    category: "Général",
    questions: [
      {
        question: "Qu'est-ce que Dropy ?",
        answer: "Dropy est une plateforme e-commerce tout-en-un conçue spécifiquement pour le marché tunisien. Elle permet aux entrepreneurs de lancer leur boutique en ligne, de trouver des produits en dropshipping et de collaborer avec des créateurs de contenu."
      },
      {
        question: "Est-ce que je peux utiliser Dropy gratuitement ?",
        answer: "Oui, nous proposons un plan Starter gratuit qui vous permet de lancer votre première boutique avec jusqu'à 50 produits."
      }
    ]
  },
  {
    category: "Vente & Dropshipping",
    questions: [
      {
        question: "Comment fonctionne le dropshipping sur Dropy ?",
        answer: "Vous parcourez notre catalogue de fournisseurs tunisiens, importez les produits qui vous intéressent dans votre boutique, et fixez votre marge. Lorsqu'un client commande, le fournisseur s'occupe de l'expédition."
      },
      {
        question: "Quels sont les modes de paiement acceptés ?",
        answer: "Pour les boutiques en Tunisie, le Paiement à la Livraison (Cash on Delivery) est le plus courant. Dropy intègre également des solutions comme D17, Flouci et bientôt les cartes bancaires via Stripe."
      }
    ]
  },
  {
    category: "Content Marketplace",
    questions: [
      {
        question: "Comment engager un créateur de contenu ?",
        answer: "Depuis votre espace vendeur, vous pouvez créer un brief décrivant vos besoins (UGC, photos, vidéos). Les créateurs postuleront à votre mission, et vous pourrez choisir celui qui correspond le mieux à votre marque."
      },
      {
        question: "Le paiement des créateurs est-il sécurisé ?",
        answer: "Oui, Dropy utilise un système d'escrow. Votre paiement est bloqué sur la plateforme et n'est libéré au créateur que lorsque vous validez le contenu reçu."
      }
    ]
  }
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-background py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Retour à l'accueil
        </Link>
        
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <HelpCircle className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-4xl font-bold">Centre d'aide</h1>
            <p className="text-muted-foreground">Tout ce que vous devez savoir sur Dropy</p>
          </div>
        </div>

        <div className="space-y-12">
          {faqs.map((category) => (
            <section key={category.category}>
              <h2 className="text-xl font-semibold mb-6 border-b pb-2">{category.category}</h2>
              <Accordion type="single" collapsible className="w-full">
                {category.questions.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          ))}
        </div>

        <div className="mt-20 p-8 rounded-3xl bg-muted/50 text-center">
          <MessageCircle className="w-10 h-10 text-primary mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Vous avez encore des questions ?</h3>
          <p className="text-muted-foreground mb-6">
            Notre équipe de support est disponible 7j/7 pour vous aider.
          </p>
          <Button asChild>
            <a href="https://wa.me/216xxxxxxxx" target="_blank" rel="noopener noreferrer">
              Contacter le support WhatsApp
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
