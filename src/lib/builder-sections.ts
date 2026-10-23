import {
  BadgeCheck,
  Clock,
  FileText,
  Truck,
  HelpCircle,
  ImageIcon,
  LayoutGrid,
  ListOrdered,
  Mail,
  Megaphone,
  MessageSquareQuote,
  PanelBottom,
  Phone,
  ShoppingBag,
  Sparkles,
  Star,
  Tags,
  Video,
  type LucideIcon,
} from "lucide-react";

import { PLACEHOLDERS_AR } from "@/lib/builder-sections-ar";

export type SectionCategory = "essentials" | "products" | "content" | "trust" | "pages";

export type SectionType = {
  id: string;
  icon: LucideIcon;
  category: SectionCategory;
};

export const SECTION_CATEGORIES: SectionCategory[] = ["essentials", "products", "content", "trust", "pages"];

export const SECTION_LIBRARY: SectionType[] = [
  { id: "hero", icon: ImageIcon, category: "essentials" },
  { id: "promo_banner", icon: Megaphone, category: "essentials" },
  { id: "cta_banner", icon: Sparkles, category: "essentials" },
  { id: "countdown", icon: Clock, category: "essentials" },
  { id: "footer", icon: PanelBottom, category: "essentials" },
  { id: "products", icon: ShoppingBag, category: "products" },
  { id: "store_categories", icon: Tags, category: "products" },
  { id: "collections", icon: LayoutGrid, category: "products" },
  { id: "recommended_products", icon: Star, category: "products" },
  { id: "image_with_text", icon: ImageIcon, category: "content" },
  { id: "features", icon: Sparkles, category: "content" },
  { id: "process_steps", icon: ListOrdered, category: "content" },
  { id: "video", icon: Video, category: "content" },
  { id: "newsletter", icon: Mail, category: "content" },
  { id: "trust_badges", icon: BadgeCheck, category: "trust" },
  { id: "testimonials", icon: MessageSquareQuote, category: "trust" },
  { id: "faq", icon: HelpCircle, category: "trust" },
  { id: "contact", icon: Phone, category: "pages" },
  { id: "about", icon: FileText, category: "pages" },
  { id: "shipping_policy", icon: Truck, category: "pages" },
  { id: "refund_policy", icon: FileText, category: "pages" },
  { id: "privacy_policy", icon: FileText, category: "pages" },
  { id: "terms_conditions", icon: FileText, category: "pages" },
];

export function sectionIcon(type: string): LucideIcon {
  return SECTION_LIBRARY.find((s) => s.id === type)?.icon || LayoutGrid;
}

const photo = (id: string, width = 1600) => `https://images.unsplash.com/photo-${id}?w=${width}&q=80&auto=format&fit=crop`;

const POLICY_TEXT: Record<string, { title: string; content: string }> = {
  about: {
    title: "Notre histoire",
    content:
      "<p>Présentez votre boutique : qui vous êtes, pourquoi vous l'avez créée et ce qui rend vos produits différents.</p><p>Vos clients achètent plus facilement quand ils savent à qui ils commandent.</p>",
  },
  shipping_policy: {
    title: "Livraison",
    content:
      "<p>Nous livrons partout en Tunisie. Après votre commande, nous vous appelons pour la confirmer, puis votre colis est expédié.</p><p>Délai habituel : 24 à 72 heures selon votre gouvernorat. Vous payez en espèces à la réception.</p>",
  },
  refund_policy: {
    title: "Retours et échanges",
    content:
      "<p>Indiquez ici vos conditions de retour : délai pour nous contacter, état du produit attendu, et qui paie les frais de retour.</p><p>Pour toute demande, contactez-nous par téléphone ou WhatsApp avec votre numéro de commande.</p>",
  },
  privacy_policy: {
    title: "Confidentialité",
    content:
      "<p>Nous utilisons votre nom, votre téléphone et votre adresse uniquement pour traiter et livrer votre commande.</p><p>Vos données ne sont jamais vendues. Vous pouvez demander leur suppression en nous contactant.</p>",
  },
  terms_conditions: {
    title: "Conditions générales de vente",
    content:
      "<p>Les prix sont indiqués en dinars tunisiens (DT), frais de livraison affichés avant la validation.</p><p>Une commande est confirmée par téléphone avant l'expédition. Le paiement se fait à la livraison.</p>",
  },
};

export const getPlaceholderConfig = (type: string, lang: "fr" | "ar" = "fr"): Record<string, any> => {
  const base = placeholderFr(type);
  if (lang !== "ar" || !PLACEHOLDERS_AR[type]) return base;
  const { itemTitles, ...ar } = PLACEHOLDERS_AR[type];
  const merged = { ...base, ...ar };
  if (Array.isArray(itemTitles) && Array.isArray(base.items)) {
    merged.items = base.items.map((item: Record<string, any>, i: number) => ({ ...item, title: itemTitles[i] ?? item.title }));
  }
  return merged;
};

const placeholderFr = (type: string): Record<string, any> => {
  if (POLICY_TEXT[type]) return { ...POLICY_TEXT[type] };
  switch (type) {
    case "hero":
      return {
        variant: "classic",
        badge: "Nouvelle collection",
        title: "Votre titre accrocheur",
        subtitle: "Une phrase qui explique ce que vous vendez et pourquoi l'acheter chez vous.",
        ctaText: "Découvrir la boutique",
        ctaLink: "/shop",
        backgroundImage: photo("1441986300917-64674bd600d8"),
        height: 600,
      };
    case "promo_banner":
      return { text: "🚚 Livraison partout en Tunisie · Paiement à la livraison" };
    case "cta_banner":
      return { title: "Offre du moment", description: "Profitez-en tant que le stock le permet.", ctaText: "J'en profite", ctaLink: "/shop" };
    case "countdown":
      return {
        title: "Vente flash",
        message: "L'offre se termine dans :",
        endDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
        ctaText: "J'en profite",
        ctaLink: "/shop",
      };
    case "footer":
      return { description: "Livraison partout en Tunisie · Paiement à la livraison." };
    case "products":
      return { title: "Nos produits", limit: 8, columns: 4, source: "store" };
    case "store_categories":
      return { title: "Nos catégories", limit: 8 };
    case "collections":
      return {
        title: "Nos collections",
        columns: 3,
        items: [
          { title: "Nouveautés", image: photo("1483985988355-763728e1935b", 800), link: "/shop" },
          { title: "Meilleures ventes", image: photo("1523275335684-37898b6baf30", 800), link: "/shop" },
          { title: "Promotions", image: photo("1607082348824-0a96f2a4b9da", 800), link: "/shop" },
        ],
      };
    case "recommended_products":
      return { title: "Vous aimerez aussi", limit: 4, columns: 4 };
    case "image_with_text":
      return {
        title: "Une boutique pensée pour vous",
        text: "Racontez ce qui rend vos produits uniques : leur qualité, leur origine, ou le soin que vous mettez à les choisir.",
        image: photo("1441986300917-64674bd600d8", 1200),
        imagePosition: "left",
        ctaText: "Voir les produits",
        ctaLink: "/shop",
      };
    case "features":
      return {
        title: "Pourquoi nous choisir",
        columns: 3,
        features: [
          { icon: "BadgeCheck", title: "Qualité vérifiée", description: "Chaque produit est contrôlé avant l'envoi." },
          { icon: "Truck", title: "Livraison rapide", description: "24 à 72 h partout en Tunisie." },
          { icon: "Banknote", title: "Paiement à la livraison", description: "Vous payez à la réception du colis." },
        ],
      };
    case "process_steps":
      return {
        title: "Commander en 3 étapes",
        steps: [
          { title: "Choisissez", description: "Sélectionnez votre produit et votre taille ou couleur." },
          { title: "Confirmez", description: "Laissez votre nom, téléphone et adresse : nous vous appelons." },
          { title: "Recevez", description: "Payez en espèces à la livraison." },
        ],
      };
    case "video":
      return { title: "Découvrez nos produits en vidéo", videoUrl: "", aspectRatio: "16/9", autoplay: false };
    case "newsletter":
      return {
        title: "Restez informé",
        subtitle: "Nouveautés et offres réservées aux abonnés.",
        placeholder: "Votre e-mail",
        buttonText: "Je m'inscris",
      };
    case "trust_badges":
      return {
        layout: "row",
        items: [
          { icon: "Truck", title: "Livraison partout en Tunisie", description: "24 à 72 h" },
          { icon: "Banknote", title: "Paiement à la livraison", description: "Payez à la réception" },
          { icon: "Phone", title: "Commande confirmée", description: "Nous vous appelons avant l'envoi" },
          { icon: "Headphones", title: "Service client", description: "Par téléphone et WhatsApp" },
        ],
      };
    case "testimonials":
      return { title: "Avis de nos clients", columns: 3, testimonials: [] };
    case "faq":
      return {
        title: "Questions fréquentes",
        faqs: [
          { question: "Comment passer commande ?", answer: "Choisissez votre produit, remplissez le formulaire avec votre nom, votre téléphone et votre adresse, puis validez. Nous vous appelons pour confirmer." },
          { question: "Comment se passe le paiement ?", answer: "Vous payez en espèces à la livraison, après avoir reçu votre colis." },
          { question: "Quels sont les délais de livraison ?", answer: "24 à 72 heures selon votre gouvernorat. Nous livrons partout en Tunisie." },
        ],
      };
    case "contact":
      return {
        title: "Contactez-nous",
        subtitle: "Une question sur une commande ou un produit ? Écrivez-nous, nous répondons rapidement.",
        hours: "Lun-Sam, 9h-18h",
      };
    case "product_detail":
      return { expressOrder: true };
    case "checkout":
      return { title: "Finalisez votre commande", subtitle: "Paiement en espèces à la livraison" };
    default:
      return { title: "" };
  }
};
