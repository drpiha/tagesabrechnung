"use client";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useLocale } from "./LocaleContext";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Nav() {
  const { data } = useSession();
  const pathname = usePathname();
  const { T } = useLocale();
  const link = (href: string, label: string) => (
    <Link
      href={href}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
        pathname === href ? "bg-brand-100 text-brand-700" : "text-slate-700 hover:bg-slate-100"
      }`}
    >{label}</Link>
  );
  return (
    <nav className="no-print bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2">
        <Link href="/dashboard" className="flex items-center gap-2 mr-4">
          <div className="w-8 h-8 rounded-lg bg-brand-600 text-white grid place-items-center font-bold">T</div>
          <span className="font-semibold text-slate-900">Tagesabrechnung</span>
        </Link>
        {data && (
          <>
            {link("/dashboard", T("dashboard"))}
            {link("/history", T("history"))}
            {link("/reports", T("reports"))}
            {link("/settings", T("settings"))}
          </>
        )}
        <div className="ml-auto flex items-center gap-2">
          <LanguageSwitcher />
          {data && (
            <button onClick={() => signOut({ callbackUrl: "/" })} className="btn-secondary text-sm">
              {T("logout")}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
