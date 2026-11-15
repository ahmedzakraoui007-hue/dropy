import type { Locale } from "@/lib/i18n";

export function money(value: number | string | null | undefined, locale: Locale) {
  const amount = Number(value || 0);
  const formatted = new Intl.NumberFormat(locale === "ar" ? "ar-TN" : "fr-TN", {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 3,
    maximumFractionDigits: 3,
  }).format(amount);
  return `${formatted} ${locale === "ar" ? "د.ت" : "DT"}`;
}

export function dateTime(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-TN" : "fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function relativeTime(value: string, locale: Locale, t: (key: string, vars?: Record<string, string | number>) => string) {
  const minutes = Math.floor((Date.now() - new Date(value).getTime()) / 60000);
  if (minutes < 1) return t("time.now");
  if (minutes < 60) return t("time.minutes", { count: minutes });
  if (minutes < 24 * 60) return t("time.hours", { count: Math.floor(minutes / 60) });
  if (minutes < 48 * 60) return t("time.yesterday");
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-TN" : "fr-FR", { day: "numeric", month: "short" }).format(new Date(value));
}

export function phoneDigits(phone: string) {
  const digits = String(phone || "").replace(/\D/g, "").replace(/^00/, "");
  if (digits.length === 8) return `216${digits}`;
  return digits;
}

export function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
