"use client";

import { useTranslation } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LanguageSwitcherProps {
  className?: string;
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { locale, setLocale, dir } = useTranslation();

  return (
    <DropdownMenu dir={dir}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={`rounded-xl px-3 flex items-center gap-2 text-slate-600 hover:bg-slate-50 transition-colors ${className}`}>
          <Languages className="w-4 h-4" />
          <span className="text-xs font-bold uppercase hidden sm:inline">
            {locale === 'fr' ? 'Français' : 'العربية'}
          </span>
          <span className="text-xs font-bold uppercase sm:hidden">
            {locale === 'fr' ? 'FR' : 'AR'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xl border-slate-200">
        <DropdownMenuItem 
          className={`cursor-pointer font-bold transition-colors ${locale === 'fr' ? 'text-[#2E3192] bg-slate-50' : 'hover:bg-slate-50'}`}
          onClick={() => setLocale('fr')}
        >
          Français
        </DropdownMenuItem>
        <DropdownMenuItem 
          className={`cursor-pointer font-bold transition-colors ${locale === 'ar' ? 'text-[#2E3192] bg-slate-50' : 'hover:bg-slate-50'}`}
          onClick={() => setLocale('ar')}
        >
          العربية
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
