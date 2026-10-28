"use client";

import { useState } from "react";
import { Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/context/LanguageContext";
import { ToolShell } from "@/components/tools/ToolShell";
import { QrPreview } from "@/components/tools/QrPreview";

function normalizePhone(raw: string) {
  const digits = raw.replace(/\D/g, "").replace(/^00/, "");
  if (/^[2-9]\d{7}$/.test(digits)) return `216${digits}`;
  return digits;
}

export default function WhatsappLinkGenerator() {
  const { t } = useTranslation();
  const tr = (key: string) => t(`tools.lien-whatsapp.${key}`);
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const number = normalizePhone(phone);
  const valid = number.length >= 10 && number.length <= 15;
  const link = valid ? `https://wa.me/${number}${message.trim() ? `?text=${encodeURIComponent(message.trim())}` : ""}` : "";

  const copy = () =>
    navigator.clipboard
      .writeText(link)
      .then(() => toast.success(tr("copied")))
      .catch(() => toast.error(tr("copy_failed")));

  return (
    <ToolShell slug="lien-whatsapp">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-5 rounded-3xl border border-slate-100 p-6 shadow-sm">
          <div className="space-y-2">
            <Label htmlFor="phone">{tr("phone")}</Label>
            <Input id="phone" inputMode="tel" placeholder="22 123 456" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-12 text-lg" dir="ltr" />
            <p className="text-xs text-slate-500">{tr("phone_help")}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">{tr("message")}</Label>
            <Textarea id="message" rows={4} placeholder={tr("message_ph")} value={message} onChange={(e) => setMessage(e.target.value)} />
          </div>
        </div>
        <div className="space-y-5 rounded-3xl bg-slate-50 p-6">
          {!valid ? (
            <p className="text-sm text-slate-500">{tr("waiting")}</p>
          ) : (
            <>
              <div className="space-y-2">
                <p className="text-sm font-black uppercase tracking-widest text-slate-400">{tr("your_link")}</p>
                <code className="block break-all rounded-xl bg-white p-3 text-sm" dir="ltr">{link}</code>
                <div className="flex gap-2">
                  <Button onClick={copy} className="flex-1 rounded-xl"><Copy className="me-2 h-4 w-4" />{tr("copy")}</Button>
                  <Button asChild variant="outline" className="rounded-xl">
                    <a href={link} target="_blank" rel="noopener noreferrer" aria-label={tr("test")}><ExternalLink className="h-4 w-4" /></a>
                  </Button>
                </div>
              </div>
              <QrPreview value={link} color="#128C7E" fileName="qr-whatsapp.png" label={tr("download_qr")} />
            </>
          )}
        </div>
      </div>
    </ToolShell>
  );
}
