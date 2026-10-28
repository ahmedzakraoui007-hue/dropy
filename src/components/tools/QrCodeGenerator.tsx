"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";
import { ToolShell } from "@/components/tools/ToolShell";
import { QrPreview } from "@/components/tools/QrPreview";

const COLORS = ["#0f172a", "#2E3192", "#00A99D", "#DC2626", "#7C3AED", "#128C7E"];

export default function QrCodeGenerator() {
  const { t } = useTranslation();
  const tr = (key: string) => t(`tools.generateur-qr-code.${key}`);
  const [value, setValue] = useState("");
  const [color, setColor] = useState(COLORS[0]);

  return (
    <ToolShell slug="generateur-qr-code">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-5 rounded-3xl border border-slate-100 p-6 shadow-sm">
          <div className="space-y-2">
            <Label htmlFor="qr-value">{tr("content")}</Label>
            <Input id="qr-value" placeholder="https://maboutique.dropy.store" value={value} onChange={(e) => setValue(e.target.value)} className="h-12" dir="ltr" maxLength={1000} />
            <p className="text-xs text-slate-500">{tr("content_help")}</p>
          </div>
          <div className="space-y-2">
            <Label>{tr("color")}</Label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button key={c} type="button" aria-label={c} onClick={() => setColor(c)} className={cn("h-9 w-9 rounded-full border-4", color === c ? "border-slate-300" : "border-white")} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center rounded-3xl bg-slate-50 p-6">
          {value.trim() ? <QrPreview value={value.trim()} color={color} fileName="qr-code.png" label={tr("download")} /> : <p className="text-sm text-slate-500">{tr("waiting")}</p>}
        </div>
      </div>
    </ToolShell>
  );
}
