"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X, ArrowRight, Languages } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/ui/logo";
import { useTranslation } from "@/context/LanguageContext";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

export default function LandingHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { t, locale, setLocale, dir } = useTranslation();

  const navLinks = [
    { name: t("nav.vendeurs"), href: "/vendeurs" },
    { name: t("nav.creators"), href: "/createurs" },
    { name: t("nav.suppliers"), href: "/fournisseurs" },
    { name: t("nav.pricing"), href: "/tarifs" },
    { name: t("nav.blog"), href: "https://dropyblog.vercel.app" },
  ];

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!mounted) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 py-5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between px-6 lg:px-8 h-16 lg:h-20 rounded-[2rem] border border-transparent bg-transparent" />
        </div>
      </nav>
    );
  }

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "py-3" : "py-5"}`} dir={dir}>
      <div className="max-w-7xl mx-auto px-6">
        <div className={`relative flex items-center justify-between px-6 lg:px-8 h-16 lg:h-20 transition-all duration-500 rounded-[2rem] border ${scrolled ? "bg-white/80 backdrop-blur-xl border-slate-200 shadow-xl shadow-slate-200/20" : "bg-transparent border-transparent shadow-none"}`}>
          <div className="flex items-center gap-10">
            <Link href="/" className="flex items-center gap-3 group">
              <Logo className="h-16 w-auto group-hover:scale-105 transition-transform duration-300" />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-sm font-bold text-slate-600 hover:text-[#2E3192] transition-colors relative group"
                >
                  {link.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#2E3192] transition-all group-hover:w-full" />
                </Link>
              ))}
            </div>
          </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3">
                <LanguageSwitcher />

                <Link href="/login">

                <Button variant="ghost" className="text-slate-700 font-bold hover:bg-slate-50 rounded-xl px-5">
                  {t("nav.login")}
                </Button>
              </Link>
              <Link href="/inscription">
                <Button className="bg-gradient-to-r from-[#2E3192] to-[#00A99D] text-white hover:opacity-90 font-black rounded-xl px-6 h-12 shadow-lg shadow-[#2E3192]/20 border-none group transition-all hover:scale-105">
                  {t("nav.signup")}
                  <ArrowRight className={`ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform ${locale === 'ar' ? 'rotate-180' : ''}`} />
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-900 hover:bg-slate-200 transition-all"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-6 top-24 z-50 lg:hidden"
          >
            <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-8 overflow-hidden">
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <span className="text-sm font-bold text-slate-500">Langue / اللغة</span>
                  <div className="flex gap-2">
                    <Button 
                      variant={locale === 'fr' ? 'default' : 'outline'} 
                      size="sm" 
                      onClick={() => setLocale('fr')}
                      className="rounded-lg h-8"
                    >
                      FR
                    </Button>
                    <Button 
                      variant={locale === 'ar' ? 'default' : 'outline'} 
                      size="sm" 
                      onClick={() => setLocale('ar')}
                      className="rounded-lg h-8 font-bold"
                    >
                      عربي
                    </Button>
                  </div>
                </div>
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="block text-2xl font-black text-slate-900 hover:text-[#2E3192] transition-colors"
                  >
                    {link.name}
                  </Link>
                ))}
                <div className="pt-6 grid grid-cols-2 gap-4 border-t border-slate-100">
                  <Link href="/login" className="w-full" onClick={() => setIsOpen(false)}>
                    <Button variant="outline" className="w-full h-14 rounded-xl font-bold border-slate-200 text-slate-700">
                      {t("nav.login")}
                    </Button>
                  </Link>
                  <Link href="/inscription" className="w-full" onClick={() => setIsOpen(false)}>
                    <Button className="w-full h-14 rounded-xl font-black bg-gradient-to-r from-[#2E3192] to-[#00A99D] text-white">
                      {t("nav.signup")}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
