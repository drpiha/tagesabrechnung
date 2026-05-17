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
      className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
        pathname === href ? "bg-brand-100 text-brand-700" : "text-slate-700 hover:bg-slate-100"
      }`}
    >{label}</Link>
  );
  return (
    <nav className="no-print bg-white border-b border-slate-200 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex flex-wrap items-center gap-2">
        <Link href="/dashboard" className="flex items-center gap-2 mr-2 sm:mr-4">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-brand-600 text-white grid place-items-center font-bold text-sm sm:text-base">T</div>
          <span className="font-semibold text-slate-900 hidden sm:inline">{T("appName")}</span>
        </Link>
        {data && (
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap order-3 sm:order-2 w-full sm:w-auto">
            {link("/dashboard", T("dashboard"))}
            {link("/history", T("history"))}
            {link("/reports", T("reports"))}
            {link("/settings", T("settings"))}
          </div>
        )}
        <div className="ml-auto flex items-center gap-2 order-2 sm:order-3">
          <LanguageSwitcher />
          {data && (
            <button onClick={() => signOut({ callbackUrl: "/" })} className="btn-secondary text-xs sm:text-sm !px-2.5 !py-1.5 sm:!px-4 sm:!py-2">
              {T("logout")}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
