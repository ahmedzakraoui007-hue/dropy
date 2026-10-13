"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, Check, Star, Quote } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useTranslation } from "@/context/LanguageContext";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, dir } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const message = searchParams.get("message");
    const error = searchParams.get("error");
    if (message === "check-email") {
      toast.info(t("login.toasts.check_email_title"), {
        description: t("login.toasts.check_email_desc"),
      });
    } else if (message === "email-confirmed") {
      toast.success(t("login.toasts.confirmed_title"), {
        description: t("login.toasts.confirmed_desc"),
      });
    } else if (error) {
      toast.error(t("login.toasts.error_title"), {
        description: t("login.toasts.link_invalid"),
      });
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      let errorMessage = error.message;
      if (error.code === "invalid_credentials" || error.message === "Invalid login credentials") {
        errorMessage = t("login.toasts.invalid_credentials");
      } else if (error.code === "email_not_confirmed" || error.message.includes("Email not confirmed")) {
        errorMessage = t("login.toasts.email_not_confirmed");
      }
      toast.error(t("login.toasts.error_title"), {
        description: errorMessage,
      });
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profile?.status === "pending") {
      toast.warning(t("login.toasts.pending_title"), {
        description: t("login.toasts.pending_desc"),
      });
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    if (profile?.status === "suspended") {
      toast.error(t("login.toasts.suspended_title"), {
        description: t("login.toasts.suspended_desc"),
      });
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    const userRole = profile?.role || data.user.user_metadata?.role || "seller";
    
    const redirectMap: Record<string, string> = {
      admin: "/admin",
      seller: "/seller/dashboard",
      supplier: "/supplier/dashboard",
      creator: "/creator/dashboard",
    };

    const home = redirectMap[userRole] || "/seller/dashboard";
    const requested = searchParams.get("redirect");
    const roleRoot = home.split("/")[1];
    const target =
      requested && requested.startsWith(`/${roleRoot}`) && !requested.startsWith("//")
        ? requested
        : home;

    toast.success(t("login.toasts.success_title"));
    router.replace(target);
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm mx-auto space-y-8" dir={dir}>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">{t("login.title")}</h1>
        <p className="text-gray-500">{t("login.subtitle")}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t("login.email")}</Label>
          <div className="relative">
            <Mail className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400`} />
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${dir === 'rtl' ? 'pr-10' : 'pl-10'} h-11 border-gray-200 focus:border-indigo-600 focus:ring-indigo-600`}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t("login.password")}</Label>
            <Link 
              href="/forgot-password" 
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              {t("login.forgot_password")}
            </Link>
          </div>
          <div className="relative">
            <Lock className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400`} />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${dir === 'rtl' ? 'pr-10 pl-10' : 'pl-10 pr-10'} h-11 border-gray-200 focus:border-indigo-600 focus:ring-indigo-600`}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={`absolute ${dir === 'rtl' ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600`}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm"
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
            <div className="flex items-center gap-2">
              {t("login.submit")}
              <ArrowRight className={`h-4 w-4 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
            </div>
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500">
        {t("login.no_account")}{" "}
        <Link 
          href="/inscription" 
          className="font-semibold text-indigo-600 hover:text-indigo-500"
        >
          {t("login.signup")}
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  const [mounted, setMounted] = useState(false);
  const { t, dir } = useTranslation();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-white" dir={dir}>
      {/* Left Side - Form */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="mb-10 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Logo className="h-8 w-auto" />
            </Link>
            <LanguageSwitcher />
          </div>
          
          <Suspense fallback={<div className="h-96 animate-pulse bg-gray-50 rounded-xl" />}>
            <LoginForm />
          </Suspense>

          <div className="mt-12 text-xs text-gray-400 text-center lg:text-start">
            {t("login.footer")}
          </div>
        </div>
      </div>

      {/* Right Side - Testimonial/Visual */}
      <div className="relative hidden lg:block lg:flex-1 bg-gray-50">
        <div className="absolute inset-0 bg-indigo-600">
          <img
            src="https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80"
            alt="Business collaboration"
            className="h-full w-full object-cover mix-blend-multiply opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/80 via-indigo-900/40 to-transparent" />
        </div>
        
        <div className="relative h-full flex flex-col justify-end p-16 text-white">
          <div className="max-w-xl space-y-8">
            <div className="flex gap-1 text-emerald-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-current" />
              ))}
            </div>
            
            <div className="space-y-4">
              <Quote className="h-12 w-12 text-indigo-300 opacity-50" />
              <h2 className="text-4xl font-bold leading-tight">
                {t("login.quote")}
              </h2>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center font-bold text-xl border border-white/20">
                {t("login.quote_author").charAt(0)}
              </div>
              <div>
                <p className="font-bold text-lg">{t("login.quote_author")}</p>
                <p className="text-indigo-200">{t("login.author_role")}</p>
              </div>
            </div>
          </div>
          
          <div className="mt-16 grid grid-cols-3 gap-8 border-t border-white/10 pt-8">
            <div>
              <p className="text-3xl font-bold">500+</p>
              <p className="text-sm text-indigo-200">Sellers in Tunisia</p>
            </div>
            <div>
              <p className="text-3xl font-bold">24/48h</p>
              <p className="text-sm text-indigo-200">Delivery Speed</p>
            </div>
            <div>
              <p className="text-3xl font-bold">Zéro</p>
              <p className="text-sm text-indigo-200">Inventory Risk</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
