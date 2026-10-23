"use client";

import { Plus, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/context/LanguageContext";
import { MAX_FAQ, MAX_HIGHLIGHTS, discountPercent, type SalesContent } from "@/lib/product-sales";

type Props = {
  price: string;
  compareAt: string;
  onCompareAtChange: (value: string) => void;
  content: SalesContent;
  onChange: (content: SalesContent) => void;
};

export function ProductSalesFields({ price, compareAt, onCompareAtChange, content, onChange }: Props) {
  const { t } = useTranslation();
  const tr = (key: string) => t(`seller_app.products.sales.${key}`);
  const percent = discountPercent(price.replace(",", "."), compareAt.replace(",", "."));
  const compareInvalid = compareAt.trim() !== "" && percent === 0;

  const setHighlight = (index: number, value: string) => onChange({ ...content, highlights: content.highlights.map((h, i) => (i === index ? value : h)) });
  const setFaq = (index: number, key: "question" | "answer", value: string) =>
    onChange({ ...content, faq: content.faq.map((f, i) => (i === index ? { ...f, [key]: value } : f)) });

  return (
    <div className="space-y-5 border-t pt-5">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <p className="text-base font-semibold">{tr("title")}</p>
          <p className="text-xs text-gray-500">{tr("subtitle")}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="compare-at">{tr("compare_at")}</Label>
          <Input id="compare-at" type="number" inputMode="decimal" min={0} step="0.001" placeholder="0.000" value={compareAt} onChange={(e) => onCompareAtChange(e.target.value)} />
          <p className={`text-xs ${compareInvalid ? "text-red-600" : "text-gray-500"}`}>
            {compareInvalid ? tr("compare_invalid") : percent > 0 ? tr("compare_shows").replace("{percent}", String(percent)) : tr("compare_help")}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="sales-badge">{tr("badge")}</Label>
          <Input id="sales-badge" maxLength={40} placeholder={tr("badge_ph")} value={content.badge} onChange={(e) => onChange({ ...content, badge: e.target.value })} />
          <p className="text-xs text-gray-500">{tr("badge_help")}</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label>{tr("highlights")}</Label>
        <p className="text-xs text-gray-500">{tr("highlights_help")}</p>
        {content.highlights.map((value, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={value}
              maxLength={140}
              placeholder={tr("highlight_ph")}
              aria-label={`${tr("highlights")} ${index + 1}`}
              onChange={(e) => setHighlight(index, e.target.value)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 text-red-500"
              aria-label={tr("remove")}
              onClick={() => onChange({ ...content, highlights: content.highlights.filter((_, i) => i !== index) })}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {content.highlights.length < MAX_HIGHLIGHTS && (
          <Button type="button" variant="outline" size="sm" className="border-dashed" onClick={() => onChange({ ...content, highlights: [...content.highlights, ""] })}>
            <Plus className="me-1 h-4 w-4" />
            {tr("add_highlight")}
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <Label>{tr("faq")}</Label>
        <p className="text-xs text-gray-500">{tr("faq_help")}</p>
        {content.faq.map((item, index) => (
          <div key={index} className="space-y-2 rounded-xl border p-3">
            <div className="flex gap-2">
              <Input value={item.question} maxLength={200} placeholder={tr("question_ph")} aria-label={tr("question_ph")} onChange={(e) => setFaq(index, "question", e.target.value)} />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-red-500"
                aria-label={tr("remove")}
                onClick={() => onChange({ ...content, faq: content.faq.filter((_, i) => i !== index) })}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <Textarea value={item.answer} maxLength={1000} rows={2} placeholder={tr("answer_ph")} aria-label={tr("answer_ph")} onChange={(e) => setFaq(index, "answer", e.target.value)} />
          </div>
        ))}
        {content.faq.length < MAX_FAQ && (
          <Button type="button" variant="outline" size="sm" className="border-dashed" onClick={() => onChange({ ...content, faq: [...content.faq, { question: "", answer: "" }] })}>
            <Plus className="me-1 h-4 w-4" />
            {tr("add_faq")}
          </Button>
        )}
      </div>
    </div>
  );
}
