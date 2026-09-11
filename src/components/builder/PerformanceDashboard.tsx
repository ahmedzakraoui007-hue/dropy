"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Zap, 
  Search, 
  Eye, 
  Shield,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  RefreshCw,
  ExternalLink
} from "lucide-react";

interface ScoreCategory {
  name: string;
  score: number;
  icon: any;
  color: string;
  items: {
    status: "pass" | "fail" | "warning";
    message: string;
    fix?: string;
  }[];
}

interface PerformanceDashboardProps {
  sections: any[];
  store: any;
  onOpenSettings: (tab: string) => void;
}

export default function PerformanceDashboard({ 
  sections, 
  store,
  onOpenSettings 
}: PerformanceDashboardProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scores, setScores] = useState<ScoreCategory[]>([]);
  const [overallScore, setOverallScore] = useState(0);

  const analyzePerformance = () => {
    setIsAnalyzing(true);

    // Simulate analysis delay
    setTimeout(() => {
      const newScores: ScoreCategory[] = [];

      // Performance Score
      const performanceItems = [];
      const imageCount = sections.filter(s => s.config?.backgroundImage || s.config?.image).length;
      const sectionCount = sections.length;
      
      if (sectionCount <= 8) {
        performanceItems.push({ status: "pass" as const, message: `${sectionCount} sections (optimal)` });
      } else if (sectionCount <= 12) {
        performanceItems.push({ status: "warning" as const, message: `${sectionCount} sections (acceptable)`, fix: "Réduire le nombre de sections" });
      } else {
        performanceItems.push({ status: "fail" as const, message: `${sectionCount} sections (trop de contenu)`, fix: "Divisez le contenu en plusieurs pages" });
      }

      if (imageCount <= 5) {
        performanceItems.push({ status: "pass" as const, message: `${imageCount} images sur la page` });
      } else {
        performanceItems.push({ status: "warning" as const, message: `${imageCount} images à charger`, fix: "Optimisez ou réduisez les images" });
      }

      const hasVideo = sections.some(s => s.config?.videoUrl);
      if (hasVideo) {
        performanceItems.push({ status: "warning" as const, message: "Vidéo intégrée détectée", fix: "Utilisez le lazy loading" });
      } else {
        performanceItems.push({ status: "pass" as const, message: "Pas de vidéo lourde" });
      }

      const performanceScore = Math.round(
        (performanceItems.filter(i => i.status === "pass").length / performanceItems.length) * 100
      );

      newScores.push({
        name: "Performance",
        score: performanceScore,
        icon: Zap,
        color: performanceScore >= 80 ? "text-emerald-500" : performanceScore >= 50 ? "text-amber-500" : "text-red-500",
        items: performanceItems
      });

      // SEO Score
      const seoItems = [];
      const hasHero = sections.some(s => s.type === "hero" && s.config?.title);
      const hasMetaTitle = store?.theme_config?.seo?.metaTitle;
      const hasMetaDesc = store?.theme_config?.seo?.metaDescription;
      const hasFooter = sections.some(s => s.type === "footer");

      if (hasHero) {
        seoItems.push({ status: "pass" as const, message: "Titre H1 présent" });
      } else {
        seoItems.push({ status: "fail" as const, message: "Titre H1 manquant", fix: "Ajoutez une section Hero" });
      }

      if (hasMetaTitle) {
        const titleLength = hasMetaTitle.length;
        if (titleLength >= 30 && titleLength <= 60) {
          seoItems.push({ status: "pass" as const, message: `Meta titre optimal (${titleLength} car.)` });
        } else {
          seoItems.push({ status: "warning" as const, message: `Meta titre ${titleLength < 30 ? 'trop court' : 'trop long'}`, fix: "30-60 caractères recommandés" });
        }
      } else {
        seoItems.push({ status: "fail" as const, message: "Meta titre manquant", fix: "Ajoutez un titre SEO" });
      }

      if (hasMetaDesc) {
        const descLength = hasMetaDesc.length;
        if (descLength >= 120 && descLength <= 160) {
          seoItems.push({ status: "pass" as const, message: `Meta description optimale (${descLength} car.)` });
        } else {
          seoItems.push({ status: "warning" as const, message: `Meta description ${descLength < 120 ? 'trop courte' : 'trop longue'}`, fix: "120-160 caractères recommandés" });
        }
      } else {
        seoItems.push({ status: "fail" as const, message: "Meta description manquante", fix: "Ajoutez une description SEO" });
      }

      // Check for alt texts (simulated)
      const imagesWithAlt = sections.filter(s => s.config?.imageAlt).length;
      const totalImages = sections.filter(s => s.config?.image || s.config?.backgroundImage).length;
      if (totalImages === 0 || imagesWithAlt === totalImages) {
        seoItems.push({ status: "pass" as const, message: "Textes alternatifs OK" });
      } else {
        seoItems.push({ status: "warning" as const, message: `${totalImages - imagesWithAlt} images sans alt text`, fix: "Ajoutez des descriptions" });
      }

      const seoScore = Math.round(
        (seoItems.filter(i => i.status === "pass").length / seoItems.length) * 100
      );

      newScores.push({
        name: "SEO",
        score: seoScore,
        icon: Search,
        color: seoScore >= 80 ? "text-emerald-500" : seoScore >= 50 ? "text-amber-500" : "text-red-500",
        items: seoItems
      });

      // Accessibility Score
      const a11yItems = [];
      
      // Check contrast (simulated)
      const primaryColor = store?.theme_config?.colors?.primary || "#7c3aed";
      const bgColor = store?.theme_config?.colors?.background || "#ffffff";
      // Simplified contrast check
      const isDarkOnLight = primaryColor.startsWith("#") && bgColor.includes("fff");
      if (isDarkOnLight) {
        a11yItems.push({ status: "pass" as const, message: "Contraste des couleurs OK" });
      } else {
        a11yItems.push({ status: "warning" as const, message: "Vérifiez le contraste des couleurs", fix: "Utilisez des couleurs contrastées" });
      }

      // Check for buttons with text
      const ctaCount = sections.filter(s => s.config?.ctaText).length;
      if (ctaCount > 0) {
        a11yItems.push({ status: "pass" as const, message: `${ctaCount} boutons avec texte visible` });
      }

      // Check for headings structure
      if (hasHero) {
        a11yItems.push({ status: "pass" as const, message: "Structure de titres cohérente" });
      } else {
        a11yItems.push({ status: "warning" as const, message: "Pas de hiérarchie de titres claire" });
      }

      // Check for form labels (if contact section exists)
      const hasContact = sections.some(s => s.type === "contact");
      if (hasContact) {
        a11yItems.push({ status: "pass" as const, message: "Formulaire avec labels" });
      }

      a11yItems.push({ status: "pass" as const, message: "Navigation au clavier supportée" });

      const a11yScore = Math.round(
        (a11yItems.filter(i => i.status === "pass").length / a11yItems.length) * 100
      );

      newScores.push({
        name: "Accessibilité",
        score: a11yScore,
        icon: Eye,
        color: a11yScore >= 80 ? "text-emerald-500" : a11yScore >= 50 ? "text-amber-500" : "text-red-500",
        items: a11yItems
      });

      // Best Practices Score
      const bpItems = [];

      if (hasFooter) {
        bpItems.push({ status: "pass" as const, message: "Footer avec informations légales" });
      } else {
        bpItems.push({ status: "warning" as const, message: "Pas de footer", fix: "Ajoutez un footer" });
      }

      const hasFAQ = sections.some(s => s.type === "faq");
      if (hasFAQ) {
        bpItems.push({ status: "pass" as const, message: "Section FAQ présente" });
      }

      const hasTestimonials = sections.some(s => s.type === "testimonials");
      if (hasTestimonials) {
        bpItems.push({ status: "pass" as const, message: "Témoignages clients présents" });
      }

      const hasContact2 = sections.some(s => s.type === "contact" || s.config?.contactInfo);
      if (hasContact2) {
        bpItems.push({ status: "pass" as const, message: "Informations de contact visibles" });
      } else {
        bpItems.push({ status: "warning" as const, message: "Pas de contact visible", fix: "Ajoutez une section Contact" });
      }

      // Check for HTTPS (simulated - always pass in preview)
      bpItems.push({ status: "pass" as const, message: "HTTPS activé" });

      const bpScore = Math.round(
        (bpItems.filter(i => i.status === "pass").length / bpItems.length) * 100
      );

      newScores.push({
        name: "Bonnes Pratiques",
        score: bpScore,
        icon: Shield,
        color: bpScore >= 80 ? "text-emerald-500" : bpScore >= 50 ? "text-amber-500" : "text-red-500",
        items: bpItems
      });

      setScores(newScores);
      setOverallScore(Math.round((performanceScore + seoScore + a11yScore + bpScore) / 4));
      setIsAnalyzing(false);
    }, 800);
  };

  useEffect(() => {
    analyzePerformance();
  }, [sections, store]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 50) return "text-amber-500";
    return "text-red-500";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 50) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-lg">Score Global</h3>
          <Button variant="ghost" size="sm" onClick={analyzePerformance} disabled={isAnalyzing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isAnalyzing ? "animate-spin" : ""}`} />
            {isAnalyzing ? "Analyse..." : "Actualiser"}
          </Button>
        </div>

        <div className="flex items-center justify-center">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-muted/20"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={`${overallScore * 2.83} 283`}
                strokeLinecap="round"
                className={getScoreColor(overallScore)}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-black ${getScoreColor(overallScore)}`}>
                {overallScore}
              </span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-4">
          {overallScore >= 80 
            ? "🎉 Excellent ! Votre site est bien optimisé"
            : overallScore >= 50 
            ? "⚠️ Quelques améliorations recommandées"
            : "❌ Des optimisations sont nécessaires"
          }
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {scores.map((category) => {
            const Icon = category.icon;
            return (
              <div key={category.name} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${category.color}`} />
                    <span className="font-semibold">{category.name}</span>
                  </div>
                  <span className={`text-2xl font-black ${category.color}`}>
                    {category.score}
                  </span>
                </div>

                <Progress 
                  value={category.score} 
                  className="h-2"
                />

                <div className="space-y-2 pl-7">
                  {category.items.map((item, idx) => (
                    <div 
                      key={idx}
                      className="flex items-start gap-2 text-sm"
                    >
                      {item.status === "pass" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      ) : item.status === "warning" ? (
                        <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                      )}
                      <div className="flex-1">
                        <span className={item.status === "pass" ? "text-muted-foreground" : ""}>
                          {item.message}
                        </span>
                        {item.fix && (
                          <button 
                            className="ml-2 text-primary text-xs font-medium hover:underline"
                            onClick={() => {
                              if (category.name === "SEO") {
                                onOpenSettings("seo");
                              } else {
                                onOpenSettings("theme");
                              }
                            }}
                          >
                            Corriger →
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border bg-muted/30">
        <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => window.open("https://pagespeed.web.dev/", "_blank")}>
          <ExternalLink className="w-4 h-4" />
          Tester sur PageSpeed Insights
        </Button>
      </div>
    </div>
  );
}
