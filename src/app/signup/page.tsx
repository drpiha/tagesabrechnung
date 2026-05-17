"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale } from "@/components/LocaleContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function SignupPage() {
  const router = useRouter();
  const { T } = useLocale();
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setLoading(true);
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, companyName, email, password }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.error ?? "Hata");
      setLoading(false);
      return;
    }
    await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen grid place-items-center px-4 py-8">
      <div className="w-full max-w-md card p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="w-12 h-12 rounded-xl bg-brand-600 text-white grid place-items-center text-xl font-bold mb-3">€</div>
            <h1 className="text-2xl font-bold">{T("createAccount")}</h1>
          </div>
          <LanguageSwitcher />
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">{T("name")}</label>
            <input className="input" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="label">{T("company")}</label>
            <input className="input" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          </div>
          <div>
            <label className="label">{T("email")}</label>
            <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label">{T("password")}</label>
            <input className="input" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
            <p className="text-xs text-slate-500 mt-1">{T("passwordMin")}</p>
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button disabled={loading} className="btn-primary w-full">{loading ? "..." : T("createAccount")}</button>
        </form>
        <p className="text-sm text-slate-600 mt-4 text-center">
          {T("haveAccount")} <Link href="/login" className="text-brand-600 hover:underline">{T("login")}</Link>
        </p>
      </div>
    </main>
  );
}
