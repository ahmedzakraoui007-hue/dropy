'use client';

import { useState } from 'react';
import { themes } from '@/lib/themes';
import { ThemeCard } from './ThemeCard';
import { ThemePreviewModal } from './ThemePreviewModal';
import { useThemes } from '@/hooks/store-builder/useThemes';
import { Theme } from '@/types/themes';
import { Loader2 } from 'lucide-react';

export function ThemeGallery() {
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const { applyTheme, isApplying, currentThemeId, isLoading } = useThemes();

  const handlePreview = (theme: Theme) => {
    setSelectedTheme(theme);
    setPreviewOpen(true);
  };

  const handleApply = async (theme: Theme) => {
    await applyTheme(theme);
    setPreviewOpen(false);
    // Redirection handled in useThemes
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Chargement des thèmes...</p>
      </div>
    );
  }

  // Grouper par catégorie
  const categories = [
    { id: 'modern', label: 'Moderne & Épuré' },
    { id: 'luxury', label: 'Luxe & Élégance' },
    { id: 'creative', label: 'Créatif & Audacieux' },
    { id: 'dark', label: 'Mode Sombre' },
    { id: 'traditional', label: 'Traditionnel & Artisanal' },
  ];

  return (
    <div className="space-y-12 pb-20">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Choisissez l'apparence de votre boutique</h1>
        <p className="text-muted-foreground text-lg">
          Sélectionnez un thème professionnel conçu pour convertir. Vous pourrez ensuite personnaliser chaque détail (couleurs, polices, logo) dans l'onglet Design.
        </p>
      </div>

      <div className="space-y-16">
        {categories.map(category => {
          const categoryThemes = themes.filter(t => t.category === category.id);
          if (categoryThemes.length === 0) return null;

          return (
            <section key={category.id} className="space-y-6">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold">{category.label}</h2>
                <div className="h-px bg-border flex-1" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {categoryThemes.map(theme => (
                  <ThemeCard
                    key={theme.id}
                    theme={theme}
                    isActive={currentThemeId === theme.id}
                    onPreview={() => handlePreview(theme)}
                    onApply={() => handleApply(theme)}
                    isApplying={isApplying}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* Modal de Preview */}
      <ThemePreviewModal
        theme={selectedTheme}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        onApply={() => selectedTheme && handleApply(selectedTheme)}
      />
    </div>
  );
}
