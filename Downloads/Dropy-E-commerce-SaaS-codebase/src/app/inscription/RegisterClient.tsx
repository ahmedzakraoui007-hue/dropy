"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Logo } from "@/components/ui/logo";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, User, Check, Store, Package, Camera, Star, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useTranslation } from "@/context/LanguageContext";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, dir, language } = useTranslation();
  const defaultRole = searchParams.get("role") || "seller";

  const roles = [
    {
      id: "seller",
      icon: Store,
      title: t("register.roles.seller"),
      description: t("register.roles.seller_desc"),
      color: "indigo",
      gradient: "from-indigo-500 to-blue-600"
    },
    {
      id: "supplier",
      icon: Package,
      title: t("register.roles.supplier"),
      description: t("register.roles.supplier_desc"),
      color: "emerald",
      gradient: "from-emerald-500 to-teal-600"
    },
    {
      id: "creator",
      icon: Camera,
      title: t("register.roles.creator"),
      description: t("register.roles.creator_desc"),
      color: "violet",
      gradient: "from-violet-500 to-purple-600"
    },
  ];

  const [selectedRole, setSelectedRole] = useState(defaultRole);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!acceptTerms) {
      toast.error(t("register.toasts.accept_terms"));
      return;
    }

    if (password.length < 8) {
      toast.error(t("register.toasts.password_short"));
      return;
    }

    setLoading(true);

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        fullName,
        role: selectedRole,
        lang: language,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      toast.error(t("register.toasts.error_title"), {
        description: result.error || t("forgot_password.error_generic"),
      });
      setLoading(false);
      return;
    }

    toast.success(t("register.toasts.success_title"), {
      description: t("register.toasts.success_desc").replace("{email}", email),
    });
    router.push("/login?message=check-email");
    setLoading(false);
  }

  async function handleGoogleLogin() {
    const { createClient } = await import("@/lib/supabase/client");
    const { getURL } = await import("@/lib/utils");
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${getURL()}/auth/callback?next=/demande-en-attente`,
      },
    });
  }

  return (
    <div className="w-full max-w-md space-y-8" dir={dir}>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">{t("register.title")}</h1>
        <p className="text-gray-500">{t("register.subtitle")}</p>
      </div>

      <div className="space-y-3">
        <Label className="text-gray-700 font-medium">{t("register.role_label")}</Label>
        <div className="grid grid-cols-3 gap-3">
          {roles.map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => setSelectedRole(role.id)}
              className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                selectedRole === role.id
                  ? "border-indigo-600 bg-indigo-50"
                  : "border-gray-100 bg-gray-50 hover:border-gray-200"
              }`}
            >
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${role.gradient} flex items-center justify-center`}>
                <role.icon className="w-5 h-5 text-white" />
              </div>
              <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-tight ${selectedRole === role.id ? "text-indigo-600" : "text-gray-500"}`}>
                {role.title}
              </span>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">{t("register.full_name")}</Label>
          <div className="relative">
            <User className={`absolute ${dir === 'rtl' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400`} />
            <Input
              id="fullName"
              placeholder="Ahmed Ben Ali"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={`${dir === 'rtl' ? 'pr-10' : 'pl-10'} h-11 border-gray-200 focus:border-indigo-600 focus:ring-indigo-600`}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">{t("register.email")}</Label>
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
          <Label htmlFor="password">{t("register.password")}</Label>
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
          <p className="text-[10px] text-gray-400">{t("register.password_hint")}</p>
        </div>

        <div className="flex items-start gap-2 pt-2">
          <button
            type="button"
            onClick={() => setAcceptTerms(!acceptTerms)}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 mt-0.5 ${
              acceptTerms ? "bg-indigo-600 border-indigo-600" : "border-gray-200"
            }`}
          >
            {acceptTerms && <Check className="w-3 h-3 text-white" />}
          </button>
          <span className="text-xs text-gray-500 leading-tight">
            {t("register.terms_accept")}{" "}
            <Link href="/conditions-utilisation" className="text-indigo-600 font-semibold hover:underline">{t("register.terms_link")}</Link>
            {" "}{t("register.privacy_and")}{" "}
            <Link href="/politique-confidentialite" className="text-indigo-600 font-semibold hover:underline">{t("register.privacy_link")}</Link>
          </span>
        </div>

        <Button 
          type="submit" 
          className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm mt-4"
          disabled={loading || !acceptTerms}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
            <div className="flex items-center gap-2">
              {t("register.submit")}
              <ArrowRight className={`h-4 w-4 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
            </div>
          )}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-100" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-400">{t("register.or")}</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleLogin}
        className="w-full h-11 border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-lg"
      >
        <svg className={`h-4 w-4 ${dir === 'rtl' ? 'ml-2' : 'mr-2'}`} viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        {t("register.google")}
      </Button>

      <p className="text-center text-sm text-gray-500">
        {t("register.has_account")}{" "}
        <Link 
          href="/login" 
          className="font-semibold text-indigo-600 hover:text-indigo-500"
        >
          {t("register.login")}
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  const [mounted, setMounted] = useState(false);
  const { t, dir } = useTranslation();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-white" dir={dir}>
      {/* Left Side - Illustration */}
      <div className="relative hidden lg:block lg:flex-1 bg-gray-50">
        <div className="absolute inset-0 bg-indigo-600">
          <img
            src="https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&q=80"
            alt="Business growth"
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
              <h2 className="text-4xl font-bold leading-tight italic">
                "{t("login.quote")}"
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

      {/* Right Side - Form */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="mb-10 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Logo className="h-8 w-auto" />
            </Link>
            <LanguageSwitcher />
          </div>
          
          <Suspense fallback={<div className="h-96 animate-pulse bg-gray-50 rounded-xl" />}>
            <RegisterForm />
          </Suspense>

          <div className="mt-12 text-xs text-gray-400 text-center lg:text-start">
            {t("login.footer")}
          </div>
        </div>
      </div>
    </div>
  );
}
