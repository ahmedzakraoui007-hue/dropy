"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  Clock,
  ArrowRight,
  Bell,
  CheckCircle2,
  Download,
  Languages,
  MessageCircle,
  Package,
  Phone,
  ShieldCheck,
  Smartphone,
  Zap,
} from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";
import { PhoneFrame } from "@/components/landing/home/MiniStore";
import { APK_DOWNLOAD_PATH, APK_SIZE_MB, APP_VERSION } from "@/lib/mobile-app";

function OrdersMock({ a }: { a: (key: string) => string }) {
  const orders = [
    { name: "Sarra B.", city: a("mock.city1"), price: "89,000", status: a("mock.status_new"), tone: "bg-amber-100 text-amber-700" },
    { name: "Mehdi K.", city: a("mock.city2"), price: "145,000", status: a("mock.status_confirmed"), tone: "bg-indigo-100 text-indigo-700" },
    { name: "Amira T.", city: a("mock.city3"), price: "62,500", status: a("mock.status_shipped"), tone: "bg-teal-100 text-teal-700" },
  ];
  return (
    <div className="flex h-full flex-col bg-slate-50 pt-9 text-start">
      <div className="mx-3 flex items-center gap-2 rounded-2xl bg-[#070A1F] p-3 text-white shadow-lg">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2E3192] to-[#00A99D]">
          <Bell className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="block text-[11px] font-black">{a("mock.notif_title")}</span>
          <span className="block truncate text-[10px] text-slate-300">Sarra B. · 89,000 DT</span>
        </span>
      </div>
      <div className="px-4 pb-2 pt-4">
        <p className="text-lg font-black text-slate-900">{a("mock.orders")}</p>
        <div className="mt-2 flex gap-1.5">
          {[a("mock.filter_all"), a("mock.filter_new"), a("mock.filter_confirmed")].map((label, i) => (
            <span key={label} className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${i === 0 ? "bg-[#2E3192] text-white" : "bg-white text-slate-500 ring-1 ring-slate-200"}`}>
              {label}
            </span>
          ))}
        </div>
      </div>
      <div className="space-y-2 px-3">
        {orders.map((order) => (
          <div key={order.name} className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-100">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-black text-slate-900">{order.name}</span>
              <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${order.tone}`}>{order.status}</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-[10px] text-slate-500">{order.city}</span>
              <span className="text-xs font-black text-slate-900" dir="ltr">{order.price} DT</span>
            </div>
            <div className="mt-2 flex gap-1.5">
              <span className="flex h-6 flex-1 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><Phone className="h-3 w-3" /></span>
              <span className="flex h-6 flex-1 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><MessageCircle className="h-3 w-3" /></span>
              <span className="flex h-6 flex-[2] items-center justify-center rounded-lg bg-[#2E3192] text-[9px] font-bold text-white">{a("mock.confirm")}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ApplicationClient() {
  const { t, dir } = useTranslation();
  const a = (key: string) => t(`pages.application.${key}`);
  const [qr, setQr] = useState("");

  useEffect(() => {
    QRCode.toDataURL(`${window.location.origin}${APK_DOWNLOAD_PATH}`, { margin: 1, width: 280, color: { dark: "#070A1F", light: "#ffffff" } })
      .then(setQr)
      .catch(() => setQr(""));
  }, []);

  const features = [
    { icon: Bell, key: "push" },
    { icon: Zap, key: "confirm" },
    { icon: Phone, key: "contact" },
    { icon: Package, key: "products" },
    { icon: Smartphone, key: "home" },
    { icon: Languages, key: "languages" },
  ];

  const steps = ["step1", "step2", "step3"];

  return (
    <div className="min-h-screen bg-white pt-20" dir={dir}>
      <section className="relative overflow-hidden bg-[#070A1F] px-4 py-16 text-white sm:px-6 lg:py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_10%_0%,rgba(79,70,229,0.45),transparent_55%),radial-gradient(ellipse_at_95%_100%,rgba(0,169,157,0.4),transparent_55%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-teal-200">
              <Smartphone className="h-3.5 w-3.5" />
              {a("badge").replace("{version}", APP_VERSION)}
            </span>
            <h1 className="mt-6 text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              {a("title_main")}{" "}
              <span className="bg-gradient-to-r from-[#8B8FFF] to-[#22E1C9] bg-clip-text text-transparent">{a("title_accent")}</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg font-medium leading-relaxed text-slate-300">{a("desc")}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a
                href={APK_DOWNLOAD_PATH}
                className="inline-flex h-14 items-center justify-center gap-3 rounded-2xl bg-white px-7 text-base font-black text-[#1B1F6B] shadow-xl shadow-indigo-900/30 transition-transform hover:-translate-y-0.5"
              >
                <Download className="h-5 w-5" />
                {a("download_android")}
              </a>
              <span className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl border border-white/15 px-6 text-sm font-bold text-slate-300">
                <Clock className="h-5 w-5" />
                {a("ios_soon")}
              </span>
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-400">{a("file_info").replace("{size}", String(APK_SIZE_MB)).replace("{version}", APP_VERSION)}</p>
          </div>

          <div className="relative flex items-end justify-center gap-8">
            <PhoneFrame className="w-[260px] shrink-0 sm:w-[290px]">
              <OrdersMock a={a} />
            </PhoneFrame>
            <div className="mb-10 hidden w-48 rounded-3xl bg-white p-4 text-center text-slate-900 shadow-2xl lg:block">
              {qr ? <img src={qr} alt={a("qr_alt")} className="mx-auto h-40 w-40" /> : <div className="mx-auto h-40 w-40 rounded-xl bg-slate-100" />}
              <p className="mt-3 text-sm font-black">{a("qr_title")}</p>
              <p className="mt-1 text-xs font-medium text-slate-500">{a("qr_desc")}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-black text-slate-900 md:text-5xl">{a("features_title")}</h2>
            <p className="mt-4 text-lg font-medium text-slate-500">{a("features_subtitle")}</p>
          </div>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, key }) => (
              <div key={key} className="rounded-3xl border border-slate-100 bg-slate-50 p-7 transition-all hover:-translate-y-1 hover:bg-white hover:shadow-xl">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2E3192] to-[#00A99D] text-white">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-lg font-black text-slate-900">{a(`features.${key}.title`)}</h3>
                <p className="mt-2 font-medium leading-relaxed text-slate-500">{a(`features.${key}.desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:pb-28">
        <div className="mx-auto grid max-w-7xl gap-10 rounded-[2.5rem] bg-slate-900 p-8 text-white md:p-14 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-black md:text-4xl">{a("install_title")}</h2>
            <p className="mt-4 font-medium leading-relaxed text-slate-400">{a("install_desc")}</p>
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#22E1C9]" />
              <p className="text-sm font-medium leading-relaxed text-slate-300">{a("install_warning")}</p>
            </div>
          </div>
          <ol className="space-y-4">
            {steps.map((key, i) => (
              <li key={key} className="flex items-start gap-4 rounded-2xl bg-white/5 p-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#00A99D] text-sm font-black">{i + 1}</span>
                <span>
                  <span className="block font-black">{a(`install.${key}.title`)}</span>
                  <span className="mt-1 block text-sm font-medium text-slate-400">{a(`install.${key}.desc`)}</span>
                </span>
              </li>
            ))}
            <li>
              <a href={APK_DOWNLOAD_PATH} className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-white px-7 font-black text-[#1B1F6B] transition-transform hover:-translate-y-0.5">
                <Download className="h-5 w-5" />
                {a("download_android")}
              </a>
            </li>
          </ol>
        </div>
      </section>

      <section className="px-4 pb-24 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-[#00A99D]" />
          <h2 className="mt-4 text-2xl font-black text-slate-900 md:text-3xl">{a("cta_title")}</h2>
          <p className="mt-3 font-medium text-slate-500">{a("cta_desc")}</p>
          <Link href="/inscription" className="mt-7 inline-flex h-14 items-center gap-2 rounded-2xl bg-[#2E3192] px-8 font-black text-white shadow-xl shadow-indigo-500/20 transition-transform hover:-translate-y-0.5">
            {a("cta_button")}
            <ArrowRight className="h-5 w-5 rtl:rotate-180" />
          </Link>
        </div>
      </section>
    </div>
  );
}
