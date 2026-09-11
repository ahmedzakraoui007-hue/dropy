"use client";

import { useState } from "react";
import { 
  X, 
  Search, 
  Layout, 
  Check, 
  Eye, 
  Plus, 
  ArrowRight,
  ShoppingBag,
  Cpu,
  Sparkles,
  Utensils,
  Briefcase,
  Wand2,
  Palette,
  Type,
  Image as ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { BUILDER_TEMPLATES, BuilderTemplate } from "@/lib/builder-templates";
import { toast } from "sonner";

interface TemplateMarketplaceProps {
  onClose: () => void;
  onSelectTemplate: (template: BuilderTemplate) => void;
}

const CATEGORIES = [
  { id: "all", name: "Tous", icon: Layout },
  { id: "Fashion", name: "Mode", icon: ShoppingBag },
  { id: "Tech", name: "Tech", icon: Cpu },
  { id: "Beauty", name: "Beauté", icon: Sparkles },
  { id: "Food", name: "Gastronomie", icon: Utensils },
  { id: "Business", name: "Business", icon: Briefcase },
];

export default function TemplateMarketplace({ onClose, onSelectTemplate }: TemplateMarketplaceProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);
  const [wizardStep, setWizardStep] = useState<"library" | "wizard">("library");
  const [selectedTemplate, setSelectedTemplate] = useState<BuilderTemplate | null>(null);

  const filteredTemplates = BUILDER_TEMPLATES.filter(template => {
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          template.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSelectTemplate = (template: BuilderTemplate) => {
    setSelectedTemplate(template);
    setWizardStep("wizard");
  };

  const finalizeTemplate = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate);
      toast.success("Template appliqué avec succès !");
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
    >
      <Card className="w-full max-w-6xl h-[85vh] shadow-2xl border-border/50 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-border flex items-center justify-between bg-muted/30">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              {wizardStep === "library" ? (
                <>
                  <Layout className="w-6 h-6 text-primary" />
                  Bibliothèque de Templates
                </>
              ) : (
                <>
                  <Wand2 className="w-6 h-6 text-primary" />
                  Configuration Rapide : {selectedTemplate?.name}
                </>
              )}
            </h2>
            <p className="text-muted-foreground">
              {wizardStep === "library" 
                ? "Choisissez un point de départ professionnel pour votre boutique."
                : "Personnalisez les éléments clés avant de commencer."
              }
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <AnimatePresence mode="wait">
            {wizardStep === "library" ? (
              <motion.div 
                key="library"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex flex-1 overflow-hidden"
              >
                {/* Sidebar Filters */}
                <div className="w-64 border-r border-border p-4 bg-muted/10 hidden md:block">
                  <div className="space-y-1">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4 px-2">Catégories</h3>
                    {CATEGORIES.map((cat) => (
                      <Button
                        key={cat.id}
                        variant={selectedCategory === cat.id ? "secondary" : "ghost"}
                        className="w-full justify-start gap-3 h-10 rounded-lg px-3"
                        onClick={() => setSelectedCategory(cat.id)}
                      >
                        <cat.icon className={`w-4 h-4 ${selectedCategory === cat.id ? "text-primary" : "text-muted-foreground"}`} />
                        <span className="text-sm font-medium">{cat.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 flex flex-col min-w-0">
                  {/* Search Bar */}
                  <div className="p-4 border-b border-border bg-background/50">
                    <div className="relative max-w-md">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input 
                        placeholder="Rechercher un template (ex: Fashion, Tech...)" 
                        className="pl-10 h-10 bg-background"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Templates Grid */}
                  <ScrollArea className="flex-1 p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
                      {filteredTemplates.map((template) => (
                        <motion.div
                          key={template.id}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          onMouseEnter={() => setHoveredTemplate(template.id)}
                          onMouseLeave={() => setHoveredTemplate(null)}
                        >
                          <Card className="group cursor-pointer overflow-hidden border-border/50 hover:border-primary/50 transition-all hover:shadow-xl relative h-full flex flex-col bg-card">
                            <div className="aspect-[16/10] relative overflow-hidden bg-muted">
                              <img 
                                src={template.thumbnail} 
                                alt={template.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              />
                              <div className={`absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3 transition-opacity duration-300 ${
                                hoveredTemplate === template.id ? "opacity-100" : "opacity-0"
                              }`}>
                                <Button 
                                  variant="default" 
                                  className="bg-primary hover:bg-primary/90 rounded-full px-6"
                                  onClick={() => handleSelectTemplate(template)}
                                >
                                  Utiliser ce Template
                                </Button>
                                <Button variant="outline" className="text-white border-white hover:bg-white/20 rounded-full px-6">
                                  <Eye className="w-4 h-4 mr-2" />
                                  Aperçu
                                </Button>
                              </div>
                              <Badge className="absolute top-3 left-3 bg-background/80 backdrop-blur-md text-foreground border-border/50 font-bold text-[10px] uppercase tracking-wider">
                                {template.category}
                              </Badge>
                            </div>
                            <CardContent className="p-4 flex-1 flex flex-col">
                              <h3 className="font-bold text-lg mb-1">{template.name}</h3>
                              <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                                {template.description}
                              </p>
                              <div className="mt-auto flex items-center justify-between pt-4 border-t border-border/50">
                                <div className="flex items-center gap-1.5">
                                  <Layout className="w-3.5 h-3.5 text-primary" />
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                    {template.sections.length} sections
                                  </span>
                                </div>
                                <div className="flex -space-x-1.5">
                                  {[1, 2, 3].map(i => (
                                    <div key={i} className="w-5 h-5 rounded-full border-2 border-background bg-muted flex items-center justify-center">
                                      <div className={`w-full h-full rounded-full ${
                                        i === 1 ? "bg-primary/40" : i === 2 ? "bg-secondary/40" : "bg-accent/40"
                                      }`} />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>

                    {filteredTemplates.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                          <Search className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-xl font-bold">Aucun template trouvé</h3>
                        <p className="text-muted-foreground">Essayez d&apos;autres mots-clés ou changez de catégorie.</p>
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="wizard"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-1"
              >
                <div className="w-1/2 p-8 border-r border-border bg-muted/5">
                  <div className="max-w-md mx-auto space-y-8">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                        <Palette className="w-4 h-4" />
                        Étape 1 : Identité Visuelle
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Nom de la Boutique</Label>
                          <Input placeholder="Ma Super Boutique" defaultValue={selectedTemplate?.name} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Logo</Label>
                          <Button variant="outline" className="w-full h-10 gap-2 text-xs">
                            <ImageIcon className="w-4 h-4" /> Upload Logo
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                        <Type className="w-4 h-4" />
                        Étape 2 : Typographie & Couleurs
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {["Elegance", "Modern", "Classic"].map(style => (
                          <Button key={style} variant="outline" className="flex flex-col h-20 gap-1 p-2">
                            <span className="text-xs font-bold">{style}</span>
                            <div className="flex gap-1">
                              <div className="w-3 h-3 rounded-full bg-primary" />
                              <div className="w-3 h-3 rounded-full bg-secondary" />
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4 pt-4">
                      <Button className="w-full bg-gradient-to-r from-violet-500 to-purple-600 h-12 rounded-xl text-lg font-bold" onClick={finalizeTemplate}>
                        Finaliser mon Site
                        <Check className="ml-2 w-5 h-5" />
                      </Button>
                      <Button variant="ghost" className="w-full" onClick={() => setWizardStep("library")}>
                        Retour à la bibliothèque
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="w-1/2 bg-muted/20 relative p-8">
                  <div className="absolute inset-0 flex flex-col p-8 overflow-hidden">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Aperçu en direct</div>
                    <div className="flex-1 bg-white rounded-xl shadow-2xl border border-border/50 overflow-hidden flex flex-col">
                      <div className="h-6 bg-muted border-b border-border flex items-center gap-1.5 px-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                        <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {selectedTemplate?.sections.map((s, i) => (
                          <div key={i} className="bg-muted/30 rounded-lg p-8 text-center border border-dashed border-border/50">
                            <span className="text-[10px] font-bold uppercase text-muted-foreground">{s.type}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="p-4 bg-muted/30 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <p className="text-xs text-muted-foreground">
              Tous nos templates sont optimisés pour le SEO et le mobile par défaut.
            </p>
          </div>
          <div className="flex gap-3">
            {wizardStep === "library" && <Button variant="outline" onClick={onClose}>Annuler</Button>}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function Label({ className, children }: { className?: string, children: React.ReactNode }) {
  return <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}>{children}</label>;
}
