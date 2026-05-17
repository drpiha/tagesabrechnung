"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { type Locale, t, type TKey } from "@/lib/i18n";

const Ctx = createContext<{ locale: Locale; setLocale: (l: Locale) => void; T: (k: TKey) => string }>({
  locale: "tr",
  setLocale: () => {},
  T: (k) => t("tr", k),
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("tr");

  useEffect(() => {
    const stored = (typeof window !== "undefined" && localStorage.getItem("locale")) as Locale | null;
    if (stored === "tr" || stored === "de") setLocaleState(stored);
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    if (typeof window !== "undefined") localStorage.setItem("locale", l);
  };

  return <Ctx.Provider value={{ locale, setLocale, T: (k) => t(locale, k) }}>{children}</Ctx.Provider>;
}

export const useLocale = () => useContext(Ctx);
