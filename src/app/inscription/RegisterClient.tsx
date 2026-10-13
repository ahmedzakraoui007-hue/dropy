"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Mail, Lock, ArrowRight, User, Check, Store, Package, Camera } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthField, PasswordField, PasswordStrength, AuthAlert, SubmitButton } from "@/components/auth/AuthFields";
import { SignupSuccess } from "@/components/auth/SignupSuccess";
import { cn } from "@/lib/utils";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLE_IDS = ["seller", "supplier", "creator"] as const;
type RoleId = (typeof ROLE_IDS)[number];

type FieldErrors = { fullName?: string; email?: string; password?: string; terms?: string };

const ROLE_META: Record<RoleId, { icon: typeof Store; gradient: string }> = {
  seller: { icon: Store, gradient: "from-[#2E3192] to-[#4f56d6]" },
  supplier: { icon: Package, gradient: "from-[#00A99D] to-[#0d8f86]" },
  creator: { icon: Camera, gradient: "from-violet-500 to-purple-600" },
};

function RegisterForm() {
  const { t, dir, language } = useTranslation();
  const [selectedRole, setSelectedRole] = useState<RoleId>("seller");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [emailExists, setEmailExists] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  useEffect(() => {
    const roleParam = new URLSearchParams(window.location.search).get("role");
    if (ROLE_IDS.includes(roleParam as RoleId)) setSelectedRole(roleParam as RoleId);
  }, []);

  function clearError(field: keyof FieldErrors) {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!fullName.trim()) next.fullName = "register.errors.name_required";
    if (!email.trim()) next.email = "register.errors.email_required";
    else if (!EMAIL_REGEX.test(email.trim())) next.email = "register.errors.invalid_email";
    if (password.length < 8) next.password = "register.toasts.password_short";
    if (!acceptTerms) next.terms = "register.errors.terms_required";
    return next;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fieldErrors = validate();
    setErrors(fieldErrors);
    setFormError(null);
    setEmailExists(false);

    const firstInvalid = (["fullName", "email", "password", "terms"] as const).find((f) => fieldErrors[f]);
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      return;
    }

    setLoading(true);
    const normalizedEmail = email.trim().toLowerCase();

    let response: Response;
    let result: { error?: string; code?: string } = {};
    try {
      response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
          fullName: fullName.trim(),
          role: selectedRole,
          lang: language,
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

    setSubmittedEmail(normalizedEmail);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (submittedEmail) {
    return (
      <SignupSuccess
        email={submittedEmail}
        onChangeEmail={() => {
          setSubmittedEmail(null);
          setPassword("");
        }}
      />
    );
  }

  return (
    <div className="space-y-7">
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">{t("register.title")}</h1>
        <p className="text-slate-500">{t("register.subtitle")}</p>
      </div>

      {formError && <AuthAlert variant="error" title={t("register.toasts.error_title")}>{t(formError)}</AuthAlert>}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <fieldset className="space-y-2.5">
          <legend className="mb-2.5 text-sm font-semibold text-slate-700">{t("register.role_label")}</legend>
          <div className="grid grid-cols-3 gap-2.5">
            {ROLE_IDS.map((id) => {
              const meta = ROLE_META[id];
              const Icon = meta.icon;
              const active = selectedRole === id;
              return (
                <label
                  key={id}
                  className={cn(
                    "relative flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 p-3 text-center transition-all focus-within:ring-4 focus-within:ring-[#2E3192]/15",
                    active ? "border-[#2E3192] bg-[#2E3192]/[0.04]" : "border-slate-100 bg-slate-50/60 hover:border-slate-200"
                  )}
                >
                  <input
                    type="radio"
                    name="role"
                    value={id}
                    checked={active}
                    onChange={() => setSelectedRole(id)}
                    className="sr-only"
                  />
                  {active && (
                    <span className="absolute end-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-[#2E3192]">
                      <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                    </span>
                  )}
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${meta.gradient}`}>
                    <Icon className="h-5 w-5 text-white" />
                  </span>
                  <span className={cn("text-xs font-bold", active ? "text-[#2E3192]" : "text-slate-700")}>
                    {t(`register.roles.${id}`)}
                  </span>
                  <span className="hidden text-[11px] leading-tight text-slate-500 sm:block">
                    {t(`register.roles.${id}_desc`)}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <AuthField
          id="fullName"
          label={t("register.full_name")}
          icon={User}
          placeholder={t("register.full_name_placeholder")}
          autoComplete="name"
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            clearError("fullName");
          }}
          error={errors.fullName && t(errors.fullName)}
        />

        <div className="space-y-2">
          <AuthField
            id="email"
            type="email"
            label={t("register.email")}
            icon={Mail}
            placeholder={t("login.email_placeholder")}
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearError("email");
              setEmailExists(false);
            }}
            error={errors.email && t(errors.email)}
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

        <PasswordField
          id="password"
          label={t("register.password")}
          icon={Lock}
          placeholder={t("register.password_placeholder")}
          autoComplete="new-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            clearError("password");
          }}
          error={errors.password && t(errors.password)}
          footer={!errors.password && <PasswordStrength password={password} />}
        />

        <div className="space-y-1.5">
          <label className="flex cursor-pointer items-start gap-3">
            <span className="relative mt-0.5 flex h-5 w-5 shrink-0">
              <input
                id="terms"
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => {
                  setAcceptTerms(e.target.checked);
                  clearError("terms");
                }}
                aria-invalid={Boolean(errors.terms)}
                className={cn(
                  "peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 bg-white transition-colors checked:border-[#2E3192] checked:bg-[#2E3192] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2E3192]/15",
                  errors.terms ? "border-red-400" : "border-slate-300"
                )}
              />
              <Check
                className="pointer-events-none absolute inset-0 m-auto hidden h-3.5 w-3.5 text-white peer-checked:block"
                strokeWidth={3}
              />
            </span>
            <span className="text-sm leading-snug text-slate-600">
              {t("register.terms_accept")}{" "}
              <Link href="/conditions-utilisation" target="_blank" className="font-semibold text-[#2E3192] hover:underline">
                {t("register.terms_link")}
              </Link>{" "}
              {t("register.privacy_and")}{" "}
              <Link href="/politique-confidentialite" target="_blank" className="font-semibold text-[#2E3192] hover:underline">
                {t("register.privacy_link")}
              </Link>
            </span>
          </label>
          {errors.terms && <p className="ps-8 text-xs font-medium text-red-600">{t(errors.terms)}</p>}
        </div>

        <SubmitButton loading={loading} loadingLabel={t("register.submitting")}>
          {t("register.submit")}
          <ArrowRight className={`h-4 w-4 ${dir === "rtl" ? "rotate-180" : ""}`} />
        </SubmitButton>
      </form>

      <p className="text-center text-sm text-slate-500">
        {t("register.has_account")}{" "}
        <Link href="/login" className="font-semibold text-[#2E3192] hover:text-[#00A99D] transition-colors">
          {t("register.login")}
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <AuthShell wide>
      <RegisterForm />
    </AuthShell>
  );
}
