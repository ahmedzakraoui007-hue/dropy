export type CheckoutMode = "both" | "express" | "cart";
export type FieldRule = "hidden" | "optional" | "required";
export type CustomField = { id: string; label: string; required: boolean };

export type CheckoutSettings = {
  mode: CheckoutMode;
  city: FieldRule;
  email: FieldRule;
  note: FieldRule;
  customFields: CustomField[];
  buttonText: string;
  stickyButton: boolean;
  shakeButton: boolean;
};

export type CheckoutExtras = {
  city: string;
  email: string;
  note: string;
  answers: Record<string, string>;
};

export const MAX_CUSTOM_FIELDS = 3;
const RULES: FieldRule[] = ["hidden", "optional", "required"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const rule = (value: unknown, fallback: FieldRule): FieldRule => (RULES.includes(value as FieldRule) ? (value as FieldRule) : fallback);

export function normalizeCheckout(raw: unknown): CheckoutSettings {
  const data = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const mode = data.mode === "express" || data.mode === "cart" ? data.mode : "both";
  const customFields = (Array.isArray(data.customFields) ? data.customFields : [])
    .filter((f) => f && typeof f === "object" && String((f as CustomField).label || "").trim())
    .slice(0, MAX_CUSTOM_FIELDS)
    .map((f, idx) => {
      const field = f as CustomField;
      return { id: String(field.id || `field-${idx}`).slice(0, 40), label: String(field.label).trim().slice(0, 60), required: field.required === true };
    });
  return {
    mode,
    city: rule(data.city, "optional"),
    email: rule(data.email, "hidden"),
    note: rule(data.note, "hidden"),
    customFields,
    buttonText: typeof data.buttonText === "string" ? data.buttonText.trim().slice(0, 40) : "",
    stickyButton: data.stickyButton !== false,
    shakeButton: data.shakeButton === true,
  };
}

export const emptyExtras = (): CheckoutExtras => ({ city: "", email: "", note: "", answers: {} });

export type ExtrasError = "city" | "email" | "email_invalid" | "note" | `field:${string}`;

export function checkExtras(settings: CheckoutSettings, extras: CheckoutExtras): ExtrasError[] {
  const errors: ExtrasError[] = [];
  if (settings.city === "required" && !extras.city.trim()) errors.push("city");
  if (settings.email === "required" && !extras.email.trim()) errors.push("email");
  if (settings.email !== "hidden" && extras.email.trim() && !EMAIL_REGEX.test(extras.email.trim())) errors.push("email_invalid");
  if (settings.note === "required" && !extras.note.trim()) errors.push("note");
  for (const field of settings.customFields) {
    if (field.required && !String(extras.answers[field.id] || "").trim()) errors.push(`field:${field.id}`);
  }
  return errors;
}

export function extrasFromInput(raw: unknown): CheckoutExtras {
  const data = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const answersRaw = data.answers && typeof data.answers === "object" ? (data.answers as Record<string, unknown>) : {};
  const answers: Record<string, string> = {};
  for (const [key, value] of Object.entries(answersRaw).slice(0, MAX_CUSTOM_FIELDS)) {
    answers[String(key).slice(0, 40)] = String(value ?? "").trim().slice(0, 300);
  }
  return {
    city: String(data.city ?? "").trim().slice(0, 100),
    email: String(data.email ?? "").trim().toLowerCase().slice(0, 200),
    note: String(data.note ?? "").trim().slice(0, 500),
    answers,
  };
}

export function orderNotes(settings: CheckoutSettings, extras: CheckoutExtras) {
  const lines = settings.customFields
    .map((f) => (extras.answers[f.id] ? `${f.label} : ${extras.answers[f.id]}` : ""))
    .filter(Boolean);
  if (settings.note !== "hidden" && extras.note) lines.push(extras.note);
  return lines.join("\n") || null;
}
