"use client";

import { Check } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { themeHeroImage, themes } from "@/lib/themes";
import type { Theme } from "@/types/themes";
import { useTranslation } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

export const EDITOR_FONTS = [
  "Inter",
  "Poppins",
  "Montserrat",
  "DM Sans",
  "Outfit",
  "Space Grotesk",
  "Playfair Display",
  "Cormorant Garamond",
  "Lora",
  "Cairo",
  "Tajawal",
  "Almarai",
];

const COLOR_PRESETS = ["#111827", "#7c3aed", "#2563eb", "#0d9488", "#16a34a", "#ca8a04", "#ea580c", "#e11d48", "#db2777", "#9f1239"];

const HEX = /^#[0-9a-f]{6}$/i;

export function firstFont(value?: string) {
  return (value || "").replace(/['"]/g, "").split(",")[0].trim() || "Inter";
}

export function themeLook(theme: Theme, current: Record<string, any>) {
  const radius = parseFloat(theme.layout?.borderRadius || "8");
  const heading = firstFont(theme.typography?.headingFont);
  const body = firstFont(theme.typography?.bodyFont);
  return {
    ...current,
    theme_id: theme.id,
    colors: {
      ...(current.colors || {}),
      primary: theme.colors.primary,
      secondary: theme.colors.secondary,
      accent: theme.colors.accent,
      background: theme.colors.background,
      text: theme.colors.text,
    },
    typography: { ...(current.typography || {}), fontHeading: heading, fontBody: body },
    fonts: { heading, body },
    spacing: { ...(current.spacing || {}), borderRadius: radius <= 0 ? "none" : radius >= 999 ? "full" : "md" },
  };
}

type Props = {
  themeConfig: Record<string, any>;
  onChange: (next: Record<string, any>) => void;
  onPickTheme: (theme: Theme) => void;
};

export function StylePanel({ themeConfig, onChange, onPickTheme }: Props) {
  const { t } = useTranslation();
  const tr = (key: string) => t(`store_builder.editor.style.${key}`);
  const primary = themeConfig?.colors?.primary || "#7c3aed";
  const heading = themeConfig?.fonts?.heading || themeConfig?.typography?.fontHeading || "Inter";
  const body = themeConfig?.fonts?.body || themeConfig?.typography?.fontBody || "Inter";
  const radius = themeConfig?.spacing?.borderRadius || "md";
  const scale = Number(themeConfig?.typography?.scale) || 100;

  const setPrimary = (value: string) => onChange({ ...themeConfig, colors: { ...(themeConfig.colors || {}), primary: value } });
  const setFont = (kind: "heading" | "body", value: string) =>
    onChange({
      ...themeConfig,
      fonts: { heading, body, [kind]: value },
      typography: { ...(themeConfig.typography || {}), [kind === "heading" ? "fontHeading" : "fontBody"]: value },
    });

  return (
    <div className="p-4 space-y-8">
      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-bold">{tr("themes")}</h3>
          <p className="text-xs text-muted-foreground">{tr("themes_help")}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2">
          {themes.map((theme) => {
            const active = themeConfig?.theme_id === theme.id;
            const image = themeHeroImage(theme, 400);
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => onPickTheme(theme)}
                className={cn(
                  "group relative overflow-hidden rounded-xl border text-start transition-all hover:shadow-md",
                  active ? "border-primary ring-2 ring-primary/30" : "border-border"
                )}
              >
                <div className="relative aspect-[4/3] bg-muted">
                  {image && <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <span
                    className="absolute bottom-2 start-2 end-2 text-white text-sm font-bold leading-tight truncate"
                    style={{ fontFamily: firstFont(theme.typography?.headingFont) }}
                  >
                    {t(`store_builder.themes.${theme.id}.name`)}
                  </span>
                  {active && (
                    <span className="absolute top-2 end-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-primary shadow">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 px-2 py-1.5">
                  {[theme.colors.primary, theme.colors.secondary, theme.colors.accent].map((color, i) => (
                    <span key={i} className="h-3 w-3 rounded-full border border-black/10" style={{ backgroundColor: color }} />
                  ))}
                  <span className="ms-1 truncate text-[10px] text-muted-foreground">{t(`store_builder.themes.${theme.id}.niche`)}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-bold">{tr("main_color")}</h3>
        <div className="flex flex-wrap gap-2">
          {COLOR_PRESETS.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={color}
              onClick={() => setPrimary(color)}
              className={cn(
                "h-8 w-8 rounded-full border-2 transition-transform hover:scale-110",
                primary.toLowerCase() === color ? "border-foreground" : "border-transparent"
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="color"
            aria-label={tr("main_color")}
            value={HEX.test(primary) ? primary : "#7c3aed"}
            onChange={(e) => setPrimary(e.target.value)}
            className="h-9 w-12 cursor-pointer rounded-md border border-border bg-background p-1"
          />
          <Input
            dir="ltr"
            defaultValue={primary}
            key={primary}
            onBlur={(e) => HEX.test(e.target.value.trim()) && setPrimary(e.target.value.trim())}
            className="h-9 font-mono text-xs"
          />
        </div>
        <p className="text-xs text-muted-foreground">{tr("main_color_help")}</p>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-bold">{tr("fonts")}</h3>
        {(["heading", "body"] as const).map((kind) => (
          <div key={kind} className="space-y-1.5">
            <Label className="text-xs">{tr(kind === "heading" ? "font_heading" : "font_body")}</Label>
            <Select value={kind === "heading" ? heading : body} onValueChange={(value) => setFont(kind, value)}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[...new Set([...(EDITOR_FONTS), kind === "heading" ? heading : body])].map((font) => (
                  <SelectItem key={font} value={font}>
                    <span style={{ fontFamily: font }}>{font}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
        {(() => {
          const families = [...new Set([heading, body, ...EDITOR_FONTS])].filter((f) => f !== "Inter");
          return (
            <link
              rel="stylesheet"
              href={`https://fonts.googleapis.com/css2?${families.map((f) => `family=${f.replace(/ /g, "+")}:wght@400;700`).join("&")}&display=swap`}
            />
          );
        })()}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-bold">{tr("corners")}</h3>
        <div className="grid grid-cols-3 gap-2">
          {(["none", "md", "full"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange({ ...themeConfig, spacing: { ...(themeConfig.spacing || {}), borderRadius: value } })}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl border p-2 text-[11px] font-medium transition-colors",
                radius === value ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-muted"
              )}
            >
              <span
                className="h-6 w-10 border-2 border-current"
                style={{ borderRadius: value === "none" ? 0 : value === "md" ? 6 : 999 }}
              />
              {tr(`corners_${value}`)}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold">{tr("text_size")}</h3>
          <span className="text-xs text-muted-foreground">{scale}%</span>
        </div>
        <Slider
          value={[scale]}
          min={85}
          max={115}
          step={5}
          onValueChange={([value]) => onChange({ ...themeConfig, typography: { ...(themeConfig.typography || {}), scale: value } })}
        />
      </section>
    </div>
  );
}
