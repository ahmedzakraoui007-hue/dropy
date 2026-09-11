"use client";

import { useTranslation } from "@/context/LanguageContext";
import { Sparkles, Heart, Rocket, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CarrieresPage() {
  const { t, dir } = useTranslation();

  return (
    <div className="bg-white" dir={dir}>
      {/* Hero */}
      <section className="px-6 py-16 lg:py-32 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-teal-500/10 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <h1 className="text-4xl lg:text-6xl font-extrabold mb-8">
            {dir === 'rtl' ? "نبنيو مستقبل" : "Construisons le futur du"} <br />
            <span className="text-teal-400">{dir === 'rtl' ? "التجارة في تونس" : "commerce tunisien"}</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed">
            {dir === 'rtl' 
              ? "دروبي مش مجرد منصة. إحنا فريق خدام يحب يعاون رواد الأعمال التوانسة باش يكبروا مشاريعهم." 
              : "Dropy n'est pas qu'une plateforme. C'est une équipe de passionnés qui travaillent chaque jour pour donner du pouvoir aux entrepreneurs locaux."}
          </p>
          <div className="flex gap-4">
            <Button className="bg-teal-500 hover:bg-teal-600 text-white h-12 px-8 rounded-xl font-bold">
              {dir === 'rtl' ? "شوف الفرص المتوفرة" : "Voir les postes ouverts"}
            </Button>
          </div>
        </div>
      </section>

      {/* Culture */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">{dir === 'rtl' ? "علاش تنضم لدروبي ؟" : "Pourquoi rejoindre Dropy ?"}</h2>
            <p className="text-slate-500">{dir === 'rtl' ? "ثقافة الابتكار، التأثير والتعاون." : "Une culture d'innovation, d'impact et de bienveillance."}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-teal-500 mb-6 shadow-sm">
                <Rocket className="w-6 h-6" />
              </div>
              <h3 className="font-bold mb-2">{dir === 'rtl' ? "تأثير حقيقي" : "Impact Réel"}</h3>
              <p className="text-sm text-slate-500">{dir === 'rtl' ? "خدمتك تبدل بالحق حياة آلاف التوانسة." : "Vos actions changent concrètement la vie de milliers d'entrepreneurs."}</p>
            </div>
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-blue-500 mb-6 shadow-sm">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-bold mb-2">{dir === 'rtl' ? "ابتكار" : "Innovation"}</h3>
              <p className="text-sm text-slate-500">{dir === 'rtl' ? "اخدم بأحدث التكنولوجيا باش تحل مشاكل صعيبة." : "Travaillez avec les dernières technologies pour résoudre des défis complexes."}</p>
            </div>
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-pink-500 mb-6 shadow-sm">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="font-bold mb-2">{dir === 'rtl' ? "جو عائلي" : "Bienveillance"}</h3>
              <p className="text-sm text-slate-500">{dir === 'rtl' ? "بيئة خدمة صحية وين تنجم تنجح وتتعلم." : "Un environnement sain où chacun peut s'exprimer et grandir."}</p>
            </div>
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-orange-500 mb-6 shadow-sm">
                <Coffee className="w-6 h-6" />
              </div>
              <h3 className="font-bold mb-2">{dir === 'rtl' ? "مرونة" : "Flexibilité"}</h3>
              <p className="text-sm text-slate-500">{dir === 'rtl' ? "نركزو على النتيجة وعلى راحة الفريق متاعنا." : "Nous privilégions le résultat et le bien-être de nos collaborateurs."}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Jobs */}
      <section className="py-24 bg-slate-50 border-t border-slate-100 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">{dir === 'rtl' ? "مالقيتش عرض يناسبك ؟" : "Pas de postes ouverts actuellement ?"}</h2>
          <p className="text-slate-600 mb-10 leading-relaxed">
            {dir === 'rtl' 
              ? "ديما نلوجو على مواهب جديدة. ابعتلنا سيرتك الذاتية وقولنا كيفاش تنجم تعاونا." 
              : "Nous sommes toujours à la recherche de talents exceptionnels. Envoyez-nous votre candidature spontanée et racontez-nous comment vous pouvez nous aider."}
          </p>
          <a href="mailto:carrieres@dropy.store">
            <Button variant="outline" className="h-12 px-8 rounded-xl border-slate-200">
              {dir === 'rtl' ? "ترشح بصفة تلقائية" : "Candidature spontanée"}
            </Button>
          </a>
        </div>
      </section>
    </div>
  );
}
