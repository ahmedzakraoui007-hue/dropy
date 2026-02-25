"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Store, Sparkles, ArrowRight, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useQuota } from "@/hooks/use-quota";
import { QuotaAlert } from "@/components/ui/quota-alert";

const templates = [
  { id: "fashion", name: "Mode & Fashion", image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop" },
  { id: "electronics", name: "Électronique", image: "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=400&h=300&fit=crop" },
  { id: "beauty", name: "Beauté", image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=300&fit=crop" },
  { id: "home", name: "Maison & Déco", image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&h=300&fit=crop" },
  { id: "sport", name: "Sport", image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=300&fit=crop" },
  { id: "general", name: "Général", image: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&h=300&fit=crop" },
];

export default function CreateStorePage() {
  const router = useRouter();
  const { plan, usage, limits, loading: quotaLoading, check } = useQuota();
  const [step, setStep] = useState(1);
  const [storeName, setStoreName] = useState("");
  const [storeSlug, setStoreSlug] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("fashion");
  const [loading, setLoading] = useState(false);

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  async function handleCreateStore() {
    if (!storeName.trim()) {
      toast.error("Veuillez entrer un nom pour votre boutique");
      return;
    }

    setLoading(true);
    
    if (!check('maxStores')) {
      toast.error("Limite de boutiques atteinte", {
        description: `Votre plan ${plan} est limité à ${limits.maxStores} boutique(s).`
      });
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Vous devez être connecté");
      router.push("/login");
      return;
    }

    const slug = storeSlug || generateSlug(storeName);

    const { data: existingStore } = await supabase
      .from("stores")
      .select("id")
      .eq("slug", slug)
      .single();

    if (existingStore) {
      toast.error("Ce nom de boutique est déjà pris");
      setLoading(false);
      return;
    }

      const { data: store, error } = await supabase
        .from("stores")
        .insert({
          vendor_id: user.id,
          name: storeName,
        slug,
        description,
        subdomain: slug,
        theme_config: {
          template: selectedTemplate,
          colors: { primary: "#8B5CF6", secondary: "#06B6D4" },
          fonts: { heading: "Outfit", body: "Outfit" },
        },
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      toast.error("Erreur lors de la création", { description: error.message });
      setLoading(false);
      return;
    }

    // Generate all essential pages
    const essentialPages = [
      {
        name: "Accueil",
        slug: "home",
        type: "home",
        show_in_menu: true,
        sections: [
          { id: crypto.randomUUID(), type: "hero", config: { title: `Bienvenue chez ${storeName}`, subtitle: "Les meilleurs produits en un seul clic.", variant: "bold" }, position: 0, is_visible: true },
          { id: crypto.randomUUID(), type: "collections", config: { title: "Nos Catégories", items: [{ title: "Nouveautés", image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600", link: "/shop" }] }, position: 1, is_visible: true },
          { id: crypto.randomUUID(), type: "products", config: { title: "Meilleures Ventes", limit: 4 }, position: 2, is_visible: true },
          { id: crypto.randomUUID(), type: "trust_badges", config: { layout: 'row' }, position: 3, is_visible: true },
          { id: crypto.randomUUID(), type: "footer", config: { brandName: storeName, copyright: `© 2026 ${storeName}. Tous droits réservés.` }, position: 4, is_visible: true }
        ]
      },
      {
        name: "Boutique",
        slug: "shop",
        type: "shop",
        show_in_menu: true,
        sections: [
          { id: crypto.randomUUID(), type: "hero", config: { title: "Notre Boutique", subtitle: "Découvrez notre collection complète", variant: "classic", height: 300, badge: "SHOP" }, position: 0, is_visible: true },
          { id: crypto.randomUUID(), type: "products", config: { title: "Tous nos produits", limit: 20, columns: 4 }, position: 1, is_visible: true },
          { id: crypto.randomUUID(), type: "footer", config: { brandName: storeName }, position: 2, is_visible: true }
        ]
      },
      {
        name: "À Propos",
        slug: "about",
        type: "about",
        show_in_menu: true,
        sections: [
          { id: crypto.randomUUID(), type: "hero", config: { title: "Notre Histoire", variant: "classic", height: 400, badge: "DÉCOUVREZ NOTRE MISSION" }, position: 0, is_visible: true },
          { id: crypto.randomUUID(), type: "about", config: { title: "Notre Mission", content: "<h3>Démocratiser le e-commerce</h3><p>Notre mission est de vous offrir les meilleurs produits aux meilleurs prix.</p>" }, position: 1, is_visible: true },
          { id: crypto.randomUUID(), type: "footer", config: { brandName: storeName }, position: 2, is_visible: true }
        ]
      },
      {
        name: "Contact",
        slug: "contact",
        type: "contact",
        show_in_menu: true,
        sections: [
          { id: crypto.randomUUID(), type: "hero", config: { title: "Contactez-Nous", variant: "classic", height: 300, badge: "DISPONIBLE 7J/7" }, position: 0, is_visible: true },
          { id: crypto.randomUUID(), type: "contact", config: { title: "Parlons de votre projet" }, position: 1, is_visible: true },
          { id: crypto.randomUUID(), type: "footer", config: { brandName: storeName }, position: 2, is_visible: true }
        ]
      },
      {
        name: "Détail Produit",
        slug: "product-detail",
        type: "product",
        show_in_menu: false,
        sections: [
          { id: crypto.randomUUID(), type: "product_detail", config: { title: "Produit Premium" }, position: 0, is_visible: true },
          { id: crypto.randomUUID(), type: "recommended_products", config: { title: "Vous aimerez aussi" }, position: 1, is_visible: true },
          { id: crypto.randomUUID(), type: "footer", config: { brandName: storeName }, position: 2, is_visible: true }
        ]
      },
      {
        name: "Commande",
        slug: "checkout",
        type: "checkout",
        show_in_menu: false,
        sections: [
          { id: crypto.randomUUID(), type: "checkout", config: { title: "Finalisez votre commande" }, position: 0, is_visible: true },
          { id: crypto.randomUUID(), type: "trust_badges", config: { title: "Paiement Sécurisé", layout: 'row' }, position: 1, is_visible: true },
          { id: crypto.randomUUID(), type: "footer", config: { brandName: storeName }, position: 2, is_visible: true }
        ]
      },
      {
        name: "Merci",
        slug: "merci",
        type: "merci",
        show_in_menu: false,
        sections: [
          { id: crypto.randomUUID(), type: "hero", config: { title: "Merci !", subtitle: "Commande confirmée.", ctaText: "Retour à l'accueil", ctaLink: "/" }, position: 0, is_visible: true },
          { id: crypto.randomUUID(), type: "footer", config: { brandName: storeName }, position: 1, is_visible: true }
        ]
      }
    ];

    for (const page of essentialPages) {
      await supabase.from("store_pages").insert({
        store_id: store.id,
        name: page.name,
        slug: page.slug,
        type: page.type,
        sections: page.sections,
        show_in_menu: page.show_in_menu,
        is_published: true,
        position: essentialPages.indexOf(page)
      });
    }

    toast.success("Boutique créée avec succès !");
    router.push("/seller/store-builder");
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {!quotaLoading && !check('maxStores') && (
        <QuotaAlert 
          title="Limite de boutiques atteinte"
          description={`Vous avez déjà ${usage.stores} boutique(s). Votre plan ${plan} est limité à ${limits.maxStores}.`}
          plan={plan}
        />
      )}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
          <Store className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Créer votre boutique</h1>
        <p className="text-muted-foreground">
          {step === 1 ? "Donnez un nom à votre boutique" : "Choisissez un template"}
        </p>
      </motion.div>

      <div className="flex items-center justify-center gap-2 mb-8">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
          {step > 1 ? <Check className="w-5 h-5" /> : "1"}
        </div>
        <div className={`w-24 h-1 rounded ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
          2
        </div>
      </div>

      {step === 1 ? (
        <Card>
          <CardContent className="p-8 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="storeName">Nom de la boutique *</Label>
              <Input
                id="storeName"
                placeholder="Ma Super Boutique"
                value={storeName}
                onChange={(e) => {
                  setStoreName(e.target.value);
                  setStoreSlug(generateSlug(e.target.value));
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="storeSlug">URL de la boutique</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">dropy.store/</span>
                <Input
                  id="storeSlug"
                  placeholder="ma-boutique"
                  value={storeSlug}
                  onChange={(e) => setStoreSlug(generateSlug(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optionnel)</Label>
              <Textarea
                id="description"
                placeholder="Décrivez votre boutique en quelques mots..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <Button
              onClick={() => setStep(2)}
              className="w-full bg-gradient-to-r from-violet-500 to-purple-600 h-12"
              disabled={!storeName.trim()}
            >
              Continuer
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                  selectedTemplate === template.id
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <img
                  src={template.image}
                  alt={template.name}
                  className="w-full aspect-video object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white font-medium text-sm">{template.name}</p>
                </div>
                {selectedTemplate === template.id && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-12">
              Retour
            </Button>
            <Button
              onClick={handleCreateStore}
              className="flex-1 bg-gradient-to-r from-violet-500 to-purple-600 h-12"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Créer ma boutique
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
