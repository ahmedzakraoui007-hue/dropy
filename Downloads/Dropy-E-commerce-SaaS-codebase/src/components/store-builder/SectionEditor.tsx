// src/components/store-builder/SectionEditor.tsx
'use client';

import { useState } from 'react';
import {
  GripVertical, Eye, EyeOff, Copy, Trash2,
  ChevronDown, ChevronUp, Image as ImageIcon,
  Type, ShoppingBag, Layout, Star, Mail,
  Clock, Video, AlignLeft, Info, Plus, Zap,
  Shield, Columns, Heart, Grid, Award, List,
  Activity, User, MessageSquare, RefreshCw,
  HelpCircle, Truck, FileText, Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageSection, SectionType, SectionData, HeroSectionData, FeaturedProductsSectionData, BenefitsSectionData } from '@/types/store-builder';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SectionEditorProps {
  section: PageSection;
  isActive: boolean;
  onSelect: () => void;
  onUpdate: (data: Partial<SectionData>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onToggleVisibility: () => void;
}

export function SectionEditor({
  section,
  isActive,
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate,
  onToggleVisibility,
}: SectionEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  const sectionIcons: Partial<Record<SectionType, any>> = {
    hero: ImageIcon,
    featured_products: ShoppingBag,
    categories: Layout,
    benefits: Shield,
    testimonials: MessageSquare,
    newsletter: Mail,
    banner: ImageIcon,
    countdown: Clock,
    image_with_text: ImageIcon,
    video: Video,
    rich_text: AlignLeft,
    product_grid: Grid,
    category_grid: Layout,
    instagram_feed: Search,
    about_preview: Info,
    brand_logos: RefreshCw,
    faq_preview: HelpCircle,
    blog_preview: FileText,
    collection_grid: Grid,
    divider: AlignLeft,
    spacer: AlignLeft,
    custom_html: Type,
    promo_banner: Zap,
    pricing: Columns,
    wishlist: Heart,
    trust_badges: Shield,
    collections: Grid,
    product_detail: ShoppingBag,
    recommended_products: Star,
    checkout: Zap,
    features: Award,
    about: Info,
    process_steps: List,
    stats: Activity,
    team: User,
    contact: Mail,
    shipping_policy: Truck,
    refund_policy: RefreshCw,
    privacy_policy: Shield,
    terms_conditions: FileText,
    footer: Layout,
    mega_menu: Layout,
  };

  const sectionLabels: Partial<Record<SectionType, string>> = {
    hero: 'Bannière Hero',
    featured_products: 'Produits Vedettes',
    categories: 'Catégories',
    benefits: 'Réassurance',
    testimonials: 'Témoignages',
    newsletter: 'Newsletter',
    banner: 'Bannière Promo',
    countdown: 'Compte à rebours',
    image_with_text: 'Image + Texte',
    video: 'Vidéo',
    rich_text: 'Texte Riche',
    product_grid: 'Grille Produits',
    category_grid: 'Grille Catégories',
    instagram_feed: 'Instagram Feed',
    about_preview: 'À Propos (Aperçu)',
    brand_logos: 'Logos Partenaires',
    faq_preview: 'FAQ (Aperçu)',
    blog_preview: 'Blog (Aperçu)',
    collection_grid: 'Grille Collections',
    divider: 'Séparateur',
    spacer: 'Espace',
    custom_html: 'HTML Custom',
    promo_banner: 'Bandeau Promo',
    pricing: 'Tarifs',
    wishlist: 'Favoris',
    trust_badges: 'Badges Confiance',
    collections: 'Collections',
    product_detail: 'Détail Produit',
    recommended_products: 'Recommandations',
    checkout: 'Checkout COD',
    features: 'Avantages',
    about: 'À Propos',
    process_steps: 'Étapes',
    stats: 'Statistiques',
    team: 'Équipe',
    contact: 'Contact',
    shipping_policy: 'Livraison',
    refund_policy: 'Retours',
    privacy_policy: 'Confidentialité',
    terms_conditions: 'Conditions (CGV)',
    footer: 'Pied de page',
    mega_menu: 'Mega Menu',
  };

  const Icon = sectionIcons[section.type] || ImageIcon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group border rounded-3xl overflow-hidden transition-all bg-white mb-3",
        isActive ? "ring-2 ring-primary border-primary shadow-xl shadow-primary/5 scale-[1.01]" : "border-gray-100 hover:border-gray-200 shadow-sm",
        !section.is_visible && "opacity-60 grayscale-[0.5]"
      )}
    >
      {/* Header */}
      <div
        className="flex items-center gap-4 p-5 cursor-pointer select-none bg-white"
        onClick={() => {
          onSelect();
          setIsExpanded(!isExpanded);
        }}
      >
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="p-1.5 hover:bg-gray-50 rounded-xl cursor-grab active:cursor-grabbing transition-colors text-gray-300 group-hover:text-gray-400"
        >
          <GripVertical className="w-5 h-5" />
        </div>

        {/* Icon & Label */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className={cn(
            "w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center transition-all",
            isActive ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110 rotate-3" : "bg-[#F8F9FC] text-gray-400"
          )}>
            <Icon className="w-6 h-6" />
          </div>
          <div className="flex-1 truncate">
            <span className="font-black text-gray-900 block uppercase tracking-tight text-sm">
              {sectionLabels[section.type] || section.type}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[9px] text-gray-400 uppercase tracking-widest font-black opacity-50">Section {section.type}</span>
              {!section.is_visible && <span className="text-[8px] bg-red-50 text-red-500 px-1.5 rounded-full font-black uppercase tracking-tighter">Masqué</span>}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleVisibility(); }}
            className={cn(
              "w-9 h-9 flex items-center justify-center hover:bg-gray-50 rounded-xl transition-colors",
              !section.is_visible ? "text-red-500" : "text-gray-400"
            )}
            title={section.is_visible ? 'Masquer' : 'Afficher'}
          >
            {section.is_visible ? <Eye className="w-4.5 h-4.5" /> : <EyeOff className="w-4.5 h-4.5" />}
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
            className="w-9 h-9 flex items-center justify-center hover:bg-gray-50 text-gray-400 rounded-xl transition-colors"
            title="Dupliquer"
          >
            <Copy className="w-4.5 h-4.5" />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="w-9 h-9 flex items-center justify-center hover:bg-red-50 text-red-500 rounded-xl transition-colors"
            title="Supprimer"
          >
            <Trash2 className="w-4.5 h-4.5" />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
            className={cn(
              "w-9 h-9 flex items-center justify-center hover:bg-gray-50 text-gray-400 rounded-xl transition-all",
              isExpanded && "bg-gray-900 text-white rotate-180"
            )}
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Editor Panel */}
      {isExpanded && (
        <div className="p-8 border-t border-gray-50 bg-[#F8F9FC]">
          <SectionDataEditor
            type={section.type}
            data={section.content as SectionData}
            onChange={onUpdate as (data: Partial<SectionData>) => void}
          />

          {/* Global Section Controls */}
          <div className="mt-8 pt-8 border-t border-gray-100 grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Padding Vertical (px)</Label>
              <Slider
                value={[section.content.paddingY || 100]}
                onValueChange={([v]) => onUpdate({ paddingY: v })}
                max={200}
                step={10}
                className="py-4"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Couleur de Fond</Label>
              <Input
                type="color"
                value={section.content.backgroundColor || '#ffffff'}
                onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
                className="h-10 w-full p-1 bg-white rounded-xl border-gray-100"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Éditeurs spécifiques par type de section
function SectionDataEditor({ type, data, onChange }: {
  type: SectionType;
  data: SectionData;
  onChange: (data: Record<string, any>) => void;
}) {
  switch (type) {
    case 'hero':
      return <HeroEditor data={data as any} onChange={onChange} />;
    case 'featured_products':
    case 'product_grid':
    case 'recommended_products':
      return <ProductsEditor data={data as any} onChange={onChange} />;
    case 'benefits':
    case 'features':
    case 'trust_badges':
      return <GridEditor data={data as any} onChange={onChange} />;
    case 'testimonials':
      return <TestimonialsEditor data={data as any} onChange={onChange} />;
    default:
      return (
        <div className="p-4 bg-blue-50 rounded-2xl mb-4 border border-blue-100">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-blue-900 uppercase tracking-tight">Éditeur Avancé</p>
              <p className="text-[10px] text-blue-700 mt-1 leading-relaxed font-medium">
                L'interface d'édition visuelle pour ce bloc est en cours de déploiement.
                Modifiez les paramètres principaux ci-dessous.
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <Label className="text-[9px] font-black uppercase tracking-widest text-gray-400">Titre du bloc</Label>
            <Input
              value={data.title || ''}
              onChange={e => onChange({ title: e.target.value })}
              className="bg-white border-blue-100 rounded-xl h-12 font-bold px-4 focus:ring-2 focus:ring-blue-500/20"
              placeholder="Titre de la section..."
            />
          </div>
        </div>
      );
  }
}

// Sub-editors
function HeroEditor({ data, onChange }: { data: any, onChange: (d: any) => void }) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-3">
          <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Titre Impactant</Label>
          <Input
            value={data.title}
            onChange={e => onChange({ title: e.target.value })}
            className="bg-white border-gray-100 rounded-xl h-12 font-black text-sm px-4 shadow-sm"
          />
        </div>
        <div className="space-y-3">
          <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Sous-titre</Label>
          <textarea
            value={data.subtitle || ''}
            onChange={e => onChange({ subtitle: e.target.value })}
            className="w-full bg-white border border-gray-100 rounded-xl p-4 text-sm font-medium shadow-sm focus:ring-2 focus:ring-primary/20 outline-none min-h-[100px]"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Image (URL)</Label>
          <Input
            value={data.backgroundImage || ''}
            onChange={e => onChange({ backgroundImage: e.target.value })}
            className="bg-white border-gray-100 rounded-xl h-10 px-4 shadow-sm text-xs font-mono"
          />
        </div>
        <div className="space-y-3">
          <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Overlay ({Math.round((data.overlay || 0) * 100)}%)</Label>
          <Slider
            value={[(data.overlay || 0) * 100]}
            onValueChange={([v]) => onChange({ overlay: v / 100 })}
            max={100}
            step={5}
            className="py-3"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Texte du Bouton</Label>
          <Input
            value={data.ctaText || ''}
            onChange={e => onChange({ ctaText: e.target.value })}
            className="bg-white border-gray-100 rounded-xl h-10 px-4 shadow-sm font-bold"
          />
        </div>
        <div className="space-y-3">
          <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Lien du Bouton</Label>
          <Input
            value={data.ctaLink || ''}
            onChange={e => onChange({ ctaLink: e.target.value })}
            className="bg-white border-gray-100 rounded-xl h-10 px-4 shadow-sm font-mono text-[10px]"
          />
        </div>
      </div>
    </div>
  );
}

function ProductsEditor({ data, onChange }: { data: any, onChange: (d: any) => void }) {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Titre de la section</Label>
        <Input
          value={data.title}
          onChange={e => onChange({ title: e.target.value })}
          className="bg-white border-gray-100 rounded-xl h-12 font-black px-4 shadow-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Mise en page</Label>
          <Select value={data.layout || 'grid'} onValueChange={v => onChange({ layout: v })}>
            <SelectTrigger className="bg-white rounded-xl border-gray-100 h-10 shadow-sm font-bold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="grid">Grille Fixe</SelectItem>
              <SelectItem value="carousel">Carrousel</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-3">
          <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Nombre de colonnes</Label>
          <Select value={String(data.columns || 4)} onValueChange={v => onChange({ columns: parseInt(v) })}>
            <SelectTrigger className="bg-white rounded-xl border-gray-100 h-10 shadow-sm font-bold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="2">2 Colonnes</SelectItem>
              <SelectItem value="3">3 Colonnes</SelectItem>
              <SelectItem value="4">4 Colonnes</SelectItem>
              <SelectItem value="5">5 Colonnes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <Switch
          checked={data.showAddToCart || true}
          onCheckedChange={v => onChange({ showAddToCart: v })}
        />
        <div className="flex-1">
          <Label className="font-black text-gray-900 uppercase tracking-tight text-xs block">Bouton Panier Rapide</Label>
          <span className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Ajout au panier direct sur la grille</span>
        </div>
      </div>
    </div>
  );
}

function GridEditor({ data, onChange }: { data: any, onChange: (d: any) => void }) {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Titre du bloc</Label>
        <Input
          value={data.title || ''}
          onChange={e => onChange({ title: e.target.value })}
          className="bg-white border-gray-100 rounded-xl h-12 font-black px-4 shadow-sm"
        />
      </div>

      <div className="space-y-4">
        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Éléments de réassurance</Label>
        {(data.items || data.features || []).map((item: any, index: number) => (
          <div key={index} className="p-6 bg-white rounded-2xl border border-gray-100 space-y-4 shadow-sm group/item">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2 py-1 rounded-lg">Bloc #{index + 1}</span>
            </div>
            <Input
              value={item.title}
              onChange={e => {
                const list = [...(data.items || data.features)];
                list[index] = { ...item, title: e.target.value };
                onChange(data.items ? { items: list } : { features: list });
              }}
              className="font-black border-none px-0 h-auto focus:ring-0 text-sm uppercase tracking-tight"
              placeholder="Titre de l'avantage"
            />
            <textarea
              value={item.description}
              onChange={e => {
                const list = [...(data.items || data.features)];
                list[index] = { ...item, description: e.target.value };
                onChange(data.items ? { items: list } : { features: list });
              }}
              className="text-xs text-gray-500 font-medium border-none px-0 h-auto focus:ring-0 w-full bg-transparent resize-none outline-none"
              placeholder="Description détaillée..."
              rows={2}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function TestimonialsEditor({ data, onChange }: { data: any, onChange: (d: any) => void }) {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Titre de la section</Label>
        <Input
          value={data.title}
          onChange={e => onChange({ title: e.target.value })}
          className="bg-white border-gray-100 rounded-xl h-12 font-black px-4 shadow-sm"
        />
      </div>

      <div className="space-y-4">
        <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Témoignages Clients</Label>
        {(data.testimonials || []).map((item: any, index: number) => (
          <div key={index} className="p-6 bg-white rounded-2xl border border-gray-100 space-y-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gray-50 overflow-hidden border-2 border-white shadow-sm shrink-0">
                <img src={item.avatar} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <Input
                  value={item.name}
                  onChange={e => {
                    const list = [...data.testimonials];
                    list[index] = { ...item, name: e.target.value };
                    onChange({ testimonials: list });
                  }}
                  className="font-black border-none px-0 h-auto focus:ring-0 text-sm"
                />
                <Input
                  value={item.location}
                  onChange={e => {
                    const list = [...data.testimonials];
                    list[index] = { ...item, location: e.target.value };
                    onChange({ testimonials: list });
                  }}
                  className="text-[9px] text-gray-400 font-black uppercase tracking-widest border-none px-0 h-auto focus:ring-0"
                />
              </div>
            </div>
            <textarea
              value={item.text}
              onChange={e => {
                const list = [...data.testimonials];
                list[index] = { ...item, text: e.target.value };
                onChange({ testimonials: list });
              }}
              className="text-xs text-gray-500 font-medium border-none px-0 h-auto focus:ring-0 w-full bg-transparent resize-none outline-none leading-relaxed italic"
              rows={3}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
