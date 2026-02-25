"use client";

import { Heart, Target, ShieldCheck, Users } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";

export default function AboutPage() {
  const { t, dir } = useTranslation();

  return (
    <div className="bg-white" dir={dir}>
      {/* Vision */}
      <section className="px-6 py-16 lg:py-32 bg-slate-50">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 mb-8">
            {t("pages.about.title")} <br className="hidden lg:block" />
            <span className="text-teal-500">{t("pages.about.vision")}</span>
          </h1>
          <p className="text-xl text-slate-600 leading-relaxed mb-12">
            {t("pages.about.vision_desc")}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            <div className="p-8 bg-white rounded-3xl shadow-sm border border-slate-100">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-6">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">{t("pages.about.mission_title")}</h3>
              <p className="text-slate-500">{t("pages.about.mission_desc")}</p>
            </div>
            <div className="p-8 bg-white rounded-3xl shadow-sm border border-slate-100">
              <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 mb-6">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">{t("pages.about.values_title")}</h3>
              <p className="text-slate-500">{t("pages.about.values_desc")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* History */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">{t("pages.about.history_title")}</h2>
          <div className="space-y-12">
            <div className="flex gap-6 lg:gap-12">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-900 text-xl border-4 border-white shadow-sm">
                1
              </div>
              <div>
                <h3 className="text-xl font-bold mb-3">{t("pages.about.step1_title")}</h3>
                <p className="text-slate-500 leading-relaxed">
                  {t("pages.about.step1_desc")}
                </p>
              </div>
            </div>
            <div className="flex gap-6 lg:gap-12">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-900 text-xl border-4 border-white shadow-sm">
                2
              </div>
              <div>
                <h3 className="text-xl font-bold mb-3">{t("pages.about.step2_title")}</h3>
                <p className="text-slate-500 leading-relaxed">
                  {t("pages.about.step2_desc")}
                </p>
              </div>
            </div>
            <div className="flex gap-6 lg:gap-12">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-900 text-xl border-4 border-white shadow-sm">
                3
              </div>
              <div>
                <h3 className="text-xl font-bold mb-3">{t("pages.about.step3_title")}</h3>
                <p className="text-slate-500 leading-relaxed">
                  {t("pages.about.step3_desc")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
