"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  Trash2, 
  Plus, 
  GripVertical, 
  Settings2, 
  Palette, 
  Zap, 
  Maximize, 
  AlignCenter, 
  AlignLeft, 
  AlignRight, 
  Type,
  Layout as LayoutIcon,
  Video as VideoIcon,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import ImagePicker from "./ImagePicker";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface SectionEditorProps {
  section: any;
  onChange: (config: any) => void;
}

const ADVANCED_ANIMATIONS = [
  { label: "Aucune", value: "none" },
  { label: "Apparition (Haut)", value: "fade-up" },
  { label: "Apparition (Bas)", value: "fade-down" },
  { label: "Zoom avant", value: "zoom-in" },
  { label: "Glissement gauche", value: "slide-left" },
  { label: "Glissement droite", value: "slide-right" },
];

export default function SectionEditor({ section, onChange }: SectionEditorProps) {
  if (!section) return null;
  const { type, config } = section;

  const handleConfigChange = (key: string, value: any) => {
    onChange({ ...config, [key]: value });
  };

  const BaseSettings = () => (
    <div className="space-y-6 pt-4 border-t border-border mt-8">
      <div className="space-y-4">
        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Maximize className="w-3 h-3" /> Espacement & Taille
        </Label>
        <div className="space-y-4 px-1">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-[10px]">Marge Haut ({config.marginTop || 0}px)</Label>
            </div>
            <Slider 
              value={[config.marginTop || 0]} 
              min={0} max={200} step={8} 
              onValueChange={([val]) => handleConfigChange("marginTop", val)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-[10px]">Marge Bas ({config.marginBottom || 0}px)</Label>
            </div>
            <Slider 
              value={[config.marginBottom || 0]} 
              min={0} max={200} step={8} 
              onValueChange={([val]) => handleConfigChange("marginBottom", val)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-[10px]">Padding Vertical ({config.paddingY || 96}px)</Label>
            </div>
            <Slider 
              value={[config.paddingY || 96]} 
              min={0} max={200} step={8} 
              onValueChange={([val]) => handleConfigChange("paddingY", val)}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Palette className="w-3 h-3" /> Apparence & Style
        </Label>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-[10px]">Couleur de fond</Label>
            <div className="flex gap-2">
              <input 
                type="color" 
                className="w-12 h-8 p-1 rounded cursor-pointer" 
                value={config.backgroundColor || "#ffffff"} 
                onChange={(e) => handleConfigChange("backgroundColor", e.target.value)}
              />
              <Input 
                placeholder="#ffffff" 
                value={config.backgroundColor || "#ffffff"} 
                onChange={(e) => handleConfigChange("backgroundColor", e.target.value)}
                className="flex-1 h-8 text-[10px]"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px]">Couleur du texte</Label>
            <div className="flex gap-2">
              <input 
                type="color" 
                className="w-12 h-8 p-1 rounded cursor-pointer" 
                value={config.textColor || "#000000"} 
                onChange={(e) => handleConfigChange("textColor", e.target.value)}
              />
              <Input 
                placeholder="#000000" 
                value={config.textColor || "#000000"} 
                onChange={(e) => handleConfigChange("textColor", e.target.value)}
                className="flex-1 h-8 text-[10px]"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Zap className="w-3 h-3" /> Animations
        </Label>
        <Select 
          value={config.animation || "fade-up"} 
          onValueChange={(val) => handleConfigChange("animation", val)}
        >
          <SelectTrigger className="h-8 text-[10px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ADVANCED_ANIMATIONS.map(anim => (
              <SelectItem key={anim.value} value={anim.value}>{anim.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <Tabs defaultValue="content" className="w-full">
      <TabsList className="grid grid-cols-2 mb-4">
        <TabsTrigger value="content" className="text-xs">Contenu</TabsTrigger>
        <TabsTrigger value="style" className="text-xs">Style Pro</TabsTrigger>
      </TabsList>

      <TabsContent value="content" className="space-y-4">
        {renderContentEditor()}
      </TabsContent>

      <TabsContent value="style" className="space-y-4">
        <BaseSettings />
      </TabsContent>
    </Tabs>
  );

  function renderContentEditor() {
    switch (type) {
      case "hero":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Variante Hero</Label>
              <Select value={config.variant || "classic"} onValueChange={(val) => handleConfigChange("variant", val)}>
                <SelectTrigger className="h-8 text-[10px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="classic">Classique (Pleine largeur)</SelectItem>
                  <SelectItem value="split">Split (Image & Texte côte à côte)</SelectItem>
                  <SelectItem value="video">Vidéo Background</SelectItem>
                  <SelectItem value="gradient">Gradient Animé</SelectItem>
                  <SelectItem value="bold">Bold & Minimal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Badge d&apos;accroche</Label>
              <Input 
                placeholder="Ex: -50% sur tout le site"
                value={config.badge || ""} 
                onChange={(e) => handleConfigChange("badge", e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label>Titre Principal</Label>
              <Input 
                value={config.title || ""} 
                onChange={(e) => handleConfigChange("title", e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label>Sous-titre</Label>
              <Textarea 
                value={config.subtitle || ""} 
                onChange={(e) => handleConfigChange("subtitle", e.target.value)} 
              />
            </div>

            {config.variant === 'video' ? (
              <div className="space-y-2">
                <Label>Lien Vidéo (YouTube)</Label>
                <Input 
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={config.videoUrl || ""} 
                  onChange={(e) => handleConfigChange("videoUrl", e.target.value)} 
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Image d&apos;arrière-plan</Label>
                <ImagePicker 
                  value={config.backgroundImage || ""} 
                  onChange={(url) => handleConfigChange("backgroundImage", url)}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Opacité Overlay</Label>
                <Input 
                  type="number" step="0.1" min="0" max="1"
                  value={config.overlay ?? 0.4} 
                  onChange={(e) => handleConfigChange("overlay", parseFloat(e.target.value))} 
                />
              </div>
              <div className="space-y-2">
                <Label>Hauteur (px)</Label>
                <Input 
                  type="number"
                  value={config.height || 700} 
                  onChange={(e) => handleConfigChange("height", parseInt(e.target.value))} 
                />
              </div>
            </div>

              <div className="space-y-2">
                <Label>Position du contenu</Label>
                <div className="flex gap-2">
                  <Button variant={config.textPosition === 'left' ? 'secondary' : 'outline'} size="sm" className="flex-1" onClick={() => handleConfigChange("textPosition", "left")}><AlignLeft className="w-4 h-4" /></Button>
                  <Button variant={(config.textPosition === 'center' || !config.textPosition) ? 'secondary' : 'outline'} size="sm" className="flex-1" onClick={() => handleConfigChange("textPosition", "center")}><AlignCenter className="w-4 h-4" /></Button>
                  <Button variant={config.textPosition === 'right' ? 'secondary' : 'outline'} size="sm" className="flex-1" onClick={() => handleConfigChange("textPosition", "right")}><AlignRight className="w-4 h-4" /></Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Position verticale du contenu</Label>
                <Select value={config.verticalPosition || "center"} onValueChange={(val) => handleConfigChange("verticalPosition", val)}>
                  <SelectTrigger className="h-8 text-[10px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">Haut</SelectItem>
                    <SelectItem value="center">Centre</SelectItem>
                    <SelectItem value="bottom">Bas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <Label className="text-primary font-bold">Bouton Principal (CTA)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Texte CTA" value={config.ctaText || ""} onChange={(e) => handleConfigChange("ctaText", e.target.value)} />
                  <Input placeholder="Lien CTA" value={config.ctaLink || ""} onChange={(e) => handleConfigChange("ctaLink", e.target.value)} />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs">Style du bouton</Label>
                  <Select value={config.ctaStyle || "filled"} onValueChange={(val) => handleConfigChange("ctaStyle", val)}>
                    <SelectTrigger className="h-8 text-[10px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="filled">Plein (Primary)</SelectItem>
                      <SelectItem value="outline">Contour</SelectItem>
                      <SelectItem value="ghost">Transparent</SelectItem>
                      <SelectItem value="gradient">Dégradé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Taille du bouton</Label>
                  <Select value={config.ctaSize || "lg"} onValueChange={(val) => handleConfigChange("ctaSize", val)}>
                    <SelectTrigger className="h-8 text-[10px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sm">Petit</SelectItem>
                      <SelectItem value="md">Moyen</SelectItem>
                      <SelectItem value="lg">Grand</SelectItem>
                      <SelectItem value="xl">Très grand</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <Label className="text-muted-foreground font-bold">Bouton Secondaire (optionnel)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Texte Secondaire" value={config.secondaryCtaText || ""} onChange={(e) => handleConfigChange("secondaryCtaText", e.target.value)} />
                  <Input placeholder="Lien Secondaire" value={config.secondaryCtaLink || ""} onChange={(e) => handleConfigChange("secondaryCtaLink", e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Position des boutons</Label>
                <div className="flex gap-2">
                  <Button variant={config.ctaPosition === 'left' ? 'secondary' : 'outline'} size="sm" className="flex-1" onClick={() => handleConfigChange("ctaPosition", "left")}><AlignLeft className="w-4 h-4" /></Button>
                  <Button variant={(config.ctaPosition === 'center' || !config.ctaPosition) ? 'secondary' : 'outline'} size="sm" className="flex-1" onClick={() => handleConfigChange("ctaPosition", "center")}><AlignCenter className="w-4 h-4" /></Button>
                  <Button variant={config.ctaPosition === 'right' ? 'secondary' : 'outline'} size="sm" className="flex-1" onClick={() => handleConfigChange("ctaPosition", "right")}><AlignRight className="w-4 h-4" /></Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Disposition des boutons</Label>
                <Select value={config.ctaLayout || "row"} onValueChange={(val) => handleConfigChange("ctaLayout", val)}>
                  <SelectTrigger className="h-8 text-[10px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="row">Côte à côte (horizontal)</SelectItem>
                    <SelectItem value="column">Empilés (vertical)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
          </div>
        );

      case "features":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Titre</Label>
              <Input 
                value={config.title || ""} 
                onChange={(e) => handleConfigChange("title", e.target.value)} 
              />
            </div>
            <div className="space-y-4 pt-4 border-t">
                <Label>Avantages</Label>
                {(Array.isArray(config.features) ? config.features : []).map((feature: any, index: number) => (
                  <div key={index} className="p-3 border rounded-lg space-y-3 bg-muted/30 relative group">
                    <Input 
                      placeholder="Titre" 
                      value={feature.title} 
                      onChange={(e) => {
                        const newFeatures = [...(Array.isArray(config.features) ? config.features : [])];
                        newFeatures[index].title = e.target.value;
                        handleConfigChange("features", newFeatures);
                      }}
                    />
                    <Textarea 
                      placeholder="Description" 
                      value={feature.description} 
                      onChange={(e) => {
                        const newFeatures = [...(Array.isArray(config.features) ? config.features : [])];
                        newFeatures[index].description = e.target.value;
                        handleConfigChange("features", newFeatures);
                      }}
                      className="h-20"
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        const newFeatures = (Array.isArray(config.features) ? config.features : []).filter((_: any, i: number) => i !== index);
                        handleConfigChange("features", newFeatures);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => {
                    const newFeatures = [...(Array.isArray(config.features) ? config.features : []), { title: "Nouvel avantage", description: "", icon: "Star" }];
                    handleConfigChange("features", newFeatures);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un avantage
                </Button>
              </div>
          </div>
        );

      case "about":
      case "shipping_policy":
      case "refund_policy":
      case "privacy_policy":
      case "terms_conditions":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Titre de la page</Label>
              <Input value={config.title || ""} onChange={(e) => handleConfigChange("title", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Contenu (HTML supporté)</Label>
              <Textarea 
                value={config.content || ""} 
                onChange={(e) => handleConfigChange("content", e.target.value)} 
                className="h-64 font-mono text-xs"
                placeholder="<h3>Sous-titre</h3><p>Votre texte ici...</p>"
              />
            </div>
            {type === 'about' && (
              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label>Image d&apos;illustration</Label>
                  <ImagePicker value={config.image || ""} onChange={(url) => handleConfigChange("image", url)} />
                </div>
                <div className="space-y-2">
                  <Label>Position Image</Label>
                  <Select value={config.imagePosition || "right"} onValueChange={(val) => handleConfigChange("imagePosition", val)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Gauche</SelectItem>
                      <SelectItem value="right">Droite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>
        );

        case "products":
          return (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Titre de la section</Label>
                <Input 
                  value={config.title || ""} 
                  onChange={(e) => handleConfigChange("title", e.target.value)} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Colonnes</Label>
                  <Select value={String(config.columns || "4")} onValueChange={(val) => handleConfigChange("columns", parseInt(val))}>
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 colonnes</SelectItem>
                      <SelectItem value="3">3 colonnes</SelectItem>
                      <SelectItem value="4">4 colonnes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Limite</Label>
                  <Input type="number" value={config.limit || 8} onChange={(e) => handleConfigChange("limit", parseInt(e.target.value))} />
                </div>
              </div>
              <div className="flex items-center gap-2 py-2">
                <Switch checked={config.showAllButton} onCheckedChange={(val) => handleConfigChange("showAllButton", val)} />
                <Label>Bouton &quot;Voir tout&quot;</Label>
              </div>
                <div className="space-y-4 pt-4 border-t">
                  <Label className="font-bold">Liste des Produits</Label>
                  {(Array.isArray(config.items) ? config.items : []).map((item: any, index: number) => (
                    <div key={index} className="p-3 border rounded-lg space-y-3 bg-muted/30 relative group">
                      <Input placeholder="Nom" value={item.title} onChange={(e) => {
                        const newItems = [...(Array.isArray(config.items) ? config.items : [])];
                        newItems[index].title = e.target.value;
                        handleConfigChange("items", newItems);
                      }} />
                      <div className="flex gap-2">
                        <Input placeholder="Prix" value={item.price} onChange={(e) => {
                          const newItems = [...(Array.isArray(config.items) ? config.items : [])];
                          newItems[index].price = e.target.value;
                          handleConfigChange("items", newItems);
                        }} />
                        <Input placeholder="Soldes" value={item.oldPrice || ""} onChange={(e) => {
                          const newItems = [...(Array.isArray(config.items) ? config.items : [])];
                          newItems[index].oldPrice = e.target.value;
                          handleConfigChange("items", newItems);
                        }} />
                      </div>
                      <ImagePicker value={item.image || ""} onChange={(url) => {
                        const newItems = [...(Array.isArray(config.items) ? config.items : [])];
                        newItems[index].image = url;
                        handleConfigChange("items", newItems);
                      }} />
                      <Button variant="ghost" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => {
                        const newItems = (Array.isArray(config.items) ? config.items : []).filter((_: any, i: number) => i !== index);
                        handleConfigChange("items", newItems);
                      }}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full" onClick={() => {
                    const newItems = [...(Array.isArray(config.items) ? config.items : []), { title: "Nouveau Produit", price: "0.00", image: "", onSale: false }];
                    handleConfigChange("items", newItems);
                  }}><Plus className="w-4 h-4 mr-2" />Ajouter un produit</Button>
                </div>
            </div>
          );

        case "pricing":
          return (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Titre de la section</Label>
                <Input value={config.title || ""} onChange={(e) => handleConfigChange("title", e.target.value)} />
              </div>
                <div className="space-y-4 pt-4 border-t">
                  <Label>Plans Tarifaires</Label>
                  {(Array.isArray(config.plans) ? config.plans : []).map((plan: any, i: number) => (
                    <div key={i} className="p-3 border rounded-lg space-y-3 bg-muted/20 relative group">
                      <Input placeholder="Nom du plan" value={plan.name} onChange={(e) => {
                        const newPlans = [...(Array.isArray(config.plans) ? config.plans : [])];
                        newPlans[i].name = e.target.value;
                        handleConfigChange("plans", newPlans);
                      }} />
                      <div className="flex gap-2">
                        <Input placeholder="Prix" value={plan.price} onChange={(e) => {
                          const newPlans = [...(Array.isArray(config.plans) ? config.plans : [])];
                          newPlans[i].price = e.target.value;
                          handleConfigChange("plans", newPlans);
                        }} />
                        <Input placeholder="Période" value={plan.period} onChange={(e) => {
                          const newPlans = [...(Array.isArray(config.plans) ? config.plans : [])];
                          newPlans[i].period = e.target.value;
                          handleConfigChange("plans", newPlans);
                        }} />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={plan.popular} onCheckedChange={(val) => {
                          const newPlans = [...(Array.isArray(config.plans) ? config.plans : [])];
                          newPlans[i].popular = val;
                          handleConfigChange("plans", newPlans);
                        }} />
                        <Label className="text-xs">Mettre en avant</Label>
                      </div>
                      <Button variant="ghost" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => {
                        const newPlans = (Array.isArray(config.plans) ? config.plans : []).filter((_: any, index: number) => index !== i);
                        handleConfigChange("plans", newPlans);
                      }}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full" onClick={() => {
                    const newPlans = [...(Array.isArray(config.plans) ? config.plans : []), { name: "Nouveau Plan", price: "0", period: "TND", features: [] }];
                    handleConfigChange("plans", newPlans);
                  }}><Plus className="w-4 h-4 mr-2" />Ajouter un plan</Button>
                </div>
              </div>
            );

          case "stats":
            return (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Titre</Label>
                  <Input value={config.title || ""} onChange={(e) => handleConfigChange("title", e.target.value)} />
                </div>
                <div className="space-y-4 pt-4 border-t">
                  <Label>Chiffres Clés</Label>
                  {(Array.isArray(config.stats) ? config.stats : []).map((stat: any, i: number) => (
                    <div key={i} className="flex gap-2 items-end group relative">
                      <div className="flex-1 space-y-1">
                        <Label className="text-[10px]">Valeur</Label>
                        <Input placeholder="Ex: 500+" value={stat.value} onChange={(e) => {
                          const newStats = [...(Array.isArray(config.stats) ? config.stats : [])];
                          newStats[i].value = e.target.value;
                          handleConfigChange("stats", newStats);
                        }} />
                      </div>
                      <div className="flex-1 space-y-1">
                        <Label className="text-[10px]">Label</Label>
                        <Input placeholder="Ex: Clients" value={stat.label} onChange={(e) => {
                          const newStats = [...(Array.isArray(config.stats) ? config.stats : [])];
                          newStats[i].label = e.target.value;
                          handleConfigChange("stats", newStats);
                        }} />
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 mb-[1px] text-destructive opacity-0 group-hover:opacity-100" onClick={() => {
                        const newStats = (Array.isArray(config.stats) ? config.stats : []).filter((_: any, index: number) => index !== i);
                        handleConfigChange("stats", newStats);
                      }}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full" onClick={() => {
                    const newStats = [...(Array.isArray(config.stats) ? config.stats : []), { label: "Nouveau", value: "0" }];
                    handleConfigChange("stats", newStats);
                  }}><Plus className="w-4 h-4 mr-2" />Ajouter un chiffre</Button>
                </div>
              </div>
            );

          case "team":
            return (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Titre</Label>
                  <Input value={config.title || ""} onChange={(e) => handleConfigChange("title", e.target.value)} />
                </div>
                <div className="space-y-4 pt-4 border-t">
                  <Label>Membres de l&apos;équipe</Label>
                  {(Array.isArray(config.members) ? config.members : []).map((member: any, i: number) => (
                    <div key={i} className="p-3 border rounded-lg space-y-3 bg-muted/20 relative group">
                      <Input placeholder="Nom" value={member.name} onChange={(e) => {
                        const newMembers = [...(Array.isArray(config.members) ? config.members : [])];
                        newMembers[i].name = e.target.value;
                        handleConfigChange("members", newMembers);
                      }} />
                      <Input placeholder="Rôle" value={member.role} onChange={(e) => {
                        const newMembers = [...(Array.isArray(config.members) ? config.members : [])];
                        newMembers[i].role = e.target.value;
                        handleConfigChange("members", newMembers);
                      }} />
                      <ImagePicker value={member.avatar} onChange={(url) => {
                        const newMembers = [...(Array.isArray(config.members) ? config.members : [])];
                        newMembers[i].avatar = url;
                        handleConfigChange("members", newMembers);
                      }} />
                      <Button variant="ghost" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => {
                        const newMembers = (Array.isArray(config.members) ? config.members : []).filter((_: any, index: number) => index !== i);
                        handleConfigChange("members", newMembers);
                      }}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full" onClick={() => {
                    const newMembers = [...(Array.isArray(config.members) ? config.members : []), { name: "Nouveau membre", role: "Rôle", avatar: "" }];
                    handleConfigChange("members", newMembers);
                  }}><Plus className="w-4 h-4 mr-2" />Ajouter un membre</Button>
                </div>
              </div>
            );

          case "trust_badges":
            return (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Titre</Label>
                  <Input value={config.title || ""} onChange={(e) => handleConfigChange("title", e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Colonnes</Label>
                    <Select value={String(config.columns || "4")} onValueChange={(val) => handleConfigChange("columns", parseInt(val))}>
                      <SelectTrigger className="h-8 text-[10px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2 colonnes</SelectItem>
                        <SelectItem value="3">3 colonnes</SelectItem>
                        <SelectItem value="4">4 colonnes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Layout</Label>
                    <Select value={config.layout || "grid"} onValueChange={(val) => handleConfigChange("layout", val)}>
                      <SelectTrigger className="h-8 text-[10px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="grid">Grille</SelectItem>
                        <SelectItem value="row">Ligne</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-4 pt-4 border-t">
                  <Label className="font-bold">Liste des Badges</Label>
                  {(Array.isArray(config.items) ? config.items : []).map((item: any, i: number) => (
                    <div key={i} className="p-3 border rounded-lg space-y-3 bg-muted/20 relative group">
                      <div className="grid grid-cols-2 gap-2">
                        <Select value={item.icon || "Shield"} onValueChange={(val) => {
                          const newItems = [...(Array.isArray(config.items) ? config.items : [])];
                          newItems[i].icon = val;
                          handleConfigChange("items", newItems);
                        }}>
                          <SelectTrigger className="h-8 text-[10px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Truck">Livraison (Camion)</SelectItem>
                            <SelectItem value="Shield">Sécurité (Bouclier)</SelectItem>
                            <SelectItem value="RefreshCw">Retours (Flèches)</SelectItem>
                            <SelectItem value="Headphones">Support (Casque)</SelectItem>
                            <SelectItem value="Star">Qualité (Étoile)</SelectItem>
                            <SelectItem value="Zap">Rapidité (Éclair)</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input placeholder="Titre" value={item.title} onChange={(e) => {
                          const newItems = [...(Array.isArray(config.items) ? config.items : [])];
                          newItems[i].title = e.target.value;
                          handleConfigChange("items", newItems);
                        }} />
                      </div>
                      <Input placeholder="Description" value={item.description} onChange={(e) => {
                        const newItems = [...(Array.isArray(config.items) ? config.items : [])];
                        newItems[i].description = e.target.value;
                        handleConfigChange("items", newItems);
                      }} />
                      <Button variant="ghost" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => {
                        const newItems = (Array.isArray(config.items) ? config.items : []).filter((_: any, index: number) => index !== i);
                        handleConfigChange("items", newItems);
                      }}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full" onClick={() => {
                    const newItems = [...(Array.isArray(config.items) ? config.items : []), { title: "Nouveau badge", description: "", icon: "Shield" }];
                    handleConfigChange("items", newItems);
                  }}><Plus className="w-4 h-4 mr-2" />Ajouter un badge</Button>
                </div>
              </div>
            );

        case "recommended_products":
          return (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Titre</Label>
                <Input value={config.title || ""} onChange={(e) => handleConfigChange("title", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Algorithme de recommandation</Label>
                <Select value={config.algorithm || "bestsellers"} onValueChange={(val) => handleConfigChange("algorithm", val)}>
                  <SelectTrigger className="h-8 text-[10px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bestsellers">Meilleures Ventes</SelectItem>
                    <SelectItem value="recent">Vus Récemment</SelectItem>
                    <SelectItem value="similar">Produits Similaires</SelectItem>
                    <SelectItem value="random">Découverte Aléatoire</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre max</Label>
                  <Input type="number" value={config.limit || 4} onChange={(e) => handleConfigChange("limit", parseInt(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Colonnes</Label>
                  <Select value={String(config.columns || "4")} onValueChange={(val) => handleConfigChange("columns", parseInt(val))}>
                    <SelectTrigger className="h-8 text-[10px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 colonnes</SelectItem>
                      <SelectItem value="3">3 colonnes</SelectItem>
                      <SelectItem value="4">4 colonnes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-4 py-2 border-t mt-4">
                <div className="flex items-center gap-2">
                  <Switch checked={config.showPrice} onCheckedChange={(val) => handleConfigChange("showPrice", val)} />
                  <Label className="text-xs">Prix</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={config.showAddToCart} onCheckedChange={(val) => handleConfigChange("showAddToCart", val)} />
                  <Label className="text-xs">Panier</Label>
                </div>
              </div>
            </div>
          );

        case "mega_menu":
          return (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nom de la marque</Label>
                <Input value={config.brandName || ""} onChange={(e) => handleConfigChange("brandName", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Logo</Label>
                <ImagePicker value={config.logo || ""} onChange={(url) => handleConfigChange("logo", url)} />
              </div>
              <div className="flex items-center gap-4 py-2">
                <div className="flex items-center gap-2">
                  <Switch checked={config.sticky} onCheckedChange={(val) => handleConfigChange("sticky", val)} />
                  <Label className="text-xs">Collant</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={config.transparent} onCheckedChange={(val) => handleConfigChange("transparent", val)} />
                  <Label className="text-xs">Transparent</Label>
                </div>
              </div>
                <div className="space-y-4 pt-4 border-t">
                  <Label className="font-bold">Menu de Navigation</Label>
                  {(Array.isArray(config.menuItems) ? config.menuItems : []).map((item: any, i: number) => (
                    <div key={i} className="p-3 border rounded-lg space-y-3 bg-muted/20 relative group">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">Élément {i + 1}</span>
                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 hover:bg-primary/10" 
                              disabled={i === 0}
                              onClick={() => {
                                const newItems = [...(Array.isArray(config.menuItems) ? config.menuItems : [])];
                                [newItems[i-1], newItems[i]] = [newItems[i], newItems[i-1]];
                                handleConfigChange("menuItems", newItems);
                              }}
                            >
                              <ChevronUp className="w-3 h-3" />
                              <span className="sr-only">Monter</span>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 hover:bg-primary/10"
                              disabled={i === (Array.isArray(config.menuItems) ? config.menuItems : []).length - 1}
                              onClick={() => {
                                const newItems = [...(Array.isArray(config.menuItems) ? config.menuItems : [])];
                                [newItems[i], newItems[i+1]] = [newItems[i+1], newItems[i]];
                                handleConfigChange("menuItems", newItems);
                              }}
                            >
                              <ChevronDown className="w-3 h-3" />
                              <span className="sr-only">Descendre</span>
                            </Button>
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="Label" value={item.label} onChange={(e) => {
                          const newItems = [...(Array.isArray(config.menuItems) ? config.menuItems : [])];
                          newItems[i].label = e.target.value;
                          handleConfigChange("menuItems", newItems);
                        }} />
                        <Input placeholder="Lien" value={item.link} onChange={(e) => {
                          const newItems = [...(Array.isArray(config.menuItems) ? config.menuItems : [])];
                          newItems[i].link = e.target.value;
                          handleConfigChange("menuItems", newItems);
                        }} />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={item.megaMenu} onCheckedChange={(val) => {
                          const newItems = [...(Array.isArray(config.menuItems) ? config.menuItems : [])];
                          newItems[i].megaMenu = val;
                          if (val && !newItems[i].columns) newItems[i].columns = [{ title: "Catégorie", links: [] }];
                          handleConfigChange("menuItems", newItems);
                        }} />
                        <Label className="text-xs">Mega Menu</Label>
                      </div>
                      <Button variant="ghost" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => {
                        const newItems = (Array.isArray(config.menuItems) ? config.menuItems : []).filter((_: any, index: number) => index !== i);
                        handleConfigChange("menuItems", newItems);
                      }}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full" onClick={() => {
                    const newItems = [...(Array.isArray(config.menuItems) ? config.menuItems : []), { label: "Nouveau lien", link: "/shop", megaMenu: false }];
                    handleConfigChange("menuItems", newItems);
                  }}><Plus className="w-4 h-4 mr-2" />Ajouter au menu</Button>
                </div>
              </div>
            );

          case "logo_carousel":
            return (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Titre</Label>
                  <Input value={config.title || ""} onChange={(e) => handleConfigChange("title", e.target.value)} />
                </div>
                <div className="space-y-4 pt-4 border-t">
                  <Label>Logos</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Array.isArray(config.logos) ? config.logos : []).map((logo: string, i: number) => (
                      <div key={i} className="relative group aspect-video border rounded bg-white">
                        <img src={logo} className="w-full h-full object-contain p-2" alt={`Logo ${i}`} />
                        <Button variant="destructive" size="icon" className="absolute -top-1 -right-1 h-5 w-5 opacity-0 group-hover:opacity-100" onClick={() => {
                          const newLogos = (Array.isArray(config.logos) ? config.logos : []).filter((_: any, index: number) => index !== i);
                          handleConfigChange("logos", newLogos);
                        }}><Trash2 className="h-2 w-2" /></Button>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full" onClick={() => {
                    const newLogos = [...(Array.isArray(config.logos) ? config.logos : []), ""];
                    handleConfigChange("logos", newLogos);
                  }}><Plus className="w-4 h-4 mr-2" />Ajouter un logo</Button>
                </div>
              </div>
            );

          case "promo_banner":
            return (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Texte de l&apos;annonce</Label>
                  <Input value={config.text || ""} onChange={(e) => handleConfigChange("text", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Lien (Optionnel)</Label>
                  <Input placeholder="/shop" value={config.link || ""} onChange={(e) => handleConfigChange("link", e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[10px]">Fond</Label>
                    <input type="color" className="w-full h-8 cursor-pointer" value={config.backgroundColor || "#7c3aed"} onChange={(e) => handleConfigChange("backgroundColor", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">Texte</Label>
                    <input type="color" className="w-full h-8 cursor-pointer" value={config.textColor || "#ffffff"} onChange={(e) => handleConfigChange("textColor", e.target.value)} />
                  </div>
                </div>
              </div>
            );

          case "testimonials":
            return (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Titre de la section</Label>
                  <Input value={config.title || ""} onChange={(e) => handleConfigChange("title", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Colonnes</Label>
                  <Select value={String(config.columns || "3")} onValueChange={(val) => handleConfigChange("columns", parseInt(val))}>
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 colonne</SelectItem>
                      <SelectItem value="2">2 colonnes</SelectItem>
                      <SelectItem value="3">3 colonnes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-4 pt-4 border-t">
                  <Label className="font-bold">Témoignages</Label>
                  {(Array.isArray(config.testimonials) ? config.testimonials : []).map((t: any, i: number) => (
                    <div key={i} className="p-3 border rounded-lg space-y-3 bg-muted/20 relative group">
                      <Input placeholder="Nom" value={t.name} onChange={(e) => {
                        const newT = [...(Array.isArray(config.testimonials) ? config.testimonials : [])];
                        newT[i].name = e.target.value;
                        handleConfigChange("testimonials", newT);
                      }} />
                      <Input placeholder="Localisation/Rôle" value={t.location} onChange={(e) => {
                        const newT = [...(Array.isArray(config.testimonials) ? config.testimonials : [])];
                        newT[i].location = e.target.value;
                        handleConfigChange("testimonials", newT);
                      }} />
                      <div className="space-y-1">
                        <Label className="text-[10px]">Note (1-5)</Label>
                        <Input type="number" min="1" max="5" value={t.rating} onChange={(e) => {
                          const newT = [...(Array.isArray(config.testimonials) ? config.testimonials : [])];
                          newT[i].rating = parseInt(e.target.value);
                          handleConfigChange("testimonials", newT);
                        }} />
                      </div>
                      <Textarea placeholder="Témoignage" value={t.text} onChange={(e) => {
                        const newT = [...(Array.isArray(config.testimonials) ? config.testimonials : [])];
                        newT[i].text = e.target.value;
                        handleConfigChange("testimonials", newT);
                      }} />
                      <ImagePicker value={t.avatar} onChange={(url) => {
                        const newT = [...(Array.isArray(config.testimonials) ? config.testimonials : [])];
                        newT[i].avatar = url;
                        handleConfigChange("testimonials", newT);
                      }} />
                      <Button variant="ghost" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => {
                        const newT = (Array.isArray(config.testimonials) ? config.testimonials : []).filter((_: any, index: number) => index !== i);
                        handleConfigChange("testimonials", newT);
                      }}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full" onClick={() => {
                    const newT = [...(Array.isArray(config.testimonials) ? config.testimonials : []), { name: "Client", location: "Tunis", rating: 5, text: "Excellent !", avatar: "" }];
                    handleConfigChange("testimonials", newT);
                  }}><Plus className="w-4 h-4 mr-2" />Ajouter un avis</Button>
                </div>
              </div>
            );

          case "faq":
            return (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Titre</Label>
                  <Input value={config.title || ""} onChange={(e) => handleConfigChange("title", e.target.value)} />
                </div>
                <div className="space-y-4 pt-4 border-t">
                  <Label className="font-bold">Questions & Réponses</Label>
                  {(Array.isArray(config.faqs) ? config.faqs : []).map((faq: any, i: number) => (
                    <div key={i} className="p-3 border rounded-lg space-y-3 bg-muted/20 relative group">
                      <Input placeholder="Question" value={faq.question} onChange={(e) => {
                        const newF = [...(Array.isArray(config.faqs) ? config.faqs : [])];
                        newF[i].question = e.target.value;
                        handleConfigChange("faqs", newF);
                      }} />
                      <Textarea placeholder="Réponse" value={faq.answer} onChange={(e) => {
                        const newF = [...(Array.isArray(config.faqs) ? config.faqs : [])];
                        newF[i].answer = e.target.value;
                        handleConfigChange("faqs", newF);
                      }} />
                      <Button variant="ghost" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => {
                        const newF = (Array.isArray(config.faqs) ? config.faqs : []).filter((_: any, index: number) => index !== i);
                        handleConfigChange("faqs", newF);
                      }}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full" onClick={() => {
                    const newF = [...(Array.isArray(config.faqs) ? config.faqs : []), { question: "Nouvelle question ?", answer: "La réponse ici." }];
                    handleConfigChange("faqs", newF);
                  }}><Plus className="w-4 h-4 mr-2" />Ajouter une question</Button>
                </div>
              </div>
            );

          case "newsletter":
            return (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Titre</Label>
                  <Input value={config.title || ""} onChange={(e) => handleConfigChange("title", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Sous-titre</Label>
                  <Textarea value={config.subtitle || ""} onChange={(e) => handleConfigChange("subtitle", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Texte du bouton</Label>
                  <Input value={config.buttonText || ""} onChange={(e) => handleConfigChange("buttonText", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Placeholder de l&apos;input</Label>
                  <Input value={config.placeholder || ""} onChange={(e) => handleConfigChange("placeholder", e.target.value)} />
                </div>
              </div>
            );

          case "process_steps":
            return (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Titre</Label>
                  <Input value={config.title || ""} onChange={(e) => handleConfigChange("title", e.target.value)} />
                </div>
                <div className="space-y-4 pt-4 border-t">
                  <Label>Étapes</Label>
                  {(Array.isArray(config.steps) ? config.steps : []).map((step: any, i: number) => (
                    <div key={i} className="p-3 border rounded-lg space-y-2 bg-muted/20 relative group">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold">{i + 1}</div>
                        <Input placeholder="Titre" value={step.title} onChange={(e) => {
                          const newSteps = [...(Array.isArray(config.steps) ? config.steps : [])];
                          newSteps[i].title = e.target.value;
                          handleConfigChange("steps", newSteps);
                        }} />
                      </div>
                      <Textarea placeholder="Description" value={step.description} onChange={(e) => {
                        const newSteps = [...(Array.isArray(config.steps) ? config.steps : [])];
                        newSteps[i].description = e.target.value;
                        handleConfigChange("steps", newSteps);
                      }} />
                      <Button variant="ghost" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => {
                        const newSteps = (Array.isArray(config.steps) ? config.steps : []).filter((_: any, index: number) => index !== i);
                        handleConfigChange("steps", newSteps);
                      }}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full" onClick={() => {
                    const newSteps = [...(Array.isArray(config.steps) ? config.steps : []), { title: "Nouvelle étape", description: "" }];
                    handleConfigChange("steps", newSteps);
                  }}><Plus className="w-4 h-4 mr-2" />Ajouter une étape</Button>
                </div>
              </div>
            );

        case "footer":
          return (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nom de la marque</Label>
                <Input value={config.brandName || ""} onChange={(e) => handleConfigChange("brandName", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={config.description || ""} onChange={(e) => handleConfigChange("description", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px]">Téléphone</Label>
                  <Input value={config.phone || ""} onChange={(e) => handleConfigChange("phone", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Copyright</Label>
                  <Input value={config.copyright || ""} onChange={(e) => handleConfigChange("copyright", e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Adresse</Label>
                <Input value={config.address || ""} onChange={(e) => handleConfigChange("address", e.target.value)} />
              </div>
            </div>
          );

        case "video":
          return (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Titre (Optionnel)</Label>
                <Input value={config.title || ""} onChange={(e) => handleConfigChange("title", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>URL Vidéo (YouTube/Vimeo)</Label>
                <Input placeholder="https://..." value={config.videoUrl || ""} onChange={(e) => handleConfigChange("videoUrl", e.target.value)} />
              </div>
              <div className="flex items-center gap-4 py-2 border-t">
                <div className="flex items-center gap-2">
                  <Switch checked={config.autoplay} onCheckedChange={(val) => handleConfigChange("autoplay", val)} />
                  <Label className="text-xs">Lecture auto</Label>
                </div>
              </div>
            </div>
          );

        case "countdown":
          return (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Date de fin</Label>
                <Input type="datetime-local" value={config.endDate || ""} onChange={(e) => handleConfigChange("endDate", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Input placeholder="L'offre se termine dans :" value={config.message || ""} onChange={(e) => handleConfigChange("message", e.target.value)} />
              </div>
            </div>
          );

      default:
        return (
          <div className="p-4 border rounded-lg bg-muted/30 text-center space-y-4">
            <p className="text-sm text-muted-foreground italic">
              Paramètres avancés pour {type.replace("_", " ")}
            </p>
            <Input 
              placeholder="Titre Principal"
              value={config.title || ""} 
              onChange={(e) => handleConfigChange("title", e.target.value)} 
            />
            <Textarea 
              placeholder="Description ou contenu"
              value={config.description || config.content || ""} 
              onChange={(e) => handleConfigChange(config.content !== undefined ? "content" : "description", e.target.value)} 
            />
          </div>
        );
    }
  }
}
