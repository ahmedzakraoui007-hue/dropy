"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Image as ImageIcon,
  Type,
  Link2,
  Search,
  FileText,
  Zap,
  ChevronRight
} from "lucide-react";

interface Warning {
  id: string;
  type: "error" | "warning" | "info";
  category: string;
  message: string;
  details?: string;
  sectionId?: string;
  field?: string;
  fix?: () => void;
  fixLabel?: string;
}

interface SmartWarningsProps {
  sections: any[];
  pages: any[];
  store: any;
  onNavigateToSection: (sectionId: string) => void;
  onFixApplied: () => void;
}

export default function SmartWarnings({ 
  sections, 
  pages, 
  store, 
  onNavigateToSection,
  onFixApplied 
}: SmartWarningsProps) {
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeStore = () => {
    setIsAnalyzing(true);
    const newWarnings: Warning[] = [];

    // Check for empty pages
    pages.forEach(page => {
      if (!page.sections || page.sections.length === 0) {
        newWarnings.push({
          id: `empty-page-${page.slug}`,
          type: "error",
          category: "Structure",
          message: `La page "${page.name}" est vide`,
          details: "Une page sans contenu ne sera pas indexée par les moteurs de recherche",
          fixLabel: "Ajouter une section Hero"
        });
      }
    });

    // Check sections
    sections.forEach((section, index) => {
      // Check for placeholder/lorem ipsum text
      const configStr = JSON.stringify(section.config || {}).toLowerCase();
      if (configStr.includes("lorem ipsum") || configStr.includes("placeholder")) {
        newWarnings.push({
          id: `placeholder-${section.id}`,
          type: "warning",
          category: "Contenu",
          message: `Texte placeholder détecté`,
          details: `Section "${section.type}" contient du texte par défaut`,
          sectionId: section.id,
          fixLabel: "Modifier le texte"
        });
      }

      // Check for missing images
      if (section.config?.backgroundImage === "" || section.config?.image === "") {
        newWarnings.push({
          id: `missing-image-${section.id}`,
          type: "warning",
          category: "Images",
          message: `Image manquante`,
          details: `Section "${section.type}" n'a pas d'image configurée`,
          sectionId: section.id,
          fixLabel: "Ajouter une image"
        });
      }

      // Check for empty CTA buttons
      if (section.config?.ctaText && !section.config?.ctaLink) {
        newWarnings.push({
          id: `empty-cta-${section.id}`,
          type: "error",
          category: "Navigation",
          message: `Bouton CTA sans lien`,
          details: `Le bouton "${section.config.ctaText}" n'a pas de destination`,
          sectionId: section.id,
          fixLabel: "Ajouter un lien"
        });
      }

      // Check for empty titles
      if (section.type === "hero" && (!section.config?.title || section.config.title.trim() === "")) {
        newWarnings.push({
          id: `empty-title-${section.id}`,
          type: "error",
          category: "SEO",
          message: `Titre Hero manquant`,
          details: "Le titre principal est essentiel pour le SEO",
          sectionId: section.id,
          fixLabel: "Ajouter un titre"
        });
      }

      // Check for products section without items
      if (section.type === "products" && (!section.config?.items || section.config.items.length === 0)) {
        newWarnings.push({
          id: `empty-products-${section.id}`,
          type: "warning",
          category: "Contenu",
          message: `Section Produits vide`,
          details: "Aucun produit n'est configuré dans cette section",
          sectionId: section.id,
          fixLabel: "Configurer les produits"
        });
      }

      // Check for testimonials without content
      if (section.type === "testimonials") {
        const testimonials = section.config?.testimonials || [];
        if (testimonials.length === 0) {
          newWarnings.push({
            id: `empty-testimonials-${section.id}`,
            type: "warning",
            category: "Contenu",
            message: `Aucun témoignage`,
            details: "Ajoutez des témoignages pour augmenter la confiance",
            sectionId: section.id,
            fixLabel: "Ajouter des témoignages"
          });
        }
      }

      // Check for FAQ without questions
      if (section.type === "faq") {
        const faqs = section.config?.faqs || [];
        if (faqs.length === 0) {
          newWarnings.push({
            id: `empty-faq-${section.id}`,
            type: "warning",
            category: "Contenu",
            message: `FAQ vide`,
            details: "Ajoutez des questions fréquentes pour améliorer le SEO",
            sectionId: section.id,
            fixLabel: "Ajouter des questions"
          });
        }
      }
    });

    // Check for missing H1 (hero title)
    const hasHero = sections.some(s => s.type === "hero" && s.config?.title);
    if (!hasHero && sections.length > 0) {
      newWarnings.push({
        id: "missing-h1",
        type: "error",
        category: "SEO",
        message: "Pas de titre H1 détecté",
        details: "Ajoutez une section Hero avec un titre pour améliorer le référencement"
      });
    }

    // Check for missing footer
    const hasFooter = sections.some(s => s.type === "footer");
    if (!hasFooter && sections.length > 0) {
      newWarnings.push({
        id: "missing-footer",
        type: "info",
        category: "Structure",
        message: "Pas de footer",
        details: "Un footer améliore la navigation et contient les informations légales"
      });
    }

    // Check store meta
    if (!store?.theme_config?.seo?.metaTitle) {
      newWarnings.push({
        id: "missing-meta-title",
        type: "error",
        category: "SEO",
        message: "Meta titre manquant",
        details: "Le titre de la page est essentiel pour le référencement Google"
      });
    }

    if (!store?.theme_config?.seo?.metaDescription) {
      newWarnings.push({
        id: "missing-meta-desc",
        type: "warning",
        category: "SEO",
        message: "Meta description manquante",
        details: "La description apparaît dans les résultats de recherche Google"
      });
    }

    // Check for large images (simulated)
    const imageCount = sections.filter(s => s.config?.backgroundImage || s.config?.image).length;
    if (imageCount > 5) {
      newWarnings.push({
        id: "many-images",
        type: "info",
        category: "Performance",
        message: `${imageCount} images sur la page`,
        details: "Assurez-vous que les images sont optimisées pour le web"
      });
    }

    setWarnings(newWarnings);
    setIsAnalyzing(false);
  };

  useEffect(() => {
    analyzeStore();
  }, [sections, pages, store]);

  const errorCount = warnings.filter(w => w.type === "error").length;
  const warningCount = warnings.filter(w => w.type === "warning").length;
  const infoCount = warnings.filter(w => w.type === "info").length;

  const getIcon = (type: string) => {
    switch (type) {
      case "error": return <AlertCircle className="w-4 h-4 text-red-500" />;
      case "warning": return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case "info": return <Zap className="w-4 h-4 text-blue-500" />;
      default: return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Images": return <ImageIcon className="w-3 h-3" />;
      case "Contenu": return <Type className="w-3 h-3" />;
      case "Navigation": return <Link2 className="w-3 h-3" />;
      case "SEO": return <Search className="w-3 h-3" />;
      case "Structure": return <FileText className="w-3 h-3" />;
      default: return <Zap className="w-3 h-3" />;
    }
  };

  if (warnings.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <h3 className="font-bold text-lg mb-2">Tout est parfait !</h3>
        <p className="text-sm text-muted-foreground">
          Aucun problème détecté. Votre boutique est prête à être publiée.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">Analyse de la boutique</h3>
          <Button variant="ghost" size="sm" onClick={analyzeStore} disabled={isAnalyzing}>
            {isAnalyzing ? "Analyse..." : "Re-analyser"}
          </Button>
        </div>
        
        <div className="flex gap-4">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <span className="text-xs font-bold text-red-600">{errorCount}</span>
            </div>
            <span className="text-muted-foreground">Erreurs</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <span className="text-xs font-bold text-amber-600">{warningCount}</span>
            </div>
            <span className="text-muted-foreground">Avertissements</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <span className="text-xs font-bold text-blue-600">{infoCount}</span>
            </div>
            <span className="text-muted-foreground">Suggestions</span>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {warnings.map((warning) => (
            <div 
              key={warning.id}
              className={`p-4 rounded-xl border transition-all hover:shadow-md cursor-pointer ${
                warning.type === "error" ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800" :
                warning.type === "warning" ? "bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800" :
                "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800"
              }`}
              onClick={() => warning.sectionId && onNavigateToSection(warning.sectionId)}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getIcon(warning.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      {getCategoryIcon(warning.category)} {warning.category}
                    </span>
                  </div>
                  <h4 className="font-semibold text-sm mb-1">{warning.message}</h4>
                  {warning.details && (
                    <p className="text-xs text-muted-foreground">{warning.details}</p>
                  )}
                  {warning.fixLabel && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-2 h-7 text-xs gap-1 -ml-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (warning.sectionId) {
                          onNavigateToSection(warning.sectionId);
                        }
                        if (warning.fix) {
                          warning.fix();
                          onFixApplied();
                        }
                      }}
                    >
                      {warning.fixLabel}
                      <ChevronRight className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {errorCount > 0 && (
        <div className="p-4 border-t border-border bg-red-50 dark:bg-red-900/10">
          <p className="text-xs text-red-600 dark:text-red-400 text-center">
            ⚠️ Corrigez les erreurs avant de publier votre boutique
          </p>
        </div>
      )}
    </div>
  );
}
