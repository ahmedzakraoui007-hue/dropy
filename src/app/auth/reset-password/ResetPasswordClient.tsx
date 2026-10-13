"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Lock, ShieldCheck, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useTranslation } from "@/context/LanguageContext";
import { AuthShell } from "@/components/auth/AuthShell";
import { PasswordField, PasswordStrength, AuthAlert, SubmitButton } from "@/components/auth/AuthFields";

type FieldErrors = { password?: string; confirm?: string };

export default function ResetPasswordClient() {
  const { t, dir } = useTranslation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setHasSession(Boolean(data.user)));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: FieldErrors = {};
    if (password.length < 8) next.password = "reset_password.too_short";
    else if (password !== confirmPassword) next.confirm = "reset_password.mismatch";
    setErrors(next);
    if (next.password || next.confirm) {
      document.getElementById(next.password ? "password" : "confirm-password")?.focus();
      return;
    }

    setLoading(true);
    setFormError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setFormError(error.message);
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    setLoading(false);
    setSuccess(true);
  }

  let content: React.ReactNode;

  if (hasSession === null) {
    content = <div className="h-80 animate-pulse rounded-2xl bg-slate-50" />;
  } else if (success) {
    content = (
      <div className="space-y-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-[#00A99D] shadow-lg shadow-emerald-500/20">
          <ShieldCheck className="h-8 w-8 text-white" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight text-slate-900">{t("reset_password.success_title")}</h1>
          <p className="text-slate-500">{t("reset_password.success_desc")}</p>
        </div>
        <Link
          href="/login"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2E3192] to-[#3a43b5] text-[15px] font-semibold text-white shadow-lg shadow-[#2E3192]/20 transition-all hover:brightness-110"
        >
          {t("reset_password.login_now")}
          <ArrowRight className={`h-4 w-4 ${dir === "rtl" ? "rotate-180" : ""}`} />
        </Link>
      </div>
    );
  } else if (!hasSession) {
    content = (
      <div className="space-y-6">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">{t("reset_password.title")}</h1>
        <AuthAlert variant="warning" title={t("reset_password.no_session_title")}>
          {t("reset_password.no_session_desc")}
        </AuthAlert>
        <Link
          href="/forgot-password"
          className="flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#2E3192] to-[#3a43b5] text-[15px] font-semibold text-white shadow-lg shadow-[#2E3192]/20 transition-all hover:brightness-110"
        >
          {t("reset_password.request_new")}
        </Link>
      </div>
    );
  } else {
    content = (
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight text-slate-900">{t("reset_password.title")}</h1>
          <p className="text-slate-500">{t("reset_password.subtitle")}</p>
        </div>

        {formError && <AuthAlert variant="error" title={t("reset_password.error")}>{formError}</AuthAlert>}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <PasswordField
            id="password"
            label={t("reset_password.new_password")}
            icon={Lock}
            placeholder={t("register.password_placeholder")}
            autoComplete="new-password"
            autoFocus
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            error={errors.password && t(errors.password)}
            footer={!errors.password && <PasswordStrength password={password} />}
          />

          <PasswordField
            id="confirm-password"
            label={t("reset_password.confirm_password")}
            icon={Lock}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setErrors((prev) => ({ ...prev, confirm: undefined }));
            }}
            error={errors.confirm && t(errors.confirm)}
          />

          <SubmitButton loading={loading} loadingLabel={t("reset_password.submitting")}>
            {t("reset_password.submit")}
          </SubmitButton>
        </form>
      </div>
    );
  }

  return <AuthShell>{content}</AuthShell>;
}
