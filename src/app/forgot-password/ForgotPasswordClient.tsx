"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, Send, MailCheck } from "lucide-react";
import { useTranslation } from "@/context/LanguageContext";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthField, AuthAlert, SubmitButton } from "@/components/auth/AuthFields";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ForgotPasswordForm() {
  const { t, dir } = useTranslation();
  const [expired, setExpired] = useState(false);

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setExpired(new URLSearchParams(window.location.search).get("error") === "expired");
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setError("login.errors.email_required");
      return;
    }
    if (!EMAIL_REGEX.test(trimmed)) {
      setError("login.errors.email_invalid");
      return;
    }

    setLoading(true);
    setFormError(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed.toLowerCase() }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setFormError(result.error || t("forgot_password.error_generic"));
        setLoading(false);
        return;
      }
    } catch {
      setFormError(t("forgot_password.error_generic"));
      setLoading(false);
      return;
    }

    setLoading(false);
    setSubmitted(true);
  }

  const backLink = (
    <Link
      href="/login"
      className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
    >
      <ArrowLeft className={`h-4 w-4 ${dir === "rtl" ? "rotate-180" : ""}`} />
      {t("forgot_password.back_to_login")}
    </Link>
  );

  if (submitted) {
    return (
      <div className="space-y-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2E3192] to-[#00A99D] shadow-lg shadow-[#2E3192]/20">
          <MailCheck className="h-8 w-8 text-white" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight text-slate-900">{t("forgot_password.success_title")}</h1>
          <p className="text-slate-500">{t("forgot_password.success_desc").replace("{email}", email.trim())}</p>
        </div>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="h-12 w-full rounded-xl border border-slate-200 text-[15px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          {t("forgot_password.try_another")}
        </button>
        {backLink}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">{t("forgot_password.title")}</h1>
        <p className="text-slate-500">{t("forgot_password.subtitle")}</p>
      </div>

      {expired && !formError && (
        <AuthAlert variant="warning" title={t("forgot_password.expired_title")}>
          {t("forgot_password.expired_desc")}
        </AuthAlert>
      )}
      {formError && <AuthAlert variant="error" title={t("forgot_password.error")}>{formError}</AuthAlert>}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <AuthField
          id="email"
          type="email"
          label={t("forgot_password.email")}
          icon={Mail}
          placeholder={t("login.email_placeholder")}
          autoComplete="email"
          inputMode="email"
          autoFocus
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(null);
          }}
          error={error ? t(error) : undefined}
        />

        <SubmitButton loading={loading} loadingLabel={t("forgot_password.submitting")}>
          {t("forgot_password.submit")}
          <Send className={`h-4 w-4 ${dir === "rtl" ? "-scale-x-100" : ""}`} />
        </SubmitButton>
      </form>

      <div className="text-center">{backLink}</div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      <ForgotPasswordForm />
    </AuthShell>
  );
}
