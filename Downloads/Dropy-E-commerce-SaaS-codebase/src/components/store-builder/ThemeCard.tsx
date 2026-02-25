'use client';

import { Theme } from '@/types/themes';
import { Button } from '@/components/ui/button';
import { Check, Eye } from 'lucide-react';
import Image from 'next/image';

interface ThemeCardProps {
    theme: Theme;
    isActive: boolean;
    onPreview: () => void;
    onApply: () => void;
    isApplying: boolean;
}

export function ThemeCard({
    theme,
    isActive,
    onPreview,
    onApply,
    isApplying
}: ThemeCardProps) {
    return (
        <div
            className={`
        relative rounded-lg border overflow-hidden transition-all bg-card
        ${isActive ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50'}
      `}
        >
            {/* Badge "Actif" */}
            {isActive && (
                <div className="absolute top-2 right-2 z-10 bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs flex items-center gap-1 shadow-sm">
                    <Check className="w-3 h-3" />
                    Actif
                </div>
            )}

            {/* Preview Image / Color Swatches */}
            <div className="aspect-video relative bg-muted group cursor-pointer" onClick={onPreview}>
                {theme.thumbnail ? (
                    <Image
                        src={theme.thumbnail}
                        alt={theme.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <ThemeColorPreview colors={theme.colors} />
                )}

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button variant="secondary" size="sm" className="pointer-events-none">
                        <Eye className="w-4 h-4 mr-2" />
                        Aperçu
                    </Button>
                </div>
            </div>

            {/* Info */}
            <div className="p-4">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="font-semibold text-lg text-foreground">{theme.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2 min-h-[2.5em]">
                            {theme.description}
                        </p>
                    </div>
                    {theme.is_free ? (
                        <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">Gratuit</span>
                    ) : (
                        <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">Premium</span>

                    )}
                </div>

                {/* Color Swatches */}
                <div className="flex gap-1 mt-4 mb-4">
                    <div
                        className="w-6 h-6 rounded-full border border-border shadow-sm"
                        style={{ backgroundColor: theme.colors.primary }}
                        title="Couleur primaire"
                    />
                    <div
                        className="w-6 h-6 rounded-full border border-border shadow-sm"
                        style={{ backgroundColor: theme.colors.secondary }}
                        title="Couleur secondaire"
                    />
                    <div
                        className="w-6 h-6 rounded-full border border-border shadow-sm"
                        style={{ backgroundColor: theme.colors.accent }}
                        title="Couleur accent"
                    />
                    <div
                        className="w-6 h-6 rounded-full border border-border shadow-sm"
                        style={{ backgroundColor: theme.colors.background }}
                        title="Arrière-plan"
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={onPreview}
                    >
                        <Eye className="w-4 h-4 mr-2" />
                        Détails
                    </Button>
                    <Button
                        size="sm"
                        className="flex-1"
                        onClick={onApply}
                        disabled={isApplying || isActive}
                        variant={isActive ? "secondary" : "default"}
                    >
                        {isApplying ? 'Application...' : isActive ? 'Actuellement appliqué' : 'Installer'}
                    </Button>
                </div>
            </div>
        </div>
    );
}

// Composant pour afficher les couleurs si pas d'image
function ThemeColorPreview({ colors }: { colors: Theme['colors'] }) {
    return (
        <div className="w-full h-full flex">
            <div className="flex-1" style={{ backgroundColor: colors.primary }} />
            <div className="flex-1" style={{ backgroundColor: colors.secondary }} />
            <div className="flex-1" style={{ backgroundColor: colors.background }}>
                <div
                    className="w-full h-1/2"
                    style={{ backgroundColor: colors.surface }}
                />
            </div>
        </div>
    );
}
