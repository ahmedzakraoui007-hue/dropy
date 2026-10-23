import { COMMON_FAQ_AR, NICHES_AR, SECTION_TITLES_AR, TRUST_AR } from "./home-sections-ar";

type Section = { id: string; type: string; config: Record<string, unknown>; position: number; is_visible: boolean };

const photo = (id: string, width = 1600) => `https://images.unsplash.com/photo-${id}?w=${width}&q=80&auto=format&fit=crop`;

type Niche = {
  heroVariant: "classic" | "split";
  heroImage: string;
  badge: string;
  title: string;
  subtitle: string;
  cta: string;
  promo: string;
  features: { icon: string; title: string; description: string }[];
  productsTitle: string;
  storyTitle: string;
  storyText: string;
  storyImage: string;
  faq: { question: string; answer: string }[];
  newsletterTitle: string;
  newsletterSubtitle: string;
  footer: string;
};

const COMMON_FAQ = [
  { question: "Comment passer commande ?", answer: "Choisissez votre produit, remplissez le formulaire avec votre nom, votre téléphone et votre adresse, puis validez. Nous vous appelons pour confirmer." },
  { question: "Comment se passe le paiement ?", answer: "Vous payez en espèces à la livraison, après avoir reçu votre colis." },
  { question: "Quels sont les délais de livraison ?", answer: "24 à 72 heures selon votre gouvernorat. Nous livrons partout en Tunisie." },
];

const TRUST = {
  type: "trust_badges",
  config: {
    layout: "row",
    items: [
      { icon: "Truck", title: "Livraison partout en Tunisie", description: "24 à 72 h" },
      { icon: "Banknote", title: "Paiement à la livraison", description: "Payez à la réception" },
      { icon: "Phone", title: "Commande confirmée", description: "Nous vous appelons avant l'envoi" },
      { icon: "Headphones", title: "Service client", description: "Par téléphone et WhatsApp" },
    ],
  },
};

const NICHES: Record<string, Niche> = {
  general: {
    heroVariant: "classic",
    heroImage: photo("1445205170230-053b83016050"),
    badge: "Nouvelle collection",
    title: "Le style, sans compromis",
    subtitle: "Des pièces choisies avec soin, livrées chez vous partout en Tunisie.",
    cta: "Découvrir la boutique",
    promo: "🚚 Livraison partout en Tunisie · Paiement à la livraison",
    features: [
      { icon: "BadgeCheck", title: "Sélection soignée", description: "Des produits choisis pour leur qualité." },
      { icon: "Wallet", title: "Prix justes", description: "Le meilleur rapport qualité-prix, sans surprise." },
      { icon: "Smile", title: "Clients satisfaits", description: "Un service attentif avant et après l'achat." },
    ],
    productsTitle: "Nos meilleures ventes",
    storyTitle: "Une boutique pensée pour vous",
    storyText: "Nous sélectionnons des produits utiles et beaux, au juste prix. Vous commandez en quelques secondes, nous vous appelons pour confirmer, et vous payez à la livraison.",
    storyImage: photo("1441986300917-64674bd600d8", 1200),
    faq: COMMON_FAQ,
    newsletterTitle: "Restez informé",
    newsletterSubtitle: "Nouveautés et offres réservées aux abonnés.",
    footer: "Votre boutique de confiance, partout en Tunisie.",
  },
  home: {
    heroVariant: "split",
    heroImage: photo("1586023492125-27b2c045efd7"),
    badge: "Maison & déco",
    title: "Un intérieur qui vous ressemble",
    subtitle: "Mobilier, déco et accessoires pour rendre chaque pièce plus belle et plus pratique.",
    cta: "Voir la collection",
    promo: "🏡 Livraison soignée partout en Tunisie · Paiement à la livraison",
    features: [
      { icon: "Home", title: "Design soigné", description: "Des pièces sobres qui s'accordent avec tout." },
      { icon: "Package", title: "Emballage protégé", description: "Chaque article voyage en toute sécurité." },
      { icon: "Ruler", title: "Dimensions détaillées", description: "Toutes les mesures pour bien choisir." },
    ],
    productsTitle: "Coups de cœur déco",
    storyTitle: "Le confort au quotidien",
    storyText: "Nous choisissons des objets durables, faciles à vivre et à entretenir. Besoin d'un conseil sur une dimension ou une couleur ? Écrivez-nous sur WhatsApp.",
    storyImage: photo("1493663284031-b7e3aefcae8e", 1200),
    faq: [...COMMON_FAQ, { question: "Comment sont emballés les articles fragiles ?", answer: "Avec des protections adaptées. En cas de souci à la réception, contactez-nous immédiatement." }],
    newsletterTitle: "Inspirations déco",
    newsletterSubtitle: "Idées d'aménagement et nouveautés, une fois par mois.",
    footer: "Mobilier et décoration livrés partout en Tunisie.",
  },
  jewelry: {
    heroVariant: "classic",
    heroImage: photo("1611591437281-460bfbe1220a"),
    badge: "Collection précieuse",
    title: "L'élégance au quotidien",
    subtitle: "Bijoux délicats et intemporels, pour vous ou pour offrir.",
    cta: "Découvrir les bijoux",
    promo: "✨ Livraison partout en Tunisie · Paiement à la livraison",
    features: [
      { icon: "Gem", title: "Finitions soignées", description: "Des pièces choisies pour leur éclat et leur tenue." },
      { icon: "Gift", title: "Idée cadeau", description: "Des pièces parfaites pour faire plaisir." },
      { icon: "MessageCircle", title: "Conseil personnalisé", description: "Une question sur une taille ou une matière ? Écrivez-nous." },
    ],
    productsTitle: "Nos pièces signature",
    storyTitle: "Des bijoux pour chaque moment",
    storyText: "Un cadeau, une fête ou simplement le plaisir de porter une belle pièce : nos bijoux accompagnent vos moments importants. Conseils et tailles sur WhatsApp.",
    storyImage: photo("1515562141207-7a88fb7ce338", 1200),
    faq: [...COMMON_FAQ, { question: "En quelle matière sont les bijoux ?", answer: "La matière de chaque bijou est indiquée sur sa fiche produit. Pour toute question, écrivez-nous avant de commander." }],
    newsletterTitle: "Accès privé",
    newsletterSubtitle: "Recevez nos nouvelles pièces en avant-première.",
    footer: "Bijoux et accessoires élégants, livrés partout en Tunisie.",
  },
  streetwear: {
    heroVariant: "classic",
    heroImage: photo("1552346154-21d32810aba3"),
    badge: "Drop de la semaine",
    title: "Affirme ton style",
    subtitle: "Streetwear et sneakers en quantités limitées. Commande avant qu'il soit trop tard.",
    cta: "Shopper le drop",
    promo: "🔥 Nouveau drop disponible · Livraison 24-72 h",
    features: [
      { icon: "Flame", title: "Pièces tendance", description: "Les modèles du moment, sélectionnés chaque semaine." },
      { icon: "Ruler", title: "Guide des tailles", description: "Chaque fiche indique les mesures exactes." },
      { icon: "MessageCircle", title: "Conseil taille", description: "Envoie tes mesures sur WhatsApp, on t'aide à choisir." },
    ],
    productsTitle: "Le drop",
    storyTitle: "Pensé pour la rue",
    storyText: "Des coupes confortables et des matières qui tiennent. Nos stocks sont limités : quand c'est fini, c'est fini.",
    storyImage: photo("1523381210434-271e8be1f52b", 1200),
    faq: [...COMMON_FAQ, { question: "Comment choisir ma taille ?", answer: "Consultez le guide des tailles sur la fiche produit ou envoyez-nous vos mesures sur WhatsApp." }],
    newsletterTitle: "Ne rate aucun drop",
    newsletterSubtitle: "Sois prévenu dès qu'une nouvelle collection sort.",
    footer: "Streetwear et sneakers livrés partout en Tunisie.",
  },
  tech: {
    heroVariant: "classic",
    heroImage: photo("1468495244123-6c6c332eeece"),
    badge: "High-tech",
    title: "La technologie qui simplifie la vie",
    subtitle: "Accessoires et gadgets utiles, livrés rapidement partout en Tunisie.",
    cta: "Voir les produits",
    promo: "⚡ Livraison express · Paiement à la livraison",
    features: [
      { icon: "BadgeCheck", title: "Fiches détaillées", description: "Caractéristiques et compatibilité indiquées clairement." },
      { icon: "Zap", title: "Livraison rapide", description: "24 à 72 h partout en Tunisie." },
      { icon: "Headphones", title: "Assistance", description: "Une question sur la compatibilité ? On répond." },
    ],
    productsTitle: "Les plus demandés",
    storyTitle: "Des accessoires fiables",
    storyText: "Nous privilégions les produits durables et compatibles avec vos appareils. Toutes les caractéristiques sont détaillées sur chaque fiche.",
    storyImage: photo("1498049794561-7780e7231661", 1200),
    faq: [...COMMON_FAQ, { question: "Que faire si un produit a un défaut à la réception ?", answer: "Contactez-nous dès la réception par téléphone ou WhatsApp, nous trouverons une solution avec vous." }],
    newsletterTitle: "Les nouveautés tech",
    newsletterSubtitle: "Nouveaux produits et bons plans, sans spam.",
    footer: "Accessoires et high-tech livrés partout en Tunisie.",
  },
  electronics: {
    heroVariant: "split",
    heroImage: photo("1505740420928-5e560c06d30e"),
    badge: "Son & accessoires",
    title: "Le son, en grand",
    subtitle: "Casques, écouteurs et enceintes pour profiter de votre musique partout.",
    cta: "Découvrir",
    promo: "🎧 Livraison 24-72 h · Paiement à la livraison",
    features: [
      { icon: "Headphones", title: "Qualité audio", description: "Un son clair et des basses équilibrées." },
      { icon: "Timer", title: "Grande autonomie", description: "Des heures d'écoute sans recharge." },
      { icon: "MessageCircle", title: "Conseil avant achat", description: "Une question sur un modèle ? On vous répond." },
    ],
    productsTitle: "Sélection du moment",
    storyTitle: "Écoutez la différence",
    storyText: "Nous sélectionnons des produits au bon rapport qualité-prix, avec toutes les caractéristiques détaillées pour choisir sans hésiter.",
    storyImage: photo("1498049794561-7780e7231661", 1200),
    faq: [...COMMON_FAQ, { question: "Les produits sont-ils compatibles avec mon téléphone ?", answer: "La compatibilité est indiquée sur chaque fiche. En cas de doute, écrivez-nous sur WhatsApp." }],
    newsletterTitle: "Restez branché",
    newsletterSubtitle: "Nouveautés et offres en avant-première.",
    footer: "Électronique et accessoires audio livrés partout en Tunisie.",
  },
  craft: {
    heroVariant: "split",
    heroImage: photo("1565193566173-7a0ee3dbe261"),
    badge: "Fait main",
    title: "L'artisanat tunisien, chez vous",
    subtitle: "Des pièces uniques façonnées à la main par des artisans passionnés.",
    cta: "Découvrir les créations",
    promo: "🤲 Pièces faites main · Livraison partout en Tunisie",
    features: [
      { icon: "Hand", title: "Fait à la main", description: "Chaque pièce est unique." },
      { icon: "Leaf", title: "Matières naturelles", description: "Argile, bois, laine et fibres naturelles." },
      { icon: "Heart", title: "Savoir-faire local", description: "Un travail qui fait vivre nos artisans." },
    ],
    productsTitle: "Nos créations",
    storyTitle: "Des mains et une histoire",
    storyText: "Derrière chaque objet, il y a un artisan et des heures de travail. Les petites variations de forme et de couleur font le charme de chaque pièce.",
    storyImage: photo("1528396518501-b53b655eb9b3", 1200),
    faq: [...COMMON_FAQ, { question: "Les pièces sont-elles identiques aux photos ?", answer: "Chaque pièce étant faite main, de légères différences de forme ou de teinte peuvent exister : c'est ce qui la rend unique." }],
    newsletterTitle: "Les nouvelles créations",
    newsletterSubtitle: "Soyez prévenu quand une nouvelle série est prête.",
    footer: "Artisanat tunisien fait main, livré partout en Tunisie.",
  },
  beauty: {
    heroVariant: "classic",
    heroImage: photo("1596462502278-27bfdc403348"),
    badge: "Beauté & soin",
    title: "Révélez votre éclat",
    subtitle: "Soins, maquillage et parfums sélectionnés pour prendre soin de vous.",
    cta: "Voir la collection",
    promo: "💄 Livraison partout en Tunisie · Paiement à la livraison",
    features: [
      { icon: "Sparkles", title: "Sélection soignée", description: "Des références choisies avec attention." },
      { icon: "Leaf", title: "Ingrédients choisis", description: "Composition détaillée sur chaque fiche." },
      { icon: "Heart", title: "Conseils beauté", description: "Une question sur votre type de peau ? Écrivez-nous." },
    ],
    productsTitle: "Les essentiels beauté",
    storyTitle: "Prendre soin de soi, simplement",
    storyText: "Une routine simple et efficace, avec des produits adaptés à votre peau. Nous vous aidons à choisir sur WhatsApp.",
    storyImage: photo("1556228578-8c89e6adf883", 1200),
    faq: [...COMMON_FAQ, { question: "Les produits conviennent-ils aux peaux sensibles ?", answer: "Le type de peau conseillé est indiqué sur chaque fiche. En cas de doute, demandez-nous conseil avant de commander." }],
    newsletterTitle: "Le club beauté",
    newsletterSubtitle: "Nouveautés, conseils et offres réservées aux abonnées.",
    footer: "Beauté, soins et parfums livrés partout en Tunisie.",
  },
  sport: {
    heroVariant: "classic",
    heroImage: photo("1517836357463-d25dfeac3438"),
    badge: "Sport & fitness",
    title: "Dépasse tes limites",
    subtitle: "Équipement et tenues de sport pour s'entraîner partout, à la salle comme à la maison.",
    cta: "S'équiper",
    promo: "💪 Livraison 24-72 h · Paiement à la livraison",
    features: [
      { icon: "Trophy", title: "Équipement fiable", description: "Du matériel qui tient sur la durée." },
      { icon: "Zap", title: "Pour tous les niveaux", description: "Débutant ou confirmé, tu trouves ton équipement." },
      { icon: "MessageCircle", title: "Conseil taille", description: "Envoie tes mesures sur WhatsApp, on t'aide à choisir." },
    ],
    productsTitle: "L'équipement du moment",
    storyTitle: "Entraîne-toi où tu veux",
    storyText: "Du matériel pratique pour progresser à ton rythme, à la salle, dehors ou à la maison. Besoin d'un conseil ? Écris-nous sur WhatsApp.",
    storyImage: photo("1571019613454-1cb2f99b2d8b", 1200),
    faq: [...COMMON_FAQ, { question: "Comment choisir la bonne taille ?", answer: "Le guide des tailles est indiqué sur chaque fiche produit." }],
    newsletterTitle: "Reste motivé",
    newsletterSubtitle: "Nouveautés et offres pour les sportifs.",
    footer: "Sport et fitness livrés partout en Tunisie.",
  },
};

export type HomeNiche = keyof typeof NICHES;

function localized(niche: HomeNiche, lang: "fr" | "ar") {
  const n = NICHES[niche];
  if (lang !== "ar") {
    return {
      ...n,
      trust: TRUST.config.items,
      featuresTitle: "Pourquoi nous choisir",
      faqTitle: "Questions fréquentes",
      emailPlaceholder: "Votre e-mail",
      subscribe: "Je m'inscris",
    };
  }
  const ar = NICHES_AR[niche];
  return {
    ...n,
    ...ar,
    features: n.features.map((f, i) => ({ ...f, ...(ar.features[i] || {}) })),
    faq: ar.extraFaq ? [...COMMON_FAQ_AR, ar.extraFaq] : COMMON_FAQ_AR,
    trust: TRUST.config.items.map((item, i) => ({ ...item, ...(TRUST_AR[i] || {}) })),
    featuresTitle: SECTION_TITLES_AR.features,
    faqTitle: SECTION_TITLES_AR.faq,
    emailPlaceholder: SECTION_TITLES_AR.emailPlaceholder,
    subscribe: SECTION_TITLES_AR.subscribe,
  };
}

export function buildHomeSections(niche: HomeNiche, lang: "fr" | "ar" = "fr"): Section[] {
  const n = localized(niche, lang);
  const sections: Omit<Section, "id" | "position" | "is_visible">[] = [
    { type: "promo_banner", config: { text: n.promo } },
    {
      type: "hero",
      config: {
        variant: n.heroVariant,
        badge: n.badge,
        title: n.title,
        subtitle: n.subtitle,
        ctaText: n.cta,
        ctaLink: "/shop",
        backgroundImage: n.heroImage,
        overlay: 0.4,
        height: 640,
      },
    },
    { type: "trust_badges", config: { layout: "row", items: n.trust } },
    { type: "products", config: { title: n.productsTitle, limit: 8, columns: 4, source: "store" } },
    { type: "features", config: { title: n.featuresTitle, columns: 3, features: n.features } },
    { type: "image_with_text", config: { title: n.storyTitle, text: n.storyText, image: n.storyImage, imagePosition: "left", ctaText: n.cta, ctaLink: "/shop" } },
    { type: "faq", config: { title: n.faqTitle, faqs: n.faq } },
    { type: "newsletter", config: { title: n.newsletterTitle, subtitle: n.newsletterSubtitle, placeholder: n.emailPlaceholder, buttonText: n.subscribe } },
    { type: "footer", config: { description: n.footer } },
  ];
  return sections.map((section, position) => ({ ...section, id: `${niche}-${section.type}-${position}`, position, is_visible: true }));
}
