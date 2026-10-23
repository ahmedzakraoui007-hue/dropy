"use client";

import { useEffect, useState, useRef, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

import { StarRating } from "@/components/reviews/StarRating";
import { ReviewList } from "@/components/reviews/ReviewList";
import { AddReviewForm } from "@/components/reviews/AddReviewForm";
import { StoreLanguageProvider, StoreLanguageSwitch, useStoreText } from "@/components/storefront/StoreLanguage";
import { governorateLabel, normalizeStorefrontLanguage, orderErrorText, storeText, type StoreTextKey } from "@/lib/storefront-i18n";
import { TUNISIAN_GOVERNORATES } from "@/components/storefront/ExpressOrderForm";
import { discountPercent, normalizeSalesContent } from "@/lib/product-sales";
import { ExpressOrderForm } from "@/components/storefront/ExpressOrderForm";
import { SectionIcon } from "@/components/storefront/SectionIcon";
import { storeBasePath } from "@/lib/store-url";
import { loadStoreTracking, trackStoreEvent } from "@/lib/storefront-tracking";
import { deliveryFeeFor, discountedUnitPrice, normalizeOffers } from "@/lib/store-pricing";

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
  const { t } = useStoreText();
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

  if (!text && !isBuilder) return null;

  if (!isBuilder) {
    return (
      <Tag className={className} style={style} dir="auto">
        {text}
      </Tag>
    );
  }

  return (
    <Tag 
      dir="auto"
      className={`cursor-text hover:outline hover:outline-1 hover:outline-primary/50 hover:outline-offset-2 transition-all ${className}`}
      onDoubleClick={handleDoubleClick}
      style={style}
    >
      {text || t("edit.hint")}
    </Tag>
  );
};

const PreviewButton = ({ config, className, children, onClick }: { config?: any, className?: string, children?: React.ReactNode, onClick?: () => void }) => {
  const { t } = useStoreText();
  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    const link = String(config?.ctaLink || config?.cta_link || config?.link || '').trim();
    if (!link) return;
    if (link.startsWith('/product/') || link.startsWith('product/')) {
      window.parent.postMessage({ type: 'NAVIGATE', page: 'product-detail' }, '*');
      return;
    }
    navigateTo(link === '/' ? '/home' : link);
  };

  return (
    <button 
      onClick={handleClick}
      className={className || "bg-primary text-primary-foreground px-10 py-4 rounded-full font-bold text-lg hover:scale-105 transition-all shadow-xl active:scale-95"}
    >
      {children || config?.ctaText || config?.cta_text || t("common.learn_more")}
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
  const [isSelected, setIsSelected] = useState(false);
  const [isBuilder, setIsBuilder] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.parent === window) return;
    setIsBuilder(true);
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.data?.type !== 'SELECT_SECTION') return;
      const selected = event.data.sectionId === sectionId;
      setIsSelected(selected);
      if (selected) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [sectionId]);

  if (!isBuilder) return <>{children}</>;

  const act = (e: React.MouseEvent, type: string) => {
    e.stopPropagation();
    onAction(type, sectionId);
  };

  return (
    <div
      ref={ref}
      data-section-id={sectionId}
      className={`relative scroll-mt-20 ${isSelected ? 'ring-2 ring-primary ring-inset' : isHovered ? 'ring-2 ring-primary/40 ring-inset' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClickCapture={() => onAction('SELECT', sectionId)}
    >
      {(isHovered || isSelected) && (
        <div className="absolute top-2 end-2 z-[60] flex items-center gap-0.5 rounded-lg bg-gray-900/90 p-1 text-white shadow-xl" dir="ltr">
          <button onClick={(e) => act(e, 'MOVE_UP')} className="h-7 w-7 rounded hover:bg-white/20" aria-label="↑">↑</button>
          <button onClick={(e) => act(e, 'MOVE_DOWN')} className="h-7 w-7 rounded hover:bg-white/20" aria-label="↓">↓</button>
          <button onClick={(e) => act(e, 'DUPLICATE')} className="h-7 w-7 rounded hover:bg-white/20" aria-label="⧉">⧉</button>
          <button onClick={(e) => act(e, 'DELETE')} className="h-7 w-7 rounded hover:bg-red-500" aria-label="✕">✕</button>
        </div>
      )}
      {children}
    </div>
  );
};

// --- SECTIONS ---

const Hero = ({ sectionId, config }: { sectionId: string, config: any }) => {
  const { t } = useStoreText();
  const variant = config.variant || 'classic';
  const sectionStyle = getSectionStyle(config);
  const ctaPosition = config.ctaPosition || config.textPosition || 'center';
  const ctaLayout = config.ctaLayout || 'row';
  const verticalPosition = config.verticalPosition || 'center';
  const onImage = variant === 'video' || (Boolean(config.backgroundImage) && variant !== 'split');
  
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
    <div className={`relative z-10 w-full max-w-5xl mx-auto px-4 ${config.textPosition === 'left' ? 'text-start' : config.textPosition === 'right' ? 'text-end' : 'text-center'}`}>
      {config.badge && (
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${onImage ? 'bg-white/15 text-white border border-white/30 backdrop-blur' : 'bg-primary/10 text-primary border border-primary/20'} text-sm font-bold mb-8 animate-bounce`}>
          ✨ <EditableText sectionId={sectionId} field="badge" text={config.badge} />
        </div>
      )}
      <EditableText 
        tag="h1"
        sectionId={sectionId}
        field="title"
        text={config.title || t("builtin.welcome")}
        className={`${variant === 'bold' ? 'text-5xl sm:text-7xl md:text-9xl' : variant === 'split' ? 'text-4xl sm:text-5xl lg:text-6xl' : 'text-5xl sm:text-6xl md:text-8xl'} font-black mb-8 tracking-tighter leading-tight block break-words`}
        style={{ color: config.textColor || (onImage ? "#ffffff" : "inherit") }}
      />
      <EditableText 
        tag="p"
        sectionId={sectionId}
        field="subtitle"
        text={config.subtitle || t("builtin.discover")}
        className="text-xl md:text-3xl mb-12 max-w-3xl mx-auto opacity-90 leading-relaxed font-medium block"
        style={{ color: config.textColor || (onImage ? "#ffffff" : "inherit") }}
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
            <button className="text-lg font-bold border-b-2 border-current hover:opacity-70 transition-opacity" style={{ color: config.textColor || (onImage ? "#ffffff" : "inherit") }}>
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
          <div className="flex-1 min-w-0 px-6 py-12 md:p-16 lg:p-24">
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
          style={{ backgroundColor: `rgba(0,0,0,${typeof config.overlay === "number" ? config.overlay : 0.4})` }}
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
        : `grid gap-8 grid-cols-2 ${gridCols(config.columns, 4)}`
      }>
        {(config.items || []).map((item: any, i: number) => (
          <div key={i} className={`flex ${config.layout === 'row' ? 'flex-row items-center gap-4' : 'flex-col items-center text-center'} p-6 bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow`}>
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-0 text-xl shrink-0">
              <SectionIcon name={item.icon} className="w-5 h-5" />
            </div>
            <div className={config.layout === 'row' ? 'text-start' : ''}>
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

const PromoBanner = ({ sectionId, config }: { sectionId: string, config: any }) => {
  const { t } = useStoreText();
  return (
  <div className="py-2.5 px-4 text-center text-sm font-bold relative z-[60] group" style={{ backgroundColor: config.backgroundColor || "var(--primary)", color: config.textColor || "#ffffff" }}>
    <EditableText sectionId={sectionId} field="text" text={config.text || ""} />
    {config.link && <button onClick={() => navigateTo(config.link)} className="ms-2 underline hover:opacity-80 transition-opacity">{t("common.learn_more")}</button>}
  </div>
  );
};

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
      {config.title && <EditableText tag="h2" sectionId={sectionId} field="title" text={config.title} className="text-3xl md:text-4xl font-black mb-12 text-center block" />}
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
  const { t } = useStoreText();
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
            <EditableText tag="h2" sectionId={sectionId} field="title" text={config.title || t("reviews.title")} className="text-3xl md:text-4xl font-black block mb-2" />
            <div className="flex items-center gap-3">
              <StarRating rating={Math.round(averageRating)} readonly />
              <span className="text-lg font-bold">{averageRating.toFixed(1)}/5</span>
              <span className="text-muted-foreground">({t("reviews.count", { count: reviews.length })})</span>
            </div>
          </div>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-primary text-white px-6 py-3 rounded-xl font-bold hover:scale-105 transition-all"
          >
            {showAddForm ? t("common.cancel") : t("reviews.write")}
          </button>
        </div>

        {showAddForm && (
          <div className="mb-12 p-8 bg-card border border-border rounded-3xl shadow-xl animate-in zoom-in-95 duration-300">
            <h3 className="text-xl font-bold mb-6">{t("reviews.form_title")}</h3>
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

const ProductDetail = ({ sectionId, config, onAddToCart, selectedProduct, storeId, store }: { sectionId: string, config: any, onAddToCart?: (item: any) => void, selectedProduct?: any, storeId?: string, store?: any }) => {
  const { t, money } = useStoreText();
  const [reviews, setReviews] = useState<any[]>([]);
  const [product, setProduct] = useState<any>(selectedProduct || null);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const galleryRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const [formVisible, setFormVisible] = useState(true);
  const [variantOptions, setVariantOptions] = useState<{ id: string; label: string; price: number | null; stock: number | null }[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [variantError, setVariantError] = useState(false);

  useEffect(() => {
    setVariantOptions([]);
    setSelectedVariantId(null);
    if (!product?.id || !product.has_variants) return;

    if (Array.isArray(product.variants) && product.variants.length > 0) {
      setVariantOptions(
        product.variants
          .filter((v: any) => v?.id)
          .map((v: any) => ({ id: v.id, label: String(v.value ?? ""), price: v.price ?? null, stock: v.stock ?? null }))
      );
      return;
    }

    createClient()
      .from("store_product_variants")
      .select("id, price, stock, is_active, values:store_product_variant_values(custom_value, option:variant_options(label, value))")
      .eq("product_id", product.id)
      .then(({ data }) => {
        setVariantOptions(
          (data || [])
            .filter((v: any) => v.is_active !== false)
            .map((v: any) => ({
              id: v.id,
              label: (v.values || []).map((x: any) => x.option?.label || x.option?.value || x.custom_value).filter(Boolean).join(" / "),
              price: v.price ?? null,
              stock: v.stock ?? null,
            }))
        );
      });
  }, [product?.id, product?.has_variants]);

  const selectedVariant = variantOptions.find((v) => v.id === selectedVariantId) || null;
  
  const [inBuilder, setInBuilder] = useState(false);
  useEffect(() => setInBuilder(window.parent !== window), []);

  useEffect(() => {
    const wantedId = selectedProduct?.id || config.productId;
    if (storeId && (wantedId || !selectedProduct)) {
      setLoading(true);
      const supabase = createClient();
      let query = supabase.from("store_products").select("*").eq("store_id", storeId).eq("is_active", true);
      query = wantedId ? query.eq("id", wantedId) : query.order("created_at", { ascending: false }).limit(1);
      query
        .maybeSingle()
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
              compare_at_price: data.compare_at_price,
              sales_content: data.sales_content,
            });
          }
          setLoading(false);
        });
    } else if (selectedProduct) {
      setProduct(selectedProduct);
    }
  }, [selectedProduct, storeId, config.productId]);

  useEffect(() => {
    const productId = product?.id || config.productId;
    if (productId) {
      fetch(`/api/reviews/product?productId=${productId}`)
        .then(res => res.json())
        .then(data => setReviews(Array.isArray(data) ? data : []))
        .catch(err => console.error(err));
    }
  }, [product?.id, config.productId]);

  useEffect(() => {
    if (!product?.id || !product?.title) return;
    trackStoreEvent("ViewContent", { contentId: product.id, contentName: product.title, value: parsePrice(product.price) });
  }, [product?.id, product?.title]);

  const averageRating = reviews.length > 0 
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length 
    : 0;

  const displayProduct = product || {
    title: config.title || t("builtin.products"),
    price: config.price || "149.00",
    description: config.description || "",
    image: config.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop",
    images: config.images || [config.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop"]
  };

  const images: string[] = (displayProduct.images?.length > 0 ? displayProduct.images : [displayProduct.image]).filter(Boolean);
  const sales = normalizeSalesContent(displayProduct.sales_content);
  const unitPrice = parsePrice(selectedVariant?.price ?? displayProduct.price);
  const compareAt = selectedVariant?.price != null ? null : displayProduct.compare_at_price;
  const percent = discountPercent(unitPrice, compareAt);
  const showForm = config.expressOrder !== false;

  useEffect(() => {
    const node = formRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setFormVisible(entry.isIntersecting || entry.boundingClientRect.top < 0), { threshold: 0.1 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [product?.id, loading]);

  const showImage = (index: number) => {
    setSelectedImage(index);
    const gallery = galleryRef.current;
    if (gallery) gallery.scrollTo({ left: (gallery.scrollWidth / images.length) * index * (document.documentElement.dir === "rtl" ? -1 : 1), behavior: "smooth" });
  };

  if (!product && !loading && !inBuilder) return null;

  if (loading) {
    return (
      <section className="px-4 py-20">
        <div className="max-w-7xl mx-auto flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  const addToCart = () => {
    if (variantOptions.length > 0 && !selectedVariant) {
      setVariantError(true);
      return;
    }
    onAddToCart?.({
      id: displayProduct.id,
      title: displayProduct.title,
      price: selectedVariant?.price ?? displayProduct.price,
      image: images[0],
      variantId: selectedVariant?.id,
      variantLabel: selectedVariant?.label,
    });
  };

  return (
    <section className={`px-4 ${config.animation || 'fade-up'}`} style={getSectionStyle({ paddingY: 32, ...config })}>
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-6 md:gap-12 items-start">
          <div className="space-y-3 md:sticky md:top-24">
            <div className="relative overflow-hidden rounded-3xl bg-muted border border-border">
              <div
                ref={galleryRef}
                className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                onScroll={(e) => {
                  const el = e.currentTarget;
                  const index = Math.round(Math.abs(el.scrollLeft) / (el.clientWidth || 1));
                  if (index !== selectedImage) setSelectedImage(Math.min(images.length - 1, index));
                }}
              >
                {images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={idx === 0 ? displayProduct.title : ""}
                    loading={idx === 0 ? "eager" : "lazy"}
                    className="aspect-square w-full shrink-0 snap-center object-cover"
                  />
                ))}
              </div>
              {(sales.badge || percent > 0) && (
                <div className="pointer-events-none absolute start-3 top-3 flex flex-col items-start gap-2">
                  {percent > 0 && <span className="rounded-full bg-red-600 px-3 py-1 text-sm font-black text-white shadow">-{percent}%</span>}
                  {sales.badge && <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-gray-900 shadow" dir="auto">{sales.badge}</span>}
                </div>
              )}
              {images.length > 1 && (
                <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5 md:hidden">
                  {images.map((_, idx) => (
                    <span key={idx} className={`h-1.5 rounded-full transition-all ${idx === selectedImage ? "w-5 bg-white" : "w-1.5 bg-white/60"}`} />
                  ))}
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="hidden gap-2 overflow-x-auto pb-1 md:flex">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => showImage(idx)}
                    aria-label={`${idx + 1} / ${images.length}`}
                    className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${selectedImage === idx ? "border-primary" : "border-border opacity-70 hover:opacity-100"}`}
                  >
                    <img src={img} className="h-full w-full object-cover" alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div className="space-y-3">
              <h1 className="text-2xl md:text-4xl font-black leading-tight" dir="auto">{displayProduct.title}</h1>
              {reviews.length > 0 && (
                <div className="flex items-center gap-2">
                  <StarRating rating={Math.round(averageRating)} readonly size="sm" />
                  <span className="text-sm font-bold">{averageRating.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">({t("reviews.count", { count: reviews.length })})</span>
                </div>
              )}
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-3xl md:text-4xl font-black text-primary">{money(unitPrice)}</span>
                {percent > 0 && (
                  <>
                    <span className="text-lg text-muted-foreground line-through">{money(parsePrice(compareAt))}</span>
                    <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-sm font-bold text-red-600">
                      {t("products.save")} {money(parsePrice(compareAt) - unitPrice)}
                    </span>
                  </>
                )}
              </div>
            </div>

            {sales.highlights.length > 0 && (
              <ul className="space-y-2">
                {sales.highlights.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-black text-white">✓</span>
                    <span className="font-medium" dir="auto">{item}</span>
                  </li>
                ))}
              </ul>
            )}

            {variantOptions.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-bold uppercase tracking-wider opacity-70">{t("products.choose_option")}</p>
                <div className="flex flex-wrap gap-2">
                  {variantOptions.map((option) => {
                    const soldOut = option.stock != null && option.stock <= 0;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        disabled={soldOut}
                        onClick={() => { setSelectedVariantId(option.id); setVariantError(false); }}
                        className={`px-4 py-2 rounded-xl border-2 text-sm font-bold transition-all disabled:opacity-40 disabled:line-through ${selectedVariantId === option.id ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/50'}`}
                      >
                        {option.label || t("common.option")}
                      </button>
                    );
                  })}
                </div>
                {variantError && <p className="text-sm text-red-600 font-medium">{t("products.option_required")}</p>}
              </div>
            )}

            {showForm && (
              <div ref={formRef} id="order-form" className="scroll-mt-24">
                <ExpressOrderForm
                  storeId={storeId}
                  productId={displayProduct.id}
                  variantId={selectedVariant?.id}
                  unitPrice={unitPrice}
                  preview={inBuilder || !displayProduct.id}
                  title={config.expressTitle}
                  buttonText={config.expressButtonText}
                  offers={normalizeOffers(store?.quantity_offers)}
                  delivery={{ delivery_fee: store?.delivery_fee, free_delivery_threshold: store?.free_delivery_threshold }}
                  beforeSubmit={() => {
                    if (variantOptions.length > 0 && !selectedVariant) {
                      setVariantError(true);
                      return false;
                    }
                    return true;
                  }}
                  onStart={() => trackStoreEvent("InitiateCheckout", { contentId: displayProduct.id, value: unitPrice })}
                  onOrdered={(orderId, total, quantity) => {
                    trackStoreEvent("Purchase", { contentId: displayProduct.id, contentName: displayProduct.title, value: total, quantity, orderId });
                    window.parent.postMessage({ type: "NAVIGATE", page: `merci/${orderId}` }, "*");
                  }}
                />
              </div>
            )}
            <button
              type="button"
              onClick={addToCart}
              className={showForm ? "w-full border-2 border-border py-3 rounded-2xl font-bold hover:bg-muted transition-colors" : "w-full bg-primary text-primary-foreground py-5 rounded-2xl font-black text-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all"}
            >
              {t("cart.add")}
            </button>
          </div>
        </div>

        {(displayProduct.description || sales.faq.length > 0) && (
          <div className="mx-auto mt-12 max-w-3xl space-y-10">
            {displayProduct.description && (
              <div className="space-y-3">
                <h2 className="text-xl font-black">{t("products.description")}</h2>
                <p className="text-base leading-relaxed text-muted-foreground whitespace-pre-line" dir="auto">{displayProduct.description}</p>
              </div>
            )}
            {sales.faq.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-xl font-black">{t("products.faq")}</h2>
                <div className="space-y-2">
                  {sales.faq.map((item, idx) => (
                    <details key={idx} className="group rounded-2xl border border-border bg-card px-5 py-4 open:shadow-sm" open={idx === 0}>
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-bold [&::-webkit-details-marker]:hidden">
                        <span dir="auto">{item.question}</span>
                        <span className="text-xs transition-transform group-open:rotate-180">▼</span>
                      </summary>
                      <p className="mt-3 leading-relaxed text-muted-foreground whitespace-pre-line" dir="auto">{item.answer}</p>
                    </details>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showForm && !formVisible && !inBuilder && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-border bg-white/95 px-4 py-3 backdrop-blur md:hidden">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-muted-foreground" dir="auto">{displayProduct.title}</p>
            <p className="text-lg font-black text-primary">{money(unitPrice)}</p>
          </div>
          <button
            type="button"
            onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="shrink-0 rounded-xl bg-primary px-6 py-3 font-black text-white shadow-lg"
          >
            {t("cart.order")}
          </button>
        </div>
      )}
    </section>
  );
};

const Products = ({ sectionId, config, onAddToCart, storeId, onSelectProduct }: { sectionId: string, config: any, onAddToCart?: (item: any) => void, storeId?: string, onSelectProduct?: (product: any) => void }) => {
  const { t, money } = useStoreText();
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
              compare_at_price: p.compare_at_price,
              sales_content: p.sales_content,
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
            <p className="text-lg">{t("products.empty")}</p>
            <p className="text-sm mt-2">{t("products.empty_hint")}</p>
          </div>
        ) : (
          <div className={`grid gap-x-6 gap-y-12 grid-cols-2 ${gridCols(config.columns, 4)}`}>
            {displayItems.slice(0, config.limit || 12).map((item: any, i: number) => {
              const data = typeof item === 'number' ? { title: `Produit ${item}`, price: "49.00", image: placeholders[i % 3] } : item;
              return (
                <div key={data.id || i} className="group cursor-pointer" onClick={() => handleProductClick(data)}>
                  <div className="aspect-[4/5] bg-muted rounded-3xl mb-4 overflow-hidden relative shadow-sm group-hover:shadow-xl transition-all">
                    <img src={data.image || placeholders[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" loading="lazy" />
                    {(() => {
                      const off = discountPercent(parsePrice(data.price), data.compare_at_price);
                      const badge = normalizeSalesContent(data.sales_content).badge;
                      return off > 0 || badge ? (
                        <div className="pointer-events-none absolute start-3 top-3 flex flex-col items-start gap-1.5">
                          {off > 0 && <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-black text-white">-{off}%</span>}
                          {badge && <span className="rounded-full bg-white/95 px-2.5 py-0.5 text-[11px] font-bold text-gray-900" dir="auto">{badge}</span>}
                        </div>
                      ) : null;
                    })()}
                    <button onClick={(e) => { e.stopPropagation(); onAddToCart?.(data); }} className="absolute bottom-4 inset-x-4 bg-white text-black py-3 rounded-xl font-bold text-sm shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">{t("cart.add")}</button>
                  </div>
                  {hasRealProducts ? (
                    <>
                      <h3 className="font-bold text-base md:text-lg leading-snug" dir="auto">{data.title}</h3>
                      <p className="flex flex-wrap items-baseline gap-x-2">
                        <span className="text-primary font-black">{money(parsePrice(data.price))}</span>
                        {discountPercent(parsePrice(data.price), data.compare_at_price) > 0 && (
                          <span className="text-sm text-muted-foreground line-through">{money(parsePrice(data.compare_at_price))}</span>
                        )}
                      </p>
                    </>
                  ) : (
                    <>
                      <EditableText sectionId={sectionId} field={`items.${i}.title`} text={data.title} className="font-bold text-lg block" />
                      <p className="text-primary font-black">{money(parsePrice(data.price))}</p>
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
      <div className={`grid gap-12 grid-cols-1 ${gridCols(config.columns, 4)}`}>
        {(config.features || []).map((f: any, i: number) => (
          <div key={i} className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6 text-2xl">
              <SectionIcon name={f.icon} className="w-7 h-7" />
            </div>
            <EditableText tag="h3" sectionId={sectionId} field={`features.${i}.title`} text={f.title} className="text-xl font-bold mb-3 block" />
            <EditableText tag="p" sectionId={sectionId} field={`features.${i}.description`} text={f.description} className="text-muted-foreground block" />
          </div>
        ))}
      </div>
    </div>
  </section>
);

const Footer = ({ sectionId, config, links = [], store }: { sectionId: string, config: any, links?: any[], store?: any }) => {
  const { t } = useStoreText();
  return (
  <footer className="py-20 px-4 bg-slate-950 text-slate-300 border-t border-white/10">
    <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
      <div className="space-y-6">
        <div className="text-2xl font-black text-white tracking-tighter"><EditableText sectionId={sectionId} field="brandName" text={config.brandName || store?.name || t("common.store")} /></div>
        <EditableText tag="p" sectionId={sectionId} field="description" text={config.description || ""} className="text-slate-400 block" />
      </div>
      {(config.address || config.phone || store?.contact_phone || store?.contact_email) ? (
      <div>
        <h4 className="text-white font-bold mb-6">{t("footer.contact")}</h4>
        <ul className="space-y-4 text-sm">
          {config.address && <li>📍 <EditableText sectionId={sectionId} field="address" text={config.address} /></li>}
          {(config.phone || store?.contact_phone) && <li>📞 <a href={`tel:${config.phone || store?.contact_phone}`} className="hover:text-white">{config.phone || store?.contact_phone}</a></li>}
          {store?.contact_email && <li>✉️ <a href={`mailto:${store.contact_email}`} className="hover:text-white">{store.contact_email}</a></li>}
        </ul>
      </div>
      ) : <div className="hidden md:block" />}
      <div>
        <h4 className="text-white font-bold mb-6">{t("footer.follow")}</h4>
        <button 
          onClick={() => window.parent.postMessage({ type: 'NAVIGATE', page: 'track' }, '*')}
          className="flex items-center gap-2 bg-primary/20 hover:bg-primary/30 text-primary px-4 py-3 rounded-xl transition-colors text-sm font-bold"
        >
          📦 {t("footer.track")}
        </button>
      </div>
    </div>
    {links.length > 0 && (
      <div className="max-w-7xl mx-auto mt-12 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
        {links.map((l: any) => (
          <button key={l.id || l.label} onClick={() => navigateTo(l.url)} className="hover:text-white transition-colors">{l.label}</button>
        ))}
      </div>
    )}
    <div className="mt-16 pt-8 border-t border-white/5 text-center text-sm text-slate-500">
      <EditableText sectionId={sectionId} field="copyright" text={config.copyright || `© ${new Date().getFullYear()} ${store?.name || ""}. ${t("footer.rights")}`} />
    </div>
  </footer>
  );
};

const RecommendedProducts = ({ sectionId, config, onAddToCart, storeId, onSelectProduct }: { sectionId: string, config: any, onAddToCart?: (item: any) => void, storeId?: string, onSelectProduct?: (product: any) => void }) => {
  const { t, money } = useStoreText();
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
    bestsellers: t("products.recommended.bestsellers"),
    recent: t("products.recommended.recent"),
    similar: t("products.recommended.similar"),
    random: t("products.recommended.similar")
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
              text={config.title || t("products.recommended.default")} 
              className="text-3xl font-black block" 
            />
          </div>
          <button 
            onClick={() => window.parent.postMessage({ type: 'NAVIGATE', page: 'shop' }, '*')}
            className="text-sm font-bold text-primary hover:underline"
          >
            {t("nav.products")} →
          </button>
        </div>
        
        {displayItems.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>{t("products.empty")}</p>
          </div>
        ) : (
          <div className={`grid gap-6 grid-cols-2 ${gridCols(config.columns, 4)}`}>
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
                  <div className="absolute top-3 start-3 bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-full">
                    {config.algorithm === "bestsellers" ? "TOP" : config.algorithm === "recent" ? "VU" : ""}
                  </div>
                  <button 
                    onClick={(e) => handleAddToCart(e, item)}
                    className="absolute bottom-3 inset-x-3 bg-primary text-white py-2.5 rounded-xl font-bold text-sm opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0"
                  >
                    + {t("cart.add")}
                  </button>
                </div>
                <h3 className="font-bold text-sm mb-1">{item.title}</h3>
                {config.showPrice !== false && (
                  <p className="text-primary font-black">{money(parsePrice(item.price))}</p>
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

const navigateTo = (url: string) => {
  const link = (url || "").trim();
  if (/^https?:\/\//i.test(link)) {
    window.open(link, "_blank", "noopener,noreferrer");
    return;
  }
  const page = link.replace(/^\//, "").replace(/^shop\/(products|shop)$/, "shop") || "home";
  window.parent.postMessage({ type: 'NAVIGATE', page }, '*');
};

const headerLinks = (store: any, pages: any[], t: (key: StoreTextKey) => string) => {
  const custom = (store?.headerLinks || []).filter((i: any) => i?.label);
  if (custom.length) return custom.map((i: any) => ({ key: i.id || i.label, label: i.label, url: i.url || "/" }));
  const visible = pages.filter((p) => p.is_published !== false && p.show_in_navigation !== false && p.show_in_menu !== false && p.slug);
  if (!visible.length) return [{ key: "home", label: t("nav.home"), url: "/home" }, { key: "shop", label: t("nav.products"), url: "/shop" }];
  return visible.map((p) => ({ key: p.id || p.slug, label: p.title || p.name || p.slug, url: p.is_homepage ? "/home" : `/${p.slug}` }));
};

const Header = ({ store, pages = [], onOpenCart, cartCount = 0 }: { store: any, pages?: any[], onOpenCart?: () => void, cartCount?: number }) => {
  const { t } = useStoreText();
  const [open, setOpen] = useState(false);
  const links = headerLinks(store, pages, t);
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border px-4 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <button onClick={() => navigateTo("/home")} className="text-2xl font-bold tracking-tighter text-primary flex items-center gap-2 min-w-0">
          {store?.logo_url ? (
            <img src={store.logo_url} alt={store?.name || ""} className="h-8 w-auto object-contain" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white text-sm shrink-0">{store?.name?.charAt(0) || "D"}</div>
          )}
          <span className="truncate">{store?.name || t("common.store")}</span>
        </button>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          {links.map((l: any) => (
            <button key={l.key} onClick={() => navigateTo(l.url)} className="hover:text-primary transition-colors">{l.label}</button>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <StoreLanguageSwitch className="me-1" />
          <button onClick={onOpenCart} className="p-2 hover:bg-muted rounded-full relative" aria-label={t("nav.cart")}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            <span className="absolute top-0 end-0 w-4 h-4 bg-primary text-white text-[10px] flex items-center justify-center rounded-full font-bold">{cartCount}</span>
          </button>
          <button onClick={() => setOpen((v) => !v)} className="md:hidden p-2 hover:bg-muted rounded-full" aria-label={t("nav.menu")}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={open ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} /></svg>
          </button>
        </div>
      </div>
      {open && (
        <nav className="md:hidden max-w-7xl mx-auto mt-4 flex flex-col border-t border-border pt-2">
          {links.map((l: any) => (
            <button key={l.key} onClick={() => { setOpen(false); navigateTo(l.url); }} className="text-start py-3 text-sm font-medium hover:text-primary">{l.label}</button>
          ))}
        </nav>
      )}
    </header>
  );
};

  const CartDrawer = ({ isOpen, onClose, cart, onRemove, onUpdateQuantity, offers = [] }: { isOpen: boolean, onClose: () => void, cart: any[], onRemove: (id: string) => void, onUpdateQuantity: (id: string, delta: number) => void, offers?: any[] }) => {
    const { t, money } = useStoreText();
    if (!isOpen) return null;
    const total = cart.reduce((acc, item) => acc + discountedUnitPrice(parsePrice(item.price), item.quantity || 1, offers) * (item.quantity || 1), 0);
    return (
      <div className="fixed inset-0 z-[100] flex justify-end">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col" dir="auto">
          <div className="p-6 border-b border-border flex items-center justify-between"><h2 className="text-2xl font-black">{t("cart.title")} ({cart.reduce((acc, item) => acc + (item.quantity || 1), 0)})</h2><button onClick={onClose} aria-label={t("common.cancel")}>✕</button></div>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
{cart.length === 0 ? <p className="text-center text-muted-foreground mt-20">{t("cart.empty")}</p> : cart.map((item, i) => (
                <div key={`${item.id}-${i}`} className="flex gap-4">
                <div className="w-20 h-20 bg-muted rounded-xl overflow-hidden"><img src={item.image} className="w-full h-full object-cover" alt="" /></div>
                <div className="flex-1">
                  <h3 className="font-bold">{item.title}</h3>
                  {item.variantLabel && <p className="text-xs opacity-60">{item.variantLabel}</p>}
                  <p className="text-primary font-black">{money(parsePrice(item.price))}</p>
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
                    <button onClick={() => onRemove(item.id)} className="text-xs text-red-500 hover:underline">{t("common.remove")}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
            {cart.length > 0 && (
              <div className="p-6 border-t border-border space-y-4 bg-muted/10">
                <div className="flex items-center justify-between text-xl font-black"><span>{t("common.total")}</span><span className="text-primary">{money(total)}</span></div>
                <button onClick={() => { window.parent.postMessage({ type: 'NAVIGATE', page: 'checkout' }, '*'); onClose(); }} className="w-full bg-primary text-white py-4 rounded-xl font-black text-lg">{t("cart.checkout")}</button>
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
      <div className={`grid gap-8 ${gridCols(config.columns, 3)}`}>
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
                className="w-full px-6 py-5 text-start font-bold flex items-center justify-between hover:bg-muted/50 transition-colors"
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

const Newsletter = ({ sectionId, config, storeId }: { sectionId: string, config: any, storeId?: string }) => {
  const { t } = useStoreText();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId || state === "sending") return;
    setState("sending");
    try {
      const res = await fetch("/api/store/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId, email }),
      });
      setState(res.ok ? "done" : "error");
      if (res.ok) setEmail("");
    } catch {
      setState("error");
    }
  };

  return (
    <section className={`px-4 ${config.animation || 'fade-up'}`} style={{ ...getSectionStyle(config), backgroundColor: config.backgroundColor || "var(--primary)", color: config.textColor || "#ffffff" }}>
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto text-3xl">✉️</div>
        <div className="space-y-4">
          <EditableText tag="h2" sectionId={sectionId} field="title" text={config.title || t("newsletter.title")} className="text-4xl font-black block" />
          <EditableText tag="p" sectionId={sectionId} field="subtitle" text={config.subtitle || t("newsletter.subtitle")} className="text-xl opacity-90 block" />
        </div>
        {state === "done" ? (
          <p className="max-w-lg mx-auto bg-white/15 rounded-2xl px-6 py-4 font-bold" role="status">{config.successText || t("newsletter.success")}</p>
        ) : (
          <form onSubmit={submit} className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto bg-white/10 p-2 rounded-2xl backdrop-blur-md">
            <input type="email" required value={email} onChange={(e) => { setEmail(e.target.value); if (state === "error") setState("idle"); }} placeholder={config.placeholder || t("newsletter.placeholder")} aria-label={config.placeholder || t("newsletter.placeholder")} className="flex-1 bg-transparent border-none text-white placeholder:text-white/50 px-4 py-3 focus:ring-0" />
            <button type="submit" disabled={state === "sending"} className="bg-white text-primary px-8 py-3 rounded-xl font-black hover:scale-105 transition-all disabled:opacity-60 inline-flex items-center justify-center gap-2">
              {state === "sending" && <Loader2 className="w-4 h-4 animate-spin" />}
              {config.buttonText || t("newsletter.button")}
            </button>
          </form>
        )}
        {state === "error" && <p className="text-sm font-semibold opacity-90" role="alert">{t("newsletter.error")}</p>}
      </div>
    </section>
  );
};

const Collections = ({ sectionId, config }: { sectionId: string, config: any }) => (
  <section className={`px-4 ${config.animation || 'fade-up'}`} style={getSectionStyle(config)}>
    <div className="max-w-7xl mx-auto">
      {config.title && <EditableText tag="h2" sectionId={sectionId} field="title" text={config.title} className="text-4xl font-black mb-12 text-center block" />}
      <div className={`grid gap-6 grid-cols-1 sm:grid-cols-2 ${gridCols(config.columns, 3)}`}>
        {(config.items || []).map((item: any, i: number) => (
          <div key={i} className="group cursor-pointer relative overflow-hidden rounded-2xl aspect-[16/9]" onClick={() => navigateTo(item.link || '/shop')}>
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
      <SafeHtml html={config.content || ""} className="text-muted-foreground leading-relaxed" />
    </div>
  </section>
);

const Merci = ({ orderId, store }: { orderId: string, store: any }) => {
  const { t, money } = useStoreText();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrder = async () => {
      const response = await fetch(`/api/store/orders/track?id=${encodeURIComponent(orderId)}`);
      const result = response.ok ? await response.json() : null;
      setOrder(result?.order ?? null);
      setLoading(false);
    };
    loadOrder();
  }, [orderId]);

  if (loading) return <div className="p-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>;
  if (!order) return <div className="p-20 text-center">{t("thanks.not_found")}</div>;

  return (
    <section className="px-4 py-20 text-center fade-in">
      <div className="max-w-2xl mx-auto space-y-8 bg-card p-12 rounded-[3rem] border border-border shadow-2xl">
        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-4xl mx-auto animate-bounce">🎉</div>
        <div className="space-y-4">
          <h2 className="text-4xl font-black tracking-tight">{t("thanks.title")}</h2>
          <p className="text-xl text-muted-foreground">{t("thanks.body", { number: order.order_number })}</p>
        </div>
        <div className="p-6 bg-muted/50 rounded-2xl text-start space-y-4 border border-border">
          <div className="flex justify-between items-center pb-4 border-b border-border">
            <span className="text-sm font-bold uppercase opacity-60">{t("thanks.status")}</span>
            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-black uppercase">{t("thanks.received")}</span>
          </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold uppercase opacity-60">{t("thanks.total")}</span>
              <span className="text-xl font-black">{money(order.total_amount)}</span>
            </div>

          <div className="flex justify-between items-center text-xs opacity-60">
            <span>{t("thanks.payment")}</span>
            <span>{t("checkout.cod")}</span>
          </div>
        </div>
        <div className="space-y-4">
          <button onClick={() => window.parent.postMessage({ type: 'NAVIGATE', page: 'home' }, '*')} className="w-full bg-primary text-white py-4 rounded-2xl font-black text-lg shadow-xl hover:scale-[1.02] transition-all">{t("thanks.continue")}</button>
          <button onClick={() => window.parent.postMessage({ type: 'NAVIGATE', page: `track/${order.order_number}` }, '*')} className="text-sm font-bold opacity-60 hover:opacity-100 transition-opacity">{t("thanks.track")}</button>
        </div>
      </div>
    </section>
  );
};

const Track = ({ orderNumber }: { orderNumber: string }) => {
  const { t, money, lang } = useStoreText();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searchNum, setSearchNum] = useState(orderNumber || "");
  const [error, setError] = useState("");

  const handleSearch = async (num: string) => {
    if (!num) return;
    setLoading(true);
    setError("");
    const response = await fetch(`/api/store/orders/track?number=${encodeURIComponent(num)}`);
    const data = response.ok ? (await response.json()).order : null;
    if (data) setOrder(data);
    else setError(t("track.not_found"));
    setLoading(false);
  };

  useEffect(() => { if (orderNumber) handleSearch(orderNumber); }, [orderNumber]);

  const steps = [
    { key: 'new', label: t('track.status.new'), icon: '📝' },
    { key: 'confirmed', label: t('track.status.confirmed'), icon: '✅' },
    { key: 'preparing', label: t('track.status.preparing'), icon: '📦' },
    { key: 'shipped', label: t('track.status.shipped'), icon: '🚚' },
    { key: 'delivered', label: t('track.status.delivered'), icon: '🏠' }
  ];

  const isCancelled = order?.status === 'cancelled';
  const currentStepIdx = Math.max(0, steps.findIndex(s => s.key === order?.status));

  return (
    <section className="px-4 py-20 fade-in">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-black">{t("track.title")}</h2>
          <p className="text-muted-foreground">{t("track.subtitle")}</p>
        </div>
        <div className="flex gap-2 bg-card p-2 rounded-2xl border border-border shadow-xl">
          <input value={searchNum} onChange={e => setSearchNum(e.target.value.toUpperCase())} className="flex-1 bg-transparent border-none px-4 py-3 font-bold focus:ring-0" placeholder={t("track.placeholder")} dir="ltr" aria-label={t("track.placeholder")} />
          <button onClick={() => handleSearch(searchNum)} disabled={loading} className="bg-primary text-white px-8 py-3 rounded-xl font-black disabled:opacity-50">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t("track.search")}
          </button>
        </div>

        {error && <p className="text-center text-red-500 font-bold">{error}</p>}

        {order && (
          <div className="bg-card p-12 rounded-[3rem] border border-border shadow-2xl space-y-12">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-bold uppercase opacity-60 mb-1">{t("track.order")}</p>
                <p className="text-2xl font-black">{order.order_number}</p>
              </div>
              <div className="text-end">
                <p className="text-xs font-bold uppercase opacity-60 mb-1">{t("track.date")}</p>
                <p className="font-bold">{new Intl.DateTimeFormat(lang === "ar" ? "ar-TN" : "fr-TN", { day: "numeric", month: "long", year: "numeric" }).format(new Date(order.created_at))}</p>
              </div>
            </div>

            {isCancelled ? (
              <p className="rounded-2xl bg-red-50 px-4 py-3 text-center font-bold text-red-700">{t("track.status.cancelled")}</p>
            ) : (
            <div className="relative">
              <div className="absolute top-1/2 inset-x-0 h-[2px] bg-muted -translate-y-1/2" />
              <div className="absolute top-1/2 start-0 h-[2px] bg-primary -translate-y-1/2 transition-all duration-1000" style={{ width: `${(currentStepIdx / (steps.length - 1)) * 100}%` }} />
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
            )}

            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-border">
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase opacity-60">{t("track.recipient")}</p>
                <p className="font-bold">{order.customer_name}</p>
                <p className="text-sm text-muted-foreground">{order.customer_address}</p>
              </div>
                <div className="space-y-2 text-end">
                  <p className="text-xs font-bold uppercase opacity-60">{t("common.total")}</p>
                  <p className="text-2xl font-black text-primary">{money(order.total_amount)}</p>
                </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

const Checkout = ({ sectionId, config, store, cart, slug, onClearCart }: { sectionId: string, config: any, store: any, cart: any[], slug: string, onClearCart: () => void }) => {
    const { t, money, lang } = useStoreText();
    const [formData, setFormData] = useState({ name: "", phone: "", governorate: "", address: "", email: "" });
    const [submitError, setSubmitError] = useState("");
    const paymentMethod = "cod";
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [promoCode, setPromoCode] = useState("");
    const [isValidatingPromo, setIsValidatingPromo] = useState(false);
    const [appliedPromo, setAppliedPromo] = useState<any>(null);
    const [promoError, setPromoError] = useState("");
  
    const offers = normalizeOffers(store?.quantity_offers);
    const subtotal = cart.reduce((acc, item) => acc + discountedUnitPrice(parsePrice(item.price), item.quantity || 1, offers) * (item.quantity || 1), 0);
  
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
          setPromoError(t("checkout.promo_invalid"));
        }
      } catch (error) {
        setPromoError(t("checkout.promo_error"));
      } finally {
        setIsValidatingPromo(false);
      }
    };
  
    const discountAmount = appliedPromo 
      ? (appliedPromo.type === "percentage" 
          ? (subtotal * appliedPromo.value / 100) 
          : appliedPromo.value)
      : 0;
  
    const shippingCost = deliveryFeeFor(Math.max(0, subtotal - discountAmount), store || {});
    const total = Math.max(0, subtotal - discountAmount) + shippingCost;
  
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (cart.length === 0) return;
      setSubmitError("");
      setIsSubmitting(true);
      
      try {
        const response = await fetch("/api/store/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storeId: store.id,
            cart: cart.map(item => ({ productId: item.productId ?? item.id, variantId: item.variantId || null, quantity: item.quantity || 1 })),
            customer: formData,
            appliedPromo,
            paymentMethod,
            slug
          })
        });
        
        const data = await response.json();
        if (data.success) {
          trackStoreEvent("Purchase", { value: total, quantity: cart.reduce((acc, item) => acc + (item.quantity || 1), 0), orderId: data.orderId });
          onClearCart();
          if (data.url) {
            window.parent.postMessage({ type: "OPEN_EXTERNAL_URL", data: { url: data.url } }, "*");
          } else {
            window.parent.postMessage({ type: 'NAVIGATE', page: `merci/${data.orderId}` }, '*');
          }
        } else {
          setSubmitError(orderErrorText(data.code, t));
        }
      } catch (error) {
        setSubmitError(t("express.network"));
      } finally {
        setIsSubmitting(false);
      }
    };
  
    return (
      <section className={`px-4 ${config.animation || 'fade-in'}`} style={getSectionStyle(config)}>
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-8 bg-card p-5 md:p-8 rounded-3xl border border-border shadow-sm">
              <h2 className="text-2xl font-black"><EditableText sectionId={sectionId} field="title" text={config.title || t("checkout.title")} /></h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider opacity-60">{t("checkout.name")}</label>
                    <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-muted border-none p-4 rounded-xl focus:ring-2 ring-primary" placeholder={t("express.name")} autoComplete="name" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider opacity-60">{t("checkout.phone")}</label>
                      <input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-muted border-none p-4 rounded-xl focus:ring-2 ring-primary" placeholder="22 123 456" inputMode="tel" autoComplete="tel" dir="ltr" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider opacity-60">{t("checkout.email")}</label>
                      <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-muted border-none p-4 rounded-xl focus:ring-2 ring-primary" placeholder="email@exemple.com" dir="ltr" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider opacity-60">{t("express.governorate")}</label>
                    <select required value={formData.governorate} onChange={e => setFormData({...formData, governorate: e.target.value})} className="w-full bg-muted border-none p-4 rounded-xl focus:ring-2 ring-primary">
                      <option value="">{t("express.governorate")}</option>
                      {TUNISIAN_GOVERNORATES.map((g) => <option key={g} value={g}>{governorateLabel(g, lang)}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider opacity-60">{t("checkout.address")}</label>
                    <textarea required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-muted border-none p-4 rounded-xl focus:ring-2 ring-primary min-h-[100px]" placeholder={t("express.address")} autoComplete="street-address" />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold uppercase tracking-wider opacity-60 block">{t("checkout.payment")}</label>
                  <div className="p-4 rounded-xl border-2 border-primary bg-primary/5 flex items-center gap-3">
                    <span className="text-2xl">🚚</span>
                    <span className="font-bold text-sm">{t("checkout.cod")}</span>
                  </div>
                </div>

                {submitError && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{submitError}</p>}
                <button disabled={isSubmitting || cart.length === 0} className="w-full bg-primary text-white py-4 rounded-2xl font-black text-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <>✅ {config.buttonText || t("checkout.confirm")}</>}
                </button>
              </form>
            </div>
            <div className="space-y-6">
              <div className="bg-muted/30 p-5 md:p-8 rounded-3xl border border-border">
                <h3 className="font-bold mb-6">{t("cart.title")} ({cart.reduce((acc, item) => acc + (item.quantity || 1), 0)})</h3>
                <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pe-2">
                  {cart.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-white border border-border shrink-0">
                        <img src={item.image} className="w-full h-full object-cover" alt="" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm truncate">{item.title}</h4>
                        {item.variantLabel && <p className="text-xs opacity-60">{item.variantLabel}</p>}
                        <p className="text-xs text-muted-foreground">× {item.quantity || 1}</p>
                      </div>
                      <div className="text-end">
                        <p className="font-bold text-sm">{money(parsePrice(item.price) * (item.quantity || 1))}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="flex justify-between text-sm"><span>{t("common.subtotal")}</span><span className="font-bold">{money(subtotal)}</span></div>
                  
                  {appliedPromo && (
                    <div className="flex justify-between text-sm text-emerald-600 font-bold">
                      <span className="flex items-center gap-1">
                        🏷️ {appliedPromo.code}
                        <button onClick={() => setAppliedPromo(null)} aria-label={t("common.remove")} className="ms-1 text-xs opacity-50 hover:opacity-100">✕</button>
                      </span>
                      <span>-{money(discountAmount)}</span>
                    </div>
                  )}

                  {!appliedPromo && (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input 
                          value={promoCode}
                          onChange={e => setPromoCode(e.target.value.toUpperCase())}
                          className="flex-1 bg-white border border-border px-3 py-2 rounded-lg text-sm"
                          placeholder={t("checkout.promo")}
                          aria-label={t("checkout.promo")}
                        />
                        <button 
                          onClick={(e) => { e.preventDefault(); handleValidatePromo(); }}
                          disabled={isValidatingPromo || !promoCode}
                          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50"
                        >
                          {t("checkout.apply")}
                        </button>
                      </div>
                      {promoError && <p className="text-xs text-red-500">{promoError}</p>}
                    </div>
                  )}

                  <div className="flex justify-between text-sm"><span>{t("common.delivery")}</span>{shippingCost > 0 ? <span className="font-bold">{money(shippingCost)}</span> : <span className="font-bold text-emerald-600">{t("common.free")}</span>}</div>
                  <div className="h-[1px] bg-border my-4" />
                  <div className="flex justify-between text-xl font-black"><span>{t("common.total")}</span><span className="text-primary">{money(total)}</span></div>
                </div>

              </div>
              <div className="p-6 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-xl">🚚</div>
                <p className="text-xs font-medium">
                  {t("checkout.cod")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  };




const ALLOWED_TAGS = new Set(["P", "BR", "STRONG", "B", "EM", "I", "U", "S", "H1", "H2", "H3", "H4", "UL", "OL", "LI", "A", "BLOCKQUOTE", "SPAN", "DIV", "HR", "TABLE", "THEAD", "TBODY", "TR", "TH", "TD"]);

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const sanitizeHtml = (html: string): string => {
  if (!html) return "";
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return escapeHtml(html.replace(/<[^>]*>/g, " "));
  }
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
  const clean = (node: Element) => {
    for (const child of Array.from(node.children)) {
      if (!ALLOWED_TAGS.has(child.tagName)) {
        if (["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "SVG", "MATH", "TEMPLATE"].includes(child.tagName)) {
          child.remove();
        } else {
          clean(child);
          child.replaceWith(...Array.from(child.childNodes));
        }
        continue;
      }
      for (const attr of Array.from(child.attributes)) {
        const name = attr.name.toLowerCase();
        const keep = child.tagName === "A" && name === "href" && /^(https?:|mailto:|tel:|\/|#)/i.test(attr.value.trim());
        if (!keep) child.removeAttribute(attr.name);
      }
      if (child.tagName === "A") {
        child.setAttribute("rel", "noopener noreferrer nofollow");
        child.setAttribute("target", "_blank");
      }
      clean(child);
    }
  };
  const root = doc.body.firstElementChild as Element;
  clean(root);
  return root.innerHTML;
};

const SafeHtml = ({ html, className }: { html: string; className?: string }) => {
  const [clean, setClean] = useState(() => (typeof window === "undefined" ? "" : sanitizeHtml(html)));
  useEffect(() => setClean(sanitizeHtml(html)), [html]);
  return <div className={className} dir="auto" dangerouslySetInnerHTML={{ __html: clean }} />;
};

const GRID_COLS: Record<number, string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
  5: "md:grid-cols-5",
  6: "md:grid-cols-6",
};
const gridCols = (n: any, fallback = 4) => GRID_COLS[Number(n)] || GRID_COLS[fallback];

const Countdown = ({ sectionId, config }: { sectionId: string, config: any }) => {
  const { t } = useStoreText();
  const target = config.endDate || config.targetDate || config.end_date;
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const end = target ? new Date(target).getTime() : NaN;
  const left = now === null || isNaN(end) ? null : Math.max(0, end - now);
  const parts = left === null
    ? [["--", t("countdown.days")], ["--", t("countdown.hours")], ["--", t("countdown.minutes")], ["--", t("countdown.seconds")]]
    : [
        [Math.floor(left / 86400000), t("countdown.days")],
        [Math.floor((left / 3600000) % 24), t("countdown.hours")],
        [Math.floor((left / 60000) % 60), t("countdown.minutes")],
        [Math.floor((left / 1000) % 60), t("countdown.seconds")],
      ].map(([v, l]) => [String(v).padStart(2, "0"), l]);
  return (
    <section className="px-4" style={{ ...getSectionStyle(config), backgroundColor: config.backgroundColor || "#0f172a", color: config.textColor || "#ffffff" }}>
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <EditableText tag="h2" sectionId={sectionId} field="title" text={config.title || t("countdown.title")} className="text-3xl md:text-4xl font-black block" />
        {(config.subtitle || config.message) && <EditableText tag="p" sectionId={sectionId} field="subtitle" text={config.subtitle || config.message} className="text-lg opacity-80 block" />}
        {left === 0 ? (
          <p className="text-xl font-bold">{config.expiredText || t("countdown.expired")}</p>
        ) : (
          <div className="flex justify-center gap-3 md:gap-6" dir="ltr">
            {parts.map(([value, label]) => (
              <div key={label} className="w-16 md:w-24 rounded-2xl bg-white/10 py-4">
                <div className="text-2xl md:text-4xl font-black tabular-nums">{value}</div>
                <div className="text-[10px] md:text-xs uppercase tracking-widest opacity-70 mt-1">{label}</div>
              </div>
            ))}
          </div>
        )}
        {(config.ctaText || config.ctaLink) && left !== 0 && <PreviewButton config={config} />}
      </div>
    </section>
  );
};

const videoEmbedUrl = (url: string): string | null => {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
};

const VideoSection = ({ sectionId, config }: { sectionId: string, config: any }) => {
  const { t } = useStoreText();
  const url = config.videoUrl || config.url || "";
  const embed = videoEmbedUrl(url);
  const direct = !embed && /\.(mp4|webm|mov)(\?|$)/i.test(url);
  const [inBuilder, setInBuilder] = useState(false);
  useEffect(() => setInBuilder(window.parent !== window), []);
  if (!embed && !direct && !inBuilder) return null;
  return (
    <section className="px-4" style={getSectionStyle(config)}>
      <div className="max-w-5xl mx-auto space-y-8">
        {config.title && <EditableText tag="h2" sectionId={sectionId} field="title" text={config.title} className="text-3xl md:text-4xl font-black text-center block" />}
        <div className="relative w-full overflow-hidden rounded-3xl bg-black shadow-2xl" style={{ aspectRatio: config.aspectRatio || "16/9" }}>
          {embed ? (
            <iframe src={embed} className="absolute inset-0 w-full h-full" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={config.title || "video"} />
          ) : direct ? (
            <video src={url} className="absolute inset-0 w-full h-full object-cover" controls playsInline autoPlay={Boolean(config.autoplay)} muted={Boolean(config.autoplay)} />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-white/60 text-sm">{t("video.setup")}</div>
          )}
        </div>
      </div>
    </section>
  );
};

const ContactSection = ({ sectionId, config, store }: { sectionId: string, config: any, store: any }) => {
  const { t } = useStoreText();
  const phone = config.phone || store?.contact_phone || "";
  const email = config.email || store?.contact_email || "";
  const whatsapp = (config.whatsapp || store?.whatsapp_number || phone || "").replace(/[^\d]/g, "");
  const address = config.address || "";
  const [form, setForm] = useState({ name: "", message: "" });
  const send = () => {
    const text = `${form.name ? `${form.name}: ` : ""}${form.message}`;
    if (whatsapp) window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(text)}`, "_blank");
    else if (email) window.location.href = `mailto:${email}?subject=${encodeURIComponent(t("contact.subject"))}&body=${encodeURIComponent(text)}`;
  };
  return (
    <section className="px-4" style={getSectionStyle(config)}>
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12">
        <div className="space-y-6">
          <EditableText tag="h2" sectionId={sectionId} field="title" text={config.title || t("contact.title")} className="text-3xl md:text-4xl font-black block" />
          <EditableText tag="p" sectionId={sectionId} field="subtitle" text={config.subtitle || t("contact.subtitle")} className="text-muted-foreground block" />
          <div className="space-y-3 text-sm">
            {phone && <p><span className="font-bold">{t("contact.phone")} : </span><a href={`tel:${phone}`} dir="ltr" className="hover:text-primary">{phone}</a></p>}
            {email && <p><span className="font-bold">{t("contact.email")} : </span><a href={`mailto:${email}`} className="hover:text-primary">{email}</a></p>}
            {address && <p><span className="font-bold">{t("contact.address")} : </span>{address}</p>}
            {config.hours && <p><span className="font-bold">{t("contact.hours")} : </span>{config.hours}</p>}
          </div>
        </div>
        <div className="space-y-4 rounded-3xl border border-border p-6 bg-card">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t("contact.your_name")} className="w-full rounded-xl border border-border bg-background px-4 py-3" />
          <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder={t("contact.your_message")} rows={5} className="w-full rounded-xl border border-border bg-background px-4 py-3" />
          <button
            onClick={send}
            disabled={!form.message.trim() || (!whatsapp && !email)}
            className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-bold disabled:opacity-50"
          >
            {whatsapp ? t("contact.send_whatsapp") : t("contact.send_email")}
          </button>
          {!whatsapp && !email && <p className="text-xs text-muted-foreground text-center">{t("contact.setup")}</p>}
        </div>
      </div>
    </section>
  );
};

const ImageWithText = ({ sectionId, config }: { sectionId: string, config: any }) => {
  const { t } = useStoreText();
  const imageRight = (config.imagePosition || config.layout) === "right";
  return (
    <section className="px-4" style={getSectionStyle(config)}>
      <div className={`max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center`}>
        <div className={`rounded-3xl overflow-hidden aspect-[4/3] bg-muted ${imageRight ? "md:order-2" : ""}`}>
          {(config.image || config.imageUrl) && <img src={config.image || config.imageUrl} alt={config.title || ""} className="w-full h-full object-cover" />}
        </div>
        <div className="space-y-6">
          <EditableText tag="h2" sectionId={sectionId} field="title" text={config.title || ""} className="text-3xl md:text-4xl font-black block" />
          {config.content ? (
            <SafeHtml html={config.content} className="text-muted-foreground leading-relaxed" />
          ) : (
            <EditableText tag="p" sectionId={sectionId} field="text" text={config.text || config.description || ""} className="text-muted-foreground leading-relaxed block" />
          )}
          {(config.ctaText || config.ctaLink) && <PreviewButton config={config} />}
        </div>
      </div>
    </section>
  );
};

const CtaBanner = ({ sectionId, config }: { sectionId: string, config: any }) => {
  const { t } = useStoreText();
  return (
  <section className="px-4" style={{ ...getSectionStyle({ paddingY: 64, ...config }), backgroundColor: config.backgroundColor || "var(--primary)", color: config.textColor || "#ffffff" }}>
    <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-start">
      <div className="space-y-2">
        <EditableText tag="h2" sectionId={sectionId} field="title" text={config.title || ""} className="text-2xl md:text-4xl font-black block" />
        {(config.description || config.subtitle) && <EditableText tag="p" sectionId={sectionId} field="description" text={config.description || config.subtitle} className="opacity-90 block" />}
      </div>
      <PreviewButton config={config} className="bg-white text-black px-8 py-4 rounded-full font-bold hover:scale-105 transition-all shrink-0">
        {config.ctaText || t("common.learn_more")}
      </PreviewButton>
    </div>
  </section>
  );
};

const StoreCategories = ({ sectionId, config, storeId }: { sectionId: string, config: any, storeId?: string }) => {
  const { t } = useStoreText();
  const [categories, setCategories] = useState<{ name: string; image: string | null; count: number }[]>([]);
  useEffect(() => {
    if (!storeId) return;
    createClient()
      .from("store_products")
      .select("category, images")
      .eq("store_id", storeId)
      .eq("is_active", true)
      .not("category", "is", null)
      .limit(500)
      .then(({ data }) => {
        const map = new Map<string, { name: string; image: string | null; count: number }>();
        for (const p of data || []) {
          const name = String(p.category || "").trim();
          if (!name) continue;
          const entry = map.get(name) || { name, image: Array.isArray(p.images) ? p.images[0] || null : null, count: 0 };
          entry.count += 1;
          map.set(name, entry);
        }
        setCategories([...map.values()].sort((a, b) => b.count - a.count).slice(0, Number(config.limit) || 8));
      });
  }, [storeId, config.limit]);

  if (!categories.length) {
    return typeof window !== "undefined" && window.parent !== window ? (
      <div className="p-10 text-center text-sm text-muted-foreground border-2 border-dashed">{t("categories.setup")}</div>
    ) : null;
  }

  return (
    <section className="px-4" style={getSectionStyle(config)}>
      <div className="max-w-7xl mx-auto">
        {config.title && <EditableText tag="h2" sectionId={sectionId} field="title" text={config.title} className="text-3xl md:text-4xl font-black mb-12 text-center block" />}
        <div className={`grid gap-6 grid-cols-2 ${gridCols(config.gridColumns || config.columns, 3)}`}>
          {categories.map((c) => (
            <button
              key={c.name}
              onClick={() => window.parent.postMessage({ type: "NAVIGATE", page: "shop", category: c.name }, "*")}
              className="group relative overflow-hidden rounded-2xl aspect-square bg-muted text-start"
            >
              {c.image && <img src={c.image} alt={c.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />}
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white">
                <span className="text-xl font-black">{c.name}</span>
                {config.showProductCount !== false && <span className="text-xs opacity-80 mt-1">{t("categories.count", { count: c.count })}</span>}
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

const LIST_FIELDS: Record<string, string> = {
  testimonials: "testimonials",
  faq: "faqs",
  features: "features",
  stats: "stats",
  process_steps: "steps",
  logo_carousel: "logos",
  team: "members",
  collections: "items",
};

const SECTION_ALIASES: Record<string, string> = {
  featured_products: "products",
  product_grid: "products",
  icon_grid: "features",
  benefits: "features",
  brand_logos: "logo_carousel",
  faq_preview: "faq",
  about_preview: "about",
  rich_text: "about",
  categories: "store_categories",
  categories_grid: "store_categories",
  collection_grid: "collections",
  banner: "cta_banner",
};

const normalizeSection = (section: any) => {
  const raw = section.config ?? section.content ?? {};
  const type = SECTION_ALIASES[section.type] || section.type;
  const config: any = { ...raw };
  if (type === "products") {
    config.limit = raw.limit ?? raw.count;
  }
  if (type === "features" && !raw.features && Array.isArray(raw.items)) config.features = raw.items;
  if (type === "faq" && !raw.faqs && Array.isArray(raw.items)) config.faqs = raw.items;
  if (type === "logo_carousel" && !raw.logos && Array.isArray(raw.items)) config.logos = raw.items.map((i: any) => (typeof i === "string" ? i : i.image || i.logo)).filter(Boolean);
  if (type === "about" && !raw.content && (raw.text || raw.description)) config.content = escapeHtml(String(raw.text || raw.description)).replace(/\n/g, "<br/>");
  if (type === "promo_banner" && !raw.text && (raw.title || raw.description)) config.text = [raw.title, raw.description].filter(Boolean).join(" — ");
  if (type === "hero") {
    const variants: Record<string, string> = { bold_statement: "bold", split_screen: "split", video_background: "video", minimalist: "classic", minimalist_luxury: "classic" };
    if (variants[raw.variant]) config.variant = variants[raw.variant];
    if (!raw.title && raw.singleWord) config.title = raw.singleWord;
    if (!raw.backgroundImage && (raw.image || raw.productImage || raw.fallbackImage)) config.backgroundImage = raw.image || raw.productImage || raw.fallbackImage;
  }
  if (type === "countdown") {
    if (!raw.endDate && raw.countdownEndDate) config.endDate = raw.countdownEndDate;
    if (!raw.message && raw.badge) config.message = raw.badge;
  }
  if (type === "testimonials" && !raw.testimonials && Array.isArray(raw.reviews)) {
    config.testimonials = raw.reviews.map((r: any) => ({ name: r.author || r.name, rating: r.rating, text: r.text }));
  }
  if (type === "trust_badges" && !raw.items && Array.isArray(raw.badges)) config.items = raw.badges;
  if (type === "features" && !raw.features && Array.isArray(raw.values)) config.features = raw.values;
  if (type === "stats" && Array.isArray(raw.stats)) {
    config.stats = raw.stats.map((st: any) => ({ ...st, value: typeof st.value === "number" ? `${st.value.toLocaleString("fr-FR")}${st.suffix || ""}` : st.value }));
  }
  if (type === "contact") {
    const info = raw.contactInfo || {};
    config.phone = raw.phone || info.phone;
    config.email = raw.email || info.email;
    config.address = raw.address || info.address;
    config.hours = raw.hours || info.hours;
    config.whatsapp = raw.whatsapp || raw.whatsappNumber;
    for (const key of ["phone", "whatsapp"]) {
      if (config[key] && String(config[key]).replace(/\D/g, "").length < 8) delete config[key];
    }
  }
  if (type === "about" && !raw.image && raw.founderImage) config.image = raw.founderImage;
  if (type === "video" && !raw.title && raw.overlayContent?.title) config.title = raw.overlayContent.title;
  if (type === "collections" && !Array.isArray(raw.items)) return { ...section, type: "store_categories", config };
  if (type === "about" && config.image) return { ...section, type: "image_with_text", config };
  return { ...section, type, config };
};

const SectionRenderer = ({ section, store, onAddToCart, cart, slug, onClearCart, selectedProduct, onSelectProduct }: { section: any, store: any, onAddToCart?: (item: any) => void, cart: any[], slug: string, onClearCart: () => void, selectedProduct?: any, onSelectProduct?: (product: any) => void }) => {
  const { t } = useStoreText();
  if (section.is_visible === false) return null;
  section = normalizeSection(section);
  if (String(section.id || "").startsWith("builtin-")) section = { ...section, config: resolveBuiltin(section.config, t) };
  const listField = LIST_FIELDS[section.type];
  if (listField && typeof window !== "undefined" && window.parent === window) {
    const items = section.config?.[listField];
    if (!Array.isArray(items) || items.length === 0) return null;
  }
  const commonProps = { sectionId: section.id, config: section.config };
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
      case "product_detail": return <ProductDetail {...commonProps} onAddToCart={onAddToCart} selectedProduct={selectedProduct} storeId={store?.id} store={store} />;
        case "products": return <Products {...commonProps} onAddToCart={onAddToCart} storeId={store?.id} onSelectProduct={onSelectProduct} />;
      case "features": return <Features {...commonProps} />;
      case "testimonials": return <Testimonials {...commonProps} />;
      case "faq": return <FAQ {...commonProps} />;
        case "newsletter": return <Newsletter {...commonProps} storeId={store?.id} />;
        case "reviews": return <ReviewsSection {...commonProps} />;
        case "footer": return <Footer {...commonProps} store={store} links={(store?.footerLinks || []).filter((l: any) => l?.label)} />;

        case "recommended_products": return <RecommendedProducts {...commonProps} onAddToCart={onAddToCart} storeId={store?.id} onSelectProduct={onSelectProduct} />;
        case "checkout": return <Checkout {...commonProps} store={store} cart={cart} slug={slug} onClearCart={onClearCart} />;
        case "countdown": return <Countdown {...commonProps} />;
        case "video": return <VideoSection {...commonProps} />;
        case "contact": return <ContactSection {...commonProps} store={store} />;
        case "image_with_text": return <ImageWithText {...commonProps} />;
        case "cta_banner": return <CtaBanner {...commonProps} />;
        case "store_categories": return <StoreCategories {...commonProps} storeId={store?.id} />;


      default: return typeof window !== "undefined" && window.parent !== window ? <div className="p-10 text-center border-2 border-dashed">Section {section.type}</div> : null;
    }
  };
  return <SectionWrapper sectionId={section.id} onAction={handleAction}>{renderSection()}</SectionWrapper>;
};


const BUILT_IN_PAGES: Record<string, any[]> = {
  checkout: [{ id: "builtin-checkout", type: "checkout", config: {} }],
  "product-detail": [{ id: "builtin-product-detail", type: "product_detail", config: {} }],
  shop: [{ id: "builtin-shop", type: "products", config: { title: "@builtin.products", limit: 24, columns: 4 } }],
  home: [
    { id: "builtin-home-hero", type: "hero", is_visible: true, config: { title: "@builtin.welcome", subtitle: "@builtin.discover", variant: "bold" } },
    { id: "builtin-home-products", type: "products", is_visible: true, config: { title: "@builtin.products", limit: 8, columns: 4, source: "store" } },
    {
      id: "builtin-home-trust",
      type: "trust_badges",
      is_visible: true,
      config: {
        layout: "row",
        items: [
          { icon: "Truck", title: "@trust.delivery", description: "@builtin.fast" },
          { icon: "Shield", title: "@trust.cod", description: "@builtin.secure" },
        ],
      },
    },
    { id: "builtin-home-footer", type: "footer", is_visible: true, config: {} },
  ],
};

const resolveBuiltin = (value: any, t: (key: StoreTextKey) => string): any => {
  if (typeof value === "string") return value.startsWith("@") ? t(value.slice(1) as StoreTextKey) : value;
  if (Array.isArray(value)) return value.map((v) => resolveBuiltin(v, t));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolveBuiltin(v, t)]));
  return value;
};

const sectionsForPage = (pageSlug: string, pageList: any[]) => {
  const page = pageList.find((p) => p.slug === pageSlug);
  if (page) return page.sections || [];
  return BUILT_IN_PAGES[pageSlug] ?? null;
};

const WhatsAppButton = ({ store, currentPage, productTitle }: { store: any; currentPage: string; productTitle?: string }) => {
  const { t } = useStoreText();
  const digits = String(store?.whatsapp_number || "").replace(/\D/g, "");
  if (digits.length < 8 || currentPage === "checkout") return null;
  const number = digits.length === 8 ? `216${digits}` : digits;
  const subject = currentPage === "product-detail" && productTitle ? t("whatsapp.about", { title: productTitle }) : "";
  const text = encodeURIComponent(t("whatsapp.hello", { subject }));
  return (
    <a
      href={`https://wa.me/${number}?text=${text}`}
      target="_blank"
      rel="noreferrer"
      aria-label="WhatsApp"
      className={`fixed ${currentPage === "product-detail" ? "bottom-24 md:bottom-5" : "bottom-5"} end-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl transition-transform hover:scale-105`}
    >
      <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current" aria-hidden="true">
        <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.48.71.31 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35zM12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.32l-.34-.2-3.57.94.95-3.48-.22-.36a9.43 9.43 0 1 1 7.99 4.42zm8.02-17.45A11.33 11.33 0 0 0 12.05.7C5.8.7.7 5.78.7 12.04c0 2 .52 3.95 1.52 5.67L.6 23.3l5.73-1.5a11.3 11.3 0 0 0 5.72 1.46h.01c6.25 0 11.34-5.09 11.34-11.34 0-3.03-1.18-5.88-3.33-8.02z" />
      </svg>
    </a>
  );
};

export default function StorePreview({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState<any>(null);
  const [canSeeOffline, setCanSeeOffline] = useState(false);
  const [sections, setSections] = useState<any[]>([]);
  const [pages, setPages] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState("home");
    const [cart, setCart] = useState<any[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const hasReceivedInitialUpdate = useRef(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);

    useEffect(() => {
      const applyLocation = () => {
        const base = storeBasePath(slug, window.location.pathname, window.location.hostname);
        const rest = window.location.pathname.slice(base.length).split("/").filter(Boolean).map(decodeURIComponent).join("/");
        const productMatch = rest.match(/^p\/([^/]+)$/);
        if (productMatch) {
          setSelectedProduct((prev: any) => (prev?.id === productMatch[1] ? prev : { id: productMatch[1] }));
          setCurrentPage("product-detail");
        } else {
          setCurrentPage(rest || "home");
        }
      };
      applyLocation();
      window.addEventListener("popstate", applyLocation);
      return () => window.removeEventListener("popstate", applyLocation);
    }, [slug]);

    useEffect(() => {
      if (window.parent !== window) return;
      const base = storeBasePath(slug, window.location.pathname, window.location.hostname);
      let target = base || "/";
      if (currentPage === "product-detail") {
        if (!selectedProduct?.id) return;
        target = `${base}/p/${selectedProduct.id}`;
      } else if (currentPage && currentPage !== "home") {
        target = `${base}/${currentPage}`;
      }
      if (window.location.pathname !== target) window.history.pushState(null, "", target);
    }, [currentPage, slug, selectedProduct?.id]);

      useEffect(() => {
        const savedCart = localStorage.getItem(`cart_${slug}`);
        if (savedCart) try { setCart(JSON.parse(savedCart)); } catch (e) {}
        
        const isBuilder = window.parent !== window;

        const loadStore = async () => {
          const supabase = createClient();
          const { data: storeData } = await supabase.from("stores").select("*").eq("slug", slug).single();
          if (storeData) {
            setStore(storeData);
            if (storeData.is_active === false) {
              const { data: { user } } = await supabase.auth.getUser();
              setCanSeeOffline(user?.id === storeData.vendor_id);
            }
            
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
              let pagesQuery = supabase.from("store_pages").select("*").eq("store_id", storeData.id);
              if (!isBuilder) pagesQuery = pagesQuery.eq("is_published", true);
              const { data: pagesData } = await pagesQuery.order("sort_order", { ascending: true });
              const { data: navData } = await supabase.from("store_navigation").select("type, items").eq("store_id", storeData.id);
              const navItems = (t: string) => (navData || []).find((n: any) => n.type === t)?.items || [];
              setStore((prev: any) => (prev ? { ...prev, headerLinks: navItems("header"), footerLinks: navItems("footer") } : prev));
              if (pagesData) {
                setPages(pagesData);
                const initial = sectionsForPage(currentPage, pagesData) ?? pagesData[0]?.sections ?? [];
                if (!hasReceivedInitialUpdate.current) setSections(initial);
              }
            }
          }
          setLoading(false);
        }
        loadStore();
      }, [slug]);

    useEffect(() => {
      // Handle page change without reloading everything from DB
      if (pages.length > 0 || BUILT_IN_PAGES[currentPage]) {
        const next = sectionsForPage(currentPage, pages);
        if (next) setSections(next);
      }
    }, [currentPage, pages]);

  useEffect(() => { if (!loading) localStorage.setItem(`cart_${slug}`, JSON.stringify(cart)); }, [cart, slug, loading]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'STORE_UPDATE') {
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
      if (event.data?.type === 'NAVIGATE') {
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

  useEffect(() => {
    if (!store) return;
    loadStoreTracking({ facebook: store.facebook_pixel_id, tiktok: store.tiktok_pixel_id, google: store.google_analytics_id });
  }, [store?.facebook_pixel_id, store?.tiktok_pixel_id, store?.google_analytics_id]);

  useEffect(() => {
    if (!store?.id) return;
    trackStoreEvent("PageView");
  }, [store?.id, currentPage, selectedProduct?.id]);

  if (loading) return <div className="flex h-screen items-center justify-center bg-white"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!store) return <div className="flex h-screen items-center justify-center bg-white"><p>{storeText("fr")("common.not_found")}</p></div>;
  if (store.is_active === false && !canSeeOffline) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-2 bg-white px-6 text-center">
        <p className="text-xl font-bold text-gray-900">{store.name}</p>
        <p className="text-gray-500">{storeText(normalizeStorefrontLanguage(store.storefront_language) === "ar" ? "ar" : "fr")("common.unavailable")}</p>
      </div>
    );
  }

  return (
    <StoreLanguageProvider setting={store.storefront_language} slug={slug}>
    <div className="min-h-screen flex flex-col bg-white relative" style={{
      '--primary': store?.theme_config?.colors?.primary || '#7c3aed',
      '--secondary': store?.theme_config?.colors?.secondary || '#4f46e5',
      '--font-heading': store?.theme_config?.fonts?.heading || store?.theme_config?.typography?.fontHeading || 'Inter',
      '--font-body': store?.theme_config?.fonts?.body || store?.theme_config?.typography?.fontBody || 'Inter',
      '--radius': store?.theme_config?.spacing?.borderRadius === 'full' ? '9999px' : store?.theme_config?.spacing?.borderRadius === 'md' ? '0.5rem' : '0px',
    } as React.CSSProperties}>
      <style jsx global>{`
        :root {
          --primary: ${store?.theme_config?.colors?.primary || '#7c3aed'};
          --primary-foreground: #ffffff;
        }
        h1, h2, h3, h4, h5, h6 {
          font-family: var(--font-heading), 'Cairo', system-ui, sans-serif !important;
        }
        body {
          font-family: var(--font-body), 'Cairo', system-ui, sans-serif !important;
          font-size: ${store?.theme_config?.typography?.scale || 100}%;
        }
        section .grid > *, section .flex > * { min-width: 0; }
        section h1, section h2, section h3 { overflow-wrap: anywhere; }
        input, select, textarea { max-width: 100%; }
        .rounded-3xl { border-radius: calc(var(--radius) * 3) !important; }
        .rounded-2xl { border-radius: calc(var(--radius) * 2) !important; }
        .rounded-xl { border-radius: var(--radius) !important; }
        .bg-primary { background-color: var(--primary) !important; }
        .text-primary { color: var(--primary) !important; }
        .border-primary { border-color: var(--primary) !important; }
      `}</style>
        {(() => {
          const families = [store?.theme_config?.fonts?.heading || store?.theme_config?.typography?.fontHeading, store?.theme_config?.fonts?.body || store?.theme_config?.typography?.fontBody]
            .map((f: any) => String(f || "").replace(/['"]/g, "").split(",")[0].trim())
            .filter((f: string) => f && !/^(inter|system-ui|sans-serif|serif)$/i.test(f));
          const unique = [...new Set([...families, ...(normalizeStorefrontLanguage(store?.storefront_language) === "fr" ? [] : ["Cairo"])])];
          return unique.length ? (
            <link rel="stylesheet" href={`https://fonts.googleapis.com/css2?${unique.map((f) => `family=${encodeURIComponent(f).replace(/%20/g, "+")}:wght@400;700`).join("&")}&display=swap`} />
          ) : null;
        })()}
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
                  if (p.has_variants && !p.variantId) {
                    setSelectedProduct(p);
                    setCurrentPage("product-detail");
                    window.scrollTo({ top: 0, behavior: "instant" });
                    return;
                  }
                  const productId = p.productId ?? p.id;
                  const key = p.variantId ? `${productId}:${p.variantId}` : productId;
                  setCart(prev => {
                    const existing = prev.find(item => item.id === key);
                    if (existing) {
                      return prev.map(item => item.id === key ? { ...item, quantity: (item.quantity || 1) + 1 } : item);
                    }
                    return [...prev, { ...p, id: key, productId, quantity: 1 }];
                  });
                  trackStoreEvent("AddToCart", { contentId: productId, contentName: p.title, value: parsePrice(p.price), quantity: 1 });
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
        <WhatsAppButton store={store} currentPage={currentPage} productTitle={selectedProduct?.title} />
        <CartDrawer 
          offers={normalizeOffers(store?.quantity_offers)}
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
    </StoreLanguageProvider>
  );
}
