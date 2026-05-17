"use client";
import { useState } from "react";
import { useLocale } from "./LocaleContext";

interface Initial { email: string; name: string | null; companyName: string | null; locale: string }

export function SettingsClient({ initial }: { initial: Initial }) {
  const { T } = useLocale();
  const [name, setName] = useState(initial.name ?? "");
  const [companyName, setCompanyName] = useState(initial.companyName ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setMsg(null); setErr(null); setSaving(true);
    const body: any = { name, companyName };
    if (newPassword) { body.newPassword = newPassword; body.currentPassword = currentPassword; }
    const res = await fetch("/api/settings", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) { setMsg(T("saved")); setCurrentPassword(""); setNewPassword(""); }
    else { const j = await res.json().catch(()=>({})); setErr(j.error ?? "Hata"); }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{T("settings")}</h1>

      <div className="card p-6 space-y-4">
        <h2 className="font-semibold">{T("profile")}</h2>
        <div>
          <label className="label">{T("email")}</label>
          <input className="input bg-slate-100" disabled value={initial.email} />
        </div>
        <div>
          <label className="label">{T("name")}</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="label">{T("company")}</label>
          <input className="input" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <h2 className="font-semibold">{T("changePassword")}</h2>
        <div>
          <label className="label">{T("currentPassword")}</label>
          <input type="password" className="input" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        </div>
        <div>
          <label className="label">{T("newPassword")}</label>
          <input type="password" className="input" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
      </div>

      {msg && <p className="text-sm text-green-700">✓ {msg}</p>}
      {err && <p className="text-sm text-red-600">{err}</p>}

      <div className="flex justify-end">
        <button onClick={save} disabled={saving} className="btn-primary">{saving ? "..." : T("save_settings")}</button>
      </div>
    </div>
  );
}
