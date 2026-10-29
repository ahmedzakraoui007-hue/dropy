"use client";

import { useState } from "react";
import { ArrowRight, BarChart3, CheckCircle2, Languages, Loader2, MessageCircle, Palette, Package, ShieldCheck, Smartphone, Truck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/context/LanguageContext";
import { WHATSAPP_URL } from "@/lib/contact";

const INCLUDED = [
  { key: "brand", icon: Palette },
  { key: "products", icon: Package },
  { key: "cod", icon: Truck },
  { key: "languages", icon: Languages },
  { key: "mobile", icon: Smartphone },
  { key: "dashboard", icon: BarChart3 },
  { key: "protection", icon: ShieldCheck },
];

const FIELDS = [
  { key: "name", required: true, autoComplete: "name" },
  { key: "business", required: true, autoComplete: "organization" },
  { key: "phone", required: true, autoComplete: "tel", inputMode: "tel" as const },
  { key: "email", required: false, autoComplete: "email", type: "email" },
  { key: "city", required: false, autoComplete: "address-level2" },
  { key: "activity", required: false },
];

export default function FreeSiteOffer() {
  const { t, dir } = useTranslation();
  const tr = (key: string) => t(`pages.free_site.${key}`);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setSending(true);
    try {
      const response = await fetch("/api/site-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      if (response.status === 400) {
        toast.error(tr("form_invalid"));
        return;
      }
      if (!response.ok) throw new Error();
      form.reset();
      setSent(true);
    } catch {
      toast.error(tr("form_error"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white" dir={dir}>
      <section className="relative overflow-hidden border-b border-slate-100 bg-slate-50/60 px-6 py-16 lg:py-24">
        <div className="absolute -top-20 end-0 -z-0 h-[420px] w-[420px] rounded-full bg-[#00A99D]/10 blur-[120px]" />
        <div className="relative mx-auto max-w-5xl">
          <p className="mb-5 inline-flex rounded-full bg-[#2E3192] px-4 py-1.5 text-xs font-black uppercase tracking-widest text-white">{tr("badge")}</p>
          <h1 className="max-w-3xl text-4xl font-black leading-[1.1] tracking-tight text-slate-900 md:text-6xl">{tr("title")}</h1>
          <p className="mt-6 max-w-2xl text-lg font-medium text-slate-600">{tr("subtitle")}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="#demande">
              <Button size="lg" className="h-14 rounded-2xl bg-slate-900 px-8 text-base font-black hover:bg-slate-800">
                {tr("cta")}
                <ArrowRight className="ms-2 h-5 w-5 rtl:rotate-180" />
              </Button>
            </a>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="h-14 rounded-2xl border-2 px-8 text-base font-bold">
                <MessageCircle className="me-2 h-5 w-5" />
                {tr("whatsapp")}
              </Button>
            </a>
          </div>
          <p className="mt-6 text-sm font-bold text-slate-500">{tr("price_line")}</p>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-black text-slate-900">{tr("included_title")}</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {INCLUDED.map((item) => (
              <div key={item.key} className="rounded-3xl border border-slate-100 p-6 shadow-sm">
                <item.icon className="mb-4 h-7 w-7 text-[#00A99D]" />
                <p className="font-black text-slate-900">{tr(`included.${item.key}`)}</p>
                <p className="mt-1 text-sm text-slate-500">{tr(`included.${item.key}_desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50/60 px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-black text-slate-900">{tr("steps_title")}</h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <li key={n} className="rounded-3xl bg-white p-6 shadow-sm">
                <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#2E3192] to-[#00A99D] font-black text-white">{n}</span>
                <p className="font-black text-slate-900">{tr(`step${n}`)}</p>
                <p className="mt-1 text-sm text-slate-500">{tr(`step${n}_desc`)}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-6">
            <p className="font-black text-slate-900">{tr("for_who_title")}</p>
            <p className="mt-2 text-slate-600">{tr("for_who")}</p>
          </div>
        </div>
      </section>

      <section id="demande" className="scroll-mt-24 px-6 py-16">
        <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-black text-slate-900">{tr("form_title")}</h2>
            <p className="mt-3 text-slate-600">{tr("form_subtitle")}</p>
            <ul className="mt-6 space-y-3">
              {["promise1", "promise2", "promise3"].map((key) => (
                <li key={key} className="flex items-start gap-3 text-slate-700">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#00A99D]" />
                  {tr(key)}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-slate-100 bg-slate-50 p-6 lg:p-8">
            {sent ? (
              <div className="py-10 text-center">
                <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-[#00A99D]" />
                <p className="text-xl font-black text-slate-900">{tr("sent_title")}</p>
                <p className="mt-2 text-slate-600">{tr("sent_text")}</p>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
                <div className="grid gap-4 sm:grid-cols-2">
                  {FIELDS.map((f) => (
                    <div key={f.key} className="space-y-1.5">
                      <Label htmlFor={`fs-${f.key}`}>{tr(`fields.${f.key}`)}{f.required ? " *" : ""}</Label>
                      <Input
                        id={`fs-${f.key}`}
                        name={f.key}
                        required={f.required}
                        type={f.type || "text"}
                        inputMode={f.inputMode}
                        autoComplete={f.autoComplete}
                        maxLength={150}
                        dir={f.key === "phone" || f.key === "email" ? "ltr" : undefined}
                        className="bg-white"
                      />
                    </div>
                  ))}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fs-links">{tr("fields.links")}</Label>
                  <Input id="fs-links" name="links" maxLength={500} placeholder={tr("fields.links_ph")} className="bg-white" dir="ltr" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fs-message">{tr("fields.message")}</Label>
                  <Textarea id="fs-message" name="message" rows={3} maxLength={2000} placeholder={tr("fields.message_ph")} className="bg-white" />
                </div>
                <Button type="submit" disabled={sending} className="h-12 w-full rounded-xl bg-slate-900 font-black hover:bg-slate-800">
                  {sending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                  {tr("submit")}
                </Button>
                <p className="text-xs text-slate-500">{tr("privacy")}</p>
              </form>
            )}
          </div>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto max-w-3xl space-y-4">
          <h2 className="text-2xl font-black text-slate-900">{t("tools.faq_title")}</h2>
          {[1, 2, 3, 4].map((n) => (
            <details key={n} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-5 open:bg-white">
              <summary className="cursor-pointer font-bold text-slate-900">{tr(`faq${n}_q`)}</summary>
              <p className="mt-3 text-slate-600">{tr(`faq${n}_a`)}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
