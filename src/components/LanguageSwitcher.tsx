"use client";
import { useLocale } from "./LocaleContext";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();
  return (
    <div className="inline-flex rounded-lg border border-slate-300 overflow-hidden text-sm">
      <button
        type="button"
        onClick={() => setLocale("tr")}
        className={`px-3 py-1.5 ${locale === "tr" ? "bg-brand-600 text-white" : "bg-white text-slate-700 hover:bg-slate-50"}`}
      >TR</button>
      <button
        type="button"
        onClick={() => setLocale("de")}
        className={`px-3 py-1.5 ${locale === "de" ? "bg-brand-600 text-white" : "bg-white text-slate-700 hover:bg-slate-50"}`}
      >DE</button>
    </div>
  );
}
