"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, Loader2, Send, CheckCircle } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useTranslation } from "@/context/LanguageContext";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

export default function ForgotPasswordPage() {
  const { t, dir } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const result = await response.json();

    if (!response.ok) {
      toast.error(t("forgot_password.error"), {
        description: result.error || t("forgot_password.error_generic"),
      });
      setLoading(false);
      return;
    }

    setSubmitted(true);
    toast.success(t("forgot_password.toast_success"), {
      description: t("forgot_password.toast_success_desc"),
    });
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50" dir={dir}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo className="h-12 w-auto" />
          </Link>
          <LanguageSwitcher />
        </div>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2 text-gray-900">
            {t("forgot_password.title")}
          </h2>
          <p className="text-gray-500">
            {t("forgot_password.subtitle")}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-xl shadow-gray-200/50">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">
                  {t("forgot_password.email")}
                </Label>
                <div className="relative">
                  <Mail className={`absolute ${dir === 'rtl' ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400`} />
                    <Input
                      id="email"
                      type="email"
                      placeholder="votre@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onInvalid={(e) => {
                        const target = e.target as HTMLInputElement;
                        target.setCustomValidity(t("register.errors.invalid_email"));
                      }}
                      onInput={(e) => {
                        const target = e.target as HTMLInputElement;
                        target.setCustomValidity("");
                      }}
                      className={`${dir === 'rtl' ? 'pr-11 pl-4' : 'pl-11 pr-4'} h-12 border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-600 focus:ring-indigo-500/20 rounded-xl transition-all`}
                      required
                    />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/25 transition-all"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                      {t("forgot_password.submit")}
                      <Send className={`${dir === 'rtl' ? 'ms-2 scale-x-[-1]' : 'ms-2'} w-4 h-4`} />
                  </>
                )}
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {t("forgot_password.success_title")}
                </h3>
                <p className="text-gray-600 text-sm">
                  {t("forgot_password.success_desc").replace("{email}", email)}
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setSubmitted(false)} 
                className="w-full h-12 font-semibold border-gray-200 rounded-xl"
              >
                {t("forgot_password.try_another")}
              </Button>
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <Link href="/login" className="text-gray-500 hover:text-gray-700 flex items-center justify-center gap-2 font-medium transition-colors">
            <ArrowLeft className={`w-4 h-4 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
            {t("forgot_password.back_to_login")}
          </Link>
        </div>
      </motion.div>
    </div>

  );
}

