import type { Theme } from "@/types/themes";
import { premiumHomeSections } from "@/lib/themes/premium";
import { firstFont } from "@/lib/theme-look";

type Lang = "fr" | "ar";

const small = (url?: string, width = 500) => (url ? url.replace(/w=\d+/, `w=${width}`) : "");

export function MiniStore({ theme, lang, scroll = false }: { theme: Theme; lang: Lang; scroll?: boolean }) {
  const sections = premiumHomeSections(theme.id, lang) || [];
  const find = (type: string) => sections.find((s) => s.type === type)?.config as Record<string, any> | undefined;
  const hero = find("hero") || {};
  const showcase = find("showcase_3d");
  const marquee = find("marquee");
  const statement = find("big_statement");
  const items: { image: string; title?: string }[] = (showcase?.items as any[]) || [];
  const c = theme.colors;
  const heading = firstFont(theme.typography.headingFont);
  const strip = marquee?.items?.map((i: any) => i.text).join("  ✦  ") || "";

  return (
    <div className="h-full w-full overflow-hidden" style={{ background: c.background, color: c.text }} dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className={scroll ? "dropy-screen-scroll" : ""}>
        <div className="flex items-center justify-between px-4 pb-2 pt-8">
          <span className="text-[15px] font-bold" style={{ fontFamily: heading }}>{theme.name}</span>
          <span className="flex flex-col gap-[3px]">
            <i className="block h-[2px] w-4 rounded" style={{ background: c.text }} />
            <i className="block h-[2px] w-4 rounded" style={{ background: c.text }} />
          </span>
        </div>
        {strip && (
          <div className="overflow-hidden whitespace-nowrap py-1.5 text-[8px] font-bold uppercase tracking-[0.2em]" style={{ background: marquee?.backgroundColor || c.text, color: marquee?.textColor || c.background }}>
            {strip}
          </div>
        )}
        <div className="relative aspect-[4/5] overflow-hidden">
          <img src={small(hero.backgroundImage, 600)} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute inset-x-4 bottom-4 text-center text-white">
            {hero.badge && <p className="mb-1 text-[7px] font-bold uppercase tracking-[0.25em] opacity-80">{hero.badge}</p>}
            <p className="text-[22px] font-bold leading-[1.05]" style={{ fontFamily: heading }}>{hero.title}</p>
            <span className="mt-3 inline-block rounded-full bg-white px-3 py-1.5 text-[8px] font-bold text-black">{hero.ctaText}</span>
          </div>
        </div>
        {statement?.text && (
          <p
            className="px-4 py-6 text-center text-[17px] font-bold leading-tight"
            style={{ fontFamily: heading, background: statement.backgroundColor || undefined }}
          >
            <span style={{ backgroundImage: `linear-gradient(100deg, ${c.primary}, ${c.secondary})`, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>{statement.text}</span>
          </p>
        )}
        <div className="grid grid-cols-2 gap-2 px-3 pb-6">
          {items.slice(0, 4).map((item, i) => (
            <div key={i}>
              <div className="aspect-[4/5] overflow-hidden" style={{ borderRadius: theme.layout.borderRadius }}>
                <img src={small(item.image, 300)} alt="" className="h-full w-full object-cover" loading="lazy" />
              </div>
              <p className="mt-1 truncate text-[9px] font-semibold">{item.title}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PhoneFrame({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`relative aspect-[9/19] rounded-[2.6rem] bg-[#0A0A0F] p-[9px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] ring-1 ring-white/10 ${className}`} style={style}>
      <div className="relative h-full w-full overflow-hidden rounded-[2.1rem] bg-white">
        {children}
        <div className="absolute left-1/2 top-2 z-10 h-[18px] w-[70px] -translate-x-1/2 rounded-full bg-[#0A0A0F]" />
      </div>
    </div>
  );
}
