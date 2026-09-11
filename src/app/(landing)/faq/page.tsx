"use client";

import { useTranslation } from "@/context/LanguageContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQPage() {
  const { t, dir } = useTranslation();

  const faqs = [
    {
      question: t("pages.faq.q1"),
      answer: t("pages.faq.a1"),
    },
    {
      question: t("pages.faq.q2"),
      answer: t("pages.faq.a2"),
    },
    {
      question: t("pages.faq.q3"),
      answer: t("pages.faq.a3"),
    },
  ];

  return (
    <div className="bg-white py-16 lg:py-32" dir={dir}>
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-6">{t("pages.faq.title")}</h1>
          <p className="text-lg text-slate-600">
            {t("pages.faq.subtitle")}
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-4">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border rounded-2xl px-6 border-slate-100">
              <AccordionTrigger className="text-left font-bold text-slate-900 hover:text-teal-500 hover:no-underline py-6">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 pb-6 leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-20 p-8 rounded-3xl bg-blue-50 border border-blue-100 text-center">
          <h3 className="text-xl font-bold text-slate-900 mb-4">{t("pages.faq.more_questions")}</h3>
          <p className="text-slate-600 mb-6">
            {t("pages.contact.subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/contact" className="w-full sm:w-auto">
              <button className="w-full px-8 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 hover:bg-slate-50 transition-colors">
                {t("pages.faq.contact_us")}
              </button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
