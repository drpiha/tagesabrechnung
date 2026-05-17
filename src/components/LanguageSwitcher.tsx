"use client";
import { useLocale } from "./LocaleContext";
import type { Currency } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { locale, setLocale, currency, setCurrency } = useLocale();
  return (
    <div className="flex items-center gap-2">
      <div className="inline-flex rounded-lg border border-slate-300 overflow-hidden text-sm">
        <button
          type="button"
          onClick={() => setLocale("de")}
          className={`px-3 py-1.5 ${locale === "de" ? "bg-brand-600 text-white" : "bg-white text-slate-700 hover:bg-slate-50"}`}
        >DE</button>
        <button
          type="button"
          onClick={() => setLocale("tr")}
          className={`px-3 py-1.5 ${locale === "tr" ? "bg-brand-600 text-white" : "bg-white text-slate-700 hover:bg-slate-50"}`}
        >TR</button>
      </div>
      <select
        value={currency}
        onChange={(e) => setCurrency(e.target.value as Currency)}
        className="rounded-lg border border-slate-300 bg-white text-sm px-2 py-1.5 text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-brand-500"
      >
        <option value="EUR">€ EUR</option>
        <option value="USD">$ USD</option>
        <option value="TRY">₺ TRY</option>
      </select>
    </div>
  );
}
