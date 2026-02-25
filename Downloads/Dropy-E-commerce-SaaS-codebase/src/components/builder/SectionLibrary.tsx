"use client";

import { useState } from "react";
import { 
  Plus, 
  Search, 
  X, 
  ChevronRight, 
  Star, 
  Layout, 
  ShoppingBag, 
  MessageSquare, 
  HelpCircle, 
  Mail, 
  Clock, 
  Type, 
  Info, 
  LayoutGrid, 
  Video,
  Monitor,
  Smartphone,
  Eye,
  CheckCircle2,
  Sparkles,
  Heart,
  Zap,
  Tag,
  Rocket,
  Shield,
  Award,
  TrendingUp,
  Package,
  ShoppingCart,
  Image as ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SECTION_LIBRARY } from "@/lib/builder-sections";
import { 
  ALL_CONVERSION_TEMPLATES, 
  getTemplatesByCategory, 
  getTemplateById,
  getTotalTemplateCount,
  TemplateVariant 
} from "@/lib/conversion-templates";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface SectionLibraryProps {
  onAdd: (type: string, config?: any) => void;
  onClose: () => void;
}

const CATEGORIES = [
  { id: "all", name: "Toutes les Sections", icon: LayoutGrid },
  { id: "Marketing & Conversion", name: "Marketing & Conversion", icon: Zap },
  { id: "E-commerce", name: "E-commerce", icon: ShoppingBag },
  { id: "Contenu & Infos", name: "Contenu & Infos", icon: Type },
  { id: "Social Proof", name: "Social Proof", icon: MessageSquare },
  { id: "Support & Légal", name: "Support & Légal", icon: Shield },
  { id: "Layout", name: "Mise en Page", icon: Layout },
  { id: "Navigation", name: "Navigation", icon: LayoutGrid },
];

const CONVERSION_CATEGORIES = [
  { id: "hero", name: "Hero Sections", icon: ImageIcon, count: 10, color: "from-violet-500 to-purple-600" },
  { id: "products", name: "Grilles Produits", icon: ShoppingBag, count: 8, color: "from-blue-500 to-cyan-600" },
  { id: "social_proof", name: "Social Proof", icon: Star, count: 6, color: "from-amber-500 to-orange-600" },
  { id: "newsletter", name: "Newsletter & CTA", icon: Mail, count: 5, color: "from-emerald-500 to-teal-600" },
  { id: "footer", name: "Footer", icon: Layout, count: 4, color: "from-slate-500 to-gray-600" },
  { id: "contact", name: "Contact & About", icon: Info, count: 4, color: "from-pink-500 to-rose-600" },
  { id: "cart", name: "Panier & Checkout", icon: ShoppingCart, count: 4, color: "from-indigo-500 to-blue-600" },
  { id: "product_page", name: "Page Produit", icon: Package, count: 5, color: "from-red-500 to-pink-600" },
];

export default function SectionLibrary({ onAdd, onClose }: SectionLibraryProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [previewSection, setPreviewSection] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"basic" | "conversion">("conversion");
  const [selectedConversionCategory, setSelectedConversionCategory] = useState<string | null>(null);

  const filteredSections = SECTION_LIBRARY.filter(section => {
    const matchesCategory = selectedCategory === "all" || section.category === selectedCategory;
    const matchesSearch = section.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          section.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredConversionTemplates = selectedConversionCategory 
    ? getTemplatesByCategory(selectedConversionCategory)
    : ALL_CONVERSION_TEMPLATES.flatMap(cat => cat.templates);

  const searchedConversionTemplates = searchQuery 
    ? filteredConversionTemplates.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredConversionTemplates;

  const sectionsByCategory = CATEGORIES.slice(1).map(cat => ({
    ...cat,
    items: SECTION_LIBRARY.filter(s => s.category === cat.id)
  }));

  const handleAddTemplate = (template: TemplateVariant) => {
    const sectionType = template.id.split('_')[0];
    onAdd(sectionType, template.config);
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden relative">
      {/* Header */}
      <div className="p-6 border-b border-border bg-card/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-200">
            <LayoutGrid className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-xl tracking-tight">Bibliothèque de Sections</h3>
            <p className="text-sm text-muted-foreground">
              {getTotalTemplateCount()} templates haute conversion disponibles
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-64 hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher une section..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 bg-muted/50 border-none rounded-full focus-visible:ring-violet-500"
            />
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 pt-4 border-b border-border bg-card/30">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "basic" | "conversion")}>
          <TabsList className="bg-muted/50 p-1 rounded-xl">
            <TabsTrigger 
              value="conversion" 
              className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-purple-600 data-[state=active]:text-white font-semibold gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              Templates Conversion
              <Badge className="bg-amber-400 text-amber-950 text-[10px] font-bold ml-1">PRO</Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="basic" 
              className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow font-semibold gap-2"
            >
              <LayoutGrid className="w-4 h-4" />
              Sections Basiques
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Filters */}
        <div className="w-72 border-r border-border p-4 space-y-2 bg-muted/5 hidden md:block shrink-0 overflow-y-auto">
          {activeTab === "conversion" ? (
            <>
              <Button
                variant={selectedConversionCategory === null ? "secondary" : "ghost"}
                className={`w-full justify-start gap-3 h-12 px-4 rounded-xl transition-all ${
                  selectedConversionCategory === null 
                    ? "bg-violet-600/10 text-violet-600 hover:bg-violet-600/20" 
                    : "text-muted-foreground hover:bg-muted"
                }`}
                onClick={() => setSelectedConversionCategory(null)}
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="font-semibold text-sm">Tous les Templates</span>
                <Badge className="ml-auto bg-violet-100 text-violet-700 text-xs">
                  {getTotalTemplateCount()}
                </Badge>
              </Button>
              
              <div className="pt-2 pb-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-4 mb-3">
                  Catégories
                </p>
              </div>
              
              {CONVERSION_CATEGORIES.map((cat) => (
                <Button
                  key={cat.id}
                  variant={selectedConversionCategory === cat.id ? "secondary" : "ghost"}
                  className={`w-full justify-start gap-3 h-11 px-4 rounded-xl transition-all ${
                    selectedConversionCategory === cat.id 
                      ? "bg-violet-600/10 text-violet-600 hover:bg-violet-600/20" 
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                  onClick={() => setSelectedConversionCategory(cat.id)}
                >
                  <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${cat.color} flex items-center justify-center`}>
                    <cat.icon className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="font-medium text-sm flex-1 text-left">{cat.name}</span>
                  <span className="text-xs text-muted-foreground">{cat.count}</span>
                </Button>
              ))}
            </>
          ) : (
            <>
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? "secondary" : "ghost"}
                  className={`w-full justify-start gap-3 h-12 px-4 rounded-xl transition-all ${
                    selectedCategory === cat.id ? "bg-violet-600/10 text-violet-600 hover:bg-violet-600/20" : "text-muted-foreground hover:bg-muted"
                  }`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <cat.icon className={`w-4 h-4 ${selectedCategory === cat.id ? "text-violet-600" : "text-muted-foreground"}`} />
                  <span className="font-semibold text-sm">{cat.name}</span>
                </Button>
              ))}
            </>
          )}
          
          <div className="pt-8 px-2">
            <div className="bg-gradient-to-br from-violet-600 to-purple-700 p-5 rounded-3xl text-white shadow-xl shadow-violet-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-20">
                <Sparkles className="w-12 h-12" />
              </div>
              <p className="text-xs font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                <Sparkles className="w-3 h-3" /> DROPY AI PRO
              </p>
              <p className="text-[11px] leading-relaxed mb-4 opacity-90">
                Utilisez l&apos;assistant AI pour générer des sections personnalisées et uniques.
              </p>
              <Button size="sm" className="w-full bg-white text-violet-700 hover:bg-white/90 rounded-xl font-bold">
                Générer avec l&apos;IA
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <ScrollArea className="flex-1 h-full bg-muted/5">
          <div className="p-8 lg:p-12">
            {activeTab === "conversion" ? (
              <div className="space-y-12">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border/50 pb-8">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-violet-200">
                      <TrendingUp className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="text-3xl font-black tracking-tight">
                        {selectedConversionCategory 
                          ? CONVERSION_CATEGORIES.find(c => c.id === selectedConversionCategory)?.name 
                          : "Templates Haute Conversion"}
                      </h4>
                      <p className="text-muted-foreground font-medium">
                        Optimisés pour le e-commerce tunisien • Triggers psychologiques intégrés
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-gradient-to-r from-violet-600 to-purple-600 text-white border-none font-black px-4 py-1.5 rounded-full shadow-lg shadow-violet-200">
                    {searchedConversionTemplates.length} TEMPLATES
                  </Badge>
                </div>

                {/* Conversion Tips Banner */}
                {!selectedConversionCategory && !searchQuery && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    {[
                      { icon: Zap, label: "Urgency", tip: "Countdowns & stocks limités" },
                      { icon: Star, label: "Social Proof", tip: "Avis & témoignages" },
                      { icon: Shield, label: "Trust", tip: "Badges de confiance" },
                      { icon: Heart, label: "FOMO", tip: "Fear of missing out" },
                    ].map((item, i) => (
                      <div key={i} className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100 rounded-2xl p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center">
                          <item.icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-violet-900">{item.label}</p>
                          <p className="text-xs text-violet-600">{item.tip}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Category Grid or Template List */}
                {!selectedConversionCategory && !searchQuery ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {CONVERSION_CATEGORIES.map((cat) => (
                      <motion.div
                        key={cat.id}
                        whileHover={{ y: -5, scale: 1.02 }}
                        className="cursor-pointer"
                        onClick={() => setSelectedConversionCategory(cat.id)}
                      >
                        <Card className="overflow-hidden border-border/50 hover:border-violet-300 hover:shadow-xl hover:shadow-violet-100 transition-all">
                          <div className={`h-32 bg-gradient-to-br ${cat.color} flex items-center justify-center relative`}>
                            <cat.icon className="w-12 h-12 text-white/90" />
                            <Badge className="absolute top-3 right-3 bg-white/20 backdrop-blur text-white border-none text-xs font-bold">
                              {cat.count} variants
                            </Badge>
                          </div>
                          <CardContent className="p-4">
                            <h5 className="font-bold text-sm mb-1">{cat.name}</h5>
                            <p className="text-xs text-muted-foreground">
                              {cat.count} templates optimisés
                            </p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                    {searchedConversionTemplates.map((template) => (
                      <ConversionTemplateCard 
                        key={template.id} 
                        template={template} 
                        onAdd={() => handleAddTemplate(template)}
                        onPreview={() => setPreviewSection(template)}
                        isHovered={hoveredSection === template.id}
                        setHovered={setHoveredSection}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Basic Sections Tab
              selectedCategory === "all" && !searchQuery ? (
                <div className="space-y-24">
                  {sectionsByCategory.map((category) => category.items.length > 0 && (
                    <div key={category.id} className="space-y-10">
                      <div className="flex items-center justify-between border-b border-border/50 pb-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-violet-600/10 flex items-center justify-center">
                            <category.icon className="w-6 h-6 text-violet-600" />
                          </div>
                          <div>
                            <h4 className="text-2xl font-black tracking-tight">{category.name}</h4>
                            <p className="text-sm text-muted-foreground">{category.items.length} styles disponibles</p>
                          </div>
                        </div>
                        <Button variant="ghost" className="text-violet-600 font-bold hover:bg-violet-50 rounded-xl" onClick={() => setSelectedCategory(category.id)}>
                          Voir tout <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-10">
                        {category.items.slice(0, 4).map((section) => (
                          <SectionCard 
                            key={section.id} 
                            section={section} 
                            onAdd={(id) => onAdd(id)} 
                            setHovered={setHoveredSection} 
                            isHovered={hoveredSection === section.id} 
                            setPreview={setPreviewSection} 
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-12">
                  <div className="flex items-center justify-between border-b border-border/50 pb-8">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-violet-600 flex items-center justify-center text-white shadow-xl shadow-violet-200">
                        {CATEGORIES.find(c => c.id === selectedCategory)?.icon ? 
                          (() => {
                            const Icon = CATEGORIES.find(c => c.id === selectedCategory)!.icon;
                            return <Icon className="w-7 h-7" />;
                          })() : <LayoutGrid className="w-7 h-7" />
                        }
                      </div>
                      <div>
                        <h4 className="text-3xl font-black tracking-tight">
                          {searchQuery ? `Résultats pour "${searchQuery}"` : CATEGORIES.find(c => c.id === selectedCategory)?.name}
                        </h4>
                        <p className="text-muted-foreground font-medium">
                          Découvrez nos meilleures variations pour votre boutique
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-violet-600 text-white border-none font-black px-4 py-1.5 rounded-full shadow-lg shadow-violet-100">
                      {filteredSections.length} OPTIONS
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-10">
                    {filteredSections.map((section) => (
                      <SectionCard 
                        key={section.id} 
                        section={section} 
                        onAdd={(id) => onAdd(id)} 
                        setHovered={setHoveredSection} 
                        isHovered={hoveredSection === section.id} 
                        setPreview={setPreviewSection} 
                      />
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewSection && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setPreviewSection(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-background w-full max-w-5xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col h-[85vh] border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8 border-b border-border flex items-center justify-between bg-card/50">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-200">
                    {previewSection.icon ? (
                      <previewSection.icon className="w-7 h-7 text-white" />
                    ) : (
                      <ImageIcon className="w-7 h-7 text-white" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-black text-2xl tracking-tight">{previewSection.name}</h3>
                      {previewSection.conversionTips && (
                        <Badge className="bg-emerald-100 text-emerald-700 border-none text-[10px] uppercase font-black">
                          <TrendingUp className="w-3 h-3 mr-1" /> Optimisé
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{previewSection.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex bg-muted p-1.5 rounded-full">
                    <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full"><Monitor className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full"><Smartphone className="w-4 h-4" /></Button>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setPreviewSection(null)} className="rounded-full bg-muted w-10 h-10">
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
              
              <div className="flex-1 bg-muted/20 overflow-y-auto p-12">
                <div className="max-w-4xl mx-auto bg-card rounded-[2rem] shadow-2xl overflow-hidden border border-border/50">
                  <div className="aspect-video relative overflow-hidden group">
                    {previewSection.thumbnail ? (
                      <img 
                        src={previewSection.thumbnail} 
                        alt={previewSection.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-violet-50 to-white flex flex-col items-center justify-center p-16 text-center space-y-8 relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10 pointer-events-none">
                          <div className="absolute top-0 left-0 w-64 h-64 bg-violet-500 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />
                          <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2" />
                        </div>
                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-600 to-purple-600 text-white flex items-center justify-center shadow-2xl transform -rotate-6">
                          <ImageIcon className="w-12 h-12" />
                        </div>
                        <div className="space-y-3 relative z-10">
                          <h2 className="text-4xl font-black tracking-tighter text-slate-900">{previewSection.name}</h2>
                          <p className="text-lg text-slate-600 max-w-lg mx-auto leading-relaxed">{previewSection.description}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Conversion Tips */}
                {previewSection.conversionTips && (
                  <div className="mt-8 max-w-4xl mx-auto">
                    <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      Conseils Conversion
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {previewSection.conversionTips.map((tip: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 bg-emerald-50 rounded-xl p-3">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                          <p className="text-sm text-emerald-800">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-8 border-t border-border bg-card flex items-center justify-between">
                <div className="flex items-center gap-6 text-xs text-muted-foreground font-bold uppercase tracking-widest">
                  <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Responsive</span>
                  <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> SEO Pro</span>
                  <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> 100% Edit</span>
                </div>
                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setPreviewSection(null)} className="rounded-2xl px-8 h-12 font-bold">Annuler</Button>
                  <Button 
                    onClick={() => { 
                      if (previewSection.config) {
                        handleAddTemplate(previewSection);
                      } else {
                        onAdd(previewSection.id);
                      }
                      setPreviewSection(null); 
                    }} 
                    className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 px-10 h-12 rounded-2xl font-black shadow-xl shadow-violet-200 transform transition-transform hover:scale-105 active:scale-95"
                  >
                    AJOUTER LA SECTION
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ConversionTemplateCard({ 
  template, 
  onAdd, 
  onPreview,
  isHovered,
  setHovered 
}: { 
  template: TemplateVariant;
  onAdd: () => void;
  onPreview: () => void;
  isHovered: boolean;
  setHovered: (id: string | null) => void;
}) {
  return (
    <motion.div
      layout
      onMouseEnter={() => setHovered(template.id)}
      onMouseLeave={() => setHovered(null)}
      className="relative h-full"
    >
      <Card className={`group cursor-pointer overflow-hidden border-border/50 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(124,58,237,0.15)] hover:border-violet-500/50 flex flex-col h-full bg-card rounded-[1.5rem] ${isHovered ? "-translate-y-2" : ""}`}>
        <div className="aspect-[16/10] relative overflow-hidden bg-muted/20">
          {template.thumbnail ? (
            <img 
              src={template.thumbnail} 
              alt={template.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-violet-100 to-purple-100">
              <ImageIcon className="w-16 h-16 text-violet-300" />
            </div>
          )}
          
          <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col items-center justify-end p-6 gap-3 transition-opacity duration-500 ${isHovered ? "opacity-100" : "opacity-0"}`}>
            <div className="flex gap-3">
              <Button 
                size="sm" 
                className="bg-white text-violet-700 hover:bg-white/90 rounded-xl px-6 font-bold h-10 shadow-xl"
                onClick={(e) => { e.stopPropagation(); onAdd(); }}
              >
                <Plus className="w-4 h-4 mr-1" />
                AJOUTER
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-white border-white/40 hover:bg-white/20 rounded-xl px-6 font-bold h-10 backdrop-blur-sm"
                onClick={(e) => { e.stopPropagation(); onPreview(); }}
              >
                <Eye className="w-4 h-4 mr-1" />
                APERÇU
              </Button>
            </div>
          </div>
        
          {template.conversionTips && (
            <Badge className="absolute top-3 right-3 bg-emerald-500 text-white border-none text-[9px] font-bold uppercase px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg">
              <TrendingUp className="w-3 h-3" /> Optimisé
            </Badge>
          )}
        </div>
        
        <CardContent className="p-5 flex-1 flex flex-col bg-card">
          <h4 className="font-bold text-sm mb-2 group-hover:text-violet-600 transition-colors tracking-tight">
            {template.name}
          </h4>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed flex-1">
            {template.description}
          </p>
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/50">
            <Badge variant="outline" className="text-[10px] font-medium rounded-md">
              Mobile-First
            </Badge>
            <Badge variant="outline" className="text-[10px] font-medium rounded-md">
              A/B Testé
            </Badge>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function SectionCard({ section, onAdd, setHovered, isHovered, setPreview }: { 
  section: any, 
  onAdd: (id: string) => void, 
  setHovered: (id: string | null) => void, 
  isHovered: boolean,
  setPreview: (section: any) => void
}) {
  return (
    <motion.div
      layout
      onMouseEnter={() => setHovered(section.id)}
      onMouseLeave={() => setHovered(null)}
      className="relative h-full"
    >
      <Card className={`group cursor-pointer overflow-hidden border-border/50 transition-all duration-500 hover:shadow-[0_20px_50px_rgba(124,58,237,0.15)] hover:border-violet-500/50 flex flex-col h-full bg-card rounded-[1.5rem] ${isHovered ? "-translate-y-3" : ""}`}>
        <div className="aspect-[16/11] relative overflow-hidden bg-muted/20">
          {section.thumbnail ? (
            <img 
              src={section.thumbnail} 
              alt={section.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-violet-600/10 transition-colors group-hover:text-violet-600/20">
              <section.icon className="w-24 h-24 rotate-12 transition-transform duration-700 group-hover:rotate-0 group-hover:scale-125" />
            </div>
          )}
          
          <div className={`absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-4 transition-opacity duration-500 ${isHovered ? "opacity-100" : "opacity-0"}`}>
            <Button 
              size="sm" 
              className="bg-white text-violet-700 hover:bg-white/90 rounded-2xl px-8 font-black h-11 shadow-2xl shadow-black/20 transform transition-transform hover:scale-110 active:scale-95"
              onClick={(e) => { e.stopPropagation(); onAdd(section.id); }}
            >
              AJOUTER
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-white border-white/40 hover:bg-white/20 rounded-2xl px-8 font-bold h-11 backdrop-blur-sm"
              onClick={(e) => { e.stopPropagation(); setPreview(section); }}
            >
              <Eye className="w-4 h-4 mr-2" />
              APERÇU
            </Button>
          </div>
        
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            <Badge className="bg-white/80 backdrop-blur-md text-slate-900 border-none text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
              {section.category}
            </Badge>
          </div>
        
          {(section.id === 'hero' || section.id === 'products' || section.id === 'checkout') && (
            <Badge className="absolute top-4 right-4 bg-amber-400 text-amber-950 border-none text-[9px] font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg shadow-amber-200">
              <Star className="w-3 h-3 fill-current" /> BESTSELLER
            </Badge>
          )}
        </div>
        <CardContent className="p-6 flex-1 flex flex-col bg-card">
          <h4 className="font-black text-base mb-2 group-hover:text-violet-600 transition-colors tracking-tight uppercase">{section.name}</h4>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed flex-1 font-medium">
            {section.description}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
