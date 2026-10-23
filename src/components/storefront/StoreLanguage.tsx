"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  formatStoreMoney,
  initialStoreLang,
  normalizeStorefrontLanguage,
  storeText,
  type StoreLang,
  type StorefrontLanguageSetting,
} from "@/lib/storefront-i18n";

type StoreLanguageValue = {
  lang: StoreLang;
  setting: StorefrontLanguageSetting;
  t: ReturnType<typeof storeText>;
  money: (value: number | string) => string;
  setLang: (lang: StoreLang) => void;
};

const StoreLanguageContext = createContext<StoreLanguageValue>({
  lang: "fr",
  setting: "fr",
  t: storeText("fr"),
  money: (value) => formatStoreMoney(value, "fr"),
  setLang: () => {},
});

export function StoreLanguageProvider({ setting: rawSetting, slug, children }: { setting: unknown; slug: string; children: React.ReactNode }) {
  const setting = normalizeStorefrontLanguage(rawSetting);
  const [chosen, setChosen] = useState<StoreLang>(() => (setting === "both" ? "fr" : setting));

  useEffect(() => {
    setChosen(initialStoreLang(setting, slug));
  }, [setting, slug]);

  const lang: StoreLang = setting === "both" ? chosen : setting;

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-storefront", "1");
    root.lang = lang;
    root.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  useEffect(
    () => () => {
      const root = document.documentElement;
      root.removeAttribute("data-storefront");
      let platform = "fr";
      try {
        platform = window.localStorage.getItem("locale") === "ar" ? "ar" : "fr";
      } catch {}
      root.lang = platform;
      root.dir = platform === "ar" ? "rtl" : "ltr";
    },
    []
  );

  const setLang = useCallback(
    (next: StoreLang) => {
      setChosen(next);
      try {
        window.localStorage.setItem(`store_lang:${slug}`, next);
      } catch {}
    },
    [slug]
  );

  const value = useMemo<StoreLanguageValue>(
    () => ({ lang, setting, t: storeText(lang), money: (v) => formatStoreMoney(v, lang), setLang }),
    [lang, setting, setLang]
  );

  return (
    <StoreLanguageContext.Provider value={value}>
      <div dir={lang === "ar" ? "rtl" : "ltr"} lang={lang} className="contents">
        {children}
      </div>
    </StoreLanguageContext.Provider>
  );
}

export const useStoreText = () => useContext(StoreLanguageContext);

export function StoreLanguageSwitch({ className = "" }: { className?: string }) {
  const { setting, lang, setLang, t } = useStoreText();
  if (setting !== "both") return null;
  return (
    <div className={`flex items-center rounded-full border border-border p-0.5 text-xs font-bold ${className}`} role="group" aria-label={t("nav.language")}>
      {(["fr", "ar"] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          className={`rounded-full px-2.5 py-1 transition-colors ${lang === code ? "bg-primary text-primary-foreground" : "opacity-70 hover:opacity-100"}`}
        >
          {code === "fr" ? "FR" : "ع"}
        </button>
      ))}
    </div>
  );
}
