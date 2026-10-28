"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Mail, MessageCircle, MapPin } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";
import { CONTACT_EMAIL, WHATSAPP_URL } from "@/lib/contact";

const SUBJECTS = ["seller", "creator", "supplier", "support", "other"] as const;
const SUBJECT_KEYS: Record<(typeof SUBJECTS)[number], string> = {
  seller: "vendeur",
  creator: "creator",
  supplier: "supplier",
  support: "support",
  other: "other",
};

export default function ContactPage() {
  const { t, dir } = useTranslation();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    setSending(true);
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (response.status === 400) {
        toast.error(t("pages.contact.form_invalid"));
        return;
      }
      if (!response.ok) throw new Error();
      form.reset();
      setSent(true);
    } catch {
      toast.error(t("pages.contact.form_error"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white py-16 lg:py-32" dir={dir}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 mb-6">
              {t("pages.contact.title")} <br />
              <span className="text-teal-500 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">
                {t("pages.contact.subtitle")}
              </span>
            </h1>
            <p className="text-lg text-slate-600 mb-12">
              {t("footer.tagline")}
            </p>

            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 flex-shrink-0">
                  <MessageCircle className="w-6 h-6" />
                </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{t("pages.contact.whatsapp_title")}</h3>
                    <p className="text-slate-500">{t("pages.contact.whatsapp_desc")}</p>
                    <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="text-teal-500 font-medium hover:underline">
                      Démarrer une discussion
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{t("pages.contact.email_title")}</h3>
                    <p className="text-slate-500">{t("pages.contact.email_desc")}</p>
                    <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 font-medium hover:underline">
                      {CONTACT_EMAIL}
                    </a>
                  </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 flex-shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{t("pages.contact.office_title")}</h3>
                  <p className="text-slate-500">{t("pages.contact.office_desc")}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-8 lg:p-12 rounded-[2.5rem] border border-slate-100">
            <h3 className="text-2xl font-bold text-slate-900 mb-8">{t("pages.contact.form_title")}</h3>
            {sent ? (
              <div className="rounded-2xl bg-teal-50 border border-teal-100 p-6 text-teal-800 font-medium">{t("pages.contact.form_sent")}</div>
            ) : (
            <form className="space-y-6" onSubmit={submit}>
              <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">{t("pages.contact.form_firstname")}</label>
                  <input type="text" name="firstName" required maxLength={80} className="w-full rounded-xl border-slate-200 focus:border-teal-500 focus:ring-teal-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">{t("pages.contact.form_lastname")}</label>
                  <input type="text" name="lastName" maxLength={80} className="w-full rounded-xl border-slate-200 focus:border-teal-500 focus:ring-teal-500" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">{t("pages.contact.form_email")}</label>
                <input type="email" name="email" required className="w-full rounded-xl border-slate-200 focus:border-teal-500 focus:ring-teal-500" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">{t("pages.contact.form_subject")}</label>
                <select name="subject" className="w-full rounded-xl border-slate-200 focus:border-teal-500 focus:ring-teal-500">
                  {SUBJECTS.map((key) => (
                    <option key={key} value={key}>{t(`pages.contact.subjects.${SUBJECT_KEYS[key]}`)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">{t("pages.contact.form_message")}</label>
                <textarea name="message" required minLength={10} maxLength={5000} rows={4} className="w-full rounded-xl border-slate-200 focus:border-teal-500 focus:ring-teal-500"></textarea>
              </div>
              <Button type="submit" disabled={sending} className="w-full bg-teal-500 hover:bg-teal-600 text-white h-12 rounded-xl font-bold">
                {sending ? t("pages.contact.form_sending") : t("pages.contact.form_submit")}
              </Button>
            </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
