"use client";

import { useTranslation } from "@/context/LanguageContext";

export default function CGUPage() {
  const { t, dir } = useTranslation();

  return (
    <div className="bg-white py-16 lg:py-32" dir={dir}>
        <div className="max-w-4xl mx-auto px-6 prose prose-slate">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-8">{t("pages.legal_pages.terms.title")}</h1>
          <p className="text-slate-500 mb-8">{t("pages.legal_pages.last_update")}</p>
          
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">{t("pages.legal_pages.terms.s1_title")}</h2>
            <p className="text-slate-600 leading-relaxed">
              {t("pages.legal_pages.terms.s1_desc")}
            </p>
          </section>
  
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">{t("pages.legal_pages.terms.s2_title")}</h2>
            <p className="text-slate-600 leading-relaxed">
              {t("pages.legal_pages.terms.s2_desc")}
            </p>
          </section>
  
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">{t("pages.legal_pages.terms.s3_title")}</h2>
            <p className="text-slate-600 leading-relaxed">
              {t("pages.legal_pages.terms.s3_desc")}
            </p>
          </section>
  
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">{t("footer.links.contact")}</h2>
            <p className="text-slate-600 leading-relaxed">
              {t("pages.legal_pages.mentions.contact")}
            </p>
          </section>
        </div>
    </div>
  );
}
