"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Clock, CheckCircle2, Facebook, Instagram, Linkedin, ExternalLink, ArrowLeft, Mail, MessageCircle } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/context/LanguageContext";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

export default function WaitingPage() {
  const { t, dir } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" dir={dir}>
      {/* Navbar with Logo */}
      <nav className="p-6 flex justify-between items-center border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <Link href="/" className="hover:opacity-90 transition-opacity">
          <Logo className="h-8 w-auto" />
        </Link>
        <LanguageSwitcher />
      </nav>

      <main className="flex-1 flex items-center justify-center p-6 py-12 lg:py-24">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-3xl w-full bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
        >
          {/* Header Accent */}
          <div className="h-1.5 bg-gradient-to-r from-[#2E3192] to-[#00A99D]" />
          
          <div className="p-8 lg:p-16 text-center">
            {/* Main Page Logo */}
            <div className="mb-12 flex justify-center">
              <Logo className="h-16 w-auto" />
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-sm font-semibold mb-8">
              <CheckCircle2 className="w-4 h-4" />
              {t("pages.pending_page.email_confirmed")}
            </div>

            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6 tracking-tight">
              {t("pages.pending_page.status_title")}
            </h1>
            
            <div className="space-y-8 text-slate-600 mb-12">
              <div className="max-w-xl mx-auto">
                <p className="text-lg leading-relaxed">
                  {t("pages.pending_page.status_desc")}
                </p>
              </div>
              
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex items-start gap-4 text-left">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                  <Clock className="w-5 h-5 text-[#2E3192]" />
                </div>
                <div>
                  <p className="text-slate-900 font-bold mb-1">
                    {t("pages.pending_page.notification_hint")}
                  </p>
                  <p className="text-sm text-slate-500">
                    {t("pages.pending_page.blog_desc")}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
              <a 
                href="https://dropyblog.vercel.app" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-slate-200 hover:border-[#2E3192] hover:shadow-lg transition-all group text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                  <ExternalLink className="w-6 h-6 text-slate-400 group-hover:text-[#2E3192]" />
                </div>
                <div>
                  <span className="block text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">{t("pages.pending_page.waiting_action")}</span>
                  <span className="block font-bold text-slate-900 group-hover:text-[#2E3192]">{t("pages.pending_page.blog_title")}</span>
                </div>
              </a>

              <div className="flex items-center justify-center gap-3 p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <a 
                  href="https://www.facebook.com/profile.php?id=61586447773653" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-xl bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm"
                  aria-label="Facebook"
                >
                  <Facebook className="w-5 h-5" />
                </a>
                <a 
                  href="https://www.instagram.com/dropy__store/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-xl bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-gradient-to-tr hover:from-yellow-400 hover:via-red-500 hover:to-purple-600 hover:text-white hover:border-transparent transition-all shadow-sm"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a 
                  href="https://www.linkedin.com/company/dropystore" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-xl bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-[#0077b5] hover:text-white hover:border-[#0077b5] transition-all shadow-sm"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
                <a 
                  href="https://wa.me/21654302654" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-11 h-11 rounded-xl bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-[#25D366] hover:text-white hover:border-[#25D366] transition-all shadow-sm"
                  aria-label="WhatsApp"
                >
                  <MessageCircle className="w-5 h-5" />
                </a>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full gap-2 rounded-xl py-6 px-8 border-slate-200 hover:bg-slate-50 transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                  {t("pages.pending_page.back_home")}
                </Button>
              </Link>
              <Button asChild className="w-full sm:w-auto bg-[#2E3192] hover:bg-[#1e2060] text-white rounded-xl py-6 px-8 shadow-xl shadow-indigo-100 transition-all active:scale-[0.98]">
                <a href="https://wa.me/21654302654" target="_blank" rel="noopener noreferrer">
                  {t("pages.pending_page.contact_support")}
                </a>
              </Button>
            </div>
          </div>
        </motion.div>
      </main>

      <footer className="p-8 text-center text-slate-400 text-sm border-t border-slate-200 bg-white">
        &copy; 2026 DROPY • Tunis, Tunisie
      </footer>
    </div>
  );
}
