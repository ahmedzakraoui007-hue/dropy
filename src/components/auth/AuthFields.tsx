"use client";

import { forwardRef, useState } from "react";
import { Eye, EyeOff, AlertCircle, CheckCircle2, Info, type LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

interface AuthFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  icon: LucideIcon;
  error?: string;
  hint?: string;
  labelAction?: React.ReactNode;
  endAdornment?: React.ReactNode;
}

export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(function AuthField(
  { id, label, icon: Icon, error, hint, labelAction, endAdornment, className, ...props },
  ref
) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id} className="text-sm font-semibold text-slate-700">
          {label}
        </Label>
        {labelAction}
      </div>
      <div className="relative">
        <Icon className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          ref={ref}
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={cn(
            "h-12 rounded-xl border-slate-200 bg-slate-50/60 ps-10 text-[15px] transition-colors focus-visible:border-[#2E3192] focus-visible:bg-white focus-visible:ring-[#2E3192]/15",
            error && "border-red-400 bg-red-50/40 focus-visible:border-red-500 focus-visible:ring-red-500/15",
            className
          )}
          {...props}
        />
        {endAdornment}
      </div>
      {error ? (
        <p id={`${id}-error`} className="flex items-center gap-1.5 text-xs font-medium text-red-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

type PasswordFieldProps = Omit<AuthFieldProps, "icon" | "type"> & { icon: LucideIcon; footer?: React.ReactNode };

export function PasswordField({ footer, ...props }: PasswordFieldProps) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-2">
      <AuthField
        {...props}
        type={visible ? "text" : "password"}
        className="pe-11"
        endAdornment={
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? t("auth.hide_password") : t("auth.show_password")}
            aria-pressed={visible}
            className="absolute end-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E3192]/30"
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        }
      />
      {footer}
    </div>
  );
}

export function passwordScore(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (password.length < 8) return Math.min(score, 1);
  return Math.min(score, 4);
}

export function PasswordStrength({ password }: { password: string }) {
  const { t } = useTranslation();
  if (!password) return null;

  const score = passwordScore(password);
  const levels = [
    { label: t("auth.strength.too_short"), color: "bg-red-500", text: "text-red-600" },
    { label: t("auth.strength.weak"), color: "bg-orange-500", text: "text-orange-600" },
    { label: t("auth.strength.fair"), color: "bg-amber-400", text: "text-amber-600" },
    { label: t("auth.strength.good"), color: "bg-emerald-500", text: "text-emerald-600" },
    { label: t("auth.strength.strong"), color: "bg-emerald-600", text: "text-emerald-700" },
  ];
  const level = password.length < 8 ? levels[0] : levels[Math.max(score, 1)];
  const filled = password.length < 8 ? 1 : Math.max(score, 1);

  return (
    <div className="space-y-1.5" aria-live="polite">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn("h-1.5 flex-1 rounded-full transition-colors", i < filled ? level.color : "bg-slate-200")}
          />
        ))}
      </div>
      <p className={cn("text-xs font-medium", level.text)}>{level.label}</p>
    </div>
  );
}

const ALERT_STYLES = {
  info: { box: "border-sky-200 bg-sky-50 text-sky-900", icon: Info, iconColor: "text-sky-600" },
  success: { box: "border-emerald-200 bg-emerald-50 text-emerald-900", icon: CheckCircle2, iconColor: "text-emerald-600" },
  error: { box: "border-red-200 bg-red-50 text-red-900", icon: AlertCircle, iconColor: "text-red-600" },
  warning: { box: "border-amber-200 bg-amber-50 text-amber-900", icon: AlertCircle, iconColor: "text-amber-600" },
};

export function AuthAlert({
  variant,
  title,
  children,
}: {
  variant: keyof typeof ALERT_STYLES;
  title: string;
  children?: React.ReactNode;
}) {
  const style = ALERT_STYLES[variant];
  const Icon = style.icon;
  return (
    <div role={variant === "error" ? "alert" : "status"} className={cn("flex gap-3 rounded-xl border p-4 text-sm", style.box)}>
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", style.iconColor)} />
      <div className="space-y-1">
        <p className="font-semibold">{title}</p>
        {children && <div className="text-[13px] leading-relaxed opacity-90">{children}</div>}
      </div>
    </div>
  );
}

export function SubmitButton({
  loading,
  loadingLabel,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading: boolean; loadingLabel: string }) {
  return (
    <button
      type="submit"
      disabled={loading || props.disabled}
      aria-busy={loading}
      className={cn(
        "flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2E3192] to-[#3a43b5] text-[15px] font-semibold text-white shadow-lg shadow-[#2E3192]/20 transition-all hover:shadow-xl hover:shadow-[#2E3192]/25 hover:brightness-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2E3192]/25 disabled:cursor-not-allowed disabled:opacity-70",
        className
      )}
      {...props}
    >
      {loading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          {loadingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
