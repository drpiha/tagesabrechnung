"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { type Locale, type Currency, t, type TKey, formatMoney } from "@/lib/i18n";

interface Ctx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  T: (k: TKey) => string;
  money: (cent: number) => string;
}

const Context = createContext<Ctx>({
  locale: "de",
  setLocale: () => {},
  currency: "EUR",
  setCurrency: () => {},
  T: (k) => t("de", k),
  money: (c) => formatMoney(c, "EUR", "de"),
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("de");
  const [currency, setCurrencyState] = useState<Currency>("EUR");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedLocale = localStorage.getItem("locale") as Locale | null;
    if (storedLocale === "tr" || storedLocale === "de") setLocaleState(storedLocale);
    const storedCurrency = localStorage.getItem("currency") as Currency | null;
    if (storedCurrency === "EUR" || storedCurrency === "USD" || storedCurrency === "TRY") {
      setCurrencyState(storedCurrency);
    }
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    if (typeof window !== "undefined") localStorage.setItem("locale", l);
  };
  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    if (typeof window !== "undefined") localStorage.setItem("currency", c);
  };

  return (
    <Context.Provider
      value={{
        locale,
        setLocale,
        currency,
        setCurrency,
        T: (k) => t(locale, k),
        money: (c) => formatMoney(c, currency, locale),
      }}
    >
      {children}
    </Context.Provider>
  );
}

export const useLocale = () => useContext(Context);
