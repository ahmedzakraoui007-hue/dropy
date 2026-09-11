"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, Lock, Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function ResetPasswordClient() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    if (password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      toast.error("Erreur", {
        description: error.message,
      });
      setLoading(false);
      return;
    }

    setSuccess(true);
    toast.success("Succès", {
      description: "Votre mot de passe a été mis à jour avec succès.",
    });
    
    setTimeout(() => {
      router.push("/login");
    }, 3000);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-[#F9FAFB]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/" className="flex items-center gap-2.5 justify-center mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-gray-900">Dropy</span>
          </Link>
          <h2 className="text-3xl font-bold mb-2 text-gray-900">Nouveau mot de passe</h2>
          <p className="text-gray-500">
            Choisissez un mot de passe fort pour sécuriser votre compte.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-xl shadow-gray-200/50">
          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password">Nouveau mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-11 pr-11 h-12 border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-500 rounded-xl transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-11 h-12 border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-500 rounded-xl transition-all"
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
                  "Réinitialiser le mot de passe"
                )}
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Mot de passe mis à jour !</h3>
                <p className="text-gray-600 text-sm">
                  Votre mot de passe a été modifié avec succès. Vous allez être redirigé vers la page de connexion.
                </p>
              </div>
              <Button asChild className="w-full h-12 font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl">
                <Link href="/login">Se connecter maintenant</Link>
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
