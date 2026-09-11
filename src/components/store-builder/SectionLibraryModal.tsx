// src/components/store-builder/SectionLibraryModal.tsx
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { SectionType } from '@/types/store-builder';
import {
  ImageIcon, ShoppingBag, Layout, Star, Mail,
  Clock, Video, AlignLeft, Info, Plus, Zap,
  Shield, Columns, Heart, Grid, Award, List,
  Activity, User, MessageSquare, RefreshCw,
  HelpCircle, Truck, FileText, Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface SectionLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (type: SectionType) => void;
}

const CATEGORIES = [
  { id: 'all', label: 'Tous les blocs' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'ecommerce', label: 'E-commerce' },
  { id: 'content', label: 'Contenu' },
  { id: 'social', label: 'Social Proof' },
  { id: 'legal', label: 'Légal' },
];

const SECTIONS: { type: SectionType; label: string; description: string; icon: any; category: string; premium?: boolean }[] = [
  // MARKETING
  { type: 'hero', label: 'Bannière Hero', description: 'Une grande bannière pour le haut de votre page.', icon: ImageIcon, category: 'marketing' },
  { type: 'promo_banner', label: 'Bandeau Promo', description: 'Petit bandeau d\'annonce tout en haut.', icon: Zap, category: 'marketing' },
  { type: 'countdown', label: 'Compte à rebours', description: 'Créez de l\'urgence pour vos promos.', icon: Clock, category: 'marketing' },
  { type: 'newsletter', label: 'Newsletter', description: 'Capturez les emails de vos visiteurs.', icon: Mail, category: 'marketing' },
  { type: 'banner', label: 'Bannière Promo', description: 'Une bande promotionnelle avec un CTA.', icon: Layout, category: 'marketing' },
  { type: 'pricing', label: 'Tarifs', description: 'Affichez vos plans ou tarifs.', icon: Columns, category: 'marketing', premium: true },

  // E-COMMERCE
  { type: 'featured_products', label: 'Produits Vedettes', description: 'Affichez vos meilleurs produits.', icon: ShoppingBag, category: 'ecommerce' },
  { type: 'product_grid', label: 'Grille Produits', description: 'Grille de produits avec filtres.', icon: Grid, category: 'ecommerce' },
  { type: 'categories', label: 'Catégories', description: 'Mettez en avant vos catégories.', icon: Layout, category: 'ecommerce' },
  { type: 'collection_grid', label: 'Grille de Collections', description: 'Affichage visuel de vos collections.', icon: Grid, category: 'ecommerce' },
  { type: 'wishlist', label: 'Favoris', description: 'Section de liste d\'envies.', icon: Heart, category: 'ecommerce' },
  { type: 'checkout', label: 'Checkout COD', description: 'Formulaire d\'achat optimisé.', icon: Zap, category: 'ecommerce', premium: true },

  // CONTENT
  { type: 'image_with_text', label: 'Image + Texte', description: 'Présentez votre histoire ou un produit.', icon: ImageIcon, category: 'content' },
  { type: 'video', label: 'Vidéo', description: 'Intégrez une vidéo YouTube ou Vimeo.', icon: Video, category: 'content' },
  { type: 'rich_text', label: 'Texte Riche', description: 'Éditeur de texte libre.', icon: AlignLeft, category: 'content' },
  { type: 'about_preview', label: 'À Propos', description: 'Résumé de votre histoire.', icon: Info, category: 'content' },
  { type: 'features', label: 'Avantages (USPs)', description: 'Points forts de votre boutique.', icon: Award, category: 'content' },
  { type: 'process_steps', label: 'Étapes', description: 'Expliquez comment ça marche.', icon: List, category: 'content' },
  { type: 'stats', label: 'Chiffres Clés', description: 'Affichez vos statistiques.', icon: Activity, category: 'content' },
  { type: 'team', label: 'Équipe', description: 'Présentez vos fondateurs.', icon: User, category: 'content' },

  // SOCIAL PROOF
  { type: 'testimonials', label: 'Témoignages', description: 'Avis de vos clients satisfaits.', icon: MessageSquare, category: 'social' },
  { type: 'brand_logos', label: 'Logos Partenaires', description: 'Carousel de logos de confiance.', icon: RefreshCw, category: 'social' },
  { type: 'benefits', label: 'Réassurance', description: 'Icônes de confiance (Livraison, SAV).', icon: Shield, category: 'social' },
  { type: 'instagram_feed', label: 'Instagram Feed', description: 'Affichez vos derniers posts.', icon: Search, category: 'social' },

  // LEGAL
  { type: 'faq_preview', label: 'FAQ', description: 'Questions fréquentes.', icon: HelpCircle, category: 'legal' },
  { type: 'contact', label: 'Contact', description: 'Formulaire de contact.', icon: Mail, category: 'legal' },
  { type: 'shipping_policy', label: 'Livraison', description: 'Politique de livraison.', icon: Truck, category: 'legal' },
  { type: 'refund_policy', label: 'Retours', description: 'Politique de retours.', icon: RefreshCw, category: 'legal' },
  { type: 'privacy_policy', label: 'Confidentialité', description: 'Politique de confidentialité.', icon: Shield, category: 'legal' },
  { type: 'terms_conditions', label: 'Conditions (CGV)', description: 'Conditions de vente.', icon: FileText, category: 'legal' },
];

export function SectionLibraryModal({ isOpen, onClose, onAdd }: SectionLibraryModalProps) {
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredSections = activeCategory === 'all'
    ? SECTIONS
    : SECTIONS.filter(s => s.category === activeCategory);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col rounded-[2.5rem] border-none shadow-2xl bg-white p-0">
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Navigation */}
          <aside className="w-64 bg-[#F8F9FC] border-r border-gray-100 flex flex-col p-6 shrink-0">
            <div className="mb-8">
              <h2 className="text-xl font-black uppercase tracking-tighter text-gray-900">Bibliothèque</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Blos & Sections</p>
            </div>

            <nav className="space-y-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all",
                    activeCategory === cat.id
                      ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]"
                      : "text-gray-500 hover:bg-white hover:text-gray-900"
                  )}
                >
                  {cat.label}
                  {activeCategory !== cat.id && (
                    <span className="text-[10px] opacity-30 font-mono">
                      {cat.id === 'all' ? SECTIONS.length : SECTIONS.filter(s => s.category === cat.id).length}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            <div className="mt-auto p-4 bg-primary/5 rounded-2xl border border-primary/10">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-tight text-primary">Dropy Premium</span>
              </div>
              <p className="text-[9px] text-primary/70 font-bold uppercase leading-tight">Accédez à des sections de conversion exclusives.</p>
            </div>
          </aside>

          {/* Content Area */}
          <div className="flex-1 flex flex-col bg-white">
            <DialogHeader className="px-10 py-8 border-b border-gray-50 flex flex-row items-center justify-between shrink-0">
              <div>
                <DialogTitle className="text-2xl font-black uppercase tracking-tight">
                  {CATEGORIES.find(c => c.id === activeCategory)?.label}
                </DialogTitle>
                <DialogDescription className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                  Cliquez sur une section pour l'ajouter à votre page
                </DialogDescription>
              </div>
            </DialogHeader>

            <ScrollArea className="flex-1">
              <div className="p-10">
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredSections.map((section) => (
                    <button
                      key={section.type}
                      onClick={() => onAdd(section.type)}
                      className="flex flex-col items-start gap-4 p-6 bg-white rounded-3xl border border-gray-100 hover:border-primary hover:shadow-2xl hover:shadow-primary/5 transition-all text-left group relative overflow-hidden"
                    >
                      {section.premium && (
                        <div className="absolute top-4 right-4">
                          <Badge className="bg-amber-100 text-amber-600 border-none font-black text-[8px] uppercase tracking-widest px-2">PRO</Badge>
                        </div>
                      )}

                      <div className="w-14 h-14 rounded-2xl bg-[#F8F9FC] text-gray-400 group-hover:bg-primary group-hover:text-white flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-3 shadow-sm">
                        <section.icon className="w-7 h-7" />
                      </div>

                      <div className="space-y-1.5">
                        <h4 className="font-black text-gray-900 group-hover:text-primary transition-colors uppercase tracking-tight text-sm leading-tight">
                          {section.label}
                        </h4>
                        <p className="text-[10px] font-medium text-gray-400 leading-relaxed group-hover:text-gray-500 transition-colors">
                          {section.description}
                        </p>
                      </div>

                      <div className="mt-2 w-full flex items-center justify-between pt-4 border-t border-gray-50">
                        <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest group-hover:text-primary/50">Bloc {section.category}</span>
                        <div className="w-8 h-8 rounded-full bg-[#F8F9FC] flex items-center justify-center text-gray-300 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                          <Plus className="w-4 h-4" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
