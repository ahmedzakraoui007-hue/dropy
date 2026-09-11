"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Save, 
  Eye, 
  Settings, 
  Layers, 
  Palette, 
  Code, 
  History,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Loader2,
  Trash2,
  GripVertical,
  Monitor,
  Smartphone,
  Tablet,
  Undo2,
  Redo2,
  Download,
  Upload,
  RefreshCw,
  Copy,
  Lock,
  Unlock,
  EyeOff,
  MoreVertical,
  Edit3,
  Check,
  Zap,
  Image as ImageIcon,
  ShoppingBag,
  Star,
  MessageSquare,
  HelpCircle,
  Clock,
  Type,
  Info,
  Mail,
  Video,
  Layout,
  LayoutGrid,
  Columns,
  Heart,
  AlertTriangle,
  Gauge,
  Command,
  Sparkles,
  PanelLeftClose,
  PanelLeft,
  PanelRightClose,
  PanelRight
} from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Reorder, AnimatePresence, useDragControls } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import SectionLibrary from "@/components/builder/SectionLibrary";
import SectionEditor from "@/components/builder/SectionEditor";
import SmartWarnings from "@/components/builder/SmartWarnings";
import CommandPalette from "@/components/builder/CommandPalette";
import PerformanceDashboard from "@/components/builder/PerformanceDashboard";
import AIAssistant from "@/components/builder/AIAssistant";
import TemplateMarketplace from "@/components/builder/TemplateMarketplace";
import { premiumTemplates } from "@/lib/templates";
import { BuilderTemplate } from "@/lib/builder-templates";

import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
  SelectSeparator 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  SECTION_LIBRARY, 
  getPlaceholderConfig 
} from "@/lib/builder-sections";
import { Badge } from "@/components/ui/badge";

const SECTION_ICONS: Record<string, any> = {
  hero: ImageIcon,
  products: ShoppingBag,
  features: Star,
  testimonials: MessageSquare,
  faq: HelpCircle,
  countdown: Clock,
  blog: Type,
    about: Info,
    contact: Mail,
    collections: LayoutGrid,
    newsletter: Mail,
    video: Video,
  product_detail: ShoppingBag,
  footer: Layout,
  product_compare: Columns,
  wishlist: Heart,
  checkout: ShoppingBag
};

interface Section {
  id: string;
  type: string;
  config: any;
  position: number;
  is_visible: boolean;
  is_locked?: boolean;
}

interface Page {
  id: string;
  name?: string;
  title?: string;
  slug: string;
  type: string;
  sections: Section[];
  is_published: boolean;
  show_in_menu?: boolean;
}

interface Store {
  id: string;
  name: string;
  slug: string;
  theme_config: any;
  seller_id: string;
}

interface HistoryItem {
  sections: Section[];
  theme_config: any;
}

// --- Sub-components for Reordering with Drag Controls ---

function SectionReorderItem({ 
  section, 
  activeSectionId, 
  setActiveSectionId, 
  toggleSectionVisibility, 
  duplicateSection, 
  toggleSectionLock, 
  removeSection,
  index,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown
}: { 
  section: Section;
  activeSectionId: string | null;
  setActiveSectionId: (id: string | null) => void;
  toggleSectionVisibility: (id: string) => void;
  duplicateSection: (s: Section) => void;
  toggleSectionLock: (id: string) => void;
  removeSection: (id: string) => void;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const controls = useDragControls();
  const Icon = SECTION_ICONS[section.type] || ImageIcon;

  return (
    <Reorder.Item 
      value={section}
      dragListener={false}
      dragControls={controls}
      layout="position"
      layoutId={section.id}
      whileDrag={{ 
        scale: 1.02, 
        boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
        zIndex: 100,
        cursor: "grabbing"
      }}
      className={`group p-2 rounded-lg border bg-card hover:border-primary/50 transition-colors cursor-pointer ${activeSectionId === section.id ? "border-primary ring-1 ring-primary/20 bg-primary/5" : "border-border"}`}
      onClick={() => setActiveSectionId(section.id)}
    >
      <div className="flex items-center gap-2">
        {!section.is_locked ? (
          <div 
            onPointerDown={(e) => controls.start(e)}
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded shrink-0"
          >
            <GripVertical className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>
        ) : (
          <div className="p-1 shrink-0">
            <Lock className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
        )}
        
        <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${activeSectionId === section.id ? "bg-primary text-white" : "bg-muted"}`}>
          <Icon className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold capitalize truncate">{section.type.replace("_", " ")}</p>
          <p className="text-[10px] text-muted-foreground truncate italic">
            {section.config?.title || "Sans titre"}
          </p>
        </div>

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex flex-col gap-0.5 mr-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-5 w-5 hover:bg-primary/10" 
              disabled={isFirst || section.is_locked}
              onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
            >
              <Plus className="w-2.5 h-2.5 rotate-0" />
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-5 w-5 hover:bg-primary/10"
              disabled={isLast || section.is_locked}
              onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
            >
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
            </Button>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              toggleSectionVisibility(section.id);
            }}
          >
            {section.is_visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-muted-foreground" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
                <MoreVertical className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => setActiveSectionId(section.id)}>
                <Edit3 className="w-4 h-4 mr-2" /> Modifier
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => duplicateSection(section)}>
                <Copy className="w-4 h-4 mr-2" /> Dupliquer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleSectionLock(section.id)}>
                {section.is_locked ? (
                  <><Unlock className="w-4 h-4 mr-2" /> Déverrouiller</>
                ) : (
                  <><Lock className="w-4 h-4 mr-2" /> Verrouiller</>
                )}
              </DropdownMenuItem>
              <SelectSeparator />
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                onClick={() => removeSection(section.id)}
              >
                <Trash2 className="w-4 h-4 mr-2" /> Supprimer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Reorder.Item>
  );
}

function PageReorderItem({ 
  page, 
  index,
  isFirst,
  isLast,
  onToggleVisibility,
  onMoveUp,
  onMoveDown
}: { 
  page: Page; 
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onToggleVisibility: (id: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const controls = useDragControls();

  return (
    <Reorder.Item 
      value={page}
      dragListener={false}
      dragControls={controls}
      className={`p-3 rounded-xl border bg-card flex items-center justify-between group transition-colors ${page.show_in_menu ? "border-primary/30 shadow-sm" : "border-border opacity-60"}`}
      whileDrag={{ 
        scale: 1.02, 
        boxShadow: "0 10px 30px -10px rgba(0,0,0,0.1)",
        borderColor: "var(--primary)",
        zIndex: 50
      }}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div 
          onPointerDown={(e) => controls.start(e)}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded shrink-0"
        >
          <GripVertical className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        <div className="flex-1 truncate">
          <p className="text-xs font-bold truncate">{page.title}</p>
          <p className="text-[10px] text-muted-foreground">/{page.slug}</p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity mr-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-5 w-5 hover:bg-primary/10" 
            disabled={isFirst}
            onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
          >
            <Plus className="w-2.5 h-2.5 rotate-0" />
            <span className="sr-only">Monter</span>
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-5 w-5 hover:bg-primary/10"
            disabled={isLast}
            onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
          >
            <span className="sr-only">Descendre</span>
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
          </Button>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 hover:bg-primary/10"
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility(page.id);
          }}
        >
          {(page.show_in_menu ?? true) ? <Eye className="w-4 h-4 text-primary" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
        </Button>
      </div>
    </Reorder.Item>
  );
}

export default function BuilderPage() {
  const router = useRouter();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [store, setStore] = useState<Store | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [currentPageSlug, setCurrentPageSlug] = useState("home");
  const [sections, setSections] = useState<Section[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [savedVersions, setSavedVersions] = useState<any[]>([]);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isWarningsOpen, setIsWarningsOpen] = useState(false);
  const [isPerformanceOpen, setIsPerformanceOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("sections");
  const [isBeginnerMode, setIsBeginnerMode] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && sections.length === 0 && !isInitialLoad) {
      setShowOnboarding(true);
    }
  }, [loading, sections.length, isInitialLoad]);

  const currentPage = pages.find(p => p.slug === currentPageSlug);
  const lastLoadedPageSlugRef = useRef<string | null>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'SECTION_ACTION') {
        const { actionType, sectionId } = event.data;
        const index = sections.findIndex(s => s.id === sectionId);
        
        if (index === -1) return;

        switch (actionType) {
          case 'MOVE_UP':
            if (index > 0) {
              const newSections = [...sections];
              [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
              setSections(newSections);
            }
            break;
          case 'MOVE_DOWN':
            if (index < sections.length - 1) {
              const newSections = [...sections];
              [newSections[index + 1], newSections[index]] = [newSections[index], newSections[index + 1]];
              setSections(newSections);
            }
            break;
          case 'DUPLICATE':
            duplicateSection(sections[index]);
            break;
          case 'DELETE':
            if (confirm("Supprimer cette section ?")) {
              setSections(sections.filter(s => s.id !== sectionId));
              if (activeSectionId === sectionId) setActiveSectionId(null);
            }
            break;
          case 'SETTINGS':
            setActiveSectionId(sectionId);
            // Scroll to section in sidebar
            document.querySelector(`[data-section-id="${sectionId}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            break;
        }
      }

      if (event.data.type === 'NAVIGATE') {
        const targetSlug = event.data.page.replace(/^\//, '') || 'home';
        
        // Find existing page
        const existingPage = pages.find(p => p.slug === targetSlug);
        if (existingPage) {
          setCurrentPageSlug(targetSlug);
          return;
        }

        // Proactive: If page doesn't exist but is a standard one, create it and navigate
        const standardTemplates: Record<string, "about" | "contact" | "product" | "checkout"> = {
          'about': 'about',
          'contact': 'contact',
          'product-detail': 'product',
          'checkout': 'checkout'
        };

        if (standardTemplates[targetSlug]) {
          addNewPage(standardTemplates[targetSlug]);
        }
      }

      if (event.data.type === 'TEXT_UPDATE') {
        const { sectionId, field, value } = event.data;
        setSections(prev => {
          const updated = prev.map(s => {
            if (s.id === sectionId) {
              const newConfig = { ...s.config };
              
              // Handle nested fields (e.g. "features.0.title")
              const parts = field.split('.');
              let current = newConfig;
              for (let i = 0; i < parts.length - 1; i++) {
                if (!current[parts[i]]) current[parts[i]] = {};
                current[parts[i]] = { ...current[parts[i]] };
                current = current[parts[i]];
              }
              current[parts[parts.length - 1]] = value;
              
              return { ...s, config: newConfig };
            }
            return s;
          });
          return updated;
        });
        toast.success("Texte mis à jour", { duration: 1000 });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [pages]);

  // When current page slug changes, update sections state
  useEffect(() => {
    if (currentPage && lastLoadedPageSlugRef.current !== currentPageSlug) {
      setSections(currentPage.sections || []);
      setActiveSectionId(null);
      lastLoadedPageSlugRef.current = currentPageSlug;
    }
  }, [currentPageSlug, currentPage]);

  useEffect(() => {
    async function loadStoreAndPages() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: stores } = await supabase
        .from("stores")
        .select("*")
        .eq("vendor_id", user.id)
        .order("created_at", { ascending: false });

      const storeData = stores?.[0];

      if (!storeData) {
        router.push("/seller/store/create");
        return;
      }

      setStore(storeData);

      // Load pages
      const { data: pagesData } = await supabase
        .from("store_pages")
        .select("*")
        .eq("store_id", storeData.id)
        .order("position", { ascending: true });

      if (pagesData && pagesData.length > 0) {
        setPages(pagesData);
        const homePage = pagesData.find(p => p.slug === "home") || pagesData[0];
        setCurrentPageSlug(homePage.slug);
        setSections(homePage.sections || []);
      } else {
        // Create default home page if none exists (should be handled by SQL migration but just in case)
        const defaultPage: Page = {
          id: crypto.randomUUID(),
          name: "Accueil",
          slug: "home",
          type: "home",
          sections: [],
          is_published: true
        };
        setPages([defaultPage]);
        setSections([]);
      }
      
      setIsInitialLoad(false);
      setLoading(false);

      // Load saved versions
      const { data: versions } = await supabase
        .from("store_versions")
        .select("*")
        .eq("store_id", storeData.id)
        .order("created_at", { ascending: false })
        .limit(10);
      
      setSavedVersions(versions || []);
    }

    loadStoreAndPages();
  }, [router]);

  // Consolidate pages sync and preview updates
  useEffect(() => {
    if (isInitialLoad || loading) return;

    // Update pages array when sections change
    if (currentPageSlug) {
      setPages(prev => {
        const pageIndex = prev.findIndex(p => p.slug === currentPageSlug);
        if (pageIndex === -1) return prev;
        
        const currentPage = prev[pageIndex];
        if (JSON.stringify(currentPage.sections) !== JSON.stringify(sections)) {
          const newPages = [...prev];
          newPages[pageIndex] = { ...currentPage, sections };
          return newPages;
        }
        return prev;
      });
    }

    // Send updates to iframe for live preview - IMMEDIATE for real-time feel
    const sendUpdate = () => {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          type: 'STORE_UPDATE',
          sections,
          theme_config: store?.theme_config,
          pages,
          page: currentPageSlug
        }, '*');
      }
    };

    // Send immediately for real-time preview
    sendUpdate();

    // Debounce history recording
    const historyTimeoutId = setTimeout(() => {
      const currentSnapshot = history[historyIndex];
      const newSnapshot = { sections, theme_config: store?.theme_config };

      if (JSON.stringify(currentSnapshot) !== JSON.stringify(newSnapshot)) {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newSnapshot);
        if (newHistory.length > 50) newHistory.shift();
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      }
    }, 500);

    return () => {
      clearTimeout(historyTimeoutId);
    };
  }, [sections, store?.theme_config, isInitialLoad, loading, currentPageSlug]);

  // Auto-save logic
  useEffect(() => {
    if (isInitialLoad || loading || !store) return;
    
    const autoSaveTimeoutId = setTimeout(() => {
      handleSave(true); // Call with silent=true
    }, 5000); // Auto-save after 5 seconds of inactivity

    return () => clearTimeout(autoSaveTimeoutId);
  }, [pages, store?.theme_config]);

  // Separate effect to handle external pages updates if they happen
  useEffect(() => {
    if (isInitialLoad || loading) return;
    
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'STORE_UPDATE',
        sections,
        theme_config: store?.theme_config,
        pages,
        page: currentPageSlug
      }, '*');
    }
  }, [pages]);

  async function handleSave(silent = false) {
    if (!store) return;
    if (!silent) setSaving(true);
    const supabase = createClient();

    try {
      // First, get existing pages to include their IDs
      const { data: existingPages } = await supabase
        .from("store_pages")
        .select("id, slug")
        .eq("store_id", store.id);

      const existingMap = new Map(existingPages?.map(p => [p.slug, p.id]) || []);

      const pagesToUpsert = pages.map((page, index) => ({
        ...(existingMap.has(page.slug) ? { id: existingMap.get(page.slug) } : {}),
        store_id: store.id,
          slug: page.slug,
          title: page.title,
          type: page.type,
        sections: page.sections,
        is_published: page.is_published,
        show_in_menu: page.show_in_menu ?? true,
        position: index
      }));

      const { error: pagesError } = await supabase
        .from("store_pages")
        .upsert(pagesToUpsert, { onConflict: 'store_id,slug' });
      
      if (pagesError) throw pagesError;
      
      const { error: storeError } = await supabase
        .from("stores")
        .update({ theme_config: store.theme_config })
        .eq("id", store.id);

      if (storeError) throw storeError;

      if (!silent) toast.success("Boutique enregistrée !");
    } catch (error: any) {
      console.error("Save error:", error);
      const message = error?.message || error?.details || JSON.stringify(error) || "Erreur inconnue";
      if (!silent) toast.error(`Erreur: ${message}`);
    } finally {
      if (!silent) setSaving(false);
    }
  }

    const handleIframeLoad = () => {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage({
          type: 'STORE_UPDATE',
          sections,
          theme_config: store?.theme_config,
          pages,
          page: currentPageSlug
        }, '*');
      }
    };

  function undo() {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setSections(prev.sections);
      if (store) setStore({ ...store, theme_config: prev.theme_config });
      setHistoryIndex(historyIndex - 1);
    }
  }

  function redo() {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setSections(next.sections);
      if (store) setStore({ ...store, theme_config: next.theme_config });
      setHistoryIndex(historyIndex + 1);
    }
  }

  async function saveVersion() {
    if (!store) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    try {
      const { data, error } = await supabase
        .from("store_versions")
        .insert({
          store_id: store.id,
          sections_snapshot: sections,
          theme_config_snapshot: store.theme_config,
          created_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;
      setSavedVersions([data, ...savedVersions]);
      toast.success("Version sauvegardée !");
    } catch (error) {
      toast.error("Erreur lors de la sauvegarde de la version");
    }
  }

  async function restoreVersion(version: any) {
    if (confirm("Restaurer cette version ? Les changements non enregistrés seront perdus.")) {
      setSections(version.sections_snapshot);
      if (store) setStore({ ...store, theme_config: version.theme_config_snapshot });
      toast.success("Version restaurée !");
    }
  }

  const exportTheme = () => {
    const data = {
      name: `${store?.name} Theme Export`,
      pages,
      theme_config: store?.theme_config,
      exported_at: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `theme-${store?.slug || "export"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importTheme = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.pages && data.theme_config) {
          setPages(data.pages);
          const homePage = data.pages.find((p: any) => p.slug === "home") || data.pages[0];
          setCurrentPageSlug(homePage.slug);
          setSections(homePage.sections || []);
          if (store) setStore({ ...store, theme_config: data.theme_config });
          toast.success("Thème importé avec succès !");
        } else {
          throw new Error("Format de fichier invalide");
        }
      } catch (error) {
        toast.error("Erreur lors de l'importation du thème");
      }
    };
    reader.readAsText(file);
  };

  function addSection(type: string) {
    const newSection: Section = {
      id: crypto.randomUUID(),
      type,
      config: getPlaceholderConfig(type),
      position: sections.length,
      is_visible: true
    };
    const updatedSections = [...sections, newSection];
    setSections(updatedSections);
    setPages(prev => prev.map(p => p.slug === currentPageSlug ? { ...p, sections: updatedSections } : p));
    setActiveSectionId(newSection.id);
  }

  function duplicateSection(section: Section) {
    const newSection: Section = {
      ...section,
      id: crypto.randomUUID(),
      position: sections.length
    };
    const updatedSections = [...sections, newSection];
    setSections(updatedSections);
    setPages(prev => prev.map(p => p.slug === currentPageSlug ? { ...p, sections: updatedSections } : p));
    setActiveSectionId(newSection.id);
    toast.success("Section dupliquée !");
  }

  function toggleSectionVisibility(id: string) {
    const updatedSections = sections.map(s => s.id === id ? { ...s, is_visible: !s.is_visible } : s);
    setSections(updatedSections);
    setPages(prev => prev.map(p => p.slug === currentPageSlug ? { ...p, sections: updatedSections } : p));
  }

  function toggleSectionLock(id: string) {
    const updatedSections = sections.map(s => s.id === id ? { ...s, is_locked: !s.is_locked } : s);
    setSections(updatedSections);
    setPages(prev => prev.map(p => p.slug === currentPageSlug ? { ...p, sections: updatedSections } : p));
  }

  function togglePagePublish(slug: string, is_published: boolean) {
    setPages(prev => prev.map(p => p.slug === slug ? { ...p, is_published } : p));
  }

  async function addNewPage(templateType?: "shop" | "about" | "contact" | "product" | "checkout" | "merci" | "shipping_policy" | "refund_policy" | "privacy_policy" | "terms_conditions" | "faq") {
    let name = "";
    let slug = "";
    let type = "custom";
    let templateSections: any[] = [];
    let show_in_menu = true;

      if (templateType === "shop") {
        name = "Boutique";
        slug = "shop";
        templateSections = [
          { id: crypto.randomUUID(), type: "hero", config: { ...getPlaceholderConfig("hero"), title: "Notre Boutique", subtitle: "Découvrez notre collection complète", variant: "classic", height: 300, badge: "SHOP" }, position: 0, is_visible: true },
          { id: crypto.randomUUID(), type: "products", config: { ...getPlaceholderConfig("products"), title: "Tous nos produits", limit: 20, columns: 4 }, position: 1, is_visible: true },
          { id: crypto.randomUUID(), type: "trust_badges", config: { ...getPlaceholderConfig("trust_badges"), layout: 'row' }, position: 2, is_visible: true },
          { id: crypto.randomUUID(), type: "footer", config: getPlaceholderConfig("footer"), position: 3, is_visible: true }
        ];
      } else if (templateType === "about") {
        name = "À Propos";
        slug = "about";
        templateSections = [
          { id: crypto.randomUUID(), type: "hero", config: { ...getPlaceholderConfig("hero"), title: "Notre Histoire", variant: "classic", height: 400, badge: "DÉCOUVREZ NOTRE MISSION" }, position: 0, is_visible: true },
          { id: crypto.randomUUID(), type: "about", config: getPlaceholderConfig("about"), position: 1, is_visible: true },
          { id: crypto.randomUUID(), type: "stats", config: getPlaceholderConfig("stats"), position: 2, is_visible: true },
          { id: crypto.randomUUID(), type: "team", config: getPlaceholderConfig("team"), position: 3, is_visible: true },
          { id: crypto.randomUUID(), type: "trust_badges", config: { ...getPlaceholderConfig("trust_badges"), layout: 'row' }, position: 4, is_visible: true },
          { id: crypto.randomUUID(), type: "footer", config: getPlaceholderConfig("footer"), position: 5, is_visible: true }
        ];
      } else if (templateType === "contact") {
        name = "Contact";
        slug = "contact";
        templateSections = [
          { id: crypto.randomUUID(), type: "hero", config: { ...getPlaceholderConfig("hero"), title: "Contactez-Nous", variant: "classic", height: 300, badge: "DISPONIBLE 7J/7" }, position: 0, is_visible: true },
          { id: crypto.randomUUID(), type: "contact", config: getPlaceholderConfig("contact"), position: 1, is_visible: true },
          { id: crypto.randomUUID(), type: "faq", config: getPlaceholderConfig("faq"), position: 2, is_visible: true },
          { id: crypto.randomUUID(), type: "trust_badges", config: { ...getPlaceholderConfig("trust_badges"), layout: 'row' }, position: 3, is_visible: true },
          { id: crypto.randomUUID(), type: "footer", config: getPlaceholderConfig("footer"), position: 4, is_visible: true }
        ];
      } else if (templateType === "product") {
        name = "Détail Produit";
        slug = "product-detail";
        templateSections = [
          { id: crypto.randomUUID(), type: "product_detail", config: getPlaceholderConfig("product_detail"), position: 0, is_visible: true },
          { id: crypto.randomUUID(), type: "trust_badges", config: { ...getPlaceholderConfig("trust_badges"), layout: 'row' }, position: 1, is_visible: true },
          { id: crypto.randomUUID(), type: "recommended_products", config: getPlaceholderConfig("recommended_products"), position: 2, is_visible: true },
          { id: crypto.randomUUID(), type: "faq", config: getPlaceholderConfig("faq"), position: 3, is_visible: true },
          { id: crypto.randomUUID(), type: "footer", config: getPlaceholderConfig("footer"), position: 4, is_visible: true }
        ];
      } else if (templateType === "checkout") {
        name = "Commande";
        slug = "checkout";
        show_in_menu = false;
        templateSections = [
          { id: crypto.randomUUID(), type: "checkout", config: getPlaceholderConfig("checkout"), position: 0, is_visible: true },
          { id: crypto.randomUUID(), type: "trust_badges", config: { ...getPlaceholderConfig("trust_badges"), title: "Paiement 100% Sécurisé", layout: 'row' }, position: 1, is_visible: true },
          { id: crypto.randomUUID(), type: "footer", config: getPlaceholderConfig("footer"), position: 2, is_visible: true }
        ];
      } else if (templateType === "merci") {
        name = "Merci";
        slug = "merci";
        show_in_menu = false;
        templateSections = [
          { 
            id: crypto.randomUUID(), 
            type: "hero", 
            config: { 
              ...getPlaceholderConfig("hero"), 
              title: "Merci pour votre commande !", 
              subtitle: "Votre commande a été enregistrée avec succès. Vous recevrez un SMS de confirmation sous peu.",
              ctaText: "Retour à l'accueil",
              ctaLink: "/",
              variant: "classic",
              height: 500,
              badge: "COMMANDE CONFIRMÉE"
            }, 
            position: 0, 
            is_visible: true 
          },
          { id: crypto.randomUUID(), type: "trust_badges", config: { ...getPlaceholderConfig("trust_badges"), layout: 'row' }, position: 1, is_visible: true },
          { id: crypto.randomUUID(), type: "footer", config: getPlaceholderConfig("footer"), position: 2, is_visible: true }
        ];
      } else if (templateType === "shipping_policy") {
        name = "Livraison";
        slug = "shipping-policy";
        templateSections = [
          { id: crypto.randomUUID(), type: "hero", config: { ...getPlaceholderConfig("hero"), title: "Livraison & Délais", height: 250, badge: "INFOS LIVRAISON" }, position: 0, is_visible: true },
          { id: crypto.randomUUID(), type: "shipping_policy", config: getPlaceholderConfig("shipping_policy"), position: 1, is_visible: true },
          { id: crypto.randomUUID(), type: "trust_badges", config: { ...getPlaceholderConfig("trust_badges"), layout: 'row' }, position: 2, is_visible: true },
          { id: crypto.randomUUID(), type: "footer", config: getPlaceholderConfig("footer"), position: 3, is_visible: true }
        ];
      } else if (templateType === "refund_policy") {
        name = "Retours & Remboursements";
        slug = "refund-policy";
        templateSections = [
          { id: crypto.randomUUID(), type: "hero", config: { ...getPlaceholderConfig("hero"), title: "Retours", height: 250, badge: "GARANTIE SATISFAIT" }, position: 0, is_visible: true },
          { id: crypto.randomUUID(), type: "refund_policy", config: getPlaceholderConfig("refund_policy"), position: 1, is_visible: true },
          { id: crypto.randomUUID(), type: "trust_badges", config: { ...getPlaceholderConfig("trust_badges"), layout: 'row' }, position: 2, is_visible: true },
          { id: crypto.randomUUID(), type: "footer", config: getPlaceholderConfig("footer"), position: 3, is_visible: true }
        ];
      } else if (templateType === "privacy_policy") {
        name = "Confidentialité";
        slug = "privacy-policy";
        templateSections = [
          { id: crypto.randomUUID(), type: "hero", config: { ...getPlaceholderConfig("hero"), title: "Confidentialité", height: 250, badge: "VOS DONNÉES SONT SURES" }, position: 0, is_visible: true },
          { id: crypto.randomUUID(), type: "privacy_policy", config: getPlaceholderConfig("privacy_policy"), position: 1, is_visible: true },
          { id: crypto.randomUUID(), type: "footer", config: getPlaceholderConfig("footer"), position: 2, is_visible: true }
        ];
      } else if (templateType === "terms_conditions") {
        name = "Conditions Générales";
        slug = "terms-conditions";
        templateSections = [
          { id: crypto.randomUUID(), type: "hero", config: { ...getPlaceholderConfig("hero"), title: "CGV", height: 250, badge: "CADRE LÉGAL" }, position: 0, is_visible: true },
          { id: crypto.randomUUID(), type: "terms_conditions", config: getPlaceholderConfig("terms_conditions"), position: 1, is_visible: true },
          { id: crypto.randomUUID(), type: "footer", config: getPlaceholderConfig("footer"), position: 2, is_visible: true }
        ];
      } else if (templateType === "faq") {
        name = "FAQ";
        slug = "faq";
        templateSections = [
          { id: crypto.randomUUID(), type: "hero", config: { ...getPlaceholderConfig("hero"), title: "Questions Fréquentes", height: 250, badge: "AIDE & SUPPORT" }, position: 0, is_visible: true },
          { id: crypto.randomUUID(), type: "faq", config: getPlaceholderConfig("faq"), position: 1, is_visible: true },
          { id: crypto.randomUUID(), type: "trust_badges", config: { ...getPlaceholderConfig("trust_badges"), layout: 'row' }, position: 2, is_visible: true },
          { id: crypto.randomUUID(), type: "footer", config: getPlaceholderConfig("footer"), position: 3, is_visible: true }
        ];
      }
    
    if (pages.some(p => p.slug === slug)) {
      if (!templateType) toast.error("Une page avec ce slug existe déjà.");
      return pages.find(p => p.slug === slug);
    }

    const newPage: Page = {
      id: crypto.randomUUID(),
      name,
      slug,
      type: templateType || "custom",
      sections: templateSections,
      is_published: true,
      show_in_menu
    };

    setPages(prev => [...prev, newPage]);
    setCurrentPageSlug(slug);
    setSections(templateSections);
    if (!templateType) toast.success(`Page ${name} ajoutée !`);
    return newPage;
  }

    const generateAllEssentialPages = async () => {
      const essentialTypes: ("shop" | "about" | "contact" | "product" | "checkout" | "merci" | "shipping_policy" | "refund_policy" | "privacy_policy" | "terms_conditions" | "faq")[] = [
        "shop", "about", "contact", "product", "checkout", "merci", "shipping_policy", "refund_policy", "privacy_policy", "terms_conditions", "faq"
      ];
      
      toast.info("Génération des pages essentielles...");
      
      setPages(prev => {
        const newPages = [...prev];
        
        // Ensure Home exists
        if (!newPages.find(p => p.slug === 'home')) {
          const homeSections = [
            { id: crypto.randomUUID(), type: "hero", config: { ...getPlaceholderConfig("hero"), title: `Bienvenue chez ${store?.name}`, subtitle: "Les meilleurs produits en un seul clic.", variant: "bold" }, position: 0, is_visible: true },
            { id: crypto.randomUUID(), type: "collections", config: getPlaceholderConfig("collections"), position: 1, is_visible: true },
            { id: crypto.randomUUID(), type: "products", config: { ...getPlaceholderConfig("products"), title: "Meilleures Ventes", limit: 4 }, position: 2, is_visible: true },
            { id: crypto.randomUUID(), type: "trust_badges", config: { ...getPlaceholderConfig("trust_badges"), layout: 'row' }, position: 3, is_visible: true },
            { id: crypto.randomUUID(), type: "footer", config: getPlaceholderConfig("footer"), position: 4, is_visible: true }
          ];
          newPages.push({
            id: crypto.randomUUID(),
            name: "Accueil",
            slug: "home",
            type: "home",
            sections: homeSections,
            is_published: true,
            show_in_menu: true
          });
        }

        // Add missing essential pages
        for (const type of essentialTypes) {
          const config = getPageTemplateConfig(type, store?.name || "Boutique");
          if (!newPages.find(p => p.slug === config.slug)) {
            newPages.push({
              id: crypto.randomUUID(),
              name: config.name,
              slug: config.slug,
              type: type,
              sections: config.sections,
              is_published: true,
              show_in_menu: config.show_in_menu
            });
          }
        }
        
        return newPages;
      });
      
      setCurrentPageSlug("home");
      toast.success("Toutes les pages essentielles ont été générées !");
    };

    // Helper to get page template config (extracted from addNewPage logic)
    function getPageTemplateConfig(templateType: string, storeName: string) {
      let name = "";
      let slug = "";
      let sections: any[] = [];
      let show_in_menu = true;

      switch(templateType) {
        case "shop":
          name = "Boutique";
          slug = "shop";
          sections = [
            { id: crypto.randomUUID(), type: "hero", config: { ...getPlaceholderConfig("hero"), title: "Notre Boutique", subtitle: "Découvrez notre collection complète", variant: "classic", height: 300, badge: "SHOP" }, position: 0, is_visible: true },
            { id: crypto.randomUUID(), type: "products", config: { ...getPlaceholderConfig("products"), title: "Tous nos produits", limit: 20, columns: 4 }, position: 1, is_visible: true },
            { id: crypto.randomUUID(), type: "trust_badges", config: { ...getPlaceholderConfig("trust_badges"), layout: 'row' }, position: 2, is_visible: true },
            { id: crypto.randomUUID(), type: "footer", config: getPlaceholderConfig("footer"), position: 3, is_visible: true }
          ];
          break;
        case "about":
          name = "À Propos";
          slug = "about";
          sections = [
            { id: crypto.randomUUID(), type: "hero", config: { ...getPlaceholderConfig("hero"), title: "Notre Histoire", variant: "classic", height: 400, badge: "DÉCOUVREZ NOTRE MISSION" }, position: 0, is_visible: true },
            { id: crypto.randomUUID(), type: "about", config: getPlaceholderConfig("about"), position: 1, is_visible: true },
            { id: crypto.randomUUID(), type: "stats", config: getPlaceholderConfig("stats"), position: 2, is_visible: true },
            { id: crypto.randomUUID(), type: "team", config: getPlaceholderConfig("team"), position: 3, is_visible: true },
            { id: crypto.randomUUID(), type: "trust_badges", config: { ...getPlaceholderConfig("trust_badges"), layout: 'row' }, position: 4, is_visible: true },
            { id: crypto.randomUUID(), type: "footer", config: getPlaceholderConfig("footer"), position: 5, is_visible: true }
          ];
          break;
        case "contact":
          name = "Contact";
          slug = "contact";
          sections = [
            { id: crypto.randomUUID(), type: "hero", config: { ...getPlaceholderConfig("hero"), title: "Contactez-Nous", variant: "classic", height: 300, badge: "DISPONIBLE 7J/7" }, position: 0, is_visible: true },
            { id: crypto.randomUUID(), type: "contact", config: getPlaceholderConfig("contact"), position: 1, is_visible: true },
            { id: crypto.randomUUID(), type: "faq", config: getPlaceholderConfig("faq"), position: 2, is_visible: true },
            { id: crypto.randomUUID(), type: "trust_badges", config: { ...getPlaceholderConfig("trust_badges"), layout: 'row' }, position: 3, is_visible: true },
            { id: crypto.randomUUID(), type: "footer", config: getPlaceholderConfig("footer"), position: 4, is_visible: true }
          ];
          break;
        case "product":
          name = "Détail Produit";
          slug = "product-detail";
          sections = [
            { id: crypto.randomUUID(), type: "product_detail", config: getPlaceholderConfig("product_detail"), position: 0, is_visible: true },
            { id: crypto.randomUUID(), type: "trust_badges", config: { ...getPlaceholderConfig("trust_badges"), layout: 'row' }, position: 1, is_visible: true },
            { id: crypto.randomUUID(), type: "recommended_products", config: getPlaceholderConfig("recommended_products"), position: 2, is_visible: true },
            { id: crypto.randomUUID(), type: "faq", config: getPlaceholderConfig("faq"), position: 3, is_visible: true },
            { id: crypto.randomUUID(), type: "footer", config: getPlaceholderConfig("footer"), position: 4, is_visible: true }
          ];
          break;
        case "checkout":
          name = "Commande";
          slug = "checkout";
          show_in_menu = false;
          sections = [
            { id: crypto.randomUUID(), type: "checkout", config: getPlaceholderConfig("checkout"), position: 0, is_visible: true },
            { id: crypto.randomUUID(), type: "trust_badges", config: { ...getPlaceholderConfig("trust_badges"), title: "Paiement 100% Sécurisé", layout: 'row' }, position: 1, is_visible: true },
            { id: crypto.randomUUID(), type: "footer", config: getPlaceholderConfig("footer"), position: 2, is_visible: true }
          ];
          break;
        case "merci":
          name = "Merci";
          slug = "merci";
          show_in_menu = false;
          sections = [
            { id: crypto.randomUUID(), type: "hero", config: { ...getPlaceholderConfig("hero"), title: "Merci pour votre commande !", subtitle: "Votre commande a été enregistrée avec succès. Vous recevrez un SMS de confirmation sous peu.", ctaText: "Retour à l'accueil", ctaLink: "/", variant: "classic", height: 500, badge: "COMMANDE CONFIRMÉE" }, position: 0, is_visible: true },
            { id: crypto.randomUUID(), type: "trust_badges", config: { ...getPlaceholderConfig("trust_badges"), layout: 'row' }, position: 1, is_visible: true },
            { id: crypto.randomUUID(), type: "footer", config: getPlaceholderConfig("footer"), position: 2, is_visible: true }
          ];
          break;
        case "shipping_policy":
          name = "Livraison";
          slug = "shipping-policy";
          sections = [
            { id: crypto.randomUUID(), type: "hero", config: { ...getPlaceholderConfig("hero"), title: "Livraison & Délais", height: 250, badge: "INFOS LIVRAISON" }, position: 0, is_visible: true },
            { id: crypto.randomUUID(), type: "shipping_policy", config: getPlaceholderConfig("shipping_policy"), position: 1, is_visible: true },
            { id: crypto.randomUUID(), type: "trust_badges", config: { ...getPlaceholderConfig("trust_badges"), layout: 'row' }, position: 2, is_visible: true },
            { id: crypto.randomUUID(), type: "footer", config: getPlaceholderConfig("footer"), position: 3, is_visible: true }
          ];
          break;
        case "refund_policy":
          name = "Retours";
          slug = "refund-policy";
          sections = [
            { id: crypto.randomUUID(), type: "hero", config: { ...getPlaceholderConfig("hero"), title: "Retours", height: 250, badge: "GARANTIE SATISFAIT" }, position: 0, is_visible: true },
            { id: crypto.randomUUID(), type: "refund_policy", config: getPlaceholderConfig("refund_policy"), position: 1, is_visible: true },
            { id: crypto.randomUUID(), type: "trust_badges", config: { ...getPlaceholderConfig("trust_badges"), layout: 'row' }, position: 2, is_visible: true },
            { id: crypto.randomUUID(), type: "footer", config: getPlaceholderConfig("footer"), position: 3, is_visible: true }
          ];
          break;
        case "privacy_policy":
          name = "Confidentialité";
          slug = "privacy-policy";
          sections = [
            { id: crypto.randomUUID(), type: "hero", config: { ...getPlaceholderConfig("hero"), title: "Confidentialité", height: 250, badge: "VOS DONNÉES SONT SURES" }, position: 0, is_visible: true },
            { id: crypto.randomUUID(), type: "privacy_policy", config: getPlaceholderConfig("privacy_policy"), position: 1, is_visible: true },
            { id: crypto.randomUUID(), type: "footer", config: getPlaceholderConfig("footer"), position: 2, is_visible: true }
          ];
          break;
        case "terms_conditions":
          name = "Conditions Générales";
          slug = "terms-conditions";
          sections = [
            { id: crypto.randomUUID(), type: "hero", config: { ...getPlaceholderConfig("hero"), title: "CGV", height: 250, badge: "CADRE LÉGAL" }, position: 0, is_visible: true },
            { id: crypto.randomUUID(), type: "terms_conditions", config: getPlaceholderConfig("terms_conditions"), position: 1, is_visible: true },
            { id: crypto.randomUUID(), type: "footer", config: getPlaceholderConfig("footer"), position: 2, is_visible: true }
          ];
          break;
        case "faq":
          name = "FAQ";
          slug = "faq";
          sections = [
            { id: crypto.randomUUID(), type: "hero", config: { ...getPlaceholderConfig("hero"), title: "Questions Fréquentes", height: 250, badge: "AIDE & SUPPORT" }, position: 0, is_visible: true },
            { id: crypto.randomUUID(), type: "faq", config: getPlaceholderConfig("faq"), position: 1, is_visible: true },
            { id: crypto.randomUUID(), type: "trust_badges", config: { ...getPlaceholderConfig("trust_badges"), layout: 'row' }, position: 2, is_visible: true },
            { id: crypto.randomUUID(), type: "footer", config: getPlaceholderConfig("footer"), position: 3, is_visible: true }
          ];
          break;
        default:
          name = "Nouvelle Page";
          slug = "new-page-" + Math.random().toString(36).substr(2, 5);
          sections = [];
      }

      return { name, slug, sections, show_in_menu };
    }


  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
        {/* Command Palette */}
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          pages={pages}
          sections={sections}
          onNavigateToPage={setCurrentPageSlug}
          onNavigateToSection={(id) => setActiveSectionId(id)}
          onAddSection={addSection}
          onOpenSettings={(tab) => setActiveTab(tab)}
          onSave={handleSave}
          onPreview={() => window.open(`/preview/${store?.slug}`, '_blank')}
        />

        {/* Warnings Dialog */}
        <Dialog open={isWarningsOpen} onOpenChange={setIsWarningsOpen}>
          <DialogContent className="max-w-lg p-0 h-[70vh] overflow-hidden flex flex-col">
            <DialogHeader className="sr-only">
              <DialogTitle>Avertissements</DialogTitle>
            </DialogHeader>
            <SmartWarnings
              sections={sections}
              pages={pages}
              store={store}
              onNavigateToSection={(id) => {
                setActiveSectionId(id);
                setIsWarningsOpen(false);
              }}
              onFixApplied={() => {}}
            />
          </DialogContent>
        </Dialog>

        {/* Performance Dialog */}
        <Dialog open={isPerformanceOpen} onOpenChange={setIsPerformanceOpen}>
          <DialogContent className="max-w-lg p-0 h-[70vh] overflow-hidden flex flex-col">
            <DialogHeader className="sr-only">
              <DialogTitle>Performance</DialogTitle>
            </DialogHeader>
            <PerformanceDashboard
              sections={sections}
              store={store}
              onOpenSettings={(tab) => {
                setActiveTab(tab);
                setIsPerformanceOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>

          <Dialog open={isLibraryOpen} onOpenChange={setIsLibraryOpen}>
            <DialogContent className="max-w-[95vw] lg:max-w-7xl p-0 h-[90vh] overflow-hidden flex flex-col rounded-[2.5rem] border-none shadow-2xl">
              <DialogHeader className="sr-only">
                <DialogTitle>Bibliothèque de Sections</DialogTitle>
                <DialogDescription>
                  Ajoutez de nouvelles sections à votre page de boutique.
                </DialogDescription>
              </DialogHeader>

            <div className="flex-1 overflow-hidden">
              <SectionLibrary 
                onAdd={(type) => {
                  addSection(type);
                  setIsLibraryOpen(false);
                }} 
                onClose={() => setIsLibraryOpen(false)} 
              />
            </div>
          </DialogContent>
        </Dialog>

      <div className="h-16 border-b border-border bg-card px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <div className="h-4 w-[1px] bg-border" />
          <h1 className="font-bold">{store?.name}</h1>
          <div className="flex items-center gap-2 bg-muted p-1 rounded-full ml-4">
            <Button 
              variant={isBeginnerMode ? "secondary" : "ghost"} 
              size="sm" 
              className="rounded-full text-[10px] h-6"
              onClick={() => setIsBeginnerMode(true)}
            >
              Débutant
            </Button>
            <Button 
              variant={!isBeginnerMode ? "secondary" : "ghost"} 
              size="sm" 
              className="rounded-full text-[10px] h-6"
              onClick={() => setIsBeginnerMode(false)}
            >
              Avancé
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
          <Button variant="ghost" size="sm" onClick={undo} disabled={historyIndex <= 0}>
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1}>
            <Redo2 className="w-4 h-4" />
          </Button>
          <div className="h-4 w-[1px] bg-border mx-1" />
          <Button variant={viewMode === "desktop" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("desktop")}>
            <Monitor className="w-4 h-4" />
          </Button>
          <Button variant={viewMode === "tablet" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("tablet")}>
            <Tablet className="w-4 h-4" />
          </Button>
          <Button variant={viewMode === "mobile" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("mobile")}>
            <Smartphone className="w-4 h-4" />
          </Button>
        </div>

            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsCommandPaletteOpen(true)}
                className="gap-2"
              >
                <Command className="w-4 h-4" />
                <span className="hidden lg:inline">Recherche</span>
                <kbd className="hidden lg:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">⌘K</kbd>
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 border-violet-500/50 text-violet-600 hover:bg-violet-50">
                    <Sparkles className="w-4 h-4" />
                    <span className="hidden lg:inline">Design & AI</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => setIsAIAssistantOpen(true)}>
                    <Sparkles className="w-4 h-4 mr-2 text-violet-500" /> Assistant AI
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsTemplatesOpen(true)}>
                    <Layout className="w-4 h-4 mr-2" /> Templates Premium
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsLibraryOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Bibliothèque Sections
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Gauge className="w-4 h-4" />
                    <span className="hidden lg:inline">Optimisation</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => setIsWarningsOpen(true)}>
                    <AlertTriangle className="w-4 h-4 mr-2 text-yellow-500" /> Vérifier les erreurs
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsPerformanceOpen(true)}>
                    <Gauge className="w-4 h-4 mr-2 text-emerald-500" /> Score de Performance
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="h-4 w-[1px] bg-border hidden lg:block" />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Eye className="w-4 h-4" />
                    <span className="hidden lg:inline">Aperçu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => window.open(`/preview/${store?.slug}`, '_blank')}>
                    <Eye className="w-4 h-4 mr-2" /> Ouvrir dans un onglet
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleIframeLoad}>
                    <RefreshCw className="w-4 h-4 mr-2" /> Actualiser l'aperçu
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button size="sm" onClick={() => handleSave()} disabled={saving} className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Enregistrer
              </Button>
            </div>

      </div>

<div className="flex flex-1 overflow-hidden min-h-0">
          {/* Left Sidebar - Collapsible */}
          <div className={`border-r border-border bg-card flex flex-col shrink-0 min-h-0 transition-all duration-300 relative ${isSidebarCollapsed ? 'w-0 overflow-hidden' : 'w-80'}`}>
            {/* Toggle button for left sidebar */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="absolute -right-3 top-1/2 -translate-y-1/2 z-50 w-6 h-12 bg-card border border-border rounded-r-lg flex items-center justify-center hover:bg-muted transition-colors shadow-sm"
              title={isSidebarCollapsed ? "Afficher le panneau" : "Masquer le panneau"}
            >
              {isSidebarCollapsed ? <PanelLeft className="w-3 h-3" /> : <PanelLeftClose className="w-3 h-3" />}
            </button>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden min-h-0">
                <TabsList className="grid grid-cols-5 rounded-none border-b border-border bg-card h-12">
                  <TabsTrigger value="sections" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                    <div className="flex flex-col items-center gap-0.5">
                      <Layers className="w-4 h-4" />
                      {isBeginnerMode && <span className="text-[8px] font-bold uppercase">Sections</span>}
                    </div>
                  </TabsTrigger>
                  <TabsTrigger value="pages" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                    <div className="flex flex-col items-center gap-0.5">
                      <Layout className="w-4 h-4" />
                      {isBeginnerMode && <span className="text-[8px] font-bold uppercase">Pages</span>}
                    </div>
                  </TabsTrigger>
                  <TabsTrigger value="navigation" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                    <div className="flex flex-col items-center gap-0.5">
                      <GripVertical className="w-4 h-4" />
                      {isBeginnerMode && <span className="text-[8px] font-bold uppercase">Menu</span>}
                    </div>
                  </TabsTrigger>
                  <TabsTrigger value="theme" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                    <div className="flex flex-col items-center gap-0.5">
                      <Palette className="w-4 h-4" />
                      {isBeginnerMode && <span className="text-[8px] font-bold uppercase">Style</span>}
                    </div>
                  </TabsTrigger>
                  <TabsTrigger value="launch" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                    <div className="flex flex-col items-center gap-0.5">
                      <Sparkles className="w-4 h-4" />
                      {isBeginnerMode && <span className="text-[8px] font-bold uppercase">Lancer</span>}
                    </div>
                  </TabsTrigger>
                </TabsList>

              <TabsContent value="sections" className="flex-1 overflow-hidden flex flex-col m-0">
                <div className="p-4 border-b border-border space-y-4 bg-muted/20">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Page en cours</Label>
                    <Select value={currentPageSlug} onValueChange={setCurrentPageSlug}>
                      <SelectTrigger className="w-full bg-background h-10">
                        <SelectValue placeholder="Choisir une page" />
                      </SelectTrigger>
                      <SelectContent>
                        {pages.map(page => (
                          <SelectItem key={page.id} value={page.slug}>
                            <div className="flex items-center gap-2">
                              <span>{page.slug === 'home' ? '🏠' : page.slug === 'shop' ? '🛍️' : '📄'}</span>
                              <span>{page.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <ScrollArea className="flex-1 h-full">
                  <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm">Structure de la page</h3>
                      <Button variant="outline" size="sm" onClick={() => setIsLibraryOpen(true)}>
                        <Plus className="w-4 h-4 mr-1" />
                        Ajouter
                      </Button>
                    </div>

                        <Reorder.Group axis="y" values={sections} onReorder={setSections} className="space-y-2">
                            {sections.map((section, index) => (
                              <SectionReorderItem 
                                key={section.id}
                                section={section}
                                activeSectionId={activeSectionId}
                                setActiveSectionId={setActiveSectionId}
                                toggleSectionVisibility={toggleSectionVisibility}
                                duplicateSection={duplicateSection}
                                toggleSectionLock={toggleSectionLock}
                                removeSection={(id) => setSections(sections.filter(s => s.id !== id))}
                                index={index}
                                isFirst={index === 0}
                                isLast={index === sections.length - 1}
                                onMoveUp={() => {
                                  if (index > 0) {
                                    const newSections = [...sections];
                                    [newSections[index-1], newSections[index]] = [newSections[index], newSections[index-1]];
                                    setSections(newSections);
                                  }
                                }}
                                onMoveDown={() => {
                                  if (index < sections.length - 1) {
                                    const newSections = [...sections];
                                    [newSections[index], newSections[index+1]] = [newSections[index+1], newSections[index]];
                                    setSections(newSections);
                                  }
                                }}
                              />
                            ))}
                        </Reorder.Group>
                  {sections.length === 0 && (
                    <div className="text-center py-12 px-4 border-2 border-dashed border-border rounded-xl bg-muted/5">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                        <Plus className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <h4 className="font-bold text-sm mb-1">Votre page est prête !</h4>
                      <p className="text-xs text-muted-foreground mb-6">Commencez par ajouter une section &quot;Hero&quot; pour captiver vos visiteurs dès leur arrivée.</p>
                      <Button variant="default" size="sm" className="w-full" onClick={() => setIsLibraryOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Ajouter ma première section
                      </Button>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

                <TabsContent value="navigation" className="flex-1 overflow-hidden flex flex-col m-0">
                  <ScrollArea className="flex-1 h-full">
                    <div className="p-4 space-y-6">
                      <div className="space-y-2">
                        <h3 className="font-semibold text-sm">Menu de Navigation</h3>
                        <p className="text-xs text-muted-foreground">Réorganisez vos pages et choisissez celles qui apparaissent dans votre menu principal.</p>
                      </div>

                            <Reorder.Group 
                              axis="y" 
                              values={pages} 
                              onReorder={(newOrder) => {
                                setPages(newOrder);
                              }} 
                              className="space-y-2" 
                              layoutScroll
                            >
                              {pages.map((page, index) => (
                                <PageReorderItem 
                                  key={page.id}
                                  page={page}
                                  index={index}
                                  isFirst={index === 0}
                                  isLast={index === pages.length - 1}
                                  onToggleVisibility={(id) => {
                                    setPages(prev => prev.map(p => p.id === id ? { ...p, show_in_menu: !(p.show_in_menu ?? true) } : p));
                                  }}
                                  onMoveUp={() => {
                                    if (index > 0) {
                                      const newPages = [...pages];
                                      [newPages[index-1], newPages[index]] = [newPages[index], newPages[index-1]];
                                      setPages(newPages);
                                    }
                                  }}
                                  onMoveDown={() => {
                                    if (index < pages.length - 1) {
                                      const newPages = [...pages];
                                      [newPages[index], newPages[index+1]] = [newPages[index+1], newPages[index]];
                                      setPages(newPages);
                                    }
                                  }}
                                />
                              ))}
                            </Reorder.Group>

                      <div className="p-4 rounded-xl bg-muted/30 border border-dashed border-border text-center">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-2">Structure Recommandée</p>
                        <div className="flex flex-wrap justify-center gap-1">
                          {["Accueil", "Boutique", "À Propos", "Contact", "FAQ"].map(item => (
                            <Badge key={item} variant="outline" className="text-[9px] py-0">{item}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="theme" className="flex-1 overflow-hidden flex flex-col m-0">
                  <ScrollArea className="flex-1 h-full">
                    <div className="p-4 space-y-8">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Couleurs Globales</h3>
                        <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={() => {
                          if (store) setStore({ ...store, theme_config: { ...store.theme_config, colors: { primary: "#7c3aed", secondary: "#4f46e5", accent: "#06b6d4", background: "#ffffff", text: "#0f172a" } } });
                        }}>Reset</Button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px]">Primaire</Label>
                          <div className="flex gap-2">
                            <Input type="color" className="w-8 h-8 p-1" value={store?.theme_config?.colors?.primary || "#7c3aed"} onChange={(e) => setStore(s => s ? ({ ...s, theme_config: { ...s.theme_config, colors: { ...s.theme_config.colors, primary: e.target.value } } }) : null)} />
                            <Input className="flex-1 h-8 text-[10px]" value={store?.theme_config?.colors?.primary || "#7c3aed"} onChange={(e) => setStore(s => s ? ({ ...s, theme_config: { ...s.theme_config, colors: { ...s.theme_config.colors, primary: e.target.value } } }) : null)} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px]">Secondaire</Label>
                          <div className="flex gap-2">
                            <Input type="color" className="w-8 h-8 p-1" value={store?.theme_config?.colors?.secondary || "#4f46e5"} onChange={(e) => setStore(s => s ? ({ ...s, theme_config: { ...s.theme_config, colors: { ...s.theme_config.colors, secondary: e.target.value } } }) : null)} />
                            <Input className="flex-1 h-8 text-[10px]" value={store?.theme_config?.colors?.secondary || "#4f46e5"} onChange={(e) => setStore(s => s ? ({ ...s, theme_config: { ...s.theme_config, colors: { ...s.theme_config.colors, secondary: e.target.value } } }) : null)} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Typographie</h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-[10px]">Police des Titres</Label>
                          <Select value={store?.theme_config?.typography?.fontHeading || "Inter"} onValueChange={(val) => setStore(s => s ? ({ ...s, theme_config: { ...s.theme_config, typography: { ...s.theme_config.typography, fontHeading: val } } }) : null)}>
                            <SelectTrigger className="h-8 text-[10px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Inter">Inter (Moderne)</SelectItem>
                              <SelectItem value="Playfair Display">Playfair (Élégant)</SelectItem>
                              <SelectItem value="Montserrat">Montserrat (Bold)</SelectItem>
                              <SelectItem value="Space Grotesk">Space Grotesk (Tech)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px]">Taille du texte ({store?.theme_config?.typography?.scale || 100}%)</Label>
                          <Slider 
                            value={[store?.theme_config?.typography?.scale || 100]} 
                            min={80} max={120} step={5}
                            onValueChange={([val]) => setStore(s => s ? ({ ...s, theme_config: { ...s.theme_config, typography: { ...s.theme_config.typography, scale: val } } }) : null)}
                          />
                        </div>
                      </div>
                    </div>

                      {!isBeginnerMode && (
                        <>
                          <div className="space-y-4">
                            <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Bordures & Arrondis</h3>
                            <div className="grid grid-cols-3 gap-2">
                              {['none', 'md', 'full'].map((r) => (
                                <Button 
                                  key={r} 
                                  variant={store?.theme_config?.spacing?.borderRadius === r ? 'secondary' : 'outline'} 
                                  size="sm" 
                                  className="text-[10px] h-8 capitalize"
                                  onClick={() => setStore(s => s ? ({ ...s, theme_config: { ...s.theme_config, spacing: { ...s.theme_config.spacing, borderRadius: r } } }) : null)}
                                >
                                  {r}
                                </Button>
                              ))}
                            </div>
                          </div>

                          <div className="pt-6 border-t border-border space-y-4">
                            <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Actions Thème</h3>
                            <div className="grid grid-cols-2 gap-2">
                              <Button variant="outline" size="sm" onClick={exportTheme} className="gap-2 h-8 text-[10px]">
                                <Download className="w-3 h-3" /> Exporter
                              </Button>
                              <div className="relative">
                                <input type="file" id="import-theme" className="hidden" accept=".json" onChange={importTheme} />
                                <Button variant="outline" size="sm" className="w-full gap-2 h-8 text-[10px]" onClick={() => document.getElementById("import-theme")?.click()}>
                                  <Upload className="w-3 h-3" /> Importer
                                </Button>
                              </div>
                            </div>
                          </div>
                        </>
                      )}

                    <div className="space-y-4">
                      <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Templates Pro</h3>
                      <div className="grid gap-4">
                        {premiumTemplates.map((template) => (
                          <button
                            key={template.id}
                            onClick={async () => {
                              if (confirm("Remplacer le contenu actuel par ce template ?")) {
                                const newSections = template.sections.map((s, i) => ({
                                  id: crypto.randomUUID(),
                                  type: s.type,
                                  config: s.config,
                                  position: i,
                                  is_visible: true
                                }));
                                setSections(newSections);
                                if (store) setStore({ ...store, theme_config: template.theme_config });
                                toast.success(`Template ${template.name} appliqué !`);
                              }
                            }}
                            className="group relative rounded-xl overflow-hidden border border-border hover:border-primary transition-all text-left bg-card shadow-sm"
                          >
                            <div className="aspect-video bg-muted relative">
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity z-10 text-white text-xs font-bold uppercase tracking-widest">
                                Appliquer
                              </div>
                              <img src={template.thumbnail || `https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=225&fit=crop`} className="w-full h-full object-cover" alt={template.name} />
                            </div>
                            <div className="p-3">
                              <p className="text-xs font-bold truncate">{template.name}</p>
                              <p className="text-[10px] text-muted-foreground capitalize">{template.category}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

                <TabsContent value="pages" className="flex-1 overflow-hidden flex flex-col m-0">
                  <ScrollArea className="flex-1 h-full">
                    <div className="p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm">Vos Pages</h3>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => generateAllEssentialPages()} className="h-8 text-[10px] border-violet-500 text-violet-600 hover:bg-violet-50">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Auto-générer
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => addNewPage()} className="h-8 text-[10px]">
                            <Plus className="w-3 h-3 mr-1" />
                            Nouvelle
                          </Button>
                        </div>
                      </div>

                    <div className="space-y-2">
                      {pages.map(page => (
                        <div key={page.id} className={`p-3 rounded-lg border flex items-center justify-between group transition-all ${currentPageSlug === page.slug ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                          <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => setCurrentPageSlug(page.slug)}>
                            <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                              {page.slug === 'home' ? '🏠' : page.slug === 'shop' ? '🛍️' : '📄'}
                            </div>
                            <div>
                              <p className="text-xs font-semibold">{page.name}</p>
                              <p className="text-[10px] text-muted-foreground italic">/{page.slug}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch 
                              checked={page.is_published}
                              onCheckedChange={(checked) => togglePagePublish(page.slug, checked)}
                              className="scale-75"
                            />
                            {page.slug !== 'home' && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => setPages(pages.filter(p => p.id !== page.id))}
                              >
                                <Trash2 className="w-3.5 h-3.5 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 space-y-3">
                      <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Templates recommandés</h4>
                      <div className="grid grid-cols-1 gap-2">
                        <Button variant="outline" size="sm" className="justify-start gap-2 h-10" onClick={() => addNewPage("about")}>
                          <Info className="w-4 h-4" /> À Propos
                        </Button>
                        <Button variant="outline" size="sm" className="justify-start gap-2 h-10" onClick={() => addNewPage("contact")}>
                          <Mail className="w-4 h-4" /> Contact
                        </Button>
                        <Button variant="outline" size="sm" className="justify-start gap-2 h-10" onClick={() => addNewPage("product")}>
                          <ShoppingBag className="w-4 h-4" /> Détail Produit
                        </Button>
                        <Button variant="outline" size="sm" className="justify-start gap-2 h-10" onClick={() => addNewPage("checkout")}>
                          <Zap className="w-4 h-4" /> Checkout COD
                        </Button>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

                <TabsContent value="launch" className="flex-1 overflow-hidden flex flex-col m-0">
                  <ScrollArea className="flex-1">
                    <div className="p-4 space-y-6">
                      <div className="space-y-2">
                        <h3 className="font-semibold text-sm">Prêt à vendre ?</h3>
                        <p className="text-xs text-muted-foreground">Suivez ces étapes pour lancer votre boutique professionnelle.</p>
                      </div>

                      <div className="space-y-3">
                        {[
                          { title: "Choisir un template", done: sections.length > 0, action: () => setIsTemplatesOpen(true) },
                          { title: "Personnaliser le design", done: !!store?.theme_config, action: () => setActiveTab("theme") },
                          { title: "Ajouter vos produits", done: sections.some(s => s.type === 'products'), action: () => router.push('/seller/products/catalog') },
                          { title: "Vérifier le score de vente", done: !isWarningsOpen, action: () => setIsWarningsOpen(true) },
                        ].map((item, i) => (
                          <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${item.done ? "bg-emerald-500/5 border-emerald-500/20" : "bg-muted/30 border-border"}`}>
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${item.done ? "bg-emerald-500 text-white" : "border-2 border-border bg-background"}`}>
                              {item.done ? <Check className="w-4 h-4" /> : <span className="text-[10px] font-bold">{i + 1}</span>}
                            </div>
                            <span className={`text-xs flex-1 ${item.done ? "text-emerald-700 font-medium" : "font-medium"}`}>{item.title}</span>
                            {!item.done && (
                              <Button variant="ghost" size="sm" className="h-8 text-[10px] px-3 bg-background border" onClick={item.action}>Faire</Button>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="pt-4 border-t border-border">
                        <Button 
                          className="w-full h-12 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold shadow-lg shadow-purple-200"
                          onClick={() => handleSave()}
                          disabled={saving}
                        >
                          {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Zap className="w-5 h-5 mr-2" />}
                          PUBLIER LA BOUTIQUE
                        </Button>
                        <p className="text-[10px] text-center text-muted-foreground mt-4 italic">
                          En publiant, votre boutique sera accessible à l&apos;adresse :<br />
                          <span className="font-bold text-primary">dropy.store/{store?.slug}</span>
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-violet-50 border border-violet-100 text-violet-900 space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center text-white">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-xs">Gagnez du temps</p>
                            <p className="text-[10px] opacity-80">L&apos;IA peut construire la boutique pour vous.</p>
                          </div>
                        </div>
                        <Button className="w-full bg-violet-600 text-white hover:bg-violet-700" size="sm" onClick={() => setIsAIAssistantOpen(true)}>
                          Lancer l&apos;IA
                        </Button>
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>

      </Tabs>
          </div>

          {/* Center Preview Area */}
          <div className="flex-1 bg-muted/50 overflow-hidden flex flex-col p-8 relative">
            {/* Toggle button to show left sidebar when collapsed */}
            {isSidebarCollapsed && (
              <button
                onClick={() => setIsSidebarCollapsed(false)}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-50 w-8 h-14 bg-card border border-border rounded-lg flex items-center justify-center hover:bg-muted transition-colors shadow-md"
                title="Afficher le panneau"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            )}
            
            <div className={`mx-auto bg-white shadow-2xl transition-all duration-300 overflow-hidden rounded-md flex flex-col h-full ${
              viewMode === "desktop" ? "w-full" : viewMode === "tablet" ? "w-[768px]" : "w-[375px]"
            }`}>
              <div className="h-8 bg-muted/30 border-b border-border flex items-center gap-2 px-4 shrink-0">
                <div className="w-2 h-2 rounded-full bg-red-500/50" />
                <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                <div className="w-2 h-2 rounded-full bg-green-500/50" />
                <div className="ml-4 h-4 w-1/3 rounded bg-muted/50" />
              </div>
              <iframe 
                ref={iframeRef}
                src={`/preview/${store?.slug}`}
                className="flex-1 w-full border-0"
                title="Store Preview"
                onLoad={handleIframeLoad}
              />
            </div>
          </div>

          {/* Right Panel - Section Editor */}
          {activeSectionId && (
            <div className={`border-l border-border bg-card shrink-0 flex flex-col overflow-hidden transition-all duration-300 relative ${isRightPanelCollapsed ? 'w-0' : 'w-80'}`}>
              {/* Toggle button for right panel */}
              <button
                onClick={() => setIsRightPanelCollapsed(!isRightPanelCollapsed)}
                className="absolute -left-3 top-1/2 -translate-y-1/2 z-50 w-6 h-12 bg-card border border-border rounded-l-lg flex items-center justify-center hover:bg-muted transition-colors shadow-sm"
                title={isRightPanelCollapsed ? "Afficher les paramètres" : "Masquer les paramètres"}
              >
                {isRightPanelCollapsed ? <PanelRight className="w-3 h-3" /> : <PanelRightClose className="w-3 h-3" />}
              </button>
              
              {!isRightPanelCollapsed && (
                <>
                  <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
                    <h3 className="font-semibold">Paramètres Section</h3>
                    <Button variant="ghost" size="icon" onClick={() => setActiveSectionId(null)}>
                      <Plus className="w-4 h-4 rotate-45" />
                    </Button>
                  </div>
                  <ScrollArea className="flex-1 p-4">
                    <SectionEditor 
                      section={sections.find(s => s.id === activeSectionId)} 
                      onChange={(config) => {
                        setSections(sections.map(s => s.id === activeSectionId ? { ...s, config } : s));
                      }}
                    />
                  </ScrollArea>
                </>
              )}
            </div>
          )}
          
          {/* Toggle button to show right panel when no section selected or collapsed */}
          {activeSectionId && isRightPanelCollapsed && (
            <button
              onClick={() => setIsRightPanelCollapsed(false)}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-50 w-8 h-14 bg-card border border-border rounded-lg flex items-center justify-center hover:bg-muted transition-colors shadow-md"
              title="Afficher les paramètres"
            >
              <PanelRight className="w-4 h-4" />
            </button>
          )}

        <AnimatePresence>
          {isAIAssistantOpen && (
            <AIAssistant 
              onClose={() => setIsAIAssistantOpen(false)}
              sections={sections}
              onUpdateSections={setSections}
              onAddSection={(type, data) => {
                const newSection = {
                  id: crypto.randomUUID(),
                  type,
                  config: data || getPlaceholderConfig(type),
                  position: sections.length,
                  is_visible: true
                };
                setSections([...sections, newSection]);
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isTemplatesOpen && (
            <TemplateMarketplace 
              onClose={() => setIsTemplatesOpen(false)}
              onSelectTemplate={(template) => {
                const newSections = template.sections.map((s, i) => ({
                  id: crypto.randomUUID(),
                  type: s.type,
                  config: s.config,
                  position: i,
                  is_visible: true
                }));
                setSections(newSections);
                if (store) setStore({ ...store, theme_config: template.theme_config });
                setIsTemplatesOpen(false);
              }}
            />
          )}
        </AnimatePresence>

        <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-violet-500" />
                Bienvenue sur Dropy Builder
              </DialogTitle>
              <DialogDescription className="text-lg">
                Lancez votre boutique e-commerce en moins de 30 minutes.
              </DialogDescription>
            </DialogHeader>
            <div className="grid md:grid-cols-2 gap-6 py-6">
              <div 
                className="p-6 rounded-2xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all cursor-pointer group space-y-4"
                onClick={() => {
                  setIsTemplatesOpen(true);
                  setShowOnboarding(false);
                }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Layout className="w-6 h-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold">Choisir un Template</h3>
                  <p className="text-sm text-muted-foreground">Partez d&apos;un design pro optimisé pour la conversion (Beauté, Fitness, Maison...)</p>
                </div>
              </div>
              <div 
                className="p-6 rounded-2xl border-2 border-border hover:border-violet-500 hover:bg-violet-50 transition-all cursor-pointer group space-y-4"
                onClick={() => {
                  setIsAIAssistantOpen(true);
                  setShowOnboarding(false);
                }}
              >
                <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Sparkles className="w-6 h-6 text-violet-600" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold">Assistant IA</h3>
                  <p className="text-sm text-muted-foreground">Décrivez votre niche et laissez l&apos;IA générer vos textes, images et sections.</p>
                </div>
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-4 border-t pt-6">
              <div className="flex-1 text-sm text-muted-foreground flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                30 minutes pour publier
              </div>
              <Button variant="ghost" onClick={() => setShowOnboarding(false)}>
                Je connais déjà l&apos;outil
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
