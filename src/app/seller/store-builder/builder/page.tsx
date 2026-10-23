"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Reorder, useDragControls } from "framer-motion";
import {
  AlertCircle,
  Check,
  ChevronLeft,
  CloudOff,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  GripVertical,
  Home,
  Layers,
  Loader2,
  Monitor,
  MoreVertical,
  Palette,
  Plus,
  Redo2,
  Rocket,
  Settings2,
  Smartphone,
  Tablet,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SectionSettings, type LinkTarget } from "@/components/store-builder/editor/SectionSettings";
import { AddSectionDialog } from "@/components/store-builder/editor/AddSectionDialog";
import { StylePanel, themeLook } from "@/components/store-builder/editor/StylePanel";
import { themeHomeSections } from "@/lib/themes";
import { sectionIcon } from "@/lib/builder-sections";
import { PAGE_TEMPLATE_KINDS, buildPageTemplate, makeSection, type PageTemplateKind } from "@/lib/store-page-templates";
import { slugify } from "@/lib/store-slug";
import { storeDisplayUrl, storeViewHref } from "@/lib/store-url";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";
import type { Theme } from "@/types/themes";

type Section = { id: string; type: string; config: Record<string, any>; position: number; is_visible: boolean };

type EditorPage = {
  slug: string;
  title: string;
  page_type: string;
  sections: Section[];
  is_published: boolean;
  show_in_navigation: boolean;
  is_homepage: boolean;
};

type StoreInfo = { id: string; name: string; slug: string; is_active: boolean | null; storefront_language: string | null };
type Snapshot = { pages: EditorPage[]; themeConfig: Record<string, any> };
type SaveState = "saved" | "dirty" | "saving" | "error";
type Tab = "sections" | "pages" | "style";

const AUTOSAVE_MS = 2500;
const RESERVED_PAGE_SLUGS = new Set(["home", "p", "checkout", "merci", "track", "product-detail", "api", "preview"]);

function sectionSummary(section: Section) {
  const c = section.config || {};
  const text = c.title || c.text || c.badge || c.description || "";
  return String(text).replace(/<[^>]+>/g, "").trim();
}

function setPath(target: Record<string, any>, path: string, value: unknown) {
  const parts = path.split(".");
  const root: Record<string, any> = Array.isArray(target) ? [...target] : { ...target };
  let node: any = root;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    const next = node[key];
    node[key] = Array.isArray(next) ? [...next] : { ...(next || {}) };
    node = node[key];
  }
  node[parts[parts.length - 1]] = value;
  return root;
}

function SectionRow({
  section,
  active,
  onSelect,
  onToggle,
  onDuplicate,
  onDelete,
}: {
  section: Section;
  active: boolean;
  onSelect: () => void;
  onToggle: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const controls = useDragControls();
  const Icon = sectionIcon(section.type);
  const summary = sectionSummary(section);

  return (
    <Reorder.Item
      value={section}
      dragListener={false}
      dragControls={controls}
      layout="position"
      whileDrag={{ scale: 1.02, boxShadow: "0 8px 20px rgba(0,0,0,0.12)", zIndex: 50 }}
      className={cn(
        "group flex items-center gap-2 rounded-xl border bg-card p-2 cursor-pointer transition-colors",
        active ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border hover:border-primary/40",
        !section.is_visible && "opacity-60"
      )}
      onClick={onSelect}
    >
      <button
        type="button"
        aria-label={t("store_builder.editor.sections.drag")}
        onPointerDown={(e) => controls.start(e)}
        onClick={(e) => e.stopPropagation()}
        className="touch-none cursor-grab rounded p-1 text-muted-foreground hover:bg-muted active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", active ? "bg-primary text-primary-foreground" : "bg-muted")}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{t(`store_builder.sections.${section.type}.name`)}</span>
        {summary && <span className="block truncate text-[11px] text-muted-foreground">{summary}</span>}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0"
        aria-label={t(section.is_visible ? "store_builder.editor.sections.hide" : "store_builder.editor.sections.show")}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
      >
        {section.is_visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={(e) => e.stopPropagation()} aria-label={t("store_builder.editor.sections.more")}>
            <MoreVertical className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onClick={onSelect}>
            <Settings2 className="me-2 h-4 w-4" />
            {t("store_builder.editor.sections.edit")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDuplicate}>
            <Copy className="me-2 h-4 w-4" />
            {t("store_builder.editor.sections.duplicate")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onDelete}>
            <Trash2 className="me-2 h-4 w-4" />
            {t("store_builder.editor.sections.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Reorder.Item>
  );
}

export default function BuilderPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const tr = useCallback((key: string) => t(`store_builder.editor.${key}`), [t]);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [productCount, setProductCount] = useState(0);
  const [pages, setPages] = useState<EditorPage[]>([]);
  const [themeConfig, setThemeConfig] = useState<Record<string, any>>({});
  const [currentSlug, setCurrentSlug] = useState("home");
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("sections");
  const [viewMode, setViewMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [mobilePane, setMobilePane] = useState<"panel" | "preview">("panel");
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [publishing, setPublishing] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [pendingTheme, setPendingTheme] = useState<Theme | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ kind: "section"; id: string } | { kind: "page"; slug: string } | null>(null);
  const [newPageOpen, setNewPageOpen] = useState(false);
  const [newPageName, setNewPageName] = useState("");
  const [, setHistoryVersion] = useState(0);

  const pageIdsRef = useRef(new Map<string, string>());
  const deletedIdsRef = useRef<string[]>([]);
  const savedRef = useRef("");
  const latestRef = useRef<Snapshot>({ pages: [], themeConfig: {} });
  const savingRef = useRef(false);
  const pendingSaveRef = useRef(false);
  const committedRef = useRef<Snapshot | null>(null);
  const pastRef = useRef<Snapshot[]>([]);
  const futureRef = useRef<Snapshot[]>([]);
  const skipRecordRef = useRef(false);

  latestRef.current = { pages, themeConfig };

  const contentLang: "fr" | "ar" = store?.storefront_language === "ar" ? "ar" : "fr";
  const currentPage = pages.find((p) => p.slug === currentSlug) || pages[0];
  const sections = useMemo(() => currentPage?.sections || [], [currentPage]);
  const activeSection = sections.find((s) => s.id === activeSectionId) || null;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login?redirect=/seller/store-builder/builder");
        return;
      }
      const { data: storeRow } = await supabase
        .from("stores")
        .select("id, name, slug, is_active, theme_config, storefront_language")
        .eq("vendor_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (!storeRow) {
        router.push("/seller/store-builder/start");
        return;
      }
      const loadPages = () => supabase.from("store_pages").select("*").eq("store_id", storeRow.id).order("sort_order", { ascending: true });
      let { data: pageRows } = await loadPages();
      if (!pageRows?.length) {
        await fetch("/api/seller/store", { method: "POST" });
        ({ data: pageRows } = await loadPages());
      }
      const { count } = await supabase
        .from("store_products")
        .select("id", { count: "exact", head: true })
        .eq("store_id", storeRow.id)
        .eq("is_active", true);
      if (cancelled) return;

      const ids = new Map<string, string>();
      const loaded: EditorPage[] = (pageRows || []).map((row: any) => {
        ids.set(row.slug, row.id);
        return {
          slug: row.slug,
          title: row.title || row.slug,
          page_type: row.page_type || "content",
          sections: Array.isArray(row.sections) ? row.sections : [],
          is_published: row.is_published !== false,
          show_in_navigation: row.show_in_navigation !== false,
          is_homepage: Boolean(row.is_homepage) || row.slug === "home",
        };
      });
      loaded.sort((a, b) => Number(b.is_homepage) - Number(a.is_homepage));
      const theme = (storeRow.theme_config as Record<string, any>) || {};
      pageIdsRef.current = ids;
      savedRef.current = JSON.stringify({ pages: loaded, themeConfig: theme });
      committedRef.current = { pages: loaded, themeConfig: theme };
      skipRecordRef.current = true;

      const params = new URLSearchParams(window.location.search);
      const requested = params.get("page");
      const requestedTab = params.get("tab");
      setStore({ id: storeRow.id, name: storeRow.name, slug: storeRow.slug, is_active: storeRow.is_active, storefront_language: storeRow.storefront_language });
      setProductCount(count ?? 0);
      setPages(loaded);
      setThemeConfig(theme);
      setCurrentSlug(loaded.find((p) => p.slug === requested)?.slug || loaded.find((p) => p.is_homepage)?.slug || loaded[0]?.slug || "home");
      if (requestedTab === "style" || requestedTab === "theme") setTab("style");
      if (requestedTab === "pages") setTab("pages");
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (loading) return;
    const current = { pages, themeConfig };
    if (skipRecordRef.current) {
      skipRecordRef.current = false;
      committedRef.current = current;
      return;
    }
    const timer = setTimeout(() => {
      if (committedRef.current) {
        pastRef.current = [...pastRef.current.slice(-49), committedRef.current];
        futureRef.current = [];
      }
      committedRef.current = current;
      setHistoryVersion((v) => v + 1);
    }, 400);
    return () => clearTimeout(timer);
  }, [pages, themeConfig, loading]);

  const save = useCallback(async (): Promise<boolean> => {
    if (!store) return false;
    if (savingRef.current) {
      pendingSaveRef.current = true;
      return true;
    }
    const snapshot = latestRef.current;
    const serialized = JSON.stringify(snapshot);
    if (serialized === savedRef.current && deletedIdsRef.current.length === 0) {
      setSaveState("saved");
      return true;
    }
    savingRef.current = true;
    setSaveState("saving");
    const supabase = createClient();
    try {
      if (deletedIdsRef.current.length) {
        const ids = [...deletedIdsRef.current];
        const { error } = await supabase.from("store_pages").delete().in("id", ids);
        if (error) throw error;
        deletedIdsRef.current = deletedIdsRef.current.filter((id) => !ids.includes(id));
      }
      for (const [index, page] of snapshot.pages.entries()) {
        const row = {
          store_id: store.id,
          slug: page.slug,
          title: page.title,
          page_type: page.page_type,
          sections: page.sections.map((s, position) => ({ ...s, position })),
          is_published: page.is_homepage ? true : page.is_published,
          is_homepage: page.is_homepage,
          show_in_navigation: page.show_in_navigation,
          sort_order: index,
        };
        const id = pageIdsRef.current.get(page.slug);
        if (id) {
          const { error } = await supabase.from("store_pages").update(row).eq("id", id);
          if (error) throw error;
        } else {
          const { data, error } = await supabase.from("store_pages").insert(row).select("id").single();
          if (error) throw error;
          pageIdsRef.current.set(page.slug, data.id);
        }
      }
      const { error: storeError } = await supabase.from("stores").update({ theme_config: snapshot.themeConfig }).eq("id", store.id);
      if (storeError) throw storeError;
      savedRef.current = serialized;
      setSaveState(JSON.stringify(latestRef.current) === serialized ? "saved" : "dirty");
      return true;
    } catch (error: any) {
      console.error("Save error:", error);
      setSaveState("error");
      toast.error(tr("save_error"));
      return false;
    } finally {
      savingRef.current = false;
      if (pendingSaveRef.current) {
        pendingSaveRef.current = false;
        void save();
      }
    }
  }, [store, tr]);

  useEffect(() => {
    if (loading) return;
    if (JSON.stringify({ pages, themeConfig }) === savedRef.current && deletedIdsRef.current.length === 0) return;
    setSaveState((s) => (s === "saving" ? s : "dirty"));
    const timer = setTimeout(() => void save(), AUTOSAVE_MS);
    return () => clearTimeout(timer);
  }, [pages, themeConfig, loading, save]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (saveState === "dirty" || saveState === "saving" || saveState === "error") {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [saveState]);

  const canUndo = pastRef.current.length > 0 || (committedRef.current !== null && (committedRef.current.pages !== pages || committedRef.current.themeConfig !== themeConfig));
  const canRedo = futureRef.current.length > 0;

  const undo = useCallback(() => {
    const current = latestRef.current;
    let target: Snapshot | undefined;
    const committed = committedRef.current;
    if (committed && (committed.pages !== current.pages || committed.themeConfig !== current.themeConfig)) {
      target = committed;
    } else {
      target = pastRef.current[pastRef.current.length - 1];
      if (!target) return;
      pastRef.current = pastRef.current.slice(0, -1);
    }
    futureRef.current = [current, ...futureRef.current].slice(0, 50);
    skipRecordRef.current = true;
    setPages(target.pages);
    setThemeConfig(target.themeConfig);
    setHistoryVersion((v) => v + 1);
  }, []);

  const redo = useCallback(() => {
    const [target, ...rest] = futureRef.current;
    if (!target) return;
    pastRef.current = [...pastRef.current, latestRef.current].slice(-50);
    futureRef.current = rest;
    skipRecordRef.current = true;
    setPages(target.pages);
    setThemeConfig(target.themeConfig);
    setHistoryVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const key = e.key.toLowerCase();
      if (key === "s") {
        e.preventDefault();
        void save();
        return;
      }
      const target = e.target as HTMLElement | null;
      if (target && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))) return;
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (key === "y" || (key === "z" && e.shiftKey)) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save, undo, redo]);

  const updateSections = useCallback(
    (slug: string, fn: (sections: Section[]) => Section[]) =>
      setPages((prev) => prev.map((p) => (p.slug === slug ? { ...p, sections: fn(p.sections) } : p))),
    []
  );

  const addSection = (type: string) => {
    const section = makeSection(type, undefined, contentLang);
    updateSections(currentSlug, (list) => {
      const activeIndex = list.findIndex((s) => s.id === activeSectionId);
      const footerIndex = list.findIndex((s) => s.type === "footer");
      const at = activeIndex >= 0 && list[activeIndex].type !== "footer" ? activeIndex + 1 : footerIndex >= 0 ? footerIndex : list.length;
      return [...list.slice(0, at), section, ...list.slice(at)];
    });
    setActiveSectionId(section.id);
    setMobilePane("panel");
  };

  const duplicateSection = (id: string) => {
    const copyId = crypto.randomUUID();
    updateSections(currentSlug, (list) => {
      const index = list.findIndex((s) => s.id === id);
      if (index < 0) return list;
      const copy = { ...list[index], id: copyId, config: JSON.parse(JSON.stringify(list[index].config || {})) };
      return [...list.slice(0, index + 1), copy, ...list.slice(index + 1)];
    });
    setActiveSectionId(copyId);
  };

  const moveSection = (id: string, delta: number) =>
    updateSections(currentSlug, (list) => {
      const index = list.findIndex((s) => s.id === id);
      const target = index + delta;
      if (index < 0 || target < 0 || target >= list.length) return list;
      const next = [...list];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const toggleSection = (id: string) =>
    updateSections(currentSlug, (list) => list.map((s) => (s.id === id ? { ...s, is_visible: !s.is_visible } : s)));

  const deleteSection = (id: string) => {
    updateSections(currentSlug, (list) => list.filter((s) => s.id !== id));
    if (activeSectionId === id) setActiveSectionId(null);
  };

  const updatePage = (slug: string, patch: Partial<EditorPage>) => setPages((prev) => prev.map((p) => (p.slug === slug ? { ...p, ...patch } : p)));

  const openPage = (slug: string) => {
    setCurrentSlug(slug);
    setActiveSectionId(null);
    setTab("sections");
  };

  const addTemplatePage = (kind: PageTemplateKind) => {
    if (kind === "blank") {
      setNewPageName("");
      setNewPageOpen(true);
      return;
    }
    const template = buildPageTemplate(kind, contentLang);
    const existing = pages.find((p) => p.slug === template.slug);
    if (existing) {
      openPage(existing.slug);
      toast.info(tr("pages.exists"));
      return;
    }
    setPages((prev) => [
      ...prev,
      {
        slug: template.slug,
        title: template.title,
        page_type: kind === "shop" ? "shop" : "content",
        sections: template.sections,
        is_published: true,
        show_in_navigation: template.showInMenu,
        is_homepage: false,
      },
    ]);
    openPage(template.slug);
  };

  const createBlankPage = () => {
    const title = newPageName.trim();
    if (!title) return;
    let base = slugify(title) || "page";
    if (RESERVED_PAGE_SLUGS.has(base)) base = `${base}-page`;
    let slug = base;
    let n = 2;
    while (pages.some((p) => p.slug === slug)) slug = `${base}-${n++}`;
    setPages((prev) => [
      ...prev,
      { slug, title, page_type: "content", sections: [makeSection("image_with_text", undefined, contentLang), makeSection("footer", undefined, contentLang)], is_published: true, show_in_navigation: true, is_homepage: false },
    ]);
    setNewPageOpen(false);
    openPage(slug);
  };

  const deletePage = (slug: string) => {
    const id = pageIdsRef.current.get(slug);
    if (id) {
      deletedIdsRef.current.push(id);
      pageIdsRef.current.delete(slug);
    }
    setPages((prev) => prev.filter((p) => p.slug !== slug));
    if (currentSlug === slug) {
      setCurrentSlug(pages.find((p) => p.is_homepage)?.slug || "home");
      setActiveSectionId(null);
    }
  };

  const applyTheme = (theme: Theme, replaceHome: boolean) => {
    setThemeConfig((prev) => themeLook(theme, prev));
    if (replaceHome) {
      const home = pages.find((p) => p.is_homepage);
      if (home) {
        updateSections(home.slug, () => themeHomeSections(theme, store?.storefront_language === "ar" ? "ar" : "fr").map((s: any, position: number) => ({ ...s, id: crypto.randomUUID(), position, is_visible: true })));
        setCurrentSlug(home.slug);
        setActiveSectionId(null);
      }
    }
    toast.success(tr("style.theme_applied").replace("{name}", t(`store_builder.themes.${theme.id}.name`)));
  };

  const setStoreOnline = async (online: boolean) => {
    if (!store) return;
    if (online && productCount === 0) {
      toast.error(t("store_builder.hub.need_product"));
      return;
    }
    setPublishing(true);
    const ok = await save();
    if (!ok) {
      setPublishing(false);
      return;
    }
    const { error } = await createClient().from("stores").update({ is_active: online }).eq("id", store.id);
    setPublishing(false);
    if (error) {
      toast.error(t("store_builder.hub.status_error"));
      return;
    }
    setStore({ ...store, is_active: online });
    toast.success(t(online ? "store_builder.hub.now_online" : "store_builder.hub.now_offline"));
  };

  const postToPreview = useCallback((message: Record<string, unknown>) => {
    iframeRef.current?.contentWindow?.postMessage(message, window.location.origin);
  }, []);

  const syncPreview = useCallback(() => {
    postToPreview({ type: "STORE_UPDATE", sections, theme_config: themeConfig, pages, page: currentSlug });
  }, [postToPreview, sections, themeConfig, pages, currentSlug]);

  useEffect(() => {
    if (!loading) syncPreview();
  }, [loading, syncPreview]);

  useEffect(() => {
    postToPreview({ type: "SELECT_SECTION", sectionId: activeSectionId });
  }, [activeSectionId, postToPreview]);

  const stateRef = useRef({ pages, currentSlug });
  stateRef.current = { pages, currentSlug };

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== iframeRef.current?.contentWindow) return;
      const data = event.data || {};
      const { pages: currentPages, currentSlug: slug } = stateRef.current;
      if (data.type === "SECTION_ACTION") {
        const id = String(data.sectionId || "");
        switch (data.actionType) {
          case "MOVE_UP":
            moveSectionRef.current(id, -1);
            break;
          case "MOVE_DOWN":
            moveSectionRef.current(id, 1);
            break;
          case "DUPLICATE":
            duplicateRef.current(id);
            break;
          case "DELETE":
            setConfirmDelete({ kind: "section", id });
            break;
          case "SETTINGS":
          case "SELECT":
            setActiveSectionId(id);
            setTab("sections");
            setMobilePane("panel");
            break;
        }
      } else if (data.type === "TEXT_UPDATE") {
        const { sectionId, field, value } = data;
        if (typeof field !== "string" || !field) return;
        setPages((prev) =>
          prev.map((p) =>
            p.slug === slug ? { ...p, sections: p.sections.map((s) => (s.id === sectionId ? { ...s, config: setPath(s.config || {}, field, value) } : s)) } : p
          )
        );
      } else if (data.type === "NAVIGATE") {
        const target = String(data.page || "").replace(/^\//, "") || "home";
        const page = currentPages.find((p) => p.slug === target || (target === "home" && p.is_homepage));
        if (page) {
          setCurrentSlug(page.slug);
          setActiveSectionId(null);
        } else {
          iframeRef.current?.contentWindow?.postMessage(data, window.location.origin);
        }
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const moveSectionRef = useRef(moveSection);
  moveSectionRef.current = moveSection;
  const duplicateRef = useRef(duplicateSection);
  duplicateRef.current = duplicateSection;

  if (loading || !store || !currentPage) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isOnline = store.is_active !== false;
  const viewHref = storeViewHref(store.slug, store.is_active);
  const homePage = pages.find((p) => p.is_homepage);
  const linkTargets: LinkTarget[] = [
    ...pages.map((p) => ({ value: p.is_homepage ? "/" : `/${p.slug}`, label: p.title })),
    ...(pages.some((p) => p.slug === "shop") ? [] : [{ value: "/shop", label: tr("links.shop") }]),
    { value: "/track", label: tr("links.track") },
  ];

  const saveLabel =
    saveState === "saving" ? tr("status.saving") : saveState === "dirty" ? tr("status.unsaved") : saveState === "error" ? tr("status.error") : tr("status.saved");

  const panel = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="grid grid-cols-3 border-b bg-card">
        {(
          [
            ["sections", Layers],
            ["pages", FileText],
            ["style", Palette],
          ] as const
        ).map(([key, Icon]) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setTab(key);
              if (key !== "sections") setActiveSectionId(null);
            }}
            className={cn(
              "flex items-center justify-center gap-1.5 border-b-2 py-3 text-xs font-semibold transition-colors",
              tab === key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {tr(`tabs.${key}`)}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === "sections" && activeSection && (
          <div className="flex min-h-full flex-col">
            <div className="sticky top-0 z-10 flex items-center gap-2 border-b bg-card/95 px-3 py-2 backdrop-blur">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setActiveSectionId(null)} aria-label={tr("sections.back")}>
                <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
              </Button>
              <span className="min-w-0 flex-1 truncate text-sm font-bold">{t(`store_builder.sections.${activeSection.type}.name`)}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleSection(activeSection.id)} aria-label={tr(activeSection.is_visible ? "sections.hide" : "sections.show")}>
                {activeSection.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => duplicateSection(activeSection.id)} aria-label={tr("sections.duplicate")}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => setConfirmDelete({ kind: "section", id: activeSection.id })}
                aria-label={tr("sections.delete")}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              <SectionSettings
                key={activeSection.id}
                section={activeSection}
                targets={linkTargets}
                onChange={(config) => updateSections(currentSlug, (list) => list.map((s) => (s.id === activeSection.id ? { ...s, config } : s)))}
              />
            </div>
          </div>
        )}

        {tab === "sections" && !activeSection && (
          <div className="space-y-3 p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{tr("sections.page")}</p>
                <p className="truncate text-sm font-bold">{currentPage.title}</p>
              </div>
              <Button size="sm" onClick={() => setAddOpen(true)} className="shrink-0">
                <Plus className="me-1 h-4 w-4" />
                {tr("sections.add")}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{tr("sections.help")}</p>
            <Reorder.Group axis="y" values={sections} onReorder={(next) => updateSections(currentSlug, () => next)} className="space-y-2">
              {sections.map((section) => (
                <SectionRow
                  key={section.id}
                  section={section}
                  active={section.id === activeSectionId}
                  onSelect={() => setActiveSectionId(section.id)}
                  onToggle={() => toggleSection(section.id)}
                  onDuplicate={() => duplicateSection(section.id)}
                  onDelete={() => setConfirmDelete({ kind: "section", id: section.id })}
                />
              ))}
            </Reorder.Group>
            {sections.length === 0 && (
              <div className="rounded-xl border-2 border-dashed p-6 text-center">
                <p className="text-sm font-semibold">{tr("sections.empty_title")}</p>
                <p className="mb-4 mt-1 text-xs text-muted-foreground">{tr("sections.empty_body")}</p>
                <Button size="sm" onClick={() => setAddOpen(true)}>
                  <Plus className="me-1 h-4 w-4" />
                  {tr("sections.add")}
                </Button>
              </div>
            )}
          </div>
        )}

        {tab === "pages" && (
          <div className="space-y-4 p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold">{tr("pages.title")}</h3>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm">
                    <Plus className="me-1 h-4 w-4" />
                    {tr("pages.add")}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="text-xs">{tr("pages.templates")}</DropdownMenuLabel>
                  {PAGE_TEMPLATE_KINDS.map((kind) => (
                    <DropdownMenuItem key={kind} onClick={() => addTemplatePage(kind)}>
                      {tr(`pages.kinds.${kind}`)}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => addTemplatePage("blank")}>
                    <Plus className="me-2 h-4 w-4" />
                    {tr("pages.kinds.blank")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="space-y-2">
              {pages.map((page) => (
                <div
                  key={page.slug}
                  className={cn("rounded-xl border p-3 space-y-3", page.slug === currentSlug ? "border-primary bg-primary/5" : "border-border")}
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                      {page.is_homepage ? <Home className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                    </span>
                    <Input
                      value={page.title}
                      onChange={(e) => updatePage(page.slug, { title: e.target.value })}
                      onBlur={(e) => !e.target.value.trim() && updatePage(page.slug, { title: page.slug })}
                      className="h-8 flex-1 text-sm font-semibold"
                      aria-label={tr("pages.name")}
                    />
                    <Button variant="outline" size="sm" className="h-8 shrink-0" onClick={() => openPage(page.slug)}>
                      {tr("pages.edit")}
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                    <span dir="ltr" className="text-muted-foreground">/{page.is_homepage ? "" : page.slug}</span>
                    <label className="flex items-center gap-1.5">
                      <Switch checked={page.show_in_navigation} onCheckedChange={(v) => updatePage(page.slug, { show_in_navigation: v })} className="scale-75" />
                      {tr("pages.in_menu")}
                    </label>
                    {!page.is_homepage && (
                      <label className="flex items-center gap-1.5">
                        <Switch checked={page.is_published} onCheckedChange={(v) => updatePage(page.slug, { is_published: v })} className="scale-75" />
                        {tr("pages.visible")}
                      </label>
                    )}
                    {!page.is_homepage && (
                      <button type="button" className="ms-auto text-destructive hover:underline" onClick={() => setConfirmDelete({ kind: "page", slug: page.slug })}>
                        {tr("pages.delete")}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {tr("pages.menu_help")}{" "}
              <Link href="/seller/store-builder/navigation" className="font-semibold text-primary hover:underline">
                {tr("pages.menu_link")}
              </Link>
            </p>
          </div>
        )}

        {tab === "style" && <StylePanel themeConfig={themeConfig} onChange={setThemeConfig} onPickTheme={setPendingTheme} />}
      </div>
    </div>
  );

  return (
    <div className="flex h-full flex-col overflow-hidden bg-muted/40">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-card px-2 sm:px-3">
        <Button variant="ghost" size="sm" asChild className="shrink-0 px-2">
          <Link href="/seller/store-builder" aria-label={tr("back")}>
            <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
            <span className="hidden sm:inline">{tr("back")}</span>
          </Link>
        </Button>
        <div className="hidden min-w-0 md:block">
          <p className="truncate text-sm font-bold leading-tight">{store.name}</p>
          <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <span className={cn("h-1.5 w-1.5 rounded-full", isOnline ? "bg-emerald-500" : "bg-amber-500")} />
            {isOnline ? t("store_builder.hub.online") : t("store_builder.hub.offline")}
          </p>
        </div>

        <div className="mx-auto flex min-w-0 items-center gap-1 sm:gap-2">
          <Select value={currentSlug} onValueChange={openPage}>
            <SelectTrigger className="h-9 w-[130px] sm:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pages.map((p) => (
                <SelectItem key={p.slug} value={p.slug}>
                  {p.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="hidden items-center rounded-lg bg-muted p-0.5 lg:flex">
            {(
              [
                ["desktop", Monitor],
                ["tablet", Tablet],
                ["mobile", Smartphone],
              ] as const
            ).map(([mode, Icon]) => (
              <Button
                key={mode}
                variant={viewMode === mode ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode(mode)}
                aria-label={tr(`devices.${mode}`)}
              >
                <Icon className="h-4 w-4" />
              </Button>
            ))}
          </div>
          <div className="hidden items-center sm:flex">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={undo} disabled={!canUndo} aria-label={tr("undo")}>
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={redo} disabled={!canRedo} aria-label={tr("redo")}>
              <Redo2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void save()}
          className={cn(
            "hidden shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium md:flex",
            saveState === "error" ? "text-destructive" : "text-muted-foreground hover:text-foreground"
          )}
          title={tr("save_now")}
        >
          {saveState === "saving" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : saveState === "error" ? (
            <CloudOff className="h-3.5 w-3.5" />
          ) : saveState === "dirty" ? (
            <AlertCircle className="h-3.5 w-3.5" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
          {saveLabel}
        </button>

        <Button variant="outline" size="sm" asChild className="hidden shrink-0 sm:inline-flex">
          <a href={viewHref} target="_blank" rel="noreferrer" aria-label={tr("view")}>
            <ExternalLink className="h-4 w-4 sm:me-1" />
            <span className="hidden xl:inline">{tr("view")}</span>
          </a>
        </Button>

        {isOnline ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="shrink-0 border-emerald-300 text-emerald-700" aria-label={t("store_builder.hub.online")}>
                <span className="me-1.5 h-2 w-2 rounded-full bg-emerald-500" />
                <span className="hidden sm:inline">{t("store_builder.hub.online")}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="font-normal">
                <span className="block text-xs text-muted-foreground">{tr("publish.address")}</span>
                <span dir="ltr" className="block truncate text-sm font-semibold">{storeDisplayUrl(store.slug)}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a href={viewHref} target="_blank" rel="noreferrer">
                  <ExternalLink className="me-2 h-4 w-4" />
                  {tr("view")}
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void setStoreOnline(false)}>
                <EyeOff className="me-2 h-4 w-4" />
                {tr("publish.unpublish")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button size="sm" className="shrink-0 bg-gradient-to-r from-violet-600 to-teal-500 text-white hover:opacity-90" onClick={() => void setStoreOnline(true)} disabled={publishing} aria-label={tr("publish.cta")}>
            {publishing ? <Loader2 className="h-4 w-4 animate-spin sm:me-1" /> : <Rocket className="h-4 w-4 sm:me-1" />}
            <span className="hidden sm:inline">{tr("publish.cta")}</span>
          </Button>
        )}
      </header>

      <div className="flex border-b bg-card p-1 lg:hidden">
        {(["panel", "preview"] as const).map((pane) => (
          <button
            key={pane}
            type="button"
            onClick={() => setMobilePane(pane)}
            className={cn(
              "flex-1 rounded-md py-1.5 text-xs font-semibold",
              mobilePane === pane ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            )}
          >
            {tr(`mobile.${pane}`)}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1">
        <aside className={cn("min-h-0 w-full shrink-0 border-e bg-card lg:flex lg:w-[340px] lg:flex-col", mobilePane === "panel" ? "flex flex-col" : "hidden")}>
          {panel}
        </aside>

        <main className={cn("min-h-0 min-w-0 flex-1 p-0 lg:flex lg:p-6", mobilePane === "preview" ? "flex" : "hidden")}>
          <div
            className={cn(
              "mx-auto flex h-full w-full flex-col overflow-hidden bg-white shadow-xl transition-all duration-300 lg:rounded-xl lg:border",
              viewMode === "tablet" && "lg:max-w-[768px]",
              viewMode === "mobile" && "lg:max-w-[390px]"
            )}
          >
            <div className="hidden h-8 shrink-0 items-center gap-1.5 border-b bg-muted/40 px-3 lg:flex">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
              <span dir="ltr" className="mx-auto truncate rounded bg-background px-3 py-0.5 text-[11px] text-muted-foreground">
                {storeDisplayUrl(store.slug)}
                {currentPage.is_homepage ? "" : `/${currentPage.slug}`}
              </span>
            </div>
            <iframe ref={iframeRef} src={`/preview/${store.slug}`} className="w-full flex-1 border-0" title={tr("preview_title")} onLoad={syncPreview} />
          </div>
        </main>
      </div>

      <AddSectionDialog open={addOpen} onOpenChange={setAddOpen} onAdd={addSection} />

      <AlertDialog open={Boolean(pendingTheme)} onOpenChange={(open) => !open && setPendingTheme(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("store_builder.theme_dialog.title").replace("{name}", pendingTheme ? t(`store_builder.themes.${pendingTheme.id}.name`) : "")}
            </AlertDialogTitle>
            <AlertDialogDescription>{t("store_builder.theme_dialog.body")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel>{t("store_builder.theme_dialog.cancel")}</AlertDialogCancel>
            <Button
              variant="outline"
              onClick={() => {
                if (pendingTheme) applyTheme(pendingTheme, false);
                setPendingTheme(null);
              }}
            >
              {t("store_builder.theme_dialog.colors_only")}
            </Button>
            <AlertDialogAction
              onClick={() => {
                if (pendingTheme) applyTheme(pendingTheme, Boolean(homePage));
                setPendingTheme(null);
              }}
            >
              {t("store_builder.theme_dialog.replace_home")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(confirmDelete)} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tr(confirmDelete?.kind === "page" ? "confirm.page_title" : "confirm.section_title")}</AlertDialogTitle>
            <AlertDialogDescription>{tr(confirmDelete?.kind === "page" ? "confirm.page_body" : "confirm.section_body")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tr("confirm.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                if (confirmDelete?.kind === "section") deleteSection(confirmDelete.id);
                if (confirmDelete?.kind === "page") deletePage(confirmDelete.slug);
                setConfirmDelete(null);
              }}
            >
              {tr("confirm.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={newPageOpen} onOpenChange={setNewPageOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{tr("pages.new_title")}</DialogTitle>
            <DialogDescription>{tr("pages.new_help")}</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createBlankPage();
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label htmlFor="new-page-name">{tr("pages.name")}</Label>
              <Input id="new-page-name" autoFocus value={newPageName} onChange={(e) => setNewPageName(e.target.value)} maxLength={60} />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setNewPageOpen(false)}>
                <X className="me-1 h-4 w-4" />
                {tr("confirm.cancel")}
              </Button>
              <Button type="submit" disabled={!newPageName.trim()}>
                <Plus className="me-1 h-4 w-4" />
                {tr("pages.create")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
