"use client";

import { useStoreText } from "@/components/storefront/StoreLanguage";
import type { CheckoutExtras, CheckoutSettings, ExtrasError, FieldRule } from "@/lib/checkout-settings";

type Props = {
  settings: CheckoutSettings;
  value: CheckoutExtras;
  onChange: (value: CheckoutExtras) => void;
  errors: ExtrasError[];
  fieldClass: string;
  showCity?: boolean;
  showEmail?: boolean;
};

export function CheckoutExtraFields({ settings, value, onChange, errors, fieldClass, showCity = true, showEmail = true }: Props) {
  const { t } = useStoreText();
  const placeholder = (label: string, rule: FieldRule) => (rule === "optional" ? `${label} (${t("form.optional")})` : label);
  const error = (key: ExtrasError, message = t("form.required")) =>
    errors.includes(key) ? <p className="mt-1 text-xs font-medium text-red-600">{message}</p> : null;

  return (
    <>
      {showCity && settings.city !== "hidden" && (
        <div>
          <input
            className={fieldClass}
            placeholder={placeholder(t("express.city"), settings.city)}
            aria-label={t("express.city")}
            value={value.city}
            onChange={(e) => onChange({ ...value, city: e.target.value })}
          />
          {error("city")}
        </div>
      )}
      {showEmail && settings.email !== "hidden" && (
        <div>
          <input
            type="email"
            dir="ltr"
            autoComplete="email"
            className={fieldClass}
            placeholder={placeholder(t("form.email"), settings.email)}
            aria-label={t("form.email")}
            value={value.email}
            onChange={(e) => onChange({ ...value, email: e.target.value })}
          />
          {error("email")}
          {error("email_invalid", t("form.email_invalid"))}
        </div>
      )}
      {settings.customFields.map((field) => (
        <div key={field.id}>
          <input
            className={fieldClass}
            placeholder={field.required ? field.label : `${field.label} (${t("form.optional")})`}
            aria-label={field.label}
            dir="auto"
            value={value.answers[field.id] || ""}
            onChange={(e) => onChange({ ...value, answers: { ...value.answers, [field.id]: e.target.value } })}
          />
          {error(`field:${field.id}`)}
        </div>
      ))}
      {settings.note !== "hidden" && (
        <div>
          <textarea
            rows={2}
            className={fieldClass}
            placeholder={placeholder(t("form.note"), settings.note)}
            aria-label={t("form.note")}
            dir="auto"
            value={value.note}
            onChange={(e) => onChange({ ...value, note: e.target.value })}
          />
          {error("note")}
        </div>
      )}
    </>
  );
}
