"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import fr from '@/locales/fr.json';
import ar from '@/locales/ar.json';

type Locale = 'fr' | 'ar';
type Translations = typeof fr;

interface LanguageContextType {
  locale: Locale;
  language: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  dir: 'ltr' | 'rtl';
}

const translations: Record<Locale, any> = { fr, ar };

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>('fr');

  useEffect(() => {
    const detectLanguage = async () => {
      const savedLocale = localStorage.getItem('locale') as Locale;
      if (savedLocale && (savedLocale === 'fr' || savedLocale === 'ar')) {
        setLocaleState(savedLocale);
        return;
      }

      // 1. Detect by browser language
      const browserLang = navigator.language.split('-')[0];
      if (browserLang === 'ar') {
        setLocaleState('ar');
        return;
      }

      // 2. Detect by geolocation (country) - DISABLED to prevent NetworkError in some environments
      /*
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        
        const arabicSpeakingCountries = [
          'TN', 'MA', 'DZ', 'LY', 'EG', 'SA', 'AE', 'QA', 'KW', 'OM', 'BH', 'JO', 'LB', 'IQ', 'YE', 'PS', 'SD', 'SY', 'MR'
        ];

        if (data.country_code && arabicSpeakingCountries.includes(data.country_code)) {
          setLocaleState('ar');
        } else {
          setLocaleState('fr'); // Default to French if not in an Arabic speaking country
        }
      } catch (error) {
        console.error('Error detecting country:', error);
        setLocaleState('fr'); // Fallback to French
      }
      */
      setLocaleState('fr');
    };

    detectLanguage();
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem('locale', locale);
  }, [locale]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
  };

    const t = (path: string): string => {
      const keys = path.split('.');
      let result = translations[locale];
  
      // First attempt: direct path
      let current = result;
      let found = true;
      for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
          current = current[key];
        } else {
          found = false;
          break;
        }
      }
      if (found) return current as string;
  
      // Second attempt: try under 'pages' namespace
      current = result['pages'];
      found = true;
      for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
          current = current[key];
        } else {
          found = false;
          break;
        }
      }
      if (found) return current as string;
  
      return path; // Return key if not found in both
    };

  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <LanguageContext.Provider value={{ locale, language: locale, setLocale, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    // Return a fallback instead of throwing to prevent 500 errors during SSR/initialization
    return {
      locale: 'fr' as Locale,
      language: 'fr' as Locale,
      setLocale: () => {},
      t: (key: string) => key,
      dir: 'ltr' as 'ltr' | 'rtl'
    };
  }
  return context;
};
