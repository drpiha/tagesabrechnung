"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale } from "@/components/LocaleContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function LoginPage() {
  const router = useRouter();
  const { T } = useLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) setErr(T("invalidLogin"));
    else router.push("/dashboard");
  }

  return (
    <main className="min-h-screen grid place-items-center px-4 py-8">
      <div className="w-full max-w-md card p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="w-12 h-12 rounded-xl bg-brand-600 text-white grid place-items-center text-xl font-bold mb-3">€</div>
            <h1 className="text-2xl font-bold">{T("login")}</h1>
          </div>
          <LanguageSwitcher />
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">{T("email")}</label>
            <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label">{T("password")}</label>
            <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button disabled={loading} className="btn-primary w-full">{loading ? "..." : T("login")}</button>
        </form>
        <p className="text-sm text-slate-600 mt-4 text-center">
          {T("noAccount")} <Link href="/signup" className="text-brand-600 hover:underline">{T("signup")}</Link>
        </p>
      </div>
    </main>
  );
}
