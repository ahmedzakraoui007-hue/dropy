"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SECTION_CATEGORIES, SECTION_LIBRARY, type SectionCategory } from "@/lib/builder-sections";
import { useTranslation } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (type: string) => void;
};

export function AddSectionDialog({ open, onOpenChange, onAdd }: Props) {
  const { t } = useTranslation();
  const [category, setCategory] = useState<SectionCategory | "all">("all");
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const items = SECTION_LIBRARY.filter((s) => {
    if (category !== "all" && s.category !== category) return false;
    if (!q) return true;
    return `${t(`store_builder.sections.${s.id}.name`)} ${t(`store_builder.sections.${s.id}.desc`)}`.toLowerCase().includes(q);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 gap-0 max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="p-5 pb-3 space-y-1 text-start">
          <DialogTitle>{t("store_builder.editor.add_section.title")}</DialogTitle>
          <DialogDescription>{t("store_builder.editor.add_section.subtitle")}</DialogDescription>
        </DialogHeader>
        <div className="px-5 pb-3 space-y-3 border-b">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("store_builder.editor.add_section.search")}
              className="ps-9"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
            {(["all", ...SECTION_CATEGORIES] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={cn(
                  "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                  category === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {t(`store_builder.editor.add_section.categories.${c}`)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  onAdd(s.id);
                  onOpenChange(false);
                }}
                className="flex items-start gap-3 rounded-xl border border-border p-3 text-start transition-all hover:border-primary hover:bg-primary/5 hover:shadow-sm"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <s.icon className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{t(`store_builder.sections.${s.id}.name`)}</span>
                  <span className="block text-xs text-muted-foreground leading-snug">{t(`store_builder.sections.${s.id}.desc`)}</span>
                </span>
              </button>
            ))}
          </div>
          {items.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">{t("store_builder.editor.add_section.empty")}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
