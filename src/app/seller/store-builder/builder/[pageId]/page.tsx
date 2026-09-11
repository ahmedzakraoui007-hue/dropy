// src/app/seller/store-builder/builder/[pageId]/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePageEditor } from '@/hooks/store-builder/usePageEditor';
import { useStoreConfig } from '@/hooks/store-builder/useStoreConfig';
import { SectionEditor } from '@/components/store-builder/SectionEditor';
import { SectionLibraryModal } from '@/components/store-builder/SectionLibraryModal';
import { LivePreview } from '@/components/store-builder/LivePreview';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft, Save, Eye, Plus,
  Settings, Loader2, Sparkles,
  Undo2, Redo2, Monitor, Smartphone, Tablet
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

export default function PageBuilder() {
  const { pageId } = useParams();
  const router = useRouter();
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const supabase = createClient();

  // Sensors for DnD
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('seller_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();
        if (profile) setSellerId(profile.id);
      }
    }
    load();
  }, [supabase]);

  const {
    page,
    sections,
    loading: pageLoading,
    saving: pageSaving,
    hasChanges,
    addSection,
    updateSection,
    deleteSection,
    duplicateSection,
    toggleVisibility,
    reorderSections,
    save,
    publish
  } = usePageEditor(pageId as string);

  const {
    config,
    loading: configLoading
  } = useStoreConfig(sellerId || '');

  const loading = pageLoading || configLoading;

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = sections.findIndex(s => s.id === active.id);
      const newIndex = sections.findIndex(s => s.id === over.id);
      reorderSections(oldIndex, newIndex);
    }
  };

  const handleSave = async () => {
    const success = await save();
    if (success) toast.success("Page enregistrée !");
    else toast.error("Erreur lors de l'enregistrement");
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Initialisation de l'éditeur...</p>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#F8F9FC]">
      {/* Top Bar */}
      <header className="h-16 bg-white border-b border-gray-100 px-6 flex items-center justify-between shrink-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-xl hover:bg-gray-50">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="h-8 w-[1px] bg-gray-100" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-gray-900 uppercase tracking-tight text-sm">{page?.title}</h1>
              <Badge variant="secondary" className="bg-gray-100 text-gray-500 text-[9px] font-bold uppercase tracking-widest px-1.5 py-0">
                {page?.page_type}
              </Badge>
            </div>
            <p className="text-[10px] text-gray-400 font-mono italic">/{page?.slug}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Changements non sauvegardés
            </span>
          )}
          <Button variant="outline" onClick={handleSave} disabled={pageSaving} className="rounded-xl font-bold border-gray-200">
            {pageSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Sauvegarder
          </Button>
          <Button onClick={publish} className="rounded-xl font-black bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 uppercase tracking-tight text-xs">
            <Sparkles className="w-4 h-4 mr-2" />
            Publier la page
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Panel: Sections List */}
        <aside className="w-[400px] border-r border-gray-100 bg-white flex flex-col shrink-0 z-20">
          <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-white shrink-0">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Structure</h3>
            <Button size="sm" onClick={() => setIsLibraryOpen(true)} className="h-8 rounded-lg bg-gray-900 text-white hover:bg-black font-bold text-[10px] uppercase tracking-widest px-3">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Ajouter
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto bg-gray-50/30 p-4 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis]}
            >
              <SortableContext
                items={sections.map(s => s.id)}
                strategy={verticalListSortingStrategy}
              >
                {sections.map((section) => (
                  <SectionEditor
                    key={section.id}
                    section={section}
                    isActive={activeSectionId === section.id}
                    onSelect={() => setActiveSectionId(section.id)}
                    onUpdate={(data) => updateSection(section.id, data)}
                    onDelete={() => deleteSection(section.id)}
                    onDuplicate={() => duplicateSection(section.id)}
                    onToggleVisibility={() => toggleVisibility(section.id)}
                  />
                ))}
              </SortableContext>
            </DndContext>

            {sections.length === 0 && (
              <div className="text-center py-12 px-6 border-2 border-dashed border-gray-100 rounded-3xl mt-4">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-6 h-6 text-gray-300" />
                </div>
                <h4 className="font-bold text-gray-900 mb-1 uppercase tracking-tight text-xs">Page Vide</h4>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest leading-relaxed mb-6 font-medium">Commencez par ajouter une section hero ou une bannière.</p>
                <Button variant="outline" size="sm" onClick={() => setIsLibraryOpen(true)} className="w-full rounded-xl border-gray-200 hover:bg-gray-50 font-bold text-[10px] uppercase tracking-widest">
                  Choisir un bloc
                </Button>
              </div>
            )}
          </div>
        </aside>

        <main className="flex-1 overflow-hidden flex flex-col p-8 bg-[#F0F2F5]">
          <LivePreview
            storeSlug={config?.store_slug || 'shop'}
            pageSlug={page?.slug || ''}
            data={{ sections, config }}
            activeSectionId={activeSectionId}
          />
        </main>
      </div>

      {/* Modals */}
      <SectionLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onAdd={(type) => {
          addSection(type);
          setIsLibraryOpen(false);
        }}
      />
    </div>
  );
}
