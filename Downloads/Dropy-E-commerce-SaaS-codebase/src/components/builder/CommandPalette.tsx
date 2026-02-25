"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search,
  Layers,
  Plus,
  Settings,
  Palette,
  Eye,
  Save,
  FileText,
  Image as ImageIcon,
  ShoppingBag,
  Star,
  MessageSquare,
  HelpCircle,
  Clock,
  Type,
  Layout,
  ArrowRight,
  Command,
  CornerDownLeft
} from "lucide-react";

interface CommandItem {
  id: string;
  title: string;
  description?: string;
  icon: any;
  category: string;
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  pages: any[];
  sections: any[];
  onNavigateToPage: (slug: string) => void;
  onNavigateToSection: (sectionId: string) => void;
  onAddSection: (type: string) => void;
  onOpenSettings: (tab: string) => void;
  onSave: () => void;
  onPreview: () => void;
}

const SECTION_TYPES = [
  { type: "hero", name: "Hero", icon: ImageIcon },
  { type: "products", name: "Produits", icon: ShoppingBag },
  { type: "features", name: "Caractéristiques", icon: Star },
  { type: "testimonials", name: "Témoignages", icon: MessageSquare },
  { type: "faq", name: "FAQ", icon: HelpCircle },
  { type: "countdown", name: "Compte à rebours", icon: Clock },
  { type: "about", name: "À Propos", icon: Type },
  { type: "contact", name: "Contact", icon: Type },
  { type: "footer", name: "Footer", icon: Layout },
];

export default function CommandPalette({
  isOpen,
  onClose,
  pages,
  sections,
  onNavigateToPage,
  onNavigateToSection,
  onAddSection,
  onOpenSettings,
  onSave,
  onPreview
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

    const buildCommands = useCallback((): CommandItem[] => {
      const commands: CommandItem[] = [];
  
      // Business Actions
      commands.push({
        id: "add-reviews",
        title: "Ajouter section avis clients",
        description: "Booster la confiance avec la preuve sociale",
        icon: MessageSquare,
        category: "Marketing",
        action: () => onAddSection("testimonials"),
        keywords: ["avis", "clients", "reviews", "confiance", "social proof"]
      });

      commands.push({
        id: "optimize-perf",
        title: "Améliorer performance",
        description: "Optimiser la vitesse de chargement",
        icon: Clock,
        category: "Marketing",
        action: () => onOpenSettings("performance"),
        keywords: ["vitesse", "performance", "score", "rapide"]
      });

      commands.push({
        id: "add-promo",
        title: "Ajouter code promo",
        description: "Créer une offre d'urgence",
        icon: ShoppingBag,
        category: "Marketing",
        action: () => onAddSection("countdown"),
        keywords: ["promo", "reduction", "offre", "urgence"]
      });

      // Actions rapides
      commands.push({
        id: "save",
        title: "Enregistrer et Publier",
        description: "Mettre en ligne vos modifications",
        icon: Save,
        category: "Actions",
        action: onSave,
        keywords: ["save", "sauvegarder", "enregistrer", "publier"]
      });

    commands.push({
      id: "preview",
      title: "Prévisualiser",
      description: "Ouvrir la prévisualisation dans un nouvel onglet",
      icon: Eye,
      category: "Actions",
      action: onPreview,
      keywords: ["preview", "voir", "aperçu"]
    });

    // Settings
    commands.push({
      id: "settings-theme",
      title: "Paramètres Thème",
      description: "Couleurs, typographie, style global",
      icon: Palette,
      category: "Paramètres",
      action: () => onOpenSettings("theme"),
      keywords: ["theme", "couleur", "style", "design"]
    });

    commands.push({
      id: "settings-seo",
      title: "Paramètres SEO",
      description: "Meta titre, description, Open Graph",
      icon: Search,
      category: "Paramètres",
      action: () => onOpenSettings("seo"),
      keywords: ["seo", "google", "meta", "référencement"]
    });

    // Pages
    pages.forEach(page => {
      commands.push({
        id: `page-${page.slug}`,
        title: page.name,
        description: `Aller à la page /${page.slug}`,
        icon: FileText,
        category: "Pages",
        action: () => onNavigateToPage(page.slug),
        keywords: [page.slug, page.name.toLowerCase()]
      });
    });

    // Sections existantes
    sections.forEach(section => {
      commands.push({
        id: `section-${section.id}`,
        title: section.config?.title || `Section ${section.type}`,
        description: `Modifier la section ${section.type}`,
        icon: Layers,
        category: "Sections",
        action: () => onNavigateToSection(section.id),
        keywords: [section.type, section.config?.title?.toLowerCase() || ""]
      });
    });

    // Ajouter des sections
    SECTION_TYPES.forEach(({ type, name, icon }) => {
      commands.push({
        id: `add-${type}`,
        title: `Ajouter ${name}`,
        description: `Créer une nouvelle section ${name}`,
        icon: icon,
        category: "Ajouter Section",
        action: () => onAddSection(type),
        keywords: ["add", "ajouter", "créer", type, name.toLowerCase()]
      });
    });

    return commands;
  }, [pages, sections, onNavigateToPage, onNavigateToSection, onAddSection, onOpenSettings, onSave, onPreview]);

  const commands = buildCommands();

  const filteredCommands = query.trim() === "" 
    ? commands 
    : commands.filter(cmd => {
        const searchLower = query.toLowerCase();
        return (
          cmd.title.toLowerCase().includes(searchLower) ||
          cmd.description?.toLowerCase().includes(searchLower) ||
          cmd.category.toLowerCase().includes(searchLower) ||
          cmd.keywords?.some(k => k.includes(searchLower))
        );
      });

  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
        onClose();
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Command Palette</DialogTitle>
        </DialogHeader>
        
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground" />
          <Input
            autoFocus
            placeholder="Rechercher une action, page ou section..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="border-0 shadow-none focus-visible:ring-0 text-lg placeholder:text-muted-foreground/60"
          />
          <kbd className="hidden sm:inline-flex h-6 select-none items-center gap-1 rounded border bg-muted px-2 font-mono text-[10px] font-medium text-muted-foreground">
            ESC
          </kbd>
        </div>

        <ScrollArea className="max-h-[60vh]">
          <div className="p-2">
            {filteredCommands.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p className="text-sm">Aucun résultat pour &quot;{query}&quot;</p>
              </div>
            ) : (
              Object.entries(groupedCommands).map(([category, items]) => (
                <div key={category} className="mb-4">
                  <div className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {category}
                  </div>
                  {items.map((cmd, idx) => {
                    const globalIndex = filteredCommands.indexOf(cmd);
                    const isSelected = globalIndex === selectedIndex;
                    const Icon = cmd.icon;
                    
                    return (
                      <button
                        key={cmd.id}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors ${
                          isSelected 
                            ? "bg-primary text-primary-foreground" 
                            : "hover:bg-muted"
                        }`}
                        onClick={() => {
                          cmd.action();
                          onClose();
                        }}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isSelected ? "bg-primary-foreground/20" : "bg-muted"
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{cmd.title}</p>
                          {cmd.description && (
                            <p className={`text-xs truncate ${
                              isSelected ? "text-primary-foreground/70" : "text-muted-foreground"
                            }`}>
                              {cmd.description}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <div className="flex items-center gap-1 text-xs opacity-70">
                            <CornerDownLeft className="w-3 h-3" />
                            Entrée
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="px-4 py-3 border-t border-border bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-muted border text-[10px]">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-muted border text-[10px]">↓</kbd>
              naviguer
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-muted border text-[10px]">↵</kbd>
              sélectionner
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Command className="w-3 h-3" />+K pour ouvrir
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
