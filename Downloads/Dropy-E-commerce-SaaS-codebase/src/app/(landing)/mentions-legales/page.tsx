"use client";

import { useTranslation } from "@/context/LanguageContext";

export default function MentionsLegalesPage() {
  const { t, dir } = useTranslation();

  return (
    <div className="bg-white py-16 lg:py-32" dir={dir}>
        <div className="max-w-4xl mx-auto px-6 prose prose-slate">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-8">{t("pages.legal_pages.mentions.title")}</h1>
          
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">{t("pages.legal_pages.mentions.company")}</h2>
            <p className="text-slate-600 leading-relaxed">
              {t("pages.legal_pages.mentions.address")}
            </p>
          </section>
  
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">{t("footer.links.contact")}</h2>
            <p className="text-slate-600 leading-relaxed">
              {t("pages.legal_pages.mentions.contact")}
            </p>
          </section>
        </div>
    </div>
  );
}
