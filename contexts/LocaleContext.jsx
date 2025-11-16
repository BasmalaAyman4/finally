// contexts/LocaleContext.jsx
"use client";

import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";

const LocaleContext = createContext(undefined);

export function LocaleProvider({ children }) {
  const params = useParams();
  const locale = params?.locale || "ar";

  const [dictionary, setDictionary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDictionary() {
      try {
        setLoading(true);
        setError(null);

        const dict = await getDictionary(locale);

        if (isMounted) {
          setDictionary(dict);
        }
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error("Failed to load dictionary:", err);
        }
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadDictionary();

    return () => {
      isMounted = false;
    };
  }, [locale]);

  // Helper function للوصول للترجمات المتداخلة
  const t = useMemo(() => {
    return (key, fallback = key) => {
      if (!dictionary) return fallback;

      const keys = key.split(".");
      let result = dictionary;

      for (const k of keys) {
        result = result?.[k];
        if (result === undefined) return fallback;
      }

      return result || fallback;
    };
  }, [dictionary]);

  // Helper للحصول على langCode للـ API
  const langCode = useMemo(() => {
    return locale === "en" ? "2" : "1";
  }, [locale]);

  const value = useMemo(
    () => ({
      locale,
      dictionary,
      loading,
      error,
      t,
      langCode,
      isRTL: locale === "ar",
    }),
    [locale, dictionary, loading, error, t, langCode]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);

  if (context === undefined) {
    throw new Error("useLocale must be used within LocaleProvider");
  }

  return context;
}
