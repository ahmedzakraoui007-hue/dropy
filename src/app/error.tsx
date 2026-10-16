"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-5">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2E3192] to-[#00A99D] flex items-center justify-center text-white text-2xl font-black">
          !
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-900">Une erreur est survenue</h1>
          <p className="text-slate-500">Cette page n&apos;a pas pu s&apos;afficher. Réessayez dans un instant.</p>
          <p className="text-slate-500" dir="rtl">حدث خطأ. يرجى المحاولة مرة أخرى.</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={reset}
            className="h-11 px-5 rounded-xl bg-[#2E3192] text-white font-semibold hover:brightness-110 transition"
          >
            Réessayer
          </button>
          <Link href="/" className="h-11 px-5 rounded-xl border border-slate-200 font-semibold inline-flex items-center hover:bg-slate-50 transition">
            Retour à l&apos;accueil
          </Link>
        </div>
        {error.digest && <p className="text-xs text-slate-400">Réf. {error.digest}</p>}
      </div>
    </div>
  );
}
