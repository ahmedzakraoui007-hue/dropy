"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ImagePicker from "@/components/builder/ImagePicker";
import { PICKABLE_ICONS, SectionIcon } from "@/components/storefront/SectionIcon";
import { SECTION_SCHEMAS, SPACING_PX, STYLE_FIELDS, spacingOf, type Field } from "@/lib/section-schemas";
import { useTranslation } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

export type LinkTarget = { value: string; label: string };

type Section = { id: string; type: string; config: Record<string, any> };

const HEX = /^#[0-9a-f]{6}$/i;
const CUSTOM = "__custom__";

function htmlToText(html: string) {
  return String(html || "")
    .replace(/<\/(p|h[1-6]|li|div)>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function textToHtml(text: string) {
  const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escape(p).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

function ColorInput({ value, onChange, resetLabel }: { value?: string; onChange: (v: string | undefined) => void; resetLabel: string }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value && HEX.test(value) ? value : "#ffffff"}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-12 cursor-pointer rounded-md border border-border bg-background p-1"
      />
      <Input
        dir="ltr"
        key={value || "empty"}
        defaultValue={value || ""}
        placeholder="—"
        onBlur={(e) => {
          const v = e.target.value.trim();
          if (!v) onChange(undefined);
          else if (HEX.test(v)) onChange(v);
        }}
        className="h-9 font-mono text-xs"
      />
      {value && (
        <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => onChange(undefined)} aria-label={resetLabel} title={resetLabel}>
          <RotateCcw className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

function LinkInput({ value, onChange, targets, customLabel }: { value?: string; onChange: (v: string) => void; targets: LinkTarget[]; customLabel: string }) {
  const current = value || "";
  const known = targets.some((t) => t.value === current);
  const [custom, setCustom] = useState(!known && current !== "");
  return (
    <div className="space-y-2">
      <Select
        value={custom ? CUSTOM : known ? current : ""}
        onValueChange={(v) => {
          if (v === CUSTOM) {
            setCustom(true);
            return;
          }
          setCustom(false);
          onChange(v);
        }}
      >
        <SelectTrigger className="h-9 w-full">
          <SelectValue placeholder="—" />
        </SelectTrigger>
        <SelectContent>
          {targets.map((t) => (
            <SelectItem key={t.value} value={t.value}>
              {t.label}
            </SelectItem>
          ))}
          <SelectItem value={CUSTOM}>{customLabel}</SelectItem>
        </SelectContent>
      </Select>
      {custom && <Input dir="ltr" value={current} onChange={(e) => onChange(e.target.value)} placeholder="https://" className="h-9" />}
    </div>
  );
}

function IconInput({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  const current = (value || "").toLowerCase();
  return (
    <div className="grid grid-cols-8 gap-1">
      {PICKABLE_ICONS.map((name) => (
        <button
          key={name}
          type="button"
          onClick={() => onChange(name)}
          aria-label={name}
          className={cn(
            "flex h-8 items-center justify-center rounded-md border transition-colors",
            current === name.toLowerCase() ? "border-primary bg-primary/10 text-primary" : "border-transparent hover:bg-muted"
          )}
        >
          <SectionIcon name={name} className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
  targets,
  t,
  id,
}: {
  field: Field;
  value: any;
  onChange: (v: any) => void;
  targets: LinkTarget[];
  t: (key: string) => string;
  id?: string;
}) {
  switch (field.kind) {
    case "text":
    case "url":
      return <Input id={id} dir={field.kind === "url" ? "ltr" : undefined} value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="h-9" />;
    case "textarea":
      return <Textarea id={id} value={value ?? ""} onChange={(e) => onChange(e.target.value)} rows={3} />;
    case "richtext":
      return <Textarea id={id} defaultValue={htmlToText(value)} onChange={(e) => onChange(textToHtml(e.target.value))} rows={10} />;
    case "image":
      return <ImagePicker value={value || ""} onChange={onChange} />;
    case "link":
      return <LinkInput value={value} onChange={onChange} targets={targets} customLabel={t("store_builder.fields.link_custom")} />;
    case "color":
      return <ColorInput value={value} onChange={onChange} resetLabel={t("store_builder.fields.reset")} />;
    case "datetime":
      return <Input id={id} type="datetime-local" dir="ltr" value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="h-9" />;
    case "icon":
      return <IconInput value={value} onChange={onChange} />;
    case "switch":
      return <Switch id={id} checked={Boolean(value)} onCheckedChange={onChange} />;
    case "select":
      return (
        <Select value={value === undefined || value === null ? undefined : String(value)} onValueChange={(v) => onChange(/^\d+$/.test(v) ? Number(v) : v)}>
          <SelectTrigger id={id} className="h-9 w-full">
            <SelectValue placeholder="—" />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((option) => (
              <SelectItem key={option} value={option}>
                {/^\d+$/.test(option) ? option : t(`store_builder.fields.options.${option}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case "number": {
      const numeric = typeof value === "number" ? value : Number(value);
      const current = Number.isFinite(numeric) ? Math.min(field.max, Math.max(field.min, numeric)) : field.min;
      return (
        <div className="flex items-center gap-3">
          <Slider value={[current]} min={field.min} max={field.max} step={field.step ?? 1} onValueChange={([v]) => onChange(v)} className="flex-1" />
          <span className="w-10 text-end text-xs tabular-nums text-muted-foreground">{field.step && field.step < 1 ? current.toFixed(1) : current}</span>
        </div>
      );
    }
    default:
      return null;
  }
}

function ListInput({
  field,
  value,
  onChange,
  targets,
  t,
}: {
  field: Extract<Field, { kind: "list" }>;
  value: any;
  onChange: (v: any[]) => void;
  targets: LinkTarget[];
  t: (key: string) => string;
}) {
  const items: Record<string, any>[] = Array.isArray(value) ? value : [];
  const [open, setOpen] = useState<number | null>(null);

  const update = (index: number, key: string, v: any) => onChange(items.map((item, i) => (i === index ? { ...item, [key]: v } : item)));
  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
    setOpen(target);
  };

  return (
    <div className="space-y-2">
      {items.map((item, index) => {
        const isOpen = open === index;
        const label = String(item[field.titleKey] || "").trim() || `${t("store_builder.fields.item")} ${index + 1}`;
        return (
          <div key={index} className="rounded-lg border">
            <div className="flex items-center gap-1 px-2 py-1.5">
              <button type="button" className="min-w-0 flex-1 truncate text-start text-sm font-medium" onClick={() => setOpen(isOpen ? null : index)}>
                {label}
              </button>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={index === 0} onClick={() => move(index, -1)} aria-label={t("store_builder.fields.move_up")}>
                <ChevronUp className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                disabled={index === items.length - 1}
                onClick={() => move(index, 1)}
                aria-label={t("store_builder.fields.move_down")}
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive"
                onClick={() => {
                  onChange(items.filter((_, i) => i !== index));
                  setOpen(null);
                }}
                aria-label={t("store_builder.fields.remove")}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            {isOpen && (
              <div className="space-y-3 border-t p-3">
                {field.fields.map((sub) => (
                  <div key={sub.key} className="space-y-1.5">
                    <Label htmlFor={`${field.key}-${index}-${sub.key}`} className="text-xs">{t(`store_builder.fields.${sub.key}`)}</Label>
                    <FieldInput id={`${field.key}-${index}-${sub.key}`} field={sub} value={item[sub.key]} onChange={(v) => update(index, sub.key, v)} targets={targets} t={t} />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
      {(!field.max || items.length < field.max) && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full border-dashed"
          onClick={() => {
            onChange([...items, { ...field.item }]);
            setOpen(items.length);
          }}
        >
          <Plus className="me-1 h-4 w-4" />
          {t("store_builder.fields.add_item")}
        </Button>
      )}
    </div>
  );
}

export function SectionSettings({ section, onChange, targets }: { section: Section; onChange: (config: Record<string, any>) => void; targets: LinkTarget[] }) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"content" | "style">("content");
  const config = section.config || {};
  const schema = SECTION_SCHEMAS[section.type] || [{ key: "title", kind: "text" } as Field];
  const set = (key: string, value: any) => {
    const next = { ...config };
    if (value === undefined) delete next[key];
    else next[key] = value;
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 rounded-lg bg-muted p-0.5">
        {(["content", "style"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn("rounded-md py-1.5 text-xs font-semibold", tab === key ? "bg-background shadow-sm" : "text-muted-foreground")}
          >
            {t(`store_builder.fields.tab_${key}`)}
          </button>
        ))}
      </div>

      {tab === "content" && (
        <div className="space-y-4">
          {!SECTION_SCHEMAS[section.type] && <p className="text-xs text-muted-foreground">{t("store_builder.fields.limited")}</p>}
          {schema.map((field) => {
            const hint = t(`store_builder.fields.hints.${section.type}.${field.key}`);
            const showHint = !hint.startsWith("store_builder.");
            return (
              <div key={`${section.id}-${field.key}`} className={cn("space-y-1.5", field.kind === "switch" && "flex items-center justify-between gap-3 space-y-0")}>
                <Label htmlFor={`field-${field.key}`} className="text-xs font-semibold">{t(`store_builder.fields.${field.key}`)}</Label>
                {field.kind === "list" ? (
                  <ListInput field={field} value={config[field.key]} onChange={(v) => set(field.key, v)} targets={targets} t={t} />
                ) : (
                  <FieldInput
                    id={`field-${field.key}`}
                    field={field}
                    value={field.key === "overlay" && typeof config.overlay !== "number" ? 0.4 : config[field.key]}
                    onChange={(v) => set(field.key, v)}
                    targets={targets}
                    t={t}
                  />
                )}
                {showHint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
              </div>
            );
          })}
        </div>
      )}

      {tab === "style" && (
        <div className="space-y-4">
          {STYLE_FIELDS.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <Label className="text-xs font-semibold">{t(`store_builder.fields.${field.key}`)}</Label>
              {field.key === "spacing" ? (
                <FieldInput
                  field={field}
                  value={spacingOf(config.paddingY)}
                  onChange={(v) => set("paddingY", SPACING_PX[v as string] ?? 96)}
                  targets={targets}
                  t={t}
                />
              ) : (
                <FieldInput field={field} value={config[field.key]} onChange={(v) => set(field.key, v)} targets={targets} t={t} />
              )}
            </div>
          ))}
          <p className="text-[11px] text-muted-foreground">{t("store_builder.fields.style_help")}</p>
        </div>
      )}
    </div>
  );
}
