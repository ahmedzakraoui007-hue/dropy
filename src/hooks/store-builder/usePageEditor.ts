// src/hooks/store-builder/usePageEditor.ts
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { StorePage, PageSection, SectionType, SectionData } from '@/types/store-builder';
import { getPlaceholderConfig } from '@/lib/builder-sections';

export function usePageEditor(pageId: string) {
  const [page, setPage] = useState<StorePage | null>(null);
  const [sections, setSections] = useState<PageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch page
  useEffect(() => {
    async function fetch() {
      if (!pageId) return;
      const supabase = createClient();
      const { data } = await supabase
        .from('store_pages')
        .select('*')
        .eq('id', pageId)
        .single();

      if (data) {
        setPage(data as StorePage);
        setSections((data.sections as PageSection[]) || []);
      }
      setLoading(false);
    }
    fetch();
  }, [pageId]);

  // Sauvegarder immédiatement dans Supabase (Internal Helper)
  const saveSectionsToDb = async (newSections: PageSection[]) => {
    if (!pageId) return;
    setSaving(true);
    const supabase = createClient();

    const { error } = await supabase
      .from('store_pages')
      .update({ sections: newSections, updated_at: new Date().toISOString() })
      .eq('id', pageId);

    if (error) {
      console.error('Error auto-saving sections:', error);
      // Optional: Revert state or notify user
    }

    setSaving(false);
    return !error;
  };

  // Ajouter une section
  const addSection = async (type: SectionType, afterId?: string) => {
    const newSection: PageSection = {
      id: `section-${Date.now()}`,
      type,
      content: getPlaceholderConfig(type),
      is_visible: true,
      position: sections.length,
      styles: null
    };

    let updatedSections = [...sections];
    if (afterId) {
      const index = sections.findIndex(s => s.id === afterId);
      updatedSections.splice(index + 1, 0, newSection);
    } else {
      updatedSections.push(newSection);
    }

    // Update positions
    updatedSections = updatedSections.map((s, idx) => ({ ...s, position: idx }));

    setSections(updatedSections);
    setHasChanges(true); // Keep legacy flag for Publish button
    await saveSectionsToDb(updatedSections);
  };

  // Mettre à jour une section
  const updateSection = async (sectionId: string, content: Partial<SectionData>) => {
    const updatedSections = sections.map(s =>
      s.id === sectionId ? { ...s, content: { ...s.content, ...content } } : s
    );

    setSections(updatedSections);
    setHasChanges(true);

    // Debounce save for text inputs could be better, but for now we save immediately 
    // to ensure no data loss on reload.
    // Ideally we'd use a debounce here for "content" updates.
    await saveSectionsToDb(updatedSections);
  };

  // Supprimer une section
  const deleteSection = async (sectionId: string) => {
    const updatedSections = sections.filter(s => s.id !== sectionId)
      .map((s, idx) => ({ ...s, position: idx }));

    setSections(updatedSections);
    setHasChanges(true);
    await saveSectionsToDb(updatedSections);
  };

  // Dupliquer une section
  const duplicateSection = async (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    const newSection: PageSection = {
      ...section,
      id: `section-${Date.now()}`
    };

    const index = sections.findIndex(s => s.id === sectionId);
    const updatedSections = [...sections];
    updatedSections.splice(index + 1, 0, newSection);

    // Re-index
    const finalSections = updatedSections.map((s, idx) => ({ ...s, position: idx }));

    setSections(finalSections);
    setHasChanges(true);
    await saveSectionsToDb(finalSections);
  };

  // Toggle visibilité
  const toggleVisibility = async (sectionId: string) => {
    const updatedSections = sections.map(s =>
      s.id === sectionId ? { ...s, is_visible: !s.is_visible } : s
    );
    setSections(updatedSections);
    setHasChanges(true);
    await saveSectionsToDb(updatedSections);
  };

  // Réordonner (drag & drop)
  const reorderSections = async (startIndex: number, endIndex: number) => {
    const result = Array.from(sections);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    const updatedSections = result.map((s, idx) => ({ ...s, position: idx }));

    setSections(updatedSections);
    setHasChanges(true);
    await saveSectionsToDb(updatedSections);
  };

  // Sauvegarder (Legacy manual save, still useful for Publish)
  const save = async () => {
    return await saveSectionsToDb(sections);
  };

  // Publier
  const publish = async () => {
    const saved = await save();
    if (!saved) return false;

    const supabase = createClient();
    const { error } = await supabase
      .from('store_pages')
      .update({ is_published: true, updated_at: new Date().toISOString() })
      .eq('id', pageId);

    if (!error && page) {
      setPage({ ...page, is_published: true });
    }
    return !error;
  };

  return {
    page,
    sections,
    loading,
    saving,
    hasChanges,
    addSection,
    updateSection,
    deleteSection,
    duplicateSection,
    toggleVisibility,
    reorderSections,
    save,
    publish
  };
}

// Données par défaut pour chaque type de section
function getDefaultSectionData(type: SectionType): SectionData {
  const defaults: Record<string, SectionData> = {
    hero: {
      style: 'fullscreen',
      background_type: 'image',
      background_image: '',
      overlay_opacity: 0.3,
      title: 'Bienvenue dans notre boutique',
      subtitle: 'Découvrez notre collection',
      cta_text: 'Voir les produits',
      cta_link: '/products',
      text_alignment: 'center',
      text_color: 'light',
      height: 'large'
    },
    featured_products: {
      title: 'Nos produits phares',
      subtitle: '',
      display: 'grid',
      columns: 4,
      count: 8,
      source: 'newest',
      show_view_all: true,
      view_all_link: '/products'
    },
    categories: {
      title: 'Catégories',
      subtitle: '',
      display: 'grid',
      style: 'card',
      columns: 4,
      categories: []
    },
    benefits: {
      display: 'row',
      items: [
        { icon: 'Truck', title: 'Livraison rapide', description: 'Partout en Tunisie' },
        { icon: 'Shield', title: 'Paiement sécurisé', description: 'Transactions protégées' },
        { icon: 'RotateCcw', title: 'Retours faciles', description: 'Sous 14 jours' },
        { icon: 'Headphones', title: 'Support client', description: '7j/7 par WhatsApp' }
      ]
    },
    testimonials: {
      title: 'Avis clients',
      subtitle: 'Ce que nos clients disent de nous',
      display: 'carousel',
      testimonials: []
    },
    newsletter: {
      title: 'Restez informé',
      subtitle: 'Inscrivez-vous à notre newsletter',
      background_type: 'color',
      background_color: '#f3f4f6',
      button_text: 'S\'inscrire',
      success_message: 'Merci pour votre inscription !'
    },
    banner: {
      style: 'contained',
      background_type: 'color',
      background_color: '#000000',
      title: 'Offre spéciale',
      subtitle: 'Profitez de -20% sur tout le site',
      cta_text: 'En profiter',
      cta_link: '/products',
      text_color: 'light'
    },
    countdown: {
      title: 'Vente flash',
      subtitle: 'Se termine dans',
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      cta_text: 'Voir les offres',
      cta_link: '/products',
      expired_message: 'Cette offre est terminée'
    },
    image_with_text: {
      layout: 'image_left',
      image: '',
      title: 'Notre histoire',
      text: 'Décrivez votre marque ici...',
      cta_text: 'En savoir plus',
      cta_link: '/about'
    },
    video: {
      video_type: 'youtube',
      video_url: '',
      autoplay: false,
      full_width: false
    },
    rich_text: {
      content: '<p>Votre contenu ici...</p>',
      max_width: 'lg',
      alignment: 'left'
    }
  };

  return defaults[type] || {};
}
