'use client';

import { Theme } from '@/types/themes';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Monitor, Smartphone, Tablet, X } from 'lucide-react';
import { useState } from 'react';

interface ThemePreviewModalProps {
    theme: Theme | null;
    open: boolean;
    onClose: () => void;
    onApply: () => void;
}

type DeviceView = 'desktop' | 'tablet' | 'mobile';

export function ThemePreviewModal({
    theme,
    open,
    onClose,
    onApply
}: ThemePreviewModalProps) {
    const [device, setDevice] = useState<DeviceView>('desktop');

    if (!theme) return null;

    const deviceWidths = {
        desktop: '100%',
        tablet: '768px',
        mobile: '375px',
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-background sm:rounded-xl">
                {/* Header */}
                <div className="shrink-0 p-4 border-b flex items-center justify-between bg-card z-20 shadow-sm">
                    <div className="flex items-center gap-4">
                        <DialogTitle className="text-xl font-bold">{theme.name}</DialogTitle>
                        <span className="text-sm text-muted-foreground hidden md:inline ml-2 border-l pl-4">{theme.description}</span>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Device Toggle */}
                        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1 border hidden sm:flex">
                            <Button
                                variant={device === 'desktop' ? 'secondary' : 'ghost'}
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setDevice('desktop')}
                                title="Desktop View"
                            >
                                <Monitor className="w-4 h-4" />
                            </Button>
                            <Button
                                variant={device === 'tablet' ? 'secondary' : 'ghost'}
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setDevice('tablet')}
                                title="Tablet View"
                            >
                                <Tablet className="w-4 h-4" />
                            </Button>
                            <Button
                                variant={device === 'mobile' ? 'secondary' : 'ghost'}
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setDevice('mobile')}
                                title="Mobile View"
                            >
                                <Smartphone className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="h-6 w-px bg-border hidden sm:block" />

                        <Button variant="outline" onClick={onClose} className="hidden sm:inline-flex">
                            Fermer
                        </Button>
                        <Button onClick={onApply} className="bg-primary text-primary-foreground hover:opacity-90">
                            Installer ce thème
                        </Button>
                        <Button variant="ghost" size="icon" onClick={onClose} className="sm:hidden">
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                {/* Preview Frame */}
                <div className="flex-1 overflow-auto bg-slate-100/50 flex items-start justify-center p-4 md:p-8">
                    <div
                        className={`bg-white shadow-2xl transition-all duration-300 origin-top overflow-hidden border border-border/40 ${device === 'mobile' ? 'rounded-[2rem] border-8 border-slate-900' :
                                device === 'tablet' ? 'rounded-xl border-4 border-slate-800' : 'rounded-md'
                            }`}
                        style={{
                            width: deviceWidths[device],
                            minHeight: device === 'desktop' ? '100%' : 'auto',
                            height: device === 'desktop' ? 'auto' : (device === 'mobile' ? '812px' : '1024px'),
                            maxHeight: '100%'
                        }}
                    >
                        {/* Scrollable content inside the device frame */}
                        <div className="h-full overflow-y-auto scrollbar-hide">
                            <ThemeDemoContent theme={theme} />
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// Contenu de démo pour le thème
function ThemeDemoContent({ theme }: { theme: Theme }) {
    const { colors, typography } = theme;

    return (
        <div
            className="min-h-full flex flex-col"
            style={{
                backgroundColor: colors.background,
                color: colors.text,
                fontFamily: typography.bodyFont,
            }}
        >
            {/* Header Demo */}
            <header
                className="px-8 py-6 border-b flex items-center justify-between sticky top-0 z-10"
                style={{ borderColor: colors.border, backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)' }}
            >
                <div
                    className="font-bold text-2xl"
                    style={{ fontFamily: typography.headingFont, color: colors.text }}
                >
                    Ma Boutique
                </div>
                <nav className="hidden md:flex gap-8 text-sm font-medium opacity-80">
                    <span>Accueil</span>
                    <span>Collections</span>
                    <span>Nouveautés</span>
                    <span>À propos</span>
                </nav>
                <div className="w-8 h-8 rounded-full bg-black/5" />
            </header>

            {/* Hero Demo */}
            <section
                className="px-8 py-32 text-center flex flex-col items-center justify-center relative overflow-hidden"
                style={{
                    backgroundColor: `${colors.primary}10`, // 10% opacity
                    color: colors.text
                }}
            >
                <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundColor: colors.primary }} />

                <span className="text-xs font-bold uppercase tracking-widest mb-4 opacity-70">Collection 2025</span>
                <h1
                    className="text-5xl md:text-7xl font-bold mb-6 leading-tight max-w-4xl"
                    style={{ fontFamily: typography.headingFont }}
                >
                    Bienvenue dans l'univers {theme.name}
                </h1>
                <p className="mb-10 text-xl opacity-70 max-w-2xl leading-relaxed">
                    {theme.description}. Une expérience shopping unique conçue pour mettre en valeur vos produits.
                </p>
                <div className="flex gap-4">
                    <button
                        className="px-8 py-4 rounded font-bold shadow-lg transition-transform hover:scale-105 active:scale-95"
                        style={{
                            backgroundColor: colors.primary,
                            color: '#ffffff',
                            borderRadius: theme.layout.borderRadius
                        }}
                    >
                        Voir la collection
                    </button>
                    <button
                        className="px-8 py-4 rounded font-bold border transition-colors hover:bg-black/5"
                        style={{
                            color: colors.text,
                            borderColor: colors.border,
                            borderRadius: theme.layout.borderRadius
                        }}
                    >
                        En savoir plus
                    </button>
                </div>
            </section>

            {/* Products Demo */}
            <section className="px-8 py-24 max-w-7xl mx-auto w-full">
                <div className="flex items-end justify-between mb-12">
                    <div>
                        <h2
                            className="text-3xl font-bold mb-2"
                            style={{ fontFamily: typography.headingFont }}
                        >
                            Nos produits phares
                        </h2>
                        <p className="opacity-60">Sélectionnés avec soin pour vous</p>
                    </div>
                    <a href="#" className="font-medium hover:underline opacity-80">Voir tout →</a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
                    {[1, 2, 3, 4].map(i => (
                        <div
                            key={i}
                            className="group cursor-pointer"
                        >
                            <div
                                className="aspect-[4/5] mb-4 overflow-hidden relative shadow-sm hover:shadow-xl transition-all duration-300"
                                style={{
                                    backgroundColor: colors.surface,
                                    borderRadius: theme.layout.borderRadius,
                                }}
                            >
                                <div
                                    className="w-full h-full opacity-10 transition-transform duration-700 group-hover:scale-110"
                                    style={{ backgroundColor: colors.primary }}
                                />
                                <div className="absolute top-3 left-3 bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-sm shadow-sm">
                                    Nouveau
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div
                                    className="font-bold text-lg leading-tight"
                                    style={{ fontFamily: typography.headingFont }}
                                >
                                    Produit Signature {i}
                                </div>
                                <div className="flex justify-between items-center">
                                    <div style={{ color: colors.textMuted }} className="text-sm">Catégorie</div>
                                    <div className="font-bold text-lg" style={{ color: colors.primary }}>
                                        {(29.99 * i).toFixed(2)} TND
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features Demo */}
            <section
                className="py-24 px-8"
                style={{ backgroundColor: colors.surface }}
            >
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                    {[
                        { title: 'livraison rapide', text: 'Partout en Tunisie sous 48h' },
                        { title: 'paiement sécurisé', text: 'Cartes bancaires et e-dinar' },
                        { title: 'service client', text: 'Support disponible 7j/7' },
                    ].map((feature, i) => (
                        <div key={i} className="space-y-4">
                            <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: `${colors.primary}20`, color: colors.primary }}>
                                <div className="w-8 h-8 bg-current rounded-full opacity-50" />
                            </div>
                            <h3 className="font-bold text-xl uppercase tracking-wide" style={{ fontFamily: typography.headingFont }}>{feature.title}</h3>
                            <p style={{ color: colors.textMuted }}>{feature.text}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer Demo */}
            <footer
                className="px-8 py-16 text-center text-sm border-t mt-auto"
                style={{
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.textMuted,
                }}
            >
                <div className="mb-8 font-bold text-2xl opacity-30" style={{ fontFamily: typography.headingFont }}>MA BOUTIQUE</div>
                © 2026 Ma Boutique - Propulsé par Dropy
            </footer>
        </div>
    );
}
