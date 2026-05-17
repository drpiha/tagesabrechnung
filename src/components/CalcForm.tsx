"use client";
import { useState } from "react";
import { useLocale } from "./LocaleContext";
import { calculate, eurToCent, type CalcResult } from "@/lib/calc";
import { TagesabrechnungTable } from "./TagesabrechnungTable";
import { PdfButton } from "./PdfButton";

function todayIso() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

interface Initial {
  id?: string;
  date: string;
  tagesumsatz: string;
  anfangsbestand: string;
  muenzenZielwert: string;
  notes?: string;
}

export function CalcForm({ companyName, initial }: { companyName?: string | null; initial?: Initial }) {
  const { T } = useLocale();
  const [date, setDate] = useState(initial?.date ?? todayIso());
  const [tagesumsatz, setTagesumsatz] = useState(initial?.tagesumsatz ?? "");
  const [anfangsbestand, setAnfangsbestand] = useState(initial?.anfangsbestand ?? "");
  const [muenzenZielwert, setMuenzenZielwert] = useState(initial?.muenzenZielwert ?? "50,00");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [result, setResult] = useState<CalcResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  function tryCalculate() {
    setErr(null);
    try {
      const r = calculate({
        tagesumsatzCent: eurToCent(tagesumsatz || "0"),
        anfangsbestandCent: eurToCent(anfangsbestand || "0"),
        muenzenZielwertCent: eurToCent(muenzenZielwert || "0"),
      });
      setResult(r);
    } catch (e: any) {
      setErr(e.message);
      setResult(null);
    }
  }

  async function save() {
    if (!result) { tryCalculate(); return; }
    setSaving(true); setSavedMsg(null);
    const res = await fetch("/api/reconciliation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date, tagesumsatz, anfangsbestand, muenzenZielwert, notes,
      }),
    });
    setSaving(false);
    if (res.ok) setSavedMsg(T("saved"));
    else { const j = await res.json().catch(()=>({})); setErr(j.error ?? "Hata"); }
  }

  return (
    <div className="grid lg:grid-cols-[420px_1fr] gap-6">
      <div className="card p-6 self-start no-print">
        <h2 className="font-semibold text-lg mb-4">{T("addNew")}</h2>
        <div className="space-y-4">
          <div>
            <label className="label">{T("date")}</label>
            <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="label">{T("tagesumsatz")} (€)</label>
            <input className="input" inputMode="decimal" placeholder="628,50"
                   value={tagesumsatz} onChange={(e) => setTagesumsatz(e.target.value)} />
          </div>
          <div>
            <label className="label">{T("anfangsbestand")} (€)</label>
            <input className="input" inputMode="decimal" placeholder="100,00"
                   value={anfangsbestand} onChange={(e) => setAnfangsbestand(e.target.value)} />
          </div>
          <div>
            <label className="label">{T("muenzenZielwert")} (€)</label>
            <input className="input" inputMode="decimal" placeholder="50,00"
                   value={muenzenZielwert} onChange={(e) => setMuenzenZielwert(e.target.value)} />
          </div>
          <div>
            <label className="label">{T("notes")}</label>
            <textarea className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          {savedMsg && <p className="text-sm text-green-700">✓ {savedMsg}</p>}
          <div className="flex gap-2 pt-2">
            <button onClick={tryCalculate} className="btn-secondary flex-1">{T("calculate")}</button>
            <button onClick={save} disabled={saving} className="btn-primary flex-1">{saving ? "..." : T("save")}</button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {result ? (
          <>
            <div className="flex gap-2 no-print justify-end">
              <button onClick={() => window.print()} className="btn-secondary">{T("print")}</button>
              <PdfButton
                result={result}
                date={date}
                companyName={companyName ?? null}
                tagesumsatzCent={eurToCent(tagesumsatz || "0")}
                anfangsbestandCent={eurToCent(anfangsbestand || "0")}
              />
            </div>
            <TagesabrechnungTable
              result={result}
              date={date}
              companyName={companyName ?? null}
              tagesumsatzCent={eurToCent(tagesumsatz || "0")}
              anfangsbestandCent={eurToCent(anfangsbestand || "0")}
            />
          </>
        ) : (
          <div className="card p-12 text-center text-slate-500">
            <div className="text-4xl mb-2">€</div>
            <p>Tutarları girip <strong>{T("calculate")}</strong> butonuna basın.</p>
          </div>
        )}
      </div>
    </div>
  );
}
