import type { Theme } from "@/types/themes";

type Lang = "fr" | "ar";
type Raw = [string, Record<string, unknown>];

const photo = (id: string, width = 1600) => `https://images.unsplash.com/photo-${id}?w=${width}&q=80&auto=format&fit=crop`;
const tiles = (list: [string, string][]) => list.map(([id, title]) => ({ image: photo(id, 900), title, link: "/shop" }));

const TRUST = {
  fr: [
    { icon: "Truck", title: "Livraison partout en Tunisie", description: "24 à 72 h" },
    { icon: "Banknote", title: "Paiement à la livraison", description: "Payez à la réception" },
    { icon: "Phone", title: "Commande confirmée", description: "Nous vous appelons avant l'envoi" },
    { icon: "RefreshCw", title: "Échange facile", description: "Selon nos conditions" },
  ],
  ar: [
    { icon: "Truck", title: "توصيل لكل ولايات تونس", description: "من 24 لـ 72 ساعة" },
    { icon: "Banknote", title: "الدفع عند الاستلام", description: "تخلص كي توصلك الكوموند" },
    { icon: "Phone", title: "تأكيد الطلب", description: "نكلموك قبل ما نبعثو" },
    { icon: "RefreshCw", title: "تبديل ساهل", description: "حسب الشروط متاعنا" },
  ],
};

const COMMON = {
  fr: { products: "Toute la collection", newsletter: "Rejoignez le cercle", newsletterSub: "Nouveautés et avant-premières réservées aux abonnés.", email: "Votre e-mail", subscribe: "Je m'inscris" },
  ar: { products: "الكوليكسيون الكل", newsletter: "انضم للعيلة", newsletterSub: "الجديد والعروض الخاصة للمشتركين برك.", email: "الإيميل متاعك", subscribe: "نشترك" },
};

function closing(lang: Lang, footer: string): Raw[] {
  const c = COMMON[lang];
  return [
    ["trust_badges", { layout: "row", items: TRUST[lang] }],
    ["newsletter", { title: c.newsletter, subtitle: c.newsletterSub, placeholder: c.email, buttonText: c.subscribe }],
    ["footer", { description: footer }],
  ];
}

type Premium = { theme: Omit<Theme, "defaultSections">; sections: (lang: Lang) => Raw[] };

const PREMIUM: Premium[] = [
  {
    theme: {
      id: "noor",
      name: "Noor",
      description: "Mode féminine et modeste. Concept : une marque de vêtements tunisienne lumineuse, tons sable et terracotta, serif éditoriale. Idées : tourner des reels « essayage en 3 looks », un lookbook par saison, un mot signature répété dans le bandeau défilant.",
      thumbnail: photo("1496747611176-843222e1e57c", 900),
      category: "premium",
      is_free: true,
      colors: { primary: "#B4532A", secondary: "#1C1917", accent: "#E9C46A", background: "#FBF6F0", surface: "#F3EADF", text: "#1C1917", textMuted: "#6B5E55", border: "#E7DCCF" },
      typography: { headingFont: "'Fraunces', serif", bodyFont: "'Manrope', sans-serif", baseFontSize: "16px" },
      layout: { borderRadius: "14px", containerMaxWidth: "1280px" },
    },
    sections: (lang) => {
      const fr = lang === "fr";
      return [
        ["marquee", { items: fr ? [{ text: "Nouvelle collection" }, { text: "Livraison partout en Tunisie" }, { text: "Paiement à la livraison" }, { text: "Pièces en quantité limitée" }] : [{ text: "كوليكسيون جديدة" }, { text: "توصيل لكل ولايات تونس" }, { text: "الدفع عند الاستلام" }, { text: "كميات محدودة" }], backgroundColor: "#1C1917", textColor: "#FBF6F0" }],
        ["hero", { variant: "editorial", badge: fr ? "Collection saison" : "كوليكسيون الموسم", title: fr ? "La lumière se porte." : "الضو يتلبس.", subtitle: fr ? "Des coupes fluides et des matières douces, pensées pour vos journées comme pour vos soirées." : "قصات مريحة وقماش ناعم، للنهار وللسهرية.", ctaText: fr ? "Découvrir la collection" : "اكتشفي الكوليكسيون", ctaLink: "/shop", backgroundImage: photo("1496747611176-843222e1e57c"), overlay: 0.25, height: 720 }],
        ["showcase_3d", { badge: fr ? "Les pièces phares" : "القطع المميزة", title: fr ? "Faites tourner la collection" : "دوري الكوليكسيون", subtitle: fr ? "Glissez pour découvrir chaque pièce." : "اسحبي باش تكتشفي كل قطعة.", ctaText: fr ? "Voir" : "شوفي", source: "store", limit: 8, items: tiles([["1515886657613-9f3515b0c78f", fr ? "Le sweat soleil" : "سويت الشمس"], ["1485968579580-b6d095142e6e", fr ? "Le manteau carreaux" : "مونطو الكارو"], ["1539109136881-3be0616acf4b", fr ? "L'ensemble azur" : "طقم الأزرق"], ["1523381210434-271e8be1f52b", fr ? "Les essentiels" : "الأساسيات"], ["1496747611176-843222e1e57c", fr ? "La robe fleurie" : "الروبة المورّدة"]]) }],
        ["big_statement", { text: fr ? "Simple. Lumineuse. Vous." : "بسيطة. مضوية. إنتي.", subtext: fr ? "Chaque pièce est choisie pour durer plus d'une saison." : "كل قطعة مختارة باش تدوم أكثر من موسم.", style: "outline" }],
        ["lookbook", { badge: "Shop the look", title: fr ? "Le look de la semaine" : "لوك الجمعة", subtitle: fr ? "Touchez les points pour voir chaque pièce." : "انزلي على النقاط باش تشوفي كل قطعة.", image: photo("1539109136881-3be0616acf4b"), ctaText: fr ? "Voir le produit" : "شوفي المنتوج", hotspots: [{ x: 47, y: 20, label: fr ? "Foulard" : "فولار", price: "", link: "/shop" }, { x: 41, y: 47, label: fr ? "Sac" : "صاك", price: "", link: "/shop" }, { x: 60, y: 70, label: fr ? "Manteau" : "مونطو", price: "", link: "/shop" }] }],
        ["reels", { badge: fr ? "Vu sur TikTok" : "شفتيه في تيك توك", title: fr ? "Essayez-les en vidéo" : "جربيهم بالفيديو", ctaText: fr ? "Commander" : "اطلبي", source: "store", items: tiles([["1483985988355-763728e1935b", fr ? "Le haul du mois" : "مشتريات الشهر"], ["1490481651871-ab68de25d43d", fr ? "Dans l'atelier" : "في الأتيليه"], ["1485968579580-b6d095142e6e", fr ? "3 façons de le porter" : "3 طرق باش تلبسيه"]]) }],
        ["products", { title: COMMON[lang].products, limit: 8, columns: 4, source: "store", cardStyle: "tilt" }],
        ...closing(lang, fr ? "Mode féminine, livrée partout en Tunisie." : "موضة نسائية، توصل لكل تونس."),
      ];
    },
  },
  {
    theme: {
      id: "aura",
      name: "Aura",
      description: "Beauté et soins. Concept : une marque de skincare douce et sensorielle, rose poudré et prune, serif fine. Idées : filmer la texture en gros plan pour les reels, une routine jour / nuit, des flacons posés sur des socles colorés.",
      thumbnail: photo("1608571423902-eed4a5ad8108", 900),
      category: "premium",
      is_free: true,
      colors: { primary: "#8E3B5B", secondary: "#E8A598", accent: "#F6D6CF", background: "#FFF7F4", surface: "#FBEAE5", text: "#2B1A22", textMuted: "#7A5F69", border: "#F1DAD3" },
      typography: { headingFont: "'Cormorant Garamond', serif", bodyFont: "'Jost', sans-serif", baseFontSize: "16px" },
      layout: { borderRadius: "24px", containerMaxWidth: "1200px" },
    },
    sections: (lang) => {
      const fr = lang === "fr";
      return [
        ["promo_banner", { text: fr ? "✨ Livraison partout en Tunisie · Paiement à la livraison" : "✨ توصيل لكل تونس · الدفع عند الاستلام" }],
        ["hero", { variant: "split", badge: fr ? "Rituel beauté" : "روتين الجمال", title: fr ? "Votre peau, en pleine lumière" : "بشرتك، مضوية", subtitle: fr ? "Des soins choisis pour leur texture et leurs ingrédients, livrés chez vous." : "منتجات مختارة على حساب التركيبة والمكونات، توصلك للدار.", ctaText: fr ? "Découvrir les soins" : "اكتشفي المنتجات", ctaLink: "/shop", backgroundImage: photo("1608571423902-eed4a5ad8108"), overlay: 0.2, height: 680 }],
        ["reels", { badge: fr ? "Textures" : "التكسترات", title: fr ? "Regardez avant d'essayer" : "شوفي قبل ما تجربي", ctaText: fr ? "Commander" : "اطلبي", source: "store", items: tiles([["1515377905703-c4788e51af15", fr ? "Le sérum, en gros plan" : "السيروم من قريب"], ["1612817288484-6f916006741a", fr ? "La routine naturelle" : "الروتين الطبيعي"], ["1596462502278-27bfdc403348", fr ? "Le maquillage du jour" : "ماكياج النهار"]]) }],
        ["before_after", { badge: fr ? "Jour / Nuit" : "نهار / ليل", title: fr ? "Une routine pour chaque moment" : "روتين لكل وقت", text: fr ? "Glissez pour passer de la routine du jour à celle du soir." : "اسحبي باش تتعدّي من روتين النهار لروتين الليل.", before: photo("1596462502278-27bfdc403348"), after: photo("1515377905703-c4788e51af15"), beforeLabel: fr ? "Jour" : "نهار", afterLabel: fr ? "Nuit" : "ليل" }],
        ["big_statement", { text: fr ? "Moins de produits. Mieux choisis." : "منتجات أقل. مختارة خير.", subtext: fr ? "Une sélection courte, pour une routine que vous tiendrez." : "اختيار صغير، لروتين تنجمي تحافظي عليه.", style: "gradient" }],
        ["showcase_3d", { badge: fr ? "Best-sellers" : "الأكثر طلبا", title: fr ? "Nos indispensables" : "الأساسيات متاعنا", ctaText: fr ? "Découvrir" : "اكتشفي", source: "store", limit: 8, items: tiles([["1608571423902-eed4a5ad8108", fr ? "L'élixir" : "الإكسير"], ["1515377905703-c4788e51af15", fr ? "Le sérum" : "السيروم"], ["1612817288484-6f916006741a", fr ? "Le coffret naturel" : "البوكس الطبيعي"], ["1596462502278-27bfdc403348", fr ? "Le maquillage" : "الماكياج"]]) }],
        ["products", { title: COMMON[lang].products, limit: 8, columns: 4, source: "store", cardStyle: "tilt" }],
        ...closing(lang, fr ? "Soins et beauté, livrés partout en Tunisie." : "منتجات العناية والجمال، توصل لكل تونس."),
      ];
    },
  },
  {
    theme: {
      id: "zinat",
      name: "Zinat",
      description: "Bijoux et accessoires de luxe. Concept : une maison de joaillerie entre ivoire, noir profond et or, serif haute couture. Idées : photographier chaque pièce sur fond noir, une vitrine 3D comme un écrin, un emballage cadeau mis en avant pour les fêtes.",
      thumbnail: photo("1599643478518-a784e5dc4c8f", 900),
      category: "premium",
      is_free: true,
      colors: { primary: "#B08D45", secondary: "#E9D3A0", accent: "#0B0B0C", background: "#FAF7F0", surface: "#F2EDE2", text: "#141414", textMuted: "#6B6559", border: "#E6DFD0" },
      typography: { headingFont: "'Bodoni Moda', serif", bodyFont: "'Montserrat', sans-serif", baseFontSize: "15px" },
      layout: { borderRadius: "2px", containerMaxWidth: "1240px" },
    },
    sections: (lang) => {
      const fr = lang === "fr";
      return [
        ["marquee", { items: fr ? [{ text: "Écrin cadeau offert" }, { text: "Livraison partout en Tunisie" }, { text: "Paiement à la livraison" }] : [{ text: "علبة هدية مجانية" }, { text: "توصيل لكل تونس" }, { text: "الدفع عند الاستلام" }], backgroundColor: "#0B0B0C", textColor: "#E9D3A0" }],
        ["hero", { variant: "editorial", badge: fr ? "Haute joaillerie" : "مجوهرات راقية", title: fr ? "L'éclat qui vous ressemble" : "اللمعة اللي تشبهلك", subtitle: fr ? "Des pièces fines, à offrir ou à s'offrir." : "قطع رقيقة، هدية ليك ولا لغيرك.", ctaText: fr ? "Entrer dans la maison" : "ادخل للدار", ctaLink: "/shop", backgroundImage: photo("1599643478518-a784e5dc4c8f"), overlay: 0.35, height: 760 }],
        ["showcase_3d", { badge: fr ? "L'écrin" : "العلبة", title: fr ? "Nos pièces signature" : "القطع المميزة متاعنا", subtitle: fr ? "Glissez pour faire tourner l'écrin." : "اسحب باش تدور العلبة.", ctaText: fr ? "Voir la pièce" : "شوف القطعة", source: "store", limit: 8, backgroundColor: "#0B0B0C", textColor: "#F7F3EA", items: tiles([["1605100804763-247f67b3557e", fr ? "La bague halo" : "خاتم الهالة"], ["1535632066927-ab7c9ab60908", fr ? "Les boucles azur" : "حلق الأزرق"], ["1599643478518-a784e5dc4c8f", fr ? "Le collier lune" : "عقد القمر"], ["1515562141207-7a88fb7ce338", fr ? "Les perles" : "اللؤلؤ"], ["1611591437281-460bfbe1220a", fr ? "Le bracelet" : "السوار"]]) }],
        ["big_statement", { text: fr ? "Certaines choses se gardent toute une vie." : "فما حاجات تتخبى العمر الكل.", style: "gradient", backgroundColor: "#0B0B0C", textColor: "#F7F3EA" }],
        ["lookbook", { badge: fr ? "Détails" : "التفاصيل", title: fr ? "Regardez de plus près" : "شوف من قريب", image: photo("1611591437281-460bfbe1220a"), ctaText: fr ? "Voir la pièce" : "شوف القطعة", hotspots: [{ x: 50, y: 74, label: fr ? "Bracelet" : "سوار", price: "", link: "/shop" }] }],
        ["products", { title: fr ? "La collection" : "الكوليكسيون", limit: 8, columns: 4, source: "store", cardStyle: "tilt" }],
        ...closing(lang, fr ? "Bijoux et accessoires, livrés partout en Tunisie." : "مجوهرات وإكسسوارات، توصل لكل تونس."),
      ];
    },
  },
  {
    theme: {
      id: "volt",
      name: "Volt",
      description: "Tech et gadgets. Concept : une marque high-tech futuriste, blocs nuit, cyan électrique et violet, typo géométrique. Idées : des reels « unboxing en 15 secondes », une vitrine 3D des best-sellers, un modèle 3D à faire tourner si le fournisseur donne le fichier .glb.",
      thumbnail: photo("1505740420928-5e560c06d30e", 900),
      category: "premium",
      is_free: true,
      colors: { primary: "#0891B2", secondary: "#7C3AED", accent: "#07080D", background: "#F5F7FA", surface: "#EBEFF5", text: "#0B0F19", textMuted: "#5B6475", border: "#DDE3EC" },
      typography: { headingFont: "'Space Grotesk', sans-serif", bodyFont: "'Inter', sans-serif", baseFontSize: "16px" },
      layout: { borderRadius: "16px", containerMaxWidth: "1280px" },
    },
    sections: (lang) => {
      const fr = lang === "fr";
      return [
        ["marquee", { items: fr ? [{ text: "Nouveautés tech" }, { text: "Livraison 24 à 72 h" }, { text: "Paiement à la livraison" }, { text: "Garantie selon produit" }] : [{ text: "جديد التكنولوجيا" }, { text: "توصيل من 24 لـ 72 ساعة" }, { text: "الدفع عند الاستلام" }, { text: "ضمان حسب المنتوج" }], backgroundColor: "#07080D", textColor: "#22D3EE" }],
        ["hero", { variant: "bold", badge: fr ? "Next level" : "المستوى الجاي", title: fr ? "Le futur, livré demain." : "المستقبل، يوصلك غدوة.", subtitle: fr ? "Gadgets, audio et accessoires choisis pour ceux qui veulent toujours un temps d'avance." : "قادجات، أوديو وإكسسوارات للي يحب يكون ديما قدام.", ctaText: fr ? "Explorer" : "اكتشف", ctaLink: "/shop", backgroundImage: photo("1468495244123-6c6c332eeece"), overlay: 0.55, height: 720 }],
        ["showcase_3d", { badge: fr ? "Best-sellers" : "الأكثر مبيعا", title: fr ? "En rotation" : "في الدوران", subtitle: fr ? "Glissez pour voir le prochain." : "اسحب باش تشوف اللي بعدو.", ctaText: fr ? "Voir" : "شوف", source: "store", limit: 8, backgroundColor: "#07080D", textColor: "#F1F5F9", items: tiles([["1505740420928-5e560c06d30e", fr ? "Le casque" : "الكاسك"], ["1523275335684-37898b6baf30", fr ? "La montre connectée" : "الساعة الذكية"], ["1593642632823-8f785ba67e45", fr ? "Le setup" : "السيتاب"], ["1468495244123-6c6c332eeece", fr ? "Les accessoires" : "الإكسسوارات"]]) }],
        ["big_statement", { text: fr ? "Plus rapide. Plus fin. Plus malin." : "أسرع. أرق. أذكى.", subtext: fr ? "Des produits choisis pour ce qu'ils font vraiment, au juste prix." : "منتوجات مختارة على حساب الخدمة متاعها، بسوم معقول.", style: "gradient", backgroundColor: "#07080D", textColor: "#F1F5F9" }],
        ["reels", { badge: fr ? "Unboxing" : "أنبوكسينغ", title: fr ? "Déballé en 15 secondes" : "محلول في 15 ثانية", ctaText: fr ? "Commander" : "اطلب", source: "store", items: tiles([["1505740420928-5e560c06d30e", fr ? "Le son, sans fil" : "الصوت بلا فيل"], ["1523275335684-37898b6baf30", fr ? "Au poignet" : "في اليد"], ["1593642632823-8f785ba67e45", fr ? "Le bureau idéal" : "البيرو المثالي"]]) }],
        ["products", { title: fr ? "Tout le catalogue" : "الكاتالوغ الكل", limit: 8, columns: 4, source: "store", cardStyle: "tilt" }],
        ...closing(lang, fr ? "Tech et gadgets, livrés partout en Tunisie." : "تكنولوجيا وقادجات، توصل لكل تونس."),
      ];
    },
  },
  {
    theme: {
      id: "dar",
      name: "Dar",
      description: "Maison et décoration. Concept : une marque de déco méditerranéenne, lin, olive et argile, serif chaleureuse. Idées : montrer chaque objet en situation dans une pièce, un lookbook « shop the room », des reels avant / après d'un coin de salon.",
      thumbnail: photo("1493663284031-b7e3aefcae8e", 900),
      category: "premium",
      is_free: true,
      colors: { primary: "#5B6B3A", secondary: "#C17A4A", accent: "#E9D8B4", background: "#F6F1E8", surface: "#EDE5D6", text: "#2A2620", textMuted: "#6E665A", border: "#DDD3C1" },
      typography: { headingFont: "'DM Serif Display', serif", bodyFont: "'DM Sans', sans-serif", baseFontSize: "16px" },
      layout: { borderRadius: "18px", containerMaxWidth: "1280px" },
    },
    sections: (lang) => {
      const fr = lang === "fr";
      return [
        ["promo_banner", { text: fr ? "🏡 Livraison partout en Tunisie · Paiement à la livraison" : "🏡 توصيل لكل تونس · الدفع عند الاستلام" }],
        ["hero", { variant: "editorial", badge: fr ? "Art de vivre" : "فن العيش", title: fr ? "Une maison qui vous ressemble" : "دار تشبهلك", subtitle: fr ? "Mobilier, objets et textiles pour des pièces chaleureuses et lumineuses." : "أثاث، ديكور وقماش لبيوت دافية ومضوية.", ctaText: fr ? "Découvrir" : "اكتشف", ctaLink: "/shop", backgroundImage: photo("1493663284031-b7e3aefcae8e"), overlay: 0.3, height: 720 }],
        ["lookbook", { badge: "Shop the room", title: fr ? "Composez votre salon" : "ركّب الصالون متاعك", subtitle: fr ? "Touchez un objet pour le voir dans la boutique." : "انزل على حاجة باش تشوفها في الحانوت.", image: photo("1524758631624-e2822e304c36"), ctaText: fr ? "Voir l'objet" : "شوف الحاجة", hotspots: [{ x: 45, y: 25, label: fr ? "Lampadaire" : "لمبادير", price: "", link: "/shop" }, { x: 20, y: 72, label: fr ? "Chaise" : "كرسي", price: "", link: "/shop" }, { x: 82, y: 62, label: fr ? "Canapé" : "كنابي", price: "", link: "/shop" }] }],
        ["big_statement", { text: fr ? "Le confort, avec du caractère." : "الراحة، بشخصية.", style: "plain" }],
        ["showcase_3d", { badge: fr ? "Coups de cœur" : "اختياراتنا", title: fr ? "Nos pièces du moment" : "قطع اللحظة", ctaText: fr ? "Voir" : "شوف", source: "store", limit: 8, items: tiles([["1555041469-a586c61ea9bc", fr ? "Le canapé velours" : "كنابي فلور"], ["1586023492125-27b2c045efd7", fr ? "Le fauteuil soleil" : "الفوتاي الأصفر"], ["1565193566173-7a0ee3dbe261", fr ? "Les vases" : "الفازات"], ["1493663284031-b7e3aefcae8e", fr ? "Le salon" : "الصالون"]]) }],
        ["image_with_text", { title: fr ? "Choisis pour durer" : "مختارين باش يدومو", text: fr ? "Nous sélectionnons des matières solides et des formes simples, faciles à marier avec votre intérieur." : "نختارو مواد قوية وأشكال بسيطة، تمشي مع أي ديكور.", image: photo("1565193566173-7a0ee3dbe261", 1200), imagePosition: "right", ctaText: fr ? "Voir la boutique" : "شوف الحانوت", ctaLink: "/shop" }],
        ["products", { title: COMMON[lang].products, limit: 8, columns: 4, source: "store", cardStyle: "tilt" }],
        ...closing(lang, fr ? "Maison et déco, livrées partout en Tunisie." : "ديكور ودار، توصل لكل تونس."),
      ];
    },
  },
  {
    theme: {
      id: "zitouna",
      name: "Zitouna",
      description: "Terroir et produits du terroir. Concept : une marque d'huile d'olive, miel et épices tunisiens, vert olive et or, serif classique. Idées : raconter l'origine (région, récolte), filmer le versement de l'huile en reels, proposer des coffrets cadeaux.",
      thumbnail: photo("1474979266404-7eaacbcd87c5", 900),
      category: "premium",
      is_free: true,
      colors: { primary: "#3F5A2A", secondary: "#D4A017", accent: "#F2E3B3", background: "#FBF8F0", surface: "#F2ECDD", text: "#22261C", textMuted: "#5F6553", border: "#E3DCC8" },
      typography: { headingFont: "'Playfair Display', serif", bodyFont: "'Karla', sans-serif", baseFontSize: "16px" },
      layout: { borderRadius: "12px", containerMaxWidth: "1200px" },
    },
    sections: (lang) => {
      const fr = lang === "fr";
      return [
        ["marquee", { items: fr ? [{ text: "Produits de Tunisie" }, { text: "Coffrets cadeaux" }, { text: "Livraison partout en Tunisie" }, { text: "Paiement à la livraison" }] : [{ text: "منتوجات تونسية" }, { text: "بواكس هدايا" }, { text: "توصيل لكل تونس" }, { text: "الدفع عند الاستلام" }], backgroundColor: "#3F5A2A", textColor: "#FBF8F0" }],
        ["hero", { variant: "editorial", badge: fr ? "Du terroir à votre table" : "من البلاد لطاولتك", title: fr ? "Le goût de chez nous" : "بنة بلادنا", subtitle: fr ? "Huile d'olive, miel et épices, sélectionnés auprès de producteurs tunisiens." : "زيت زيتون، عسل وعطرية، مختارين من عند فلاحة تونسيين.", ctaText: fr ? "Goûter" : "ذوق", ctaLink: "/shop", backgroundImage: photo("1474979266404-7eaacbcd87c5"), overlay: 0.3, height: 700 }],
        ["big_statement", { text: fr ? "Récolté avec patience. Partagé avec fierté." : "متلم بالصبر. مقسوم بالفخر.", style: "gradient" }],
        ["showcase_3d", { badge: fr ? "Le garde-manger" : "العولة", title: fr ? "Nos produits" : "منتوجاتنا", ctaText: fr ? "Découvrir" : "اكتشف", source: "store", limit: 8, items: tiles([["1474979266404-7eaacbcd87c5", fr ? "L'huile d'olive" : "زيت الزيتون"], ["1558642452-9d2a7deb7f62", fr ? "Le miel" : "العسل"], ["1596040033229-a9821ebd058d", fr ? "Les épices" : "العطرية"], ["1509440159596-0249088772ff", fr ? "Le pain maison" : "خبز الدار"]]) }],
        ["reels", { badge: fr ? "En cuisine" : "في الكوجينة", title: fr ? "Ça se regarde, ça se goûte" : "يتشاف، ويتذاق", ctaText: fr ? "Commander" : "اطلب", source: "store", items: tiles([["1474979266404-7eaacbcd87c5", fr ? "Le versement de l'huile" : "صبان الزيت"], ["1558642452-9d2a7deb7f62", fr ? "Le miel qui coule" : "العسل يسيل"], ["1596040033229-a9821ebd058d", fr ? "Le mélange d'épices" : "خلطة العطرية"]]) }],
        ["image_with_text", { title: fr ? "Une histoire d'origine" : "حكاية الأصل", text: fr ? "Derrière chaque produit, il y a une région, une récolte et des producteurs. Nous choisissons des produits dont nous connaissons l'origine." : "ورا كل منتوج فما جهة، صابة وفلاحة. نختارو منتوجات نعرفو منين جاية.", image: photo("1596040033229-a9821ebd058d", 1200), imagePosition: "left", ctaText: fr ? "Voir la boutique" : "شوف الحانوت", ctaLink: "/shop" }],
        ["products", { title: COMMON[lang].products, limit: 8, columns: 4, source: "store", cardStyle: "tilt" }],
        ...closing(lang, fr ? "Produits du terroir tunisien, livrés partout en Tunisie." : "منتوجات البلاد، توصل لكل تونس."),
      ];
    },
  },
];

export function premiumHomeSections(id: string, lang: Lang = "fr") {
  const premium = PREMIUM.find((p) => p.theme.id === id);
  if (!premium) return null;
  return premium.sections(lang).map(([type, config], position) => ({ id: `${id}-${type}-${position}`, type, config, position, is_visible: true }));
}

export const premiumThemes: Theme[] = PREMIUM.map((p) => ({ ...p.theme, defaultSections: premiumHomeSections(p.theme.id) || [] }));
