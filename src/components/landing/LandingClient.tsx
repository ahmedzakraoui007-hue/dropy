"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, Banknote, Camera, Check, Languages, MessageCircle, Package, PackageCheck, Palette, Phone, Rocket, Send, Sparkles, Truck } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";
import { WHATSAPP_URL } from "@/lib/contact";
import { PhoneStage } from "@/components/landing/home/PhoneStage";
import { TemplateGallery } from "@/components/landing/home/TemplateGallery";
import { premiumThemes } from "@/lib/themes/premium";
import { firstFont } from "@/lib/theme-look";

const FONT_LINK = `https://fonts.googleapis.com/css2?${[...new Set(premiumThemes.map((th) => firstFont(th.typography.headingFont)))]
  .map((f) => `family=${f.replace(/ /g, "+")}:wght@700`)
  .join("&")}&display=swap`;

export default function LandingClient() {
  const { t, dir } = useTranslation();
  const h = (key: string) => t(`home.${key}`);

  const strip = ["cod", "governorates", "languages", "tracking", "ads", "whatsapp"].map((k) => h(`strip.${k}`));
  const steps = [
    { icon: Send, key: "one" },
    { icon: Palette, key: "two" },
    { icon: Rocket, key: "three" },
  ];

  return (
    <div className="min-h-screen bg-[#FBFBFD] selection:bg-[#00A99D]/20" dir={dir}>
      <link rel="stylesheet" href={FONT_LINK} />

      <section className="relative overflow-hidden bg-[#070A1F] px-6 pb-20 pt-32 text-white lg:pb-28 lg:pt-40">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_10%,rgba(79,70,229,0.35),transparent_55%),radial-gradient(ellipse_at_85%_60%,rgba(0,169,157,0.28),transparent_55%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.5)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 lg:grid-cols-[1.05fr_1fr] [&>*]:min-w-0">
          <div>
            <p className="mb-7 inline-flex max-w-full items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.15em] sm:text-xs sm:tracking-[0.2em] text-teal-200 backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-300 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-300" />
              </span>
              {h("hero.badge")}
            </p>
            <h1 className="text-5xl font-black leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              {h("hero.title1")}{" "}
              <span className="dropy-gradient-text bg-gradient-to-r from-violet-300 via-teal-200 to-violet-300 bg-[length:200%_auto] bg-clip-text text-transparent">{h("hero.title2")}</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-slate-300 md:text-xl">{h("hero.description")}</p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link href="/creation-site-ecommerce-tunisie#demande" className="group inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-white px-8 text-base font-black text-slate-900 shadow-[0_0_40px_-5px_rgba(45,212,191,0.6)] transition-all hover:-translate-y-0.5">
                {h("hero.cta_primary")}
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
              </Link>
              <a href="#templates" className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-white/20 px-8 text-base font-bold text-white transition-colors hover:bg-white/10">
                <Sparkles className="h-5 w-5 text-teal-300" />
                {h("hero.cta_secondary")}
              </a>
            </div>
            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-slate-300">
              {["free", "cod", "languages"].map((k) => (
                <li key={k} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-teal-300" />
                  {h(`hero.points.${k}`)}
                </li>
              ))}
            </ul>
          </div>
          <PhoneStage />
        </div>
      </section>

      <div className="overflow-hidden border-y border-slate-200 bg-white py-5" dir="ltr">
        <div className="dropy-marquee flex w-max gap-12 whitespace-nowrap text-sm font-black uppercase tracking-[0.2em] text-slate-400">
          {[...strip, ...strip, ...strip, ...strip].map((item, i) => (
            <span key={i} className="flex items-center gap-12">
              {item}
              <span className="text-[#00A99D]">✦</span>
            </span>
          ))}
        </div>
      </div>

      <section id="templates" className="scroll-mt-24 px-6 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <p className="mb-4 text-xs font-black uppercase tracking-[0.25em] text-[#00A99D]">{h("templates.eyebrow")}</p>
            <h2 className="text-4xl font-black tracking-tight text-slate-900 md:text-6xl">{h("templates.title")}</h2>
            <p className="mt-5 text-lg leading-relaxed text-slate-600">{h("templates.subtitle")}</p>
          </div>
          <TemplateGallery />
        </div>
      </section>

      <section className="bg-white px-6 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="mb-4 text-xs font-black uppercase tracking-[0.25em] text-[#2E3192]">{h("steps.eyebrow")}</p>
              <h2 className="text-4xl font-black tracking-tight text-slate-900 md:text-6xl">{h("steps.title")}</h2>
            </div>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center gap-2 self-start rounded-full bg-[#25D366] px-6 text-sm font-black text-white shadow-lg shadow-emerald-500/20 transition-transform hover:-translate-y-0.5 md:self-auto">
              <MessageCircle className="h-5 w-5" />
              {h("steps.whatsapp")}
            </a>
          </div>
          <ol className="grid gap-6 md:grid-cols-3">
            {steps.map(({ icon: Icon, key }, i) => (
              <li key={key} className="group relative overflow-hidden rounded-[2rem] border border-slate-200 bg-[#FBFBFD] p-8 transition-colors hover:border-[#2E3192]/30">
                <span className="pointer-events-none absolute -end-4 -top-8 text-[9rem] font-black leading-none text-slate-100 transition-colors group-hover:text-[#2E3192]/10">{i + 1}</span>
                <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2E3192] to-[#00A99D] text-white shadow-lg">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="relative mt-8 text-2xl font-black text-slate-900">{h(`steps.${key}.title`)}</h3>
                <p className="relative mt-3 leading-relaxed text-slate-600">{h(`steps.${key}.desc`)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="px-6 py-24 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <p className="mb-4 text-xs font-black uppercase tracking-[0.25em] text-[#00A99D]">{h("bento.eyebrow")}</p>
            <h2 className="text-4xl font-black tracking-tight text-slate-900 md:text-6xl">{h("bento.title")}</h2>
          </div>
          <div className="grid auto-rows-[minmax(220px,auto)] gap-5 md:grid-cols-6">
            <div className="relative overflow-hidden rounded-[2rem] bg-[#070A1F] p-8 text-white md:col-span-4 md:row-span-2">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,rgba(0,169,157,0.35),transparent_60%)]" />
              <Banknote className="relative h-8 w-8 text-teal-300" />
              <h3 className="relative mt-5 max-w-md text-3xl font-black">{h("bento.cod.title")}</h3>
              <p className="relative mt-3 max-w-md text-slate-300">{h("bento.cod.desc")}</p>
              <div className="relative mt-8 space-y-3">
                {[
                  { icon: Phone, key: "confirm", tone: "bg-amber-400/15 text-amber-200" },
                  { icon: PackageCheck, key: "ship", tone: "bg-sky-400/15 text-sky-200" },
                  { icon: Truck, key: "deliver", tone: "bg-emerald-400/15 text-emerald-200" },
                ].map(({ icon: Icon, key, tone }, i) => (
                  <div key={key} className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur" style={{ marginInlineStart: `${i * 1.5}rem` }}>
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}><Icon className="h-5 w-5" /></span>
                    <span className="font-bold">{h(`bento.cod.${key}`)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-600 to-[#2E3192] p-8 text-white md:col-span-2">
              <Sparkles className="h-8 w-8 text-violet-200" />
              <h3 className="mt-5 text-2xl font-black">{h("bento.effects.title")}</h3>
              <p className="mt-2 text-violet-100">{h("bento.effects.desc")}</p>
              <div className="pointer-events-none absolute -bottom-10 -end-6 h-32 w-24 rotate-12 rounded-2xl border border-white/30 bg-white/10" style={{ transform: "perspective(400px) rotateY(-30deg) rotateZ(12deg)" }} />
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 md:col-span-2">
              <Languages className="h-8 w-8 text-[#00A99D]" />
              <h3 className="mt-5 text-2xl font-black text-slate-900">{h("bento.languages.title")}</h3>
              <div className="mt-5 inline-flex rounded-full bg-slate-100 p-1 text-sm font-black">
                <span className="rounded-full bg-white px-4 py-1.5 shadow">FR</span>
                <span className="px-4 py-1.5 text-slate-500">العربية</span>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 md:col-span-3">
              <BarChart3 className="h-8 w-8 text-[#2E3192]" />
              <h3 className="mt-5 text-2xl font-black text-slate-900">{h("bento.ads.title")}</h3>
              <p className="mt-2 text-slate-600">{h("bento.ads.desc")}</p>
              <div className="mt-6 flex h-20 items-end gap-2" aria-hidden>
                {[40, 65, 50, 85, 70, 100, 90].map((v, i) => (
                  <span key={i} className="flex-1 rounded-t-lg bg-gradient-to-t from-[#2E3192] to-[#00A99D]" style={{ height: `${v}%`, opacity: 0.35 + i * 0.09 }} />
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 md:col-span-3">
              <Package className="h-8 w-8 text-[#00A99D]" />
              <h3 className="mt-5 text-2xl font-black text-slate-900">{h("bento.share.title")}</h3>
              <p className="mt-2 text-slate-600">{h("bento.share.desc")}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {["WhatsApp", "Instagram", "TikTok", "Facebook"].map((name) => (
                  <span key={name} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700">{name}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-2">
          {[
            { href: "/createurs", icon: Camera, key: "creators", tone: "from-violet-50 to-white text-violet-600" },
            { href: "/fournisseurs", icon: Package, key: "suppliers", tone: "from-teal-50 to-white text-[#00A99D]" },
          ].map(({ href, icon: Icon, key, tone }) => (
            <Link key={key} href={href} className={`group flex items-center gap-6 rounded-[2rem] border border-slate-200 bg-gradient-to-br p-8 transition-shadow hover:shadow-xl ${tone}`}>
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow"><Icon className="h-6 w-6" /></span>
              <span className="flex-1">
                <span className="block text-xl font-black text-slate-900">{h(`audiences.${key}.title`)}</span>
                <span className="mt-1 block text-slate-600">{h(`audiences.${key}.desc`)}</span>
              </span>
              <ArrowRight className="h-5 w-5 text-slate-400 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
            </Link>
          ))}
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-[#070A1F] px-8 py-20 text-center text-white md:py-28">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_0%,rgba(79,70,229,0.45),transparent_55%),radial-gradient(ellipse_at_70%_100%,rgba(0,169,157,0.4),transparent_55%)]" />
          <h2 className="relative mx-auto max-w-3xl text-4xl font-black tracking-tight md:text-6xl">{h("final.title")}</h2>
          <p className="relative mx-auto mt-6 max-w-xl text-lg text-slate-300">{h("final.subtitle")}</p>
          <div className="relative mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/creation-site-ecommerce-tunisie#demande" className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-white px-8 font-black text-slate-900 transition-transform hover:-translate-y-0.5">
              {h("hero.cta_primary")}
              <ArrowRight className="h-5 w-5 rtl:rotate-180" />
            </Link>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-white/20 px-8 font-bold transition-colors hover:bg-white/10">
              <MessageCircle className="h-5 w-5" />
              {h("steps.whatsapp")}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
