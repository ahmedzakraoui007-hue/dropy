"use client";

import { useEffect, useState, useRef, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

import { StarRating } from "@/components/reviews/StarRating";
import { ReviewList } from "@/components/reviews/ReviewList";
import { AddReviewForm } from "@/components/reviews/AddReviewForm";
import { formatPrice, formatDate } from "@/lib/utils";

// --- HELPERS ---

const EditableText = ({ 
  tag: Tag = "span", 
  sectionId, 
  field, 
  text, 
  className = "", 
  style = {} 
}: { 
  tag?: any, 
  sectionId: string, 
  field: string, 
  text: string, 
  className?: string,
  style?: any
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(text);
  const [isBuilder, setIsBuilder] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    setIsBuilder(window.parent !== window);
  }, []);

  useEffect(() => {
    setValue(text);
  }, [text]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (!isBuilder) return;
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (value !== text) {
      window.parent.postMessage({ 
        type: 'TEXT_UPDATE', 
        sectionId, 
        field, 
        value 
      }, '*');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && Tag !== 'textarea' && Tag !== 'div') {
      handleBlur();
    }
    if (e.key === 'Escape') {
      setValue(text);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    if (Tag === "textarea" || Tag === "div" || (text && text.length > 50)) {
      return (
        <textarea
          ref={inputRef as any}
          autoFocus
          className={`bg-transparent border-none outline-none focus:ring-0 w-full p-0 m-0 resize-none ${className}`}
          style={style}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />
      );
    }
    return (
      <input
        ref={inputRef as any}
        autoFocus
        className={`bg-transparent border-none outline-none focus:ring-0 p-0 m-0 w-full ${className}`}
        style={style}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
    );
  }

  return (
    <Tag 
      className={`cursor-text hover:outline hover:outline-1 hover:outline-primary/50 hover:outline-offset-2 transition-all ${className}`}
      onDoubleClick={handleDoubleClick}
      style={style}
    >
      {text || "Double-cliquez pour éditer"}
    </Tag>
  );
};

const PreviewButton = ({ config, className, children, onClick }: { config?: any, className?: string, children?: React.ReactNode, onClick?: () => void }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    
    const link = config?.ctaLink || config?.cta_link || config?.link;
    if (link) {
      const internalPages = ['home', 'shop', 'products', 'about', 'contact', 'cart', 'checkout'];
      const slug = link.replace(/^\//, '');
      
      if (link.startsWith('/product/') || link.startsWith('product/')) {
        window.parent.postMessage({ type: 'NAVIGATE', page: 'product-detail' }, '*');
        return;
      }

      if (internalPages.includes(slug) || internalPages.includes(link)) {
        window.parent.postMessage({ type: 'NAVIGATE', page: slug || link }, '*');
      } else if (link.startsWith('http')) {
        window.open(link, '_blank');
      }
    }
  };

  return (
    <button 
      onClick={handleClick}
      className={className || "bg-primary text-primary-foreground px-10 py-4 rounded-full font-bold text-lg hover:scale-105 transition-all shadow-xl active:scale-95"}
    >
      {children || config?.ctaText || config?.cta_text || "En savoir plus"}
    </button>
  );
};

const parsePrice = (price: any): number => {
  if (typeof price === 'number') return price;
  if (!price) return 0;
  if (typeof price === 'object' && price.price) return parsePrice(price.price);
  const cleaned = String(price).replace(/[^\d.,]/g, '').replace(',', '.');
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    const decimal = parts.pop();
    const integer = parts.join('');
    const parsed = parseFloat(`${integer}.${decimal}`);
    return isNaN(parsed) ? 0 : parsed;
  }
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
};

const getSectionStyle = (config: any) => ({
  marginTop: `${config.marginTop || 0}px`,
  marginBottom: `${config.marginBottom || 0}px`,
  paddingTop: `${config.paddingY ?? (config.backgroundImage ? 128 : 96)}px`,
  paddingBottom: `${config.paddingY ?? (config.backgroundImage ? 128 : 96)}px`,
  backgroundColor: config.backgroundColor || "transparent",
  color: config.textColor || "inherit",
});

const SectionWrapper = ({ children, sectionId, onAction }: { children: React.ReactNode, sectionId: string, onAction: (type: string, id: string) => void }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isBuilder, setIsBuilder] = useState(false);

  useEffect(() => {
    setIsBuilder(window.parent !== window);
  }, []);

  if (!isBuilder) return <>{children}</>;

  return (
    <div 
      className={`relative group/section ${isHovered ? 'ring-2 ring-primary ring-inset' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isHovered && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full z-[100] flex items-center gap-1 bg-primary text-white p-1 rounded-t-lg shadow-xl animate-in fade-in slide-in-from-bottom-2">
          <button onClick={() => onAction('MOVE_UP', sectionId)} className="p-1.5 hover:bg-white/20 rounded" title="Déplacer vers le haut">↑</button>
          <button onClick={() => onAction('MOVE_DOWN', sectionId)} className="p-1.5 hover:bg-white/20 rounded" title="Déplacer vers le bas">↓</button>
          <div className="w-[1px] h-4 bg-white/20 mx-1" />
          <button onClick={() => onAction('DUPLICATE', sectionId)} className="p-1.5 hover:bg-white/20 rounded" title="Dupliquer">＋</button>
          <button onClick={() => onAction('SETTINGS', sectionId)} className="p-1.5 hover:bg-white/20 rounded" title="Paramètres">⚙</button>
          <div className="w-[1px] h-4 bg-white/20 mx-1" />
          <button onClick={() => onAction('DELETE', sectionId)} className="p-1.5 hover:bg-red-500 rounded" title="Supprimer">✕</button>
        </div>
      )}
      {children}
    </div>
  );
};

// --- SECTIONS ---

const Hero = ({ sectionId, config }: { sectionId: string, config: any }) => {
  const variant = config.variant || 'classic';
  const sectionStyle = getSectionStyle(config);
  const ctaPosition = config.ctaPosition || config.textPosition || 'center';
  const ctaLayout = config.ctaLayout || 'row';
  const verticalPosition = config.verticalPosition || 'center';
  
  const getCtaButtonClass = () => {
    const size = config.ctaSize || 'lg';
    const style = config.ctaStyle || 'filled';
    
    const sizeClasses: Record<string, string> = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-10 py-4 text-lg',
      xl: 'px-14 py-5 text-xl',
    };
    
    const styleClasses: Record<string, string> = {
      filled: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl',
      outline: 'border-2 border-current bg-transparent hover:bg-white/10',
      ghost: 'bg-white/10 hover:bg-white/20 backdrop-blur',
      gradient: 'bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700 shadow-xl',
    };
    
    return `${sizeClasses[size]} ${styleClasses[style]} rounded-full font-bold hover:scale-105 transition-all active:scale-95`;
  };

  const getVerticalAlign = () => {
    switch (verticalPosition) {
      case 'top': return 'items-start pt-20';
      case 'bottom': return 'items-end pb-20';
      default: return 'items-center';
    }
  };
  
  const content = (
    <div className={`relative z-10 w-full max-w-5xl mx-auto px-4 ${config.textPosition === 'left' ? 'text-left' : config.textPosition === 'right' ? 'text-right' : 'text-center'}`}>
      {config.badge && (
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 text-sm font-bold mb-8 animate-bounce`}>
          ✨ <EditableText sectionId={sectionId} field="badge" text={config.badge} />
        </div>
      )}
      <EditableText 
        tag="h1"
        sectionId={sectionId}
        field="title"
        text={config.title || "Bienvenue"}
        className={`${variant === 'bold' ? 'text-7xl md:text-9xl' : 'text-6xl md:text-8xl'} font-black mb-8 tracking-tighter leading-tight block`}
        style={{ color: config.textColor || (config.backgroundImage || variant === 'video' ? "#ffffff" : "inherit") }}
      />
      <EditableText 
        tag="p"
        sectionId={sectionId}
        field="subtitle"
        text={config.subtitle || "Découvrez nos offres exceptionnelles"}
        className="text-xl md:text-3xl mb-12 max-w-3xl mx-auto opacity-90 leading-relaxed font-medium block"
        style={{ color: config.textColor || (config.backgroundImage || variant === 'video' ? "#ffffff" : "inherit") }}
      />
      {config.ctaText && (
        <div className={`flex ${ctaLayout === 'column' ? 'flex-col' : 'flex-col sm:flex-row'} gap-6 ${ctaPosition === 'center' ? 'justify-center' : ctaPosition === 'right' ? 'justify-end' : 'justify-start'} items-center`}>
          <PreviewButton 
            config={config}
            className={getCtaButtonClass()}
          >
            <EditableText sectionId={sectionId} field="ctaText" text={config.ctaText} />
          </PreviewButton>
          {config.secondaryCtaText && (
            <button className="text-lg font-bold border-b-2 border-current hover:opacity-70 transition-opacity" style={{ color: config.textColor || (config.backgroundImage || variant === 'video' ? "#ffffff" : "inherit") }}>
              <EditableText sectionId={sectionId} field="secondaryCtaText" text={config.secondaryCtaText} />
            </button>
          )}
        </div>
      )}
    </div>
  );

  if (variant === 'split') {
    return (
      <section className={`relative overflow-hidden ${config.animation || 'fade-up'}`} style={{ ...sectionStyle, paddingTop: 0, paddingBottom: 0 }}>
        <div className={`flex flex-col ${config.imagePosition === 'left' ? 'md:flex-row-reverse' : 'md:flex-row'} w-full items-center`}>
          <div className="flex-1 p-12 md:p-24">
            {content}
          </div>
          <div className="flex-1 h-[400px] md:h-screen relative">
            <img src={config.backgroundImage} className="w-full h-full object-cover" alt="" />
            <div className="absolute inset-0 bg-primary/10" />
          </div>
        </div>
      </section>
    );
  }

  if (variant === 'video' && config.videoUrl) {
    return (
      <section className={`relative px-4 text-center overflow-hidden min-h-[700px] flex ${getVerticalAlign()} group ${config.animation || 'fade-up'}`} style={sectionStyle}>
        <div className="absolute inset-0 z-0">
          <iframe 
            src={`${config.videoUrl.replace("watch?v=", "embed/")}?autoplay=1&mute=1&loop=1&controls=0&playlist=${config.videoUrl.split('v=')[1]}`} 
            className="w-full h-full scale-[1.5]"
            allow="autoplay"
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>
        {content}
      </section>
    );
  }

  return (
    <section 
      className={`relative px-4 text-center overflow-hidden min-h-[700px] flex ${getVerticalAlign()} group ${config.animation || 'fade-up'}`}
      style={{
        ...sectionStyle,
        backgroundImage: config.backgroundImage ? `url(${config.backgroundImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        height: `${config.height || 700}px`
      }}
    >
      {config.backgroundImage && (
        <div 
          className="absolute inset-0 z-0 bg-gradient-to-b from-black/60 via-black/30 to-black/60" 
          style={{ backgroundColor: `rgba(0,0,0,${config.overlay || 0.4})` }}
        />
      )}
      {!config.backgroundImage && <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-white to-cyan-500/10 z-0" />}
      {content}
    </section>
  );
};

const TrustBadges = ({ sectionId, config }: { sectionId: string, config: any }) => (
  <section className={`px-4 border-y border-border ${config.animation || 'fade-up'}`} style={getSectionStyle(config)}>
    <div className="max-w-7xl mx-auto">
      {config.title && <EditableText tag="h2" sectionId={sectionId} field="title" text={config.title} className="text-2xl font-bold mb-12 text-center block" />}
      <div className={config.layout === 'row' 
        ? "flex flex-wrap justify-center gap-8 md:gap-16" 
        : `grid gap-8 grid-cols-2 md:grid-cols-${config.columns || 4}`
      }>
        {(config.items || []).map((item: any, i: number) => (
          <div key={i} className={`flex ${config.layout === 'row' ? 'flex-row items-center gap-4' : 'flex-col items-center text-center'} p-6 bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow`}>
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-0 text-xl shrink-0">
              {item.icon === 'Truck' ? '🚚' : item.icon === 'Shield' ? '🛡️' : item.icon === 'RefreshCw' ? '🔄' : item.icon === 'Headphones' ? '🎧' : item.icon === 'Star' ? '⭐' : item.icon === 'Zap' ? '⚡' : '🛡️'}
            </div>
            <div className={config.layout === 'row' ? 'text-left' : ''}>
              <EditableText tag="h3" sectionId={sectionId} field={`items.${i}.title`} text={item.title} className="text-sm font-bold mb-1 block" />
              <EditableText tag="p" sectionId={sectionId} field={`items.${i}.description`} text={item.description} className="text-xs text-muted-foreground block" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const LogoCarousel = ({ sectionId, config }: { sectionId: string, config: any }) => (
  <section className={`px-4 overflow-hidden ${config.animation || 'fade-up'}`} style={getSectionStyle(config)}>
    <div className="max-w-7xl mx-auto">
      {config.title && <EditableText tag="h2" sectionId={sectionId} field="title" text={config.title} className="text-center text-muted-foreground text-sm font-bold uppercase tracking-[0.2em] mb-12 block" />}
      <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-700">
        {(config.logos || []).map((logo: string, i: number) => (
          <img key={i} src={logo} className="h-8 md:h-12 w-auto object-contain" alt="Partner Logo" />
        ))}
      </div>
    </div>
  </section>
);

const PromoBanner = ({ sectionId, config }: { sectionId: string, config: any }) => (
  <div className="py-2.5 px-4 text-center text-sm font-bold relative z-[60] group" style={{ backgroundColor: config.backgroundColor || "#7c3aed", color: config.textColor || "#ffffff" }}>
    <EditableText sectionId={sectionId} field="text" text={config.text || "Offre spéciale en cours !"} />
    {config.link && <button onClick={() => window.parent.postMessage({ type: 'NAVIGATE', page: config.link.replace('/', '') }, '*')} className="ml-2 underline hover:opacity-80 transition-opacity">En savoir plus →</button>}
  </div>
);

const ProcessSteps = ({ sectionId, config }: { sectionId: string, config: any }) => (
  <section className={`px-4 ${config.animation || 'fade-up'}`} style={getSectionStyle(config)}>
    <div className="max-w-7xl mx-auto">
      <EditableText tag="h2" sectionId={sectionId} field="title" text={config.title || "Comment ça marche"} className="text-4xl font-black mb-20 text-center tracking-tight block" />
      <div className="grid md:grid-cols-3 gap-12 relative">
        {(config.steps || []).map((step: any, i: number) => (
          <div key={i} className="relative z-10 flex flex-col items-center text-center space-y-6">
            <div className="w-24 h-24 rounded-[2.5rem] bg-primary text-white flex items-center justify-center text-4xl font-black shadow-2xl shadow-primary/20">{i + 1}</div>
            <div className="space-y-3">
              <EditableText tag="h3" sectionId={sectionId} field={`steps.${i}.title`} text={step.title} className="text-2xl font-bold block" />
              <EditableText tag="p" sectionId={sectionId} field={`steps.${i}.description`} text={step.description} className="text-muted-foreground leading-relaxed block" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const Pricing = ({ sectionId, config }: { sectionId: string, config: any }) => (
  <section className={`px-4 ${config.animation || 'fade-up'}`} style={getSectionStyle(config)}>
    <div className="max-w-7xl mx-auto text-center">
      <EditableText tag="h2" sectionId={sectionId} field="title" text={config.title || "Nos Tarifs"} className="text-4xl font-black block mb-16" />
      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {(config.plans || []).map((plan: any, i: number) => (
          <div key={i} className={`p-8 rounded-[2rem] border ${plan.popular ? 'border-primary shadow-2xl scale-105 bg-white z-10' : 'border-border bg-card'} flex flex-col`}>
            {plan.popular && <span className="bg-primary text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full self-center -mt-12 mb-8">Populaire</span>}
            <EditableText tag="h3" sectionId={sectionId} field={`plans.${i}.name`} text={plan.name} className="text-xl font-bold mb-4 block" />
            <div className="flex items-baseline gap-1 justify-center mb-8">
              <EditableText tag="span" sectionId={sectionId} field={`plans.${i}.price`} text={plan.price} className="text-5xl font-black block" />
              <EditableText tag="span" sectionId={sectionId} field={`plans.${i}.period`} text={plan.period} className="text-muted-foreground font-medium block" />
            </div>
            <ul className="space-y-4 mb-8 flex-1">
              {(plan.features || []).map((f: string, j: number) => (
                <li key={j} className="flex items-center gap-3 text-sm"><span className="text-emerald-500 font-bold">✓</span> <EditableText sectionId={sectionId} field={`plans.${i}.features.${j}`} text={f} /></li>
              ))}
            </ul>
            <button className={`w-full py-4 rounded-xl font-black ${plan.popular ? 'bg-primary text-white' : 'bg-muted'}`}>Choisir</button>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const Stats = ({ sectionId, config }: { sectionId: string, config: any }) => (
  <section className={`px-4 ${config.animation || 'fade-up'}`} style={{ ...getSectionStyle(config), backgroundColor: config.backgroundColor || "#0f172a", color: config.textColor || "#ffffff" }}>
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
        {(config.stats || []).map((stat: any, i: number) => (
          <div key={i} className="space-y-2">
            <EditableText tag="div" sectionId={sectionId} field={`stats.${i}.value`} text={stat.value} className="text-5xl font-black block" />
            <EditableText tag="div" sectionId={sectionId} field={`stats.${i}.label`} text={stat.label} className="text-sm font-bold uppercase tracking-widest opacity-60 block" />
          </div>
        ))}
      </div>
    </div>
  </section>
);

const Team = ({ sectionId, config }: { sectionId: string, config: any }) => (
  <section className={`px-4 ${config.animation || 'fade-up'}`} style={getSectionStyle(config)}>
    <div className="max-w-7xl mx-auto text-center">
      <EditableText tag="h2" sectionId={sectionId} field="title" text={config.title || "Notre Équipe"} className="text-4xl font-black block mb-16" />
      <div className="grid md:grid-cols-3 gap-12">
        {(config.members || []).map((member: any, i: number) => (
          <div key={i} className="text-center group">
            <div className="aspect-square rounded-3xl overflow-hidden mb-6 shadow-xl border border-border">
              <img src={member.avatar} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={member.name} />
            </div>
            <EditableText tag="h3" sectionId={sectionId} field={`members.${i}.name`} text={member.name} className="text-2xl font-bold block" />
            <EditableText tag="p" sectionId={sectionId} field={`members.${i}.role`} text={member.role} className="text-muted-foreground block" />
          </div>
        ))}
      </div>
    </div>
  </section>
);

const ReviewsSection = ({ sectionId, config }: { sectionId: string, config: any }) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const type = config.type || "store";
      const targetId = config.targetId;
      if (!targetId) return;

      const res = await fetch(`/api/reviews/${type}?${type === 'store' ? 'storeId' : 'productId'}=${targetId}`);
      const data = await res.json();
      setReviews(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [config.targetId, config.type]);

  const averageRating = reviews.length > 0 
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length 
    : 0;

  return (
    <section className={`px-4 ${config.animation || 'fade-up'}`} style={getSectionStyle(config)}>
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <EditableText tag="h2" sectionId={sectionId} field="title" text={config.title || "Avis Clients"} className="text-3xl md:text-4xl font-black block mb-2" />
            <div className="flex items-center gap-3">
              <StarRating rating={Math.round(averageRating)} readonly />
              <span className="text-lg font-bold">{averageRating.toFixed(1)}/5</span>
              <span className="text-muted-foreground">({reviews.length} avis)</span>
            </div>
          </div>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:scale-105 transition-all"
          >
            {showAddForm ? "Annuler" : "Laisser un avis"}
          </button>
        </div>

        {showAddForm && (
          <div className="mb-12 p-8 bg-card border border-border rounded-3xl shadow-xl animate-in zoom-in-95 duration-300">
            <h3 className="text-xl font-bold mb-6">Votre avis nous intéresse</h3>
            <AddReviewForm 
              type={config.type || "store"} 
              targetId={config.targetId} 
              onSuccess={() => {
                setShowAddForm(false);
                fetchReviews();
              }} 
            />
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <ReviewList reviews={reviews} type={config.type || "store"} />
        )}
      </div>
    </section>
  );
};

const ProductDetail = ({ sectionId, config, onAddToCart, selectedProduct, storeId }: { sectionId: string, config: any, onAddToCart?: (item: any) => void, selectedProduct?: any, storeId?: string }) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [product, setProduct] = useState<any>(selectedProduct || null);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  
  useEffect(() => {
    if (selectedProduct?.id && storeId) {
      setLoading(true);
      const supabase = createClient();
      supabase
        .from("store_products")
        .select("*")
        .eq("id", selectedProduct.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setProduct({
              id: data.id,
              title: data.name,
              price: data.selling_price,
              description: data.description,
              image: data.images?.[0],
              images: data.images || [],
              variants: data.variants,
              has_variants: data.has_variants,
            });
          }
          setLoading(false);
        });
    } else if (selectedProduct) {
      setProduct(selectedProduct);
    }
  }, [selectedProduct, storeId]);

  useEffect(() => {
    const productId = product?.id || config.productId;
    if (productId) {
      fetch(`/api/reviews/product?productId=${productId}`)
        .then(res => res.json())
        .then(data => setReviews(Array.isArray(data) ? data : []))
        .catch(err => console.error(err));
    }
  }, [product?.id, config.productId]);

  const averageRating = reviews.length > 0 
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length 
    : 0;

  const displayProduct = product || {
    title: config.title || "Produit Premium",
    price: config.price || "149.00",
    description: config.description || "Description du produit...",
    image: config.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop",
    images: config.images || [config.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop"]
  };

  const images = displayProduct.images?.length > 0 ? displayProduct.images : [displayProduct.image];

  if (loading) {
    return (
      <section className="px-4 py-20">
        <div className="max-w-7xl mx-auto flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  return (
    <section className={`px-4 ${config.animation || 'fade-up'}`} style={getSectionStyle(config)}>
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16">
          <div className="space-y-4">
            <div className="aspect-square bg-muted rounded-3xl overflow-hidden shadow-xl border border-border group">
              <img src={images[selectedImage]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={displayProduct.title} />
            </div>
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${selectedImage === idx ? 'border-primary' : 'border-border'}`}
                  >
                    <img src={img} className="w-full h-full object-cover" alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-black mb-4">{displayProduct.title}</h1>
              
              <div className="flex items-center gap-2 mb-6">
                <StarRating rating={Math.round(averageRating)} readonly size="sm" />
                <span className="text-sm font-bold">{averageRating.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">({reviews.length} avis)</span>
              </div>

                <div className="flex items-center gap-4 mb-6">
                  <span className="text-4xl font-black text-primary">{formatPrice(parsePrice(displayProduct.price))}</span>
                </div>

              <p className="text-lg text-muted-foreground">{displayProduct.description}</p>
            </div>
            <button onClick={() => onAddToCart?.({
              id: displayProduct.id,
              title: displayProduct.title,
              price: displayProduct.price,
              image: images[0]
            })} className="w-full bg-primary text-primary-foreground py-5 rounded-2xl font-black text-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all">Ajouter au panier</button>
          </div>
        </div>
      </div>
    </section>
  );
};

const Products = ({ sectionId, config, onAddToCart, storeId, onSelectProduct }: { sectionId: string, config: any, onAddToCart?: (item: any) => void, storeId?: string, onSelectProduct?: (product: any) => void }) => {
  const placeholders = ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600", "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600", "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600"];
  const [storeProducts, setStoreProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    if (storeId && (config.source === 'store' || config.autoLoad !== false)) {
      setLoadingProducts(true);
      const supabase = createClient();
      supabase
        .from("store_products")
        .select("*")
        .eq("store_id", storeId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(config.limit || 12)
        .then(({ data }) => {
          if (data) {
            setStoreProducts(data.map(p => ({
              id: p.id,
              title: p.name,
              price: p.selling_price,
              image: p.images?.[0] || placeholders[0],
              images: p.images,
              description: p.description,
              variants: p.variants,
              has_variants: p.has_variants,
            })));
          }
          setLoadingProducts(false);
        });
    }
  }, [storeId, config.source, config.limit]);

  const displayItems = (storeId && storeProducts.length > 0) ? storeProducts : (config.items || []);
  const hasRealProducts = storeId && storeProducts.length > 0;

  const handleProductClick = (product: any) => {
    if (onSelectProduct) {
      onSelectProduct(product);
    } else {
      window.parent.postMessage({ type: 'NAVIGATE', page: 'product-detail', productId: product.id, product }, '*');
    }
  };

  return (
    <section className={`px-4 ${config.animation || 'fade-up'}`} style={getSectionStyle(config)}>
      <div className="max-w-7xl mx-auto">
        {config.title && <div className="text-center mb-16"><EditableText tag="h2" sectionId={sectionId} field="title" text={config.title} className="text-4xl md:text-5xl font-black mb-4 block" /></div>}
        {loadingProducts ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : displayItems.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">Aucun produit disponible</p>
            <p className="text-sm mt-2">Ajoutez des produits depuis votre espace vendeur</p>
          </div>
        ) : (
          <div className={`grid gap-x-6 gap-y-12 grid-cols-2 md:grid-cols-${config.columns || 4}`}>
            {displayItems.slice(0, config.limit || 12).map((item: any, i: number) => {
              const data = typeof item === 'number' ? { title: `Produit ${item}`, price: "49.00", image: placeholders[i % 3] } : item;
              return (
                <div key={data.id || i} className="group cursor-pointer" onClick={() => handleProductClick(data)}>
                  <div className="aspect-[4/5] bg-muted rounded-3xl mb-6 overflow-hidden relative shadow-sm group-hover:shadow-xl transition-all">
                    <img src={data.image || placeholders[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                    <button onClick={(e) => { e.stopPropagation(); onAddToCart?.(data); }} className="absolute bottom-4 left-4 right-4 bg-white text-black py-3 rounded-xl font-bold text-sm shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">Ajouter au panier</button>
                  </div>
                  {hasRealProducts ? (
                    <>
                      <h3 className="font-bold text-lg">{data.title}</h3>
                      <p className="text-primary font-black">{formatPrice(parsePrice(data.price))}</p>
                    </>
                  ) : (
                    <>
                      <EditableText sectionId={sectionId} field={`items.${i}.title`} text={data.title} className="font-bold text-lg block" />
                      <p className="text-primary font-black">{formatPrice(parsePrice(data.price))}</p>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

const Features = ({ sectionId, config }: { sectionId: string, config: any }) => (
  <section className={`px-4 ${config.animation || 'fade-up'}`} style={getSectionStyle(config)}>
    <div className="max-w-7xl mx-auto text-center">
      {config.title && <EditableText tag="h2" sectionId={sectionId} field="title" text={config.title} className="text-3xl md:text-4xl font-bold mb-16 block" />}
      <div className={`grid gap-12 grid-cols-1 md:grid-cols-${config.columns || 4}`}>
        {(config.features || []).map((f: any, i: number) => (
          <div key={i} className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 text-2xl font-bold">!</div>
            <EditableText tag="h3" sectionId={sectionId} field={`features.${i}.title`} text={f.title} className="text-xl font-bold mb-3 block" />
            <EditableText tag="p" sectionId={sectionId} field={`features.${i}.description`} text={f.description} className="text-muted-foreground block" />
          </div>
        ))}
      </div>
    </div>
  </section>
);

const Footer = ({ sectionId, config }: { sectionId: string, config: any }) => (
  <footer className="py-20 px-4 bg-slate-950 text-slate-300 border-t border-white/10">
    <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
      <div className="space-y-6">
        <div className="text-2xl font-black text-white tracking-tighter"><EditableText sectionId={sectionId} field="brandName" text={config.brandName || "BOUTIQUE"} /></div>
        <EditableText tag="p" sectionId={sectionId} field="description" text={config.description || "Votre destination premium."} className="text-slate-400 block" />
      </div>
      <div>
        <h4 className="text-white font-bold mb-6">Contact</h4>
        <ul className="space-y-4 text-sm">
          <li>📍 <EditableText sectionId={sectionId} field="address" text={config.address || "Tunis, Tunisie"} /></li>
          <li>📞 <EditableText sectionId={sectionId} field="phone" text={config.phone || "+216 71 000 000"} /></li>
        </ul>
      </div>
      <div>
        <h4 className="text-white font-bold mb-6">Suivi</h4>
        <button 
          onClick={() => window.parent.postMessage({ type: 'NAVIGATE', page: 'track' }, '*')}
          className="flex items-center gap-2 bg-primary/20 hover:bg-primary/30 text-primary px-4 py-3 rounded-xl transition-colors text-sm font-bold"
        >
          📦 Suivre ma commande
        </button>
      </div>
    </div>
    <div className="mt-16 pt-8 border-t border-white/5 text-center text-sm text-slate-500">
      <EditableText sectionId={sectionId} field="copyright" text={config.copyright || "© 2026. Tous droits réservés."} />
    </div>
  </footer>
);

const RecommendedProducts = ({ sectionId, config, onAddToCart, storeId, onSelectProduct }: { sectionId: string, config: any, onAddToCart?: (item: any) => void, storeId?: string, onSelectProduct?: (product: any) => void }) => {
  const placeholders = [
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600",
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600",
    "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600",
    "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600"
  ];

  const [storeProducts, setStoreProducts] = useState<any[]>([]);

  useEffect(() => {
    if (storeId) {
      const supabase = createClient();
      supabase
        .from("store_products")
        .select("*")
        .eq("store_id", storeId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(config.limit || 4)
        .then(({ data }) => {
          if (data) {
            setStoreProducts(data.map(p => ({
              id: p.id,
              title: p.name,
              price: p.selling_price,
              image: p.images?.[0] || placeholders[0],
            })));
          }
        });
    }
  }, [storeId, config.limit]);

  const displayItems = storeProducts.length > 0 ? storeProducts : (config.items || []);

  const algorithmLabels: Record<string, string> = {
    bestsellers: "Meilleures Ventes",
    recent: "Vus Récemment",
    similar: "Vous aimerez aussi",
    random: "Découvrez"
  };

  const handleProductClick = (item: any) => {
    if (onSelectProduct) {
      onSelectProduct(item);
    } else {
      window.parent.postMessage({ type: 'NAVIGATE', page: 'product-detail', productId: item.id, product: item }, '*');
    }
  };

  const handleAddToCart = (e: React.MouseEvent, item: any) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart?.(item);
  };

  return (
    <section className={`px-4 py-16 bg-gradient-to-b from-muted/30 to-transparent ${config.animation || 'fade-up'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-xs font-bold text-primary uppercase tracking-widest mb-2 block">
              {algorithmLabels[config.algorithm] || algorithmLabels.bestsellers}
            </span>
            <EditableText 
              tag="h2" 
              sectionId={sectionId} 
              field="title" 
              text={config.title || "Recommandé Pour Vous"} 
              className="text-3xl font-black block" 
            />
          </div>
          <button 
            onClick={() => window.parent.postMessage({ type: 'NAVIGATE', page: 'shop' }, '*')}
            className="text-sm font-bold text-primary hover:underline"
          >
            Voir tout →
          </button>
        </div>
        
        {displayItems.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Aucun produit disponible</p>
          </div>
        ) : (
          <div className={`grid gap-6 grid-cols-2 md:grid-cols-${config.columns || 4}`}>
            {displayItems.slice(0, config.limit || 4).map((item: any, i: number) => (
              <div 
                key={item.id || i} 
                className="group cursor-pointer" 
                onClick={() => handleProductClick(item)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleProductClick(item)}
              >
                <div className="aspect-square bg-white rounded-2xl mb-4 overflow-hidden relative shadow-sm group-hover:shadow-xl transition-all border border-border">
                  <img 
                    src={item.image || placeholders[i % 4]} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    alt={item.title} 
                  />
                  <div className="absolute top-3 left-3 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-full">
                    {config.algorithm === "bestsellers" ? "TOP" : config.algorithm === "recent" ? "VU" : ""}
                  </div>
                  <button 
                    onClick={(e) => handleAddToCart(e, item)}
                    className="absolute bottom-3 left-3 right-3 bg-primary text-white py-2.5 rounded-xl font-bold text-sm opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0"
                  >
                    + Ajouter
                  </button>
                </div>
                <h3 className="font-bold text-sm mb-1">{item.title}</h3>
                {config.showPrice !== false && (
                  <p className="text-primary font-black">{formatPrice(parsePrice(item.price))}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

const MegaMenu = ({ sectionId, config, store, onOpenCart, cartCount = 0 }: { sectionId: string, config: any, store: any, onOpenCart?: () => void, cartCount?: number }) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigate = (link: string) => {
    const slug = link.replace(/^\//, '') || 'home';
    window.parent.postMessage({ type: 'NAVIGATE', page: slug }, '*');
  };

  return (
    <header 
      className={`${config.sticky ? 'sticky top-0' : ''} z-50 transition-all duration-300 ${
        isScrolled || !config.transparent 
          ? 'bg-white/95 backdrop-blur-lg shadow-sm border-b border-border' 
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <button onClick={() => navigate('home')} className="text-xl font-black tracking-tighter flex items-center gap-2">
            {config.logo ? (
              <img src={config.logo} className="h-8 w-auto" alt={config.brandName} />
            ) : (
              <>
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white text-sm font-bold">
                  {(config.brandName || store?.name || "B").charAt(0)}
                </div>
                <span className="text-primary">{config.brandName || store?.name || "Boutique"}</span>
              </>
            )}
          </button>

          <nav className="hidden md:flex items-center gap-1">
            {(config.menuItems || []).map((item: any, idx: number) => (
              <div 
                key={idx} 
                className="relative"
                onMouseEnter={() => item.megaMenu && setActiveMenu(item.label)}
                onMouseLeave={() => setActiveMenu(null)}
              >
                <button 
                  onClick={() => !item.megaMenu && navigate(item.link)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeMenu === item.label ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                  }`}
                >
                  {item.label}
                  {item.megaMenu && <span className="ml-1 text-[10px]">▼</span>}
                </button>

                {item.megaMenu && activeMenu === item.label && (
                  <div className="absolute top-full left-0 pt-2 w-[600px] z-50">
                    <div className="bg-white rounded-2xl shadow-2xl border border-border p-6 grid grid-cols-3 gap-6">
                      {(item.columns || []).map((col: any, colIdx: number) => (
                        <div key={colIdx}>
                          <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-3">
                            {col.title}
                          </h4>
                          <ul className="space-y-2">
                            {(col.links || []).map((link: any, linkIdx: number) => (
                              <li key={linkIdx}>
                                <button 
                                  onClick={() => navigate(link.link)}
                                  className="text-sm hover:text-primary transition-colors"
                                >
                                  {link.label}
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                      
                      {item.featuredImage && (
                        <div 
                          className="rounded-xl overflow-hidden relative cursor-pointer group"
                          onClick={() => navigate(item.featuredLink)}
                        >
                          <img 
                            src={item.featuredImage} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                            alt={item.featuredTitle} 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                            <span className="text-white font-bold text-sm">{item.featuredTitle}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {config.showSearch && (
              <button className="p-2 hover:bg-muted rounded-full transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            )}
            {config.showCart && (
              <button onClick={onOpenCart} className="p-2 hover:bg-muted rounded-full relative transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[10px] flex items-center justify-center rounded-full font-bold">
                  {cartCount}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

const Header = ({ store, pages = [], onOpenCart, cartCount = 0 }: { store: any, pages?: any[], onOpenCart?: () => void, cartCount?: number }) => (
  <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border px-4 py-4">
    <div className="max-w-7xl mx-auto flex items-center justify-between">
      <button onClick={() => window.parent.postMessage({ type: 'NAVIGATE', page: 'home' }, '*')} className="text-2xl font-bold tracking-tighter text-primary flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white text-sm">{store?.name?.charAt(0) || "D"}</div>
        {store?.name || "Boutique"}
      </button>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          {(pages.length > 0 ? pages.filter(p => p.is_published && (p.show_in_menu !== false)) : [{ name: 'Accueil', slug: 'home' }, { name: 'Produits', slug: 'shop' }]).map(p => (
            <button key={p.slug} onClick={() => window.parent.postMessage({ type: 'NAVIGATE', page: p.slug }, '*')} className="hover:text-primary transition-colors">{p.name}</button>
          ))}
        </nav>
      <button onClick={onOpenCart} className="p-2 hover:bg-muted rounded-full relative">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
        <span className="absolute top-0 right-0 w-4 h-4 bg-primary text-white text-[10px] flex items-center justify-center rounded-full font-bold">{cartCount}</span>
      </button>
    </div>
  </header>
);

  const CartDrawer = ({ isOpen, onClose, cart, onRemove, onUpdateQuantity }: { isOpen: boolean, onClose: () => void, cart: any[], onRemove: (id: string) => void, onUpdateQuantity: (id: string, delta: number) => void }) => {
    if (!isOpen) return null;
    const total = cart.reduce((acc, item) => acc + (parsePrice(item.price) * (item.quantity || 1)), 0);
    return (
      <div className="fixed inset-0 z-[100] flex justify-end">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
          <div className="p-6 border-b border-border flex items-center justify-between"><h2 className="text-2xl font-black">Votre Panier ({cart.reduce((acc, item) => acc + (item.quantity || 1), 0)})</h2><button onClick={onClose}>✕</button></div>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
{cart.length === 0 ? <p className="text-center text-muted-foreground mt-20">Votre panier est vide</p> : cart.map((item, i) => (
                <div key={`${item.id}-${i}`} className="flex gap-4">
                <div className="w-20 h-20 bg-muted rounded-xl overflow-hidden"><img src={item.image} className="w-full h-full object-cover" alt="" /></div>
                <div className="flex-1">
                  <h3 className="font-bold">{item.title}</h3>
                  <p className="text-primary font-black">{formatPrice(parsePrice(item.price))}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center border border-border rounded-lg overflow-hidden bg-muted/50">
                      <button 
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        className="px-2 py-1 hover:bg-muted transition-colors disabled:opacity-30"
                        disabled={item.quantity <= 1}
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm font-bold">{item.quantity || 1}</span>
                      <button 
                        onClick={() => onUpdateQuantity(item.id, 1)}
                        className="px-2 py-1 hover:bg-muted transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <button onClick={() => onRemove(item.id)} className="text-xs text-red-500 hover:underline">Supprimer</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
            {cart.length > 0 && (
              <div className="p-6 border-t border-border space-y-4 bg-muted/10">
                <div className="flex items-center justify-between text-xl font-black"><span>Total</span><span className="text-primary">{formatPrice(total)}</span></div>
                <button onClick={() => { window.parent.postMessage({ type: 'NAVIGATE', page: 'checkout' }, '*'); onClose(); }} className="w-full bg-primary text-white py-4 rounded-xl font-black text-lg">Passer la commande</button>
              </div>
            )}

        </div>
      </div>
    );
  };


const Testimonials = ({ sectionId, config }: { sectionId: string, config: any }) => (
  <section className={`px-4 ${config.animation || 'fade-up'}`} style={getSectionStyle(config)}>
    <div className="max-w-7xl mx-auto">
      {config.title && <EditableText tag="h2" sectionId={sectionId} field="title" text={config.title} className="text-4xl font-black mb-16 text-center block" />}
      <div className={`grid gap-8 md:grid-cols-${config.columns || 3}`}>
        {(config.testimonials || []).map((t: any, i: number) => (
          <div key={i} className="p-8 bg-card rounded-3xl border border-border shadow-sm hover:shadow-xl transition-all group">
            <div className="flex gap-1 mb-6">
              {[...Array(t.rating || 5)].map((_, i) => <span key={i} className="text-yellow-400 text-lg">★</span>)}
            </div>
            <EditableText tag="p" sectionId={sectionId} field={`testimonials.${i}.text`} text={t.text} className="text-lg italic mb-8 block leading-relaxed" />
            <div className="flex items-center gap-4">
              <img src={t.avatar} className="w-12 h-12 rounded-full object-cover border-2 border-primary/20" alt="" />
              <div>
                <EditableText tag="h4" sectionId={sectionId} field={`testimonials.${i}.name`} text={t.name} className="font-bold block" />
                <EditableText tag="p" sectionId={sectionId} field={`testimonials.${i}.location`} text={t.location} className="text-xs text-muted-foreground block" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const FAQ = ({ sectionId, config }: { sectionId: string, config: any }) => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  return (
    <section className={`px-4 ${config.animation || 'fade-up'}`} style={getSectionStyle(config)}>
      <div className="max-w-3xl mx-auto">
        {config.title && <EditableText tag="h2" sectionId={sectionId} field="title" text={config.title} className="text-4xl font-black mb-12 text-center block" />}
        <div className="space-y-4">
          {(config.faqs || []).map((faq: any, i: number) => (
            <div key={i} className="border border-border rounded-2xl overflow-hidden bg-card">
              <button 
                className="w-full px-6 py-5 text-left font-bold flex items-center justify-between hover:bg-muted/50 transition-colors"
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
              >
                <EditableText sectionId={sectionId} field={`faqs.${i}.question`} text={faq.question} />
                <span className={`transition-transform duration-300 ${openIdx === i ? 'rotate-180' : ''}`}>▼</span>
              </button>
              {openIdx === i && (
                <div className="px-6 py-5 border-t border-border bg-muted/5 animate-in slide-in-from-top-2">
                  <EditableText tag="p" sectionId={sectionId} field={`faqs.${i}.answer`} text={faq.answer} className="text-muted-foreground leading-relaxed block" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Newsletter = ({ sectionId, config }: { sectionId: string, config: any }) => (
  <section className={`px-4 ${config.animation || 'fade-up'}`} style={{ ...getSectionStyle(config), backgroundColor: config.backgroundColor || "#7c3aed", color: config.textColor || "#ffffff" }}>
    <div className="max-w-4xl mx-auto text-center space-y-8">
      <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto text-3xl">✉️</div>
      <div className="space-y-4">
        <EditableText tag="h2" sectionId={sectionId} field="title" text={config.title || "Restez à la page"} className="text-4xl font-black block" />
        <EditableText tag="p" sectionId={sectionId} field="subtitle" text={config.subtitle || "Inscrivez-vous pour ne rien rater."} className="text-xl opacity-90 block" />
      </div>
      <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto bg-white/10 p-2 rounded-2xl backdrop-blur-md">
        <input type="email" placeholder={config.placeholder || "Votre email"} className="flex-1 bg-transparent border-none text-white placeholder:text-white/50 px-4 py-3 focus:ring-0" />
        <button className="bg-white text-primary px-8 py-3 rounded-xl font-black hover:scale-105 transition-all">{config.buttonText || "S'abonner"}</button>
      </div>
    </div>
  </section>
);

const Collections = ({ sectionId, config }: { sectionId: string, config: any }) => (
  <section className={`px-4 ${config.animation || 'fade-up'}`} style={getSectionStyle(config)}>
    <div className="max-w-7xl mx-auto">
      {config.title && <EditableText tag="h2" sectionId={sectionId} field="title" text={config.title} className="text-4xl font-black mb-12 text-center block" />}
      <div className={`grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-${config.columns || 3}`}>
        {(config.items || []).map((item: any, i: number) => (
          <div key={i} className="group cursor-pointer relative overflow-hidden rounded-2xl aspect-[16/9]" onClick={() => window.parent.postMessage({ type: 'NAVIGATE', page: item.link?.replace('/', '') || 'shop' }, '*')}>
            <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.title} />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <EditableText tag="h3" sectionId={sectionId} field={`items.${i}.title`} text={item.title} className="text-white text-2xl font-black block" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const ContentSection = ({ sectionId, config }: { sectionId: string, config: any }) => (
  <section className={`px-4 ${config.animation || 'fade-up'}`} style={getSectionStyle(config)}>
    <div className="max-w-4xl mx-auto prose prose-slate prose-lg dark:prose-invert">
      <EditableText 
        tag="h2" 
        sectionId={sectionId} 
        field="title" 
        text={config.title || ""} 
        className="text-3xl font-black mb-8 block" 
      />
      <div 
        dangerouslySetInnerHTML={{ __html: config.content || "" }} 
        className="text-muted-foreground leading-relaxed"
      />
    </div>
  </section>
);

const Merci = ({ orderId, store }: { orderId: string, store: any }) => {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrder = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("store_orders").select("*").eq("id", orderId).single();
      setOrder(data);
      setLoading(false);
    };
    loadOrder();
  }, [orderId]);

  if (loading) return <div className="p-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>;
  if (!order) return <div className="p-20 text-center">Commande non trouvée</div>;

  return (
    <section className="px-4 py-20 text-center fade-in">
      <div className="max-w-2xl mx-auto space-y-8 bg-card p-12 rounded-[3rem] border border-border shadow-2xl">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-4xl mx-auto animate-bounce">🎉</div>
        <div className="space-y-4">
          <h2 className="text-4xl font-black tracking-tight">Merci pour votre confiance !</h2>
          <p className="text-xl text-muted-foreground">Votre commande <span className="font-bold text-primary">{order.order_number}</span> a bien été enregistrée.</p>
        </div>
        <div className="p-6 bg-muted/50 rounded-2xl text-left space-y-4 border border-border">
          <div className="flex justify-between items-center pb-4 border-b border-border">
            <span className="text-sm font-bold uppercase opacity-60">Statut</span>
            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-black uppercase">Confirmée</span>
          </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold uppercase opacity-60">Total payé</span>
              <span className="text-xl font-black">{formatPrice(order.total_amount)}</span>
            </div>

          <div className="flex justify-between items-center text-xs opacity-60">
            <span>Mode de paiement</span>
            <span>{order.payment_method === 'cod' ? 'Paiement à la livraison' : 'Carte Bancaire'}</span>
          </div>
        </div>
        <div className="space-y-4">
          <button onClick={() => window.parent.postMessage({ type: 'NAVIGATE', page: 'home' }, '*')} className="w-full bg-primary text-white py-4 rounded-2xl font-black text-lg shadow-xl hover:scale-[1.02] transition-all">Continuer mes achats</button>
          <button onClick={() => window.parent.postMessage({ type: 'NAVIGATE', page: `track/${order.order_number}` }, '*')} className="text-sm font-bold opacity-60 hover:opacity-100 transition-opacity">Suivre ma commande</button>
        </div>
      </div>
    </section>
  );
};

const Track = ({ orderNumber }: { orderNumber: string }) => {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searchNum, setSearchNum] = useState(orderNumber || "");
  const [error, setError] = useState("");

  const handleSearch = async (num: string) => {
    if (!num) return;
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data, error } = await supabase.from("store_orders").select("*").eq("order_number", num).single();
    if (data) setOrder(data);
    else setError("Commande introuvable");
    setLoading(false);
  };

  useEffect(() => { if (orderNumber) handleSearch(orderNumber); }, [orderNumber]);

  const steps = [
    { key: 'new', label: 'Reçue', icon: '📝' },
    { key: 'confirmed', label: 'Confirmée', icon: '✅' },
    { key: 'preparing', label: 'En préparation', icon: '📦' },
    { key: 'shipped', label: 'Expédiée', icon: '🚚' },
    { key: 'delivered', label: 'Livrée', icon: '🏠' }
  ];

  const currentStepIdx = steps.findIndex(s => s.key === order?.status) || 0;

  return (
    <section className="px-4 py-20 fade-in">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-black">Suivi de commande</h2>
          <p className="text-muted-foreground">Entrez votre numéro de commande pour voir où elle en est.</p>
        </div>
        <div className="flex gap-2 bg-card p-2 rounded-2xl border border-border shadow-xl">
          <input value={searchNum} onChange={e => setSearchNum(e.target.value.toUpperCase())} className="flex-1 bg-transparent border-none px-4 py-3 font-bold focus:ring-0" placeholder="ORD-XXXXXX" />
          <button onClick={() => handleSearch(searchNum)} disabled={loading} className="bg-primary text-white px-8 py-3 rounded-xl font-black disabled:opacity-50">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Suivre"}
          </button>
        </div>

        {error && <p className="text-center text-red-500 font-bold">{error}</p>}

        {order && (
          <div className="bg-card p-12 rounded-[3rem] border border-border shadow-2xl space-y-12">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-bold uppercase opacity-60 mb-1">Commande</p>
                <p className="text-2xl font-black">{order.order_number}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold uppercase opacity-60 mb-1">Passée le</p>
                <p className="font-bold">{formatDate(order.created_at)}</p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-muted -translate-y-1/2" />
              <div className="absolute top-1/2 left-0 h-[2px] bg-primary -translate-y-1/2 transition-all duration-1000" style={{ width: `${(currentStepIdx / (steps.length - 1)) * 100}%` }} />
              <div className="relative flex justify-between">
                {steps.map((step, i) => (
                  <div key={step.key} className="flex flex-col items-center gap-4 relative z-10">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm border-2 transition-all duration-500 ${i <= currentStepIdx ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-110' : 'bg-card border-border text-muted-foreground'}`}>
                      {i < currentStepIdx ? '✓' : step.icon}
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${i <= currentStepIdx ? 'text-primary' : 'opacity-40'}`}>{step.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-border">
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase opacity-60">Destinataire</p>
                <p className="font-bold">{order.customer_name}</p>
                <p className="text-sm text-muted-foreground">{order.customer_address}</p>
              </div>
                <div className="space-y-2 text-right">
                  <p className="text-xs font-bold uppercase opacity-60">Total</p>
                  <p className="text-2xl font-black text-primary">{formatPrice(order.total_amount)}</p>
                </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

const Checkout = ({ sectionId, config, store, cart, slug, onClearCart }: { sectionId: string, config: any, store: any, cart: any[], slug: string, onClearCart: () => void }) => {

    const [formData, setFormData] = useState({ name: "", phone: "", address: "", email: "" });
    const [paymentMethod, setPaymentMethod] = useState("cod");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [promoCode, setPromoCode] = useState("");
    const [isValidatingPromo, setIsValidatingPromo] = useState(false);
    const [appliedPromo, setAppliedPromo] = useState<any>(null);
    const [promoError, setPromoError] = useState("");
  
    const subtotal = cart.reduce((acc, item) => acc + (parsePrice(item.price) * (item.quantity || 1)), 0);
  
    const handleValidatePromo = async () => {
      if (!promoCode) return;
      setIsValidatingPromo(true);
      setPromoError("");
      
      try {
        const response = await fetch("/api/promo-codes/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: promoCode,
            storeId: store.id,
            subtotal
          })
        });
  
        const data = await response.json();
        if (data.valid) {
          setAppliedPromo(data.promo);
          setPromoCode("");
        } else {
          setPromoError(data.error || "Code invalide");
        }
      } catch (error) {
        setPromoError("Erreur de validation");
      } finally {
        setIsValidatingPromo(false);
      }
    };
  
    const discountAmount = appliedPromo 
      ? (appliedPromo.type === "percentage" 
          ? (subtotal * appliedPromo.value / 100) 
          : appliedPromo.value)
      : 0;
  
    const total = Math.max(0, subtotal - discountAmount);
  
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (cart.length === 0) return;
      setIsSubmitting(true);
      
      try {
        const response = await fetch("/api/store/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storeId: store.id,
            cart: cart.map(item => ({ ...item, price: parsePrice(item.price) })),
            customer: formData,
            appliedPromo,
            paymentMethod,
            slug
          })
        });
        
        const data = await response.json();
        if (data.success) {
          onClearCart();
          if (data.url) {
            window.parent.postMessage({ type: "OPEN_EXTERNAL_URL", data: { url: data.url } }, "*");
          } else {
            window.parent.postMessage({ type: 'NAVIGATE', page: `merci/${data.orderId}` }, '*');
          }
        } else {
          alert(data.error || "Une erreur est survenue lors de la commande");
        }
      } catch (error) {
        alert("Erreur réseau");
      } finally {
        setIsSubmitting(false);
      }
    };
  
    return (
      <section className={`px-4 ${config.animation || 'fade-in'}`} style={getSectionStyle(config)}>
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-8 bg-card p-8 rounded-3xl border border-border shadow-sm">
              <h2 className="text-2xl font-black"><EditableText sectionId={sectionId} field="title" text={config.title || "Finalisez votre commande"} /></h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider opacity-60">Nom Complet</label>
                    <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-muted border-none p-4 rounded-xl focus:ring-2 ring-primary" placeholder="Votre nom" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider opacity-60">Téléphone</label>
                      <input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-muted border-none p-4 rounded-xl focus:ring-2 ring-primary" placeholder="+216 -- --- ---" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider opacity-60">Email (optionnel)</label>
                      <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-muted border-none p-4 rounded-xl focus:ring-2 ring-primary" placeholder="votre@email.com" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider opacity-60">Adresse complète</label>
                    <textarea required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-muted border-none p-4 rounded-xl focus:ring-2 ring-primary min-h-[100px]" placeholder="Rue, ville, code postal..." />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold uppercase tracking-wider opacity-60 block">Mode de paiement</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      type="button"
                      onClick={() => setPaymentMethod("cod")}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'}`}
                    >
                      <span className="text-2xl">🚚</span>
                      <span className="font-bold text-sm">Paiement à la livraison</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => setPaymentMethod("card")}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'card' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'}`}
                    >
                      <span className="text-2xl">💳</span>
                      <span className="font-bold text-sm">Carte Bancaire</span>
                    </button>
                  </div>
                </div>

                <button disabled={isSubmitting || cart.length === 0} className="w-full bg-primary text-white py-4 rounded-2xl font-black text-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>✅ {config.buttonText || "Confirmer la commande"}</>}
                </button>
              </form>
            </div>
            <div className="space-y-6">
              <div className="bg-muted/30 p-8 rounded-3xl border border-border">
                <h3 className="font-bold mb-6">Résumé de la commande ({cart.reduce((acc, item) => acc + (item.quantity || 1), 0)} articles)</h3>
                <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2">
                  {cart.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-white border border-border shrink-0">
                        <img src={item.image} className="w-full h-full object-cover" alt="" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm truncate">{item.title}</h4>
                        <p className="text-xs text-muted-foreground">Qté: {item.quantity || 1}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm">{formatPrice(parsePrice(item.price) * (item.quantity || 1))}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="flex justify-between text-sm"><span>Sous-total</span><span className="font-bold">{formatPrice(subtotal)}</span></div>
                  
                  {appliedPromo && (
                    <div className="flex justify-between text-sm text-emerald-600 font-bold">
                      <span className="flex items-center gap-1">
                        🏷️ Code {appliedPromo.code}
                        <button onClick={() => setAppliedPromo(null)} className="ml-1 text-xs opacity-50 hover:opacity-100">✕</button>
                      </span>
                      <span>-{formatPrice(discountAmount)}</span>
                    </div>
                  )}

                  {!appliedPromo && (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input 
                          value={promoCode}
                          onChange={e => setPromoCode(e.target.value.toUpperCase())}
                          className="flex-1 bg-white border border-border px-3 py-2 rounded-lg text-sm"
                          placeholder="Code promo"
                        />
                        <button 
                          onClick={(e) => { e.preventDefault(); handleValidatePromo(); }}
                          disabled={isValidatingPromo || !promoCode}
                          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50"
                        >
                          Appliquer
                        </button>
                      </div>
                      {promoError && <p className="text-xs text-red-500">{promoError}</p>}
                    </div>
                  )}

                  <div className="flex justify-between text-sm"><span>Livraison</span><span className="font-bold text-emerald-600">GRATUIT</span></div>
                  <div className="h-[1px] bg-border my-4" />
                  <div className="flex justify-between text-xl font-black"><span>Total</span><span className="text-primary">{formatPrice(total)}</span></div>
                </div>

              </div>
              <div className="p-6 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-xl">🚚</div>
                <p className="text-xs font-medium">
                  {paymentMethod === 'cod' 
                    ? "Paiement à la livraison. Vérifiez votre colis avant de payer."
                    : "Paiement sécurisé par carte bancaire."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  };




const SectionRenderer = ({ section, store, onAddToCart, cart, slug, onClearCart, selectedProduct, onSelectProduct }: { section: any, store: any, onAddToCart?: (item: any) => void, cart: any[], slug: string, onClearCart: () => void, selectedProduct?: any, onSelectProduct?: (product: any) => void }) => {
  const commonProps = { sectionId: section.id, config: section.config };
  if (section.is_visible === false) return null;
  const handleAction = (type: string, id: string) => window.parent.postMessage({ type: 'SECTION_ACTION', actionType: type, sectionId: id }, '*');
  const renderSection = () => {
    switch (section.type) {
        case "hero": return <Hero {...commonProps} />;
        case "collections": return <Collections {...commonProps} />;
        case "trust_badges": return <TrustBadges {...commonProps} />;
        case "about": 
        case "shipping_policy":
        case "refund_policy":
        case "privacy_policy":
        case "terms_conditions":
          return <ContentSection {...commonProps} />;

      case "logo_carousel": return <LogoCarousel {...commonProps} />;
      case "promo_banner": return <PromoBanner {...commonProps} />;
      case "process_steps": return <ProcessSteps {...commonProps} />;
      case "pricing": return <Pricing {...commonProps} />;
      case "stats": return <Stats {...commonProps} />;
      case "team": return <Team {...commonProps} />;
      case "product_detail": return <ProductDetail {...commonProps} onAddToCart={onAddToCart} selectedProduct={selectedProduct} storeId={store?.id} />;
        case "products": return <Products {...commonProps} onAddToCart={onAddToCart} storeId={store?.id} onSelectProduct={onSelectProduct} />;
      case "features": return <Features {...commonProps} />;
      case "testimonials": return <Testimonials {...commonProps} />;
      case "faq": return <FAQ {...commonProps} />;
        case "newsletter": return <Newsletter {...commonProps} />;
        case "reviews": return <ReviewsSection {...commonProps} />;
        case "footer": return <Footer {...commonProps} />;

        case "recommended_products": return <RecommendedProducts {...commonProps} onAddToCart={onAddToCart} storeId={store?.id} onSelectProduct={onSelectProduct} />;
        case "checkout": return <Checkout {...commonProps} store={store} cart={cart} slug={slug} onClearCart={onClearCart} />;


      default: return <div className="p-10 text-center border-2 border-dashed">Section {section.type}</div>;
    }
  };
  return <SectionWrapper sectionId={section.id} onAction={handleAction}>{renderSection()}</SectionWrapper>;
};


export default function StorePreview({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [pages, setPages] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState("home");
    const [cart, setCart] = useState<any[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const hasReceivedInitialUpdate = useRef(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);

      useEffect(() => {
        const savedCart = localStorage.getItem(`cart_${slug}`);
        if (savedCart) try { setCart(JSON.parse(savedCart)); } catch (e) {}
        
        const isBuilder = window.parent !== window;

        const loadStore = async () => {
          const supabase = createClient();
          const { data: storeData } = await supabase.from("stores").select("*").eq("slug", slug).single();
          if (storeData) {
            setStore(storeData);
            
            // Track visit (if not in builder)
            if (window.parent === window) {
              try {
                fetch('/api/analytics/visit', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    storeId: storeData.id,
                    pagePath: window.location.pathname,
                    referrer: document.referrer
                  })
                }).catch(() => {}); // Silently ignore tracking errors to prevent crashes
              } catch (e) {}
            }

            // Only load pages from DB if not in builder or if we haven't received an update yet
            if (!isBuilder || (!hasReceivedInitialUpdate.current && pages.length === 0)) {
              const { data: pagesData } = await supabase.from("store_pages").select("*").eq("store_id", storeData.id).order("position", { ascending: true });
              if (pagesData) {
                setPages(pagesData);
                const pageData = pagesData.find(p => p.slug === currentPage) || pagesData[0];
                if (pageData && !hasReceivedInitialUpdate.current) setSections(pageData.sections || []);
              }
            }
          }
          setLoading(false);
        }
        loadStore();
      }, [slug]);

    useEffect(() => {
      // Handle page change without reloading everything from DB
      if (pages.length > 0) {
        const pageData = pages.find(p => p.slug === currentPage);
        if (pageData) setSections(pageData.sections || []);
      }
    }, [currentPage, pages]);

  useEffect(() => { if (!loading) localStorage.setItem(`cart_${slug}`, JSON.stringify(cart)); }, [cart, slug, loading]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'STORE_UPDATE') {
        const { sections: newSections, theme_config: newTheme, pages: newPages, page: newPage } = event.data;
        hasReceivedInitialUpdate.current = true;
        
        if (newPages) setPages(newPages);
        if (newTheme) setStore((prev: any) => ({ ...prev, theme_config: newTheme }));
        
        if (newPage && newPage !== currentPage) {
          setCurrentPage(newPage);
          window.scrollTo({ top: 0, behavior: 'instant' });
        }
        
        if (newSections) {
          setSections([...newSections]);
        }
      }
      if (event.data.type === 'NAVIGATE') {
          if (event.data.productId) {
            setSelectedProduct(event.data.product || { id: event.data.productId });
          }
          setCurrentPage(event.data.page);
          window.scrollTo({ top: 0, behavior: 'instant' });
        }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [currentPage, slug]);

  if (loading) return <div className="flex h-screen items-center justify-center bg-white"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!store) return <div className="flex h-screen items-center justify-center bg-white"><p>Boutique non trouvée</p></div>;

  return (
    <div className="min-h-screen flex flex-col bg-white relative" style={{
      '--primary': store?.theme_config?.colors?.primary || '#7c3aed',
      '--secondary': store?.theme_config?.colors?.secondary || '#4f46e5',
      '--font-heading': store?.theme_config?.fonts?.heading || store?.theme_config?.typography?.fontHeading || 'Inter',
      '--font-body': store?.theme_config?.fonts?.body || 'Inter',
      '--radius': store?.theme_config?.spacing?.borderRadius === 'full' ? '9999px' : store?.theme_config?.spacing?.borderRadius === 'md' ? '0.5rem' : '0px',
    } as React.CSSProperties}>
      <style jsx global>{`
        :root {
          --primary: ${store?.theme_config?.colors?.primary || '#7c3aed'};
          --primary-foreground: #ffffff;
        }
        h1, h2, h3, h4, h5, h6 {
          font-family: var(--font-heading), system-ui, sans-serif !important;
        }
        body {
          font-family: var(--font-body), system-ui, sans-serif !important;
          font-size: ${store?.theme_config?.typography?.scale || 100}%;
        }
        .rounded-3xl { border-radius: calc(var(--radius) * 3) !important; }
        .rounded-2xl { border-radius: calc(var(--radius) * 2) !important; }
        .rounded-xl { border-radius: var(--radius) !important; }
        .bg-primary { background-color: var(--primary) !important; }
        .text-primary { color: var(--primary) !important; }
        .border-primary { border-color: var(--primary) !important; }
      `}</style>
        <Header store={store} pages={pages} onOpenCart={() => setIsCartOpen(true)} cartCount={cart.reduce((acc, item) => acc + (item.quantity || 1), 0)} />
        <main className="flex-1">
          {currentPage.startsWith("merci/") ? (
            <Merci orderId={currentPage.split("/")[1]} store={store} />
          ) : currentPage.startsWith("track") ? (
            <Track orderNumber={currentPage.split("/")[1]} />
            ) : sections.map((s) => (
              <SectionRenderer 
                key={s.id} 
                section={s} 
                store={store} 
                onAddToCart={(p) => { 
                  setCart(prev => {
                    const existing = prev.find(item => item.id === p.id);
                    if (existing) {
                      return prev.map(item => item.id === p.id ? { ...item, quantity: (item.quantity || 1) + 1 } : item);
                    }
                    return [...prev, { ...p, quantity: 1 }];
                  });
                  setIsCartOpen(true); 
                }} 
                  cart={cart} 
                  slug={slug}
                  onClearCart={() => setCart([])}
                  selectedProduct={selectedProduct}
                  onSelectProduct={(product) => {
                    setSelectedProduct(product);
                    setCurrentPage('product-detail');
                    window.scrollTo({ top: 0, behavior: 'instant' });
                  }}
                />

          ))}
        </main>
        <CartDrawer 
          isOpen={isCartOpen} 
          onClose={() => setIsCartOpen(false)} 
          cart={cart} 
          onRemove={(id) => setCart(cart.filter(i => i.id !== id))}
          onUpdateQuantity={(id, delta) => {
            setCart(prev => prev.map(item => 
              item.id === id ? { ...item, quantity: Math.max(1, (item.quantity || 1) + delta) } : item
            ));
          }}
        />

    </div>
  );
}
