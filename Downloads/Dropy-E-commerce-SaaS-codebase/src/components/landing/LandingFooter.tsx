"use client";

import Link from "next/link";
import { Mail, Facebook, Instagram, Linkedin, MessageCircle, Send, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { useTranslation } from "@/context/LanguageContext";
import { toast } from "sonner";

export default function LandingFooter() {
  const { t, dir } = useTranslation();

  const footerLinks = {
    platform: [
      { name: t("footer.links.vendeurs"), href: "/vendeurs" },
      { name: t("footer.links.creators"), href: "/createurs" },
      { name: t("footer.links.suppliers"), href: "/fournisseurs" },
      { name: t("footer.links.pricing"), href: "/tarifs" },
    ],
    resources: [
      { name: t("footer.links.blog"), href: "https://dropyblog.vercel.app" },
      { name: t("footer.links.faq"), href: "/faq" },
      { name: t("footer.links.help"), href: "/aide" },
    ],
    company: [
      { name: t("footer.links.about"), href: "/a-propos" },
      { name: t("footer.links.contact"), href: "/contact" },
      { name: t("footer.links.careers"), href: "/carrieres" },
    ],
    legal: [
      { name: t("footer.links.terms"), href: "/conditions-utilisation" },
      { name: t("footer.links.privacy"), href: "/politique-confidentialite" },
      { name: t("footer.links.legal"), href: "/mentions-legales" },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: "https://facebook.com", label: "Facebook" },
    { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
    { icon: MessageCircle, href: "https://wa.me/21600000000", label: "WhatsApp" },
    { icon: Linkedin, href: "https://linkedin.com", label: "Linkedin" },
  ];

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(t("footer.newsletter_success"), {
      description: t("footer.newsletter_desc"),
    });
  };

  return (
    <footer className="bg-slate-50 text-slate-500 pt-24 pb-12 border-t border-slate-100" dir={dir}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-12 mb-20">
          {/* Brand and Newsletter */}
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-8 group">
              <Logo className="h-14 w-auto group-hover:scale-105 transition-transform duration-300" />
            </Link>
            <p className="text-lg text-slate-500 mb-10 leading-relaxed max-w-sm font-medium">
              {t("footer.tagline")}
            </p>
            
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">{t("footer.newsletter")}</h4>
              <form onSubmit={handleNewsletterSubmit} className="relative max-w-sm">
                <input 
                  type="email" 
                  required
                  placeholder={t("footer.newsletter_placeholder")} 
                  className="w-full h-14 bg-white border border-slate-200 rounded-2xl px-6 text-slate-900 focus:outline-none focus:border-[#2E3192] transition-colors shadow-sm"
                />
                <button type="submit" className="absolute right-2 top-2 w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white hover:bg-slate-800 transition-colors">
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>

          {/* Links Grid */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-8">{t("footer.sections.platform")}</h4>
            <ul className="space-y-4">
              {footerLinks.platform.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="hover:text-[#2E3192] font-bold transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-8">{t("footer.sections.resources")}</h4>
            <ul className="space-y-4">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  {link.comingSoon ? (
                    <button 
                      onClick={() => toast.info(t("footer.blog_soon"))}
                      className="hover:text-[#2E3192] font-bold transition-colors text-left"
                    >
                      {link.name}
                    </button>
                  ) : (
                    <Link href={link.href} className="hover:text-[#2E3192] font-bold transition-colors">
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>


          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-8">{t("footer.sections.company")}</h4>
            <ul className="space-y-4">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="hover:text-[#2E3192] font-bold transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-8">{t("footer.sections.legal")}</h4>
            <ul className="space-y-4">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="hover:text-[#2E3192] font-bold transition-colors text-xs">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-12 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-4">
            {socialLinks.map((social, i) => (
              <Link 
                key={i} 
                href={social.href} 
                className="w-11 h-11 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-[#2E3192] hover:border-[#2E3192]/20 shadow-sm transition-all duration-300"
              >
                <social.icon className="w-5 h-5" />
              </Link>
            ))}
          </div>

          <p className="text-sm font-black uppercase tracking-widest text-slate-400">
            {t("footer.copyright")} <span className="text-slate-900">{t("footer.tunisia")}</span>
          </p>

          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-100 shadow-sm">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t("footer.status")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
