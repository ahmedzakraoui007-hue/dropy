'use client';

import { useState } from 'react';
import { themes } from '@/lib/themes';
import { ThemeCard } from './ThemeCard';
import { ThemePreviewModal } from './ThemePreviewModal';
import { useThemes } from '@/hooks/store-builder/useThemes';
import { useTranslation } from '@/context/LanguageContext';
import { Theme } from '@/types/themes';
import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export function ThemeGallery() {
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pendingTheme, setPendingTheme] = useState<Theme | null>(null);
  const { applyTheme, isApplying, currentThemeId, isLoading } = useThemes();
  const { t } = useTranslation();
  const tr = (key: string) => t(`store_builder.theme_dialog.${key}`);

  const handlePreview = (theme: Theme) => {
    setSelectedTheme(theme);
    setPreviewOpen(true);
  };

  const handleApply = (theme: Theme) => {
    setPreviewOpen(false);
    setPendingTheme(theme);
  };

  const confirmApply = async (replaceHome: boolean) => {
    if (!pendingTheme) return;
    const theme = pendingTheme;
    setPendingTheme(null);
    await applyTheme(theme, { replaceHome });
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
          Sélectionnez un thème professionnel conçu pour convertir. Vous pourrez ensuite personnaliser chaque détail (couleurs, polices, textes) dans l'éditeur visuel.
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

      <AlertDialog open={Boolean(pendingTheme)} onOpenChange={(open) => !open && setPendingTheme(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tr('title').replace('{name}', pendingTheme?.name ?? '')}</AlertDialogTitle>
            <AlertDialogDescription>
              {tr('body')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={isApplying}>{tr('cancel')}</AlertDialogCancel>
            <AlertDialogAction disabled={isApplying} className="bg-secondary text-secondary-foreground hover:bg-secondary/80" onClick={() => confirmApply(false)}>
              {tr('colors_only')}
            </AlertDialogAction>
            <AlertDialogAction disabled={isApplying} onClick={() => confirmApply(true)}>
              {tr('replace_home')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
