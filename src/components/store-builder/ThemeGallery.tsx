'use client';

import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { themeHeroImage, themes } from '@/lib/themes';
import { useThemes } from '@/hooks/store-builder/useThemes';
import { useTranslation } from '@/context/LanguageContext';
import { Theme } from '@/types/themes';
import { Button } from '@/components/ui/button';
import { firstFont } from '@/components/store-builder/editor/StylePanel';
import { cn } from '@/lib/utils';
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
  const [pendingTheme, setPendingTheme] = useState<Theme | null>(null);
  const { applyTheme, isApplying, currentThemeId, isLoading } = useThemes();
  const { t } = useTranslation();
  const tr = (key: string) => t(`store_builder.theme_dialog.${key}`);
  const name = (theme: Theme) => t(`store_builder.themes.${theme.id}.name`);

  const confirmApply = async (replaceHome: boolean) => {
    if (!pendingTheme) return;
    const theme = pendingTheme;
    setPendingTheme(null);
    await applyTheme(theme, { replaceHome });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold md:text-3xl">{t('store_builder.theme_page.title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('store_builder.theme_page.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {themes.map((theme) => {
          const active = currentThemeId === theme.id;
          const heading = firstFont(theme.typography?.headingFont);
          return (
            <div
              key={theme.id}
              className={cn(
                'group overflow-hidden rounded-2xl border bg-card transition-shadow hover:shadow-xl',
                active ? 'border-primary ring-2 ring-primary/30' : 'border-border'
              )}
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                <img
                  src={themeHeroImage(theme, 900)}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="absolute inset-x-4 bottom-4 text-white">
                  <p className="text-2xl font-bold leading-tight" style={{ fontFamily: heading }}>
                    {name(theme)}
                  </p>
                  <p className="text-sm opacity-90">{t(`store_builder.themes.${theme.id}.niche`)}</p>
                </div>
                {active && (
                  <span className="absolute end-3 top-3 flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-primary shadow">
                    <Check className="h-3.5 w-3.5" />
                    {t('store_builder.theme_page.current')}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-1.5">
                  {[theme.colors.primary, theme.colors.secondary, theme.colors.accent].map((color, i) => (
                    <span key={i} className="h-5 w-5 rounded-full border border-black/10" style={{ backgroundColor: color }} />
                  ))}
                </div>
                <Button size="sm" variant={active ? 'outline' : 'default'} disabled={isApplying} onClick={() => setPendingTheme(theme)}>
                  {active ? t('store_builder.theme_page.reapply') : t('store_builder.theme_page.use')}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <link
        rel="stylesheet"
        href={`https://fonts.googleapis.com/css2?${[...new Set(themes.map((th) => firstFont(th.typography?.headingFont)))]
          .filter((f) => f !== 'Inter')
          .map((f) => `family=${f.replace(/ /g, '+')}:wght@700`)
          .join('&')}&display=swap`}
      />

      <AlertDialog open={!!pendingTheme} onOpenChange={(open) => !open && setPendingTheme(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tr('title').replace('{name}', pendingTheme ? name(pendingTheme) : '')}</AlertDialogTitle>
            <AlertDialogDescription>{tr('body')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel disabled={isApplying}>{tr('cancel')}</AlertDialogCancel>
            <Button variant="outline" disabled={isApplying} onClick={() => confirmApply(false)}>
              {tr('colors_only')}
            </Button>
            <AlertDialogAction disabled={isApplying} onClick={() => confirmApply(true)}>
              {tr('replace_home')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
