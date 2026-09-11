"use client";

import { Button } from "@/components/ui/button";
import { Mail, MessageCircle, Phone, MapPin } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

export default function ContactPage() {
  const { t, dir } = useTranslation();

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
                    <a href="https://wa.me/21654302654" className="text-teal-500 font-medium hover:underline">
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
                    <a href="mailto:ahmed@dropy.store" className="text-blue-600 font-medium hover:underline">
                      ahmed@dropy.store
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
            <form className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">{t("pages.contact.form_firstname")}</label>
                  <input type="text" className="w-full rounded-xl border-slate-200 focus:border-teal-500 focus:ring-teal-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">{t("pages.contact.form_lastname")}</label>
                  <input type="text" className="w-full rounded-xl border-slate-200 focus:border-teal-500 focus:ring-teal-500" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">{t("pages.contact.form_email")}</label>
                <input type="email" className="w-full rounded-xl border-slate-200 focus:border-teal-500 focus:ring-teal-500" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">{t("pages.contact.form_subject")}</label>
                <select className="w-full rounded-xl border-slate-200 focus:border-teal-500 focus:ring-teal-500">
                  <option>{t("pages.contact.subjects.vendeur")}</option>
                  <option>{t("pages.contact.subjects.creator")}</option>
                  <option>{t("pages.contact.subjects.supplier")}</option>
                  <option>{t("pages.contact.subjects.support")}</option>
                  <option>{t("pages.contact.subjects.other")}</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">{t("pages.contact.form_message")}</label>
                <textarea rows={4} className="w-full rounded-xl border-slate-200 focus:border-teal-500 focus:ring-teal-500"></textarea>
              </div>
              <Button className="w-full bg-teal-500 hover:bg-teal-600 text-white h-12 rounded-xl font-bold">
                {t("pages.contact.form_submit")}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
