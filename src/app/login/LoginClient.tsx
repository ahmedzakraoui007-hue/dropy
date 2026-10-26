"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "@/context/LanguageContext";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthField, PasswordField, AuthAlert, SubmitButton } from "@/components/auth/AuthFields";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Notice = { variant: "info" | "success" | "error" | "warning"; title: string; desc?: string; rawDesc?: string } | null;
type FieldErrors = { email?: string; password?: string };

function LoginForm() {
  const router = useRouter();
  const { t, dir } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [notice, setNotice] = useState<Notice>(null);
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const message = searchParams.get("message");
    const error = searchParams.get("error");
    if (message === "check-email") {
      setNotice({ variant: "info", title: "login.toasts.check_email_title", desc: "login.toasts.check_email_desc" });
    } else if (message === "email-confirmed") {
      setNotice({ variant: "success", title: "login.toasts.confirmed_title", desc: "login.toasts.confirmed_desc" });
    } else if (error === "account_disabled" || error === "no_profile") {
      createClient().auth.signOut();
      setNotice(
        error === "account_disabled"
          ? { variant: "error", title: "login.toasts.suspended_title", desc: "login.toasts.suspended_desc" }
          : { variant: "error", title: "login.toasts.error_title", desc: "login.errors.no_profile" }
      );
    } else if (error) {
      setNotice({ variant: "error", title: "login.toasts.error_title", desc: "login.toasts.link_invalid" });
    }
  }, []);

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    const trimmed = email.trim();
    if (!trimmed) next.email = "login.errors.email_required";
    else if (!EMAIL_REGEX.test(trimmed)) next.email = "login.errors.email_invalid";
    if (!password) next.password = "login.errors.password_required";
    return next;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fieldErrors = validate();
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length) {
      document.getElementById(fieldErrors.email ? "email" : "password")?.focus();
      return;
    }

    setLoading(true);
    setNotice(null);
    setUnconfirmed(false);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      if (error.code === "email_not_confirmed" || error.message.includes("Email not confirmed")) {
        setUnconfirmed(true);
        setNotice({ variant: "warning", title: "login.toasts.email_not_confirmed" });
      } else if (error.code === "invalid_credentials" || error.message === "Invalid login credentials") {
        setNotice({ variant: "error", title: "login.toasts.invalid_credentials" });
      } else if (error.name === "AuthRetryableFetchError" || error.status === 0 || /fetch|network/i.test(error.message)) {
        setNotice({ variant: "error", title: "login.toasts.error_title", desc: "login.errors.network" });
      } else {
        setNotice({ variant: "error", title: "login.toasts.error_title", rawDesc: error.message });
      }
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profile?.status === "pending" || profile?.status === "suspended") {
      await supabase.auth.signOut();
      const key = profile.status === "pending" ? "pending" : "suspended";
      setNotice({
        variant: key === "pending" ? "warning" : "error",
        title: `login.toasts.${key}_title`,
        desc: `login.toasts.${key}_desc`,
      });
      setLoading(false);
      return;
    }

    const userRole = profile?.role || data.user.user_metadata?.role || "seller";
    const redirectMap: Record<string, string> = {
      admin: "/admin",
      seller: "/seller/dashboard",
      supplier: "/supplier/dashboard",
      creator: "/creator/dashboard",
      agent: "/team",
    };

    const home = redirectMap[userRole] || "/seller/dashboard";
    const requested = new URLSearchParams(window.location.search).get("redirect");
    const roleRoot = home.split("/")[1];
    const target =
      requested && requested.startsWith(`/${roleRoot}`) && !requested.startsWith("//") ? requested : home;

    toast.success(t("login.toasts.success_title"));
    router.replace(target);
    router.refresh();
  }

  async function resendConfirmation() {
    setResending(true);
    await fetch("/api/auth/resend-confirmation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    }).catch(() => null);
    setResending(false);
    setUnconfirmed(false);
    setNotice({ variant: "info", title: "login.toasts.check_email_title", desc: "login.resend_sent" });
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight text-slate-900">{t("login.title")}</h1>
        <p className="text-slate-500">{t("login.subtitle")}</p>
      </div>

      {notice && (
        <AuthAlert variant={notice.variant} title={t(notice.title)}>
          {notice.desc ? t(notice.desc) : notice.rawDesc}
          {unconfirmed && (
            <button
              type="button"
              onClick={resendConfirmation}
              disabled={resending}
              className="mt-2 block font-semibold underline underline-offset-2 hover:no-underline disabled:opacity-60"
            >
              {t("login.resend_confirmation")}
            </button>
          )}
        </AuthAlert>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <AuthField
          id="email"
          type="email"
          label={t("login.email")}
          icon={Mail}
          placeholder={t("login.email_placeholder")}
          autoComplete="email"
          inputMode="email"
          autoFocus
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
          }}
          error={errors.email && t(errors.email)}
        />

        <PasswordField
          id="password"
          label={t("login.password")}
          icon={Lock}
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
          }}
          error={errors.password && t(errors.password)}
          labelAction={
            <Link
              href="/forgot-password"
              className="text-sm font-semibold text-[#2E3192] hover:text-[#00A99D] transition-colors"
            >
              {t("login.forgot_password")}
            </Link>
          }
        />

        <SubmitButton loading={loading} loadingLabel={t("login.submitting")}>
          {t("login.submit")}
          <ArrowRight className={`h-4 w-4 ${dir === "rtl" ? "rotate-180" : ""}`} />
        </SubmitButton>
      </form>

      <p className="text-center text-sm text-slate-500">
        {t("login.no_account")}{" "}
        <Link href="/inscription" className="font-semibold text-[#2E3192] hover:text-[#00A99D] transition-colors">
          {t("login.signup")}
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthShell>
      <LoginForm />
    </AuthShell>
  );
}
