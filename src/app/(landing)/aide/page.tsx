"use client";

import { useTranslation } from "@/context/LanguageContext";
import { Search, Book, MessageCircle, PlayCircle } from "lucide-react";

export default function AidePage() {
  const { t, dir } = useTranslation();

  return (
    <div className="bg-white py-16 lg:py-32" dir={dir}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-6">{t("pages.help.title")}</h1>
          <div className="max-w-2xl mx-auto relative">
            <Search className={`absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5`} />
            <input
              type="text"
              placeholder={t("pages.help.search_placeholder")}
              className={`w-full ${dir === 'rtl' ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-4 rounded-2xl border-slate-200 focus:border-teal-500 focus:ring-teal-500 shadow-sm`}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-6">
              <Book className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">{t("pages.help.guides_title")}</h3>
            <p className="text-slate-500 text-sm mb-4">{t("pages.help.guides_desc")}</p>
            <ul className="space-y-3 text-slate-600 text-sm">
              <li><a href="#" className="hover:text-teal-500">{dir === 'rtl' ? "كيفاش نحل أول متجر" : "Créer sa première boutique"}</a></li>
              <li><a href="#" className="hover:text-teal-500">{dir === 'rtl' ? "كيفاش نختار المنتجات" : "Choisir ses produits"}</a></li>
            </ul>
          </div>
            <div className="p-8 rounded-3xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 mb-6">
                <PlayCircle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">{t("pages.help.videos_title")}</h3>
              <p className="text-slate-500 text-sm mb-4">{t("pages.help.videos_desc")}</p>
              <ul className="space-y-3 text-slate-600 text-sm">
                <li><a href="/inscription" className="hover:text-teal-500">{dir === 'rtl' ? "فيديوهات تعليمية" : "Tutoriels Vidéo"}</a></li>
              </ul>
            </div>
          <div className="p-8 rounded-3xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 mb-6">
              <MessageCircle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">{t("pages.help.support_title")}</h3>
            <p className="text-slate-500 text-sm mb-4">{t("pages.help.support_desc")}</p>
            <a href="/contact" className="text-teal-500 font-bold text-sm hover:underline">{t("pages.faq.contact_us")}</a>
          </div>
        </div>
      </div>
    </div>
  );
}
