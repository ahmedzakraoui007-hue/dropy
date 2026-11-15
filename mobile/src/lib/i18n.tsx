import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import ar from "@/locales/ar.json";
import fr from "@/locales/fr.json";

export type Locale = "fr" | "ar";

const DICTS: Record<Locale, unknown> = { fr, ar };
const KEY = "dropy.locale";

function lookup(dict: unknown, key: string): string | undefined {
  const value = key.split(".").reduce<any>((node, part) => (node == null ? undefined : node[part]), dict);
  return typeof value === "string" ? value : undefined;
}

type Ctx = {
  locale: Locale;
  rtl: boolean;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => (getLocales()[0]?.languageCode === "ar" ? "ar" : "fr"));

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((saved) => {
        if (saved === "fr" || saved === "ar") setLocaleState(saved);
      })
      .catch(() => {});
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    AsyncStorage.setItem(KEY, next).catch(() => {});
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const raw = lookup(DICTS[locale], key) ?? lookup(DICTS.fr, key) ?? key;
      return vars ? raw.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? "")) : raw;
    },
    [locale]
  );

  const value = useMemo(() => ({ locale, rtl: locale === "ar", setLocale, t }), [locale, setLocale, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n outside provider");
  return ctx;
}
