"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  ArrowRight,
  User,
  Phone,
  Globe,
  Instagram,
  Store,
  Building2,
  FileText,
  Camera,
  Package,
  Check,
  AlertCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "@/context/LanguageContext";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthField, PasswordField, PasswordStrength, AuthAlert, SubmitButton } from "@/components/auth/AuthFields";
import { SignupSuccess } from "@/components/auth/SignupSuccess";
import { cn } from "@/lib/utils";

type Role = "creator" | "seller" | "supplier";

interface RoleSignupProps {
  role: Role;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ROLE_META: Record<Role, { icon: typeof Store; gradient: string }> = {
  seller: { icon: Store, gradient: "from-[#2E3192] to-[#4f56d6]" },
  supplier: { icon: Package, gradient: "from-[#00A99D] to-[#0d8f86]" },
  creator: { icon: Camera, gradient: "from-violet-500 to-purple-600" },
};

const OPTIONS: Record<string, { value: string; key: string }[]> = {
  specialty: ["video", "photo", "lifestyle", "unboxing"].map((v) => ({ value: v, key: `role_signup.specialties.${v}` })),
  sector: ["fashion", "beauty", "home", "tech", "other"].map((v) => ({ value: v, key: `role_signup.sectors.${v}` })),
  productType: [
    ["tshirts-polos", "tshirts"],
    ["chemises-blouses", "shirts"],
    ["pantalons-jeans", "pants"],
    ["robes-jupes", "dresses"],
    ["vestes-manteaux", "jackets"],
    ["sous-vetements", "underwear"],
    ["chaussures", "shoes"],
    ["accessoires-mode", "accessories"],
    ["sportswear", "sportswear"],
    ["multi-categories", "multi"],
  ].map(([value, key]) => ({ value, key: `role_signup.categories.${key}` })),
};

function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; key: string }[];
  error?: string;
}) {
  const { t, dir } = useTranslation();
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-semibold text-slate-700">
        {label}
      </Label>
      <Select value={value} onValueChange={onChange} dir={dir}>
        <SelectTrigger
          id={id}
          aria-invalid={Boolean(error)}
          className={cn(
            "h-12 data-[size=default]:h-12 w-full rounded-xl border-slate-200 bg-slate-50/60 text-[15px] focus:ring-[#2E3192]/15",
            error && "border-red-400 bg-red-50/40"
          )}
        >
          <SelectValue placeholder={t("role_signup.select_placeholder")} />
        </SelectTrigger>
        <SelectContent className="rounded-xl">
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {t(o.key)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-red-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

export default function RoleSignup({ role }: RoleSignupProps) {
  const { t, dir, language } = useTranslation();
  const router = useRouter();
  const meta = ROLE_META[role];
  const Icon = meta.icon;

  const [isExistingUser, setIsExistingUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [emailExists, setEmailExists] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const [values, setValues] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    portfolio: "",
    instagram: "",
    specialty: "",
    storeName: "",
    sector: "",
    companyName: "",
    taxId: "",
    productType: "",
  });

  function set(field: keyof typeof values, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  useEffect(() => {
    async function checkSession() {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
      const user = data.user;
      if (!user) return;

      setIsExistingUser(true);
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", user.id)
        .maybeSingle();

      setValues((prev) => ({
        ...prev,
        email: user.email || "",
        fullName: profile?.full_name || user.user_metadata?.full_name || "",
        phone: profile?.phone || user.user_metadata?.phone || "",
      }));
    }
    checkSession();
  }, []);

  function validate() {
    const next: Record<string, string> = {};
    const required = (field: keyof typeof values) => {
      if (!values[field].trim()) next[field] = "role_signup.errors.required";
    };

    required("fullName");
    required("phone");
    if (!next.phone && values.phone.replace(/\D/g, "").length < 8) next.phone = "role_signup.errors.phone_invalid";

    if (!isExistingUser) {
      if (!values.email.trim()) next.email = "register.errors.email_required";
      else if (!EMAIL_REGEX.test(values.email.trim())) next.email = "register.errors.invalid_email";
      if (values.password.length < 8) next.password = "register.toasts.password_short";
    }

    if (role === "creator") {
      required("instagram");
      required("specialty");
      required("portfolio");
      if (!next.portfolio && !/^https?:\/\/\S+\.\S+/.test(values.portfolio.trim())) {
        next.portfolio = "role_signup.errors.url_invalid";
      }
    } else if (role === "seller") {
      required("storeName");
      required("sector");
    } else if (role === "supplier") {
      required("companyName");
      required("taxId");
      required("productType");
    }
    return next;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fieldErrors = validate();
    setErrors(fieldErrors);
    setFormError(null);
    setEmailExists(false);

    const order = [
      "fullName", "phone", "email", "password", "instagram", "specialty", "portfolio",
      "storeName", "sector", "companyName", "taxId", "productType",
    ];
    const firstInvalid = order.find((f) => fieldErrors[f]);
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      return;
    }

    setLoading(true);
    const v = {
      ...values,
      fullName: values.fullName.trim(),
      phone: values.phone.trim(),
      email: values.email.trim().toLowerCase(),
      instagram: values.instagram.trim(),
      portfolio: values.portfolio.trim(),
      storeName: values.storeName.trim(),
      companyName: values.companyName.trim(),
      taxId: values.taxId.trim(),
    };

    if (isExistingUser) {
      const response = await fetch("/api/auth/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          fullName: v.fullName,
          phone: v.phone,
          additionalData: {
            portfolio: v.portfolio,
            instagram: v.instagram,
            specialty: v.specialty,
            storeName: v.storeName,
            sector: v.sector,
            companyName: v.companyName,
            taxId: v.taxId,
            productType: v.productType,
          },
        }),
      }).catch(() => null);
      const result = response ? await response.json().catch(() => ({})) : {};

      if (!response?.ok) {
        setFormError(result.code === "role_mismatch" ? "role_signup.errors.role_mismatch" : "forgot_password.error_generic");
        setLoading(false);
        return;
      }

      await createClient().auth.signOut();
      router.replace("/demande-en-attente");
      return;
    }

    let response: Response;
    let result: { error?: string; code?: string } = {};
    try {
      response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: v.email,
          password: v.password,
          fullName: v.fullName,
          phone: v.phone,
          role,
          lang: language,
          additionalData: {
            portfolio: v.portfolio,
            instagram: v.instagram,
            specialty: v.specialty,
            storeName: v.storeName,
            sector: v.sector,
            companyName: v.companyName,
            taxId: v.taxId,
            productType: v.productType,
          },
        }),
      });
      result = await response.json().catch(() => ({}));
    } catch {
      setFormError("forgot_password.error_generic");
      setLoading(false);
      return;
    }

    setLoading(false);

    if (!response.ok) {
      if (result.code === "email_exists") {
        setEmailExists(true);
        setErrors({ email: "register.toasts.email_exists" });
        document.getElementById("email")?.focus();
        return;
      }
      if (result.code === "invalid_email") {
        setErrors({ email: "register.errors.invalid_email" });
        return;
      }
      if (result.code === "weak_password") {
        setErrors({ password: "register.toasts.password_short" });
        return;
      }
      setFormError(result.code === "email_send_failed" ? "register.toasts.email_send_failed" : "forgot_password.error_generic");
      return;
    }

    setSubmittedEmail(v.email);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const err = (field: string) => (errors[field] ? t(errors[field]!) : undefined);
  const roleName = t(`role_signup.${role}`);

  if (submittedEmail) {
    return (
      <AuthShell wide>
        <SignupSuccess
          email={submittedEmail}
          onChangeEmail={() => {
            setSubmittedEmail(null);
            set("password", "");
          }}
        />
      </AuthShell>
    );
  }

  return (
    <AuthShell wide>
      <div className="space-y-7">
        <div className="space-y-4">
          <span className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${meta.gradient} shadow-lg`}>
            <Icon className="h-6 w-6 text-white" />
          </span>
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">{t(`role_signup.titles.${role}`)}</h1>
            <p className="text-slate-500">{t(`role_signup.subtitles.${role}`)}</p>
          </div>
        </div>

        {formError && <AuthAlert variant="error" title={t("register.toasts.error_title")}>{t(formError)}</AuthAlert>}

        <form onSubmit={handleSubmit} noValidate className="space-y-7">
          <section className="space-y-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">{t("role_signup.account_section")}</h2>

            <div className="grid gap-5 sm:grid-cols-2">
              <AuthField
                id="fullName"
                label={t("role_signup.full_name")}
                icon={User}
                placeholder={t("register.full_name_placeholder")}
                autoComplete="name"
                value={values.fullName}
                onChange={(e) => set("fullName", e.target.value)}
                error={err("fullName")}
              />
              <AuthField
                id="phone"
                type="tel"
                label={t("role_signup.phone")}
                icon={Phone}
                placeholder={t("role_signup.placeholders.phone")}
                autoComplete="tel"
                inputMode="tel"
                dir="ltr"
                value={values.phone}
                onChange={(e) => set("phone", e.target.value)}
                error={err("phone")}
              />
            </div>

            <div className="space-y-2">
              <AuthField
                id="email"
                type="email"
                label={t("role_signup.email")}
                icon={Mail}
                placeholder={t("login.email_placeholder")}
                autoComplete="email"
                inputMode="email"
                value={values.email}
                onChange={(e) => {
                  set("email", e.target.value);
                  setEmailExists(false);
                }}
                disabled={isExistingUser}
                error={err("email")}
              />
              {emailExists && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold">
                  <Link href="/login" className="text-[#2E3192] hover:text-[#00A99D]">
                    {t("register.login")}
                  </Link>
                  <Link href="/forgot-password" className="text-slate-500 hover:text-slate-800">
                    {t("login.forgot_password")}
                  </Link>
                </div>
              )}
            </div>

            {!isExistingUser && (
              <PasswordField
                id="password"
                label={t("role_signup.password")}
                icon={Lock}
                placeholder={t("register.password_placeholder")}
                autoComplete="new-password"
                value={values.password}
                onChange={(e) => set("password", e.target.value)}
                error={err("password")}
                footer={!errors.password && <PasswordStrength password={values.password} />}
              />
            )}
          </section>

          <section className="space-y-5 border-t border-slate-100 pt-7">
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Check className="h-3.5 w-3.5 text-[#00A99D]" strokeWidth={3} />
              {t("role_signup.info_title").replace("{role}", roleName)}
            </h2>

            {role === "creator" && (
              <>
                <div className="grid gap-5 sm:grid-cols-2">
                  <AuthField
                    id="instagram"
                    label={t("role_signup.instagram")}
                    icon={Instagram}
                    placeholder={t("role_signup.placeholders.instagram")}
                    dir="ltr"
                    value={values.instagram}
                    onChange={(e) => set("instagram", e.target.value)}
                    error={err("instagram")}
                  />
                  <SelectField
                    id="specialty"
                    label={t("role_signup.specialty")}
                    value={values.specialty}
                    onChange={(v) => set("specialty", v)}
                    options={OPTIONS.specialty}
                    error={err("specialty")}
                  />
                </div>
                <AuthField
                  id="portfolio"
                  type="url"
                  label={t("role_signup.portfolio")}
                  icon={Globe}
                  placeholder={t("role_signup.placeholders.portfolio")}
                  inputMode="url"
                  dir="ltr"
                  value={values.portfolio}
                  onChange={(e) => set("portfolio", e.target.value)}
                  error={err("portfolio")}
                />
              </>
            )}

            {role === "seller" && (
              <div className="grid gap-5 sm:grid-cols-2">
                <AuthField
                  id="storeName"
                  label={t("role_signup.store_name")}
                  icon={Store}
                  placeholder={t("role_signup.placeholders.store_name")}
                  value={values.storeName}
                  onChange={(e) => set("storeName", e.target.value)}
                  error={err("storeName")}
                />
                <SelectField
                  id="sector"
                  label={t("role_signup.sector")}
                  value={values.sector}
                  onChange={(v) => set("sector", v)}
                  options={OPTIONS.sector}
                  error={err("sector")}
                />
              </div>
            )}

            {role === "supplier" && (
              <>
                <AuthAlert variant="info" title={t("role_signup.supplier_notice")} />
                <AuthField
                  id="companyName"
                  label={t("role_signup.company_name")}
                  icon={Building2}
                  placeholder={t("role_signup.placeholders.company_name")}
                  autoComplete="organization"
                  value={values.companyName}
                  onChange={(e) => set("companyName", e.target.value)}
                  error={err("companyName")}
                />
                <div className="grid gap-5 sm:grid-cols-2">
                  <AuthField
                    id="taxId"
                    label={t("role_signup.tax_id")}
                    icon={FileText}
                    placeholder={t("role_signup.placeholders.tax_id")}
                    value={values.taxId}
                    onChange={(e) => set("taxId", e.target.value)}
                    error={err("taxId")}
                  />
                  <SelectField
                    id="productType"
                    label={t("role_signup.product_type")}
                    value={values.productType}
                    onChange={(v) => set("productType", v)}
                    options={OPTIONS.productType}
                    error={err("productType")}
                  />
                </div>
              </>
            )}
          </section>

          <SubmitButton loading={loading} loadingLabel={t("role_signup.submitting")}>
            {isExistingUser ? t("role_signup.submit_finish") : t("role_signup.submit_create")}
            <ArrowRight className={`h-4 w-4 ${dir === "rtl" ? "rotate-180" : ""}`} />
          </SubmitButton>
        </form>

        <div className="space-y-2 text-center text-sm text-slate-500">
          {!isExistingUser && (
            <p>
              {t("role_signup.has_account")}{" "}
              <Link href="/login" className="font-semibold text-[#2E3192] hover:text-[#00A99D] transition-colors">
                {t("role_signup.login_link")}
              </Link>
            </p>
          )}
          <p>
            {t("role_signup.other_roles").replace("{role}", roleName.toLowerCase())}{" "}
            <Link href="/inscription" className="font-semibold text-[#2E3192] hover:text-[#00A99D] transition-colors">
              {t("role_signup.choose_profile")}
            </Link>
          </p>
        </div>
      </div>
    </AuthShell>
  );
}
