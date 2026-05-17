"use client";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "./LocaleContext";
import { calculate, eurToCent, type CalcResult } from "@/lib/calc";
import { TagesabrechnungTable } from "./TagesabrechnungTable";
import { PdfButton } from "./PdfButton";
import { CURRENCY_SYMBOL } from "@/lib/i18n";

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function nowHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

interface Initial {
  id?: string;
  date?: string;
  tagesumsatz?: string;
  anfangsbestand?: string;
  muenzenZielwert?: string;
  ausgaben?: string;
  notes?: string;
}

export function CalcForm({ companyName, initial }: { companyName?: string | null; initial?: Initial }) {
  const { T, currency, locale } = useLocale();
  const [date, setDate] = useState(initial?.date ?? todayIso());
  const [time, setTime] = useState(nowHHMM());
  const [tagesumsatz, setTagesumsatz] = useState(initial?.tagesumsatz ?? "");
  const [anfangsbestand, setAnfangsbestand] = useState(initial?.anfangsbestand ?? "");
  const [muenzenZielwert, setMuenzenZielwert] = useState(initial?.muenzenZielwert ?? "50,00");
  const [ausgaben, setAusgaben] = useState(initial?.ausgaben ?? "0,00");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [result, setResult] = useState<CalcResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [loadedNotice, setLoadedNotice] = useState<boolean>(!!initial?.id);

  // İlk açılışta mevcut kaydı varsa otomatik hesapla
  const didInitialCalc = useRef(false);
  useEffect(() => {
    if (didInitialCalc.current) return;
    if (initial?.tagesumsatz) {
      didInitialCalc.current = true;
      try {
        const r = calculate({
          tagesumsatzCent: eurToCent(initial.tagesumsatz),
          anfangsbestandCent: eurToCent(initial.anfangsbestand ?? "0"),
          muenzenZielwertCent: eurToCent(initial.muenzenZielwert ?? "0"),
          ausgabenCent: eurToCent(initial.ausgaben ?? "0"),
        });
        setResult(r);
      } catch {
        /* ignore */
      }
    }
  }, [initial]);

  // Tarih değişince o güne ait kayıt varsa yükle
  useEffect(() => {
    if (!date) return;
    let aborted = false;
    (async () => {
      const res = await fetch(`/api/reconciliation?date=${date}`);
      if (!res.ok) return;
      const j = await res.json();
      if (aborted) return;
      if (j.row) {
        setTagesumsatz(centToInputStr(j.row.tagesumsatz));
        setAnfangsbestand(centToInputStr(j.row.anfangsbestand));
        setMuenzenZielwert(centToInputStr(j.row.muenzenZielwert));
        setAusgaben(centToInputStr(j.row.ausgaben ?? 0));
        setNotes(j.row.notes ?? "");
        setLoadedNotice(true);
        try {
          const r = calculate({
            tagesumsatzCent: j.row.tagesumsatz,
            anfangsbestandCent: j.row.anfangsbestand,
            muenzenZielwertCent: j.row.muenzenZielwert,
            ausgabenCent: j.row.ausgaben ?? 0,
          });
          setResult(r);
        } catch { /* ignore */ }
      } else {
        setLoadedNotice(false);
      }
    })();
    return () => { aborted = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  function tryCalculate() {
    setErr(null);
    try {
      const r = calculate({
        tagesumsatzCent: eurToCent(tagesumsatz || "0"),
        anfangsbestandCent: eurToCent(anfangsbestand || "0"),
        muenzenZielwertCent: eurToCent(muenzenZielwert || "0"),
        ausgabenCent: eurToCent(ausgaben || "0"),
      });
      setResult(r);
    } catch (e: any) {
      setErr(e.message);
      setResult(null);
    }
  }

  async function save() {
    setErr(null);
    let r = result;
    if (!r) {
      try {
        r = calculate({
          tagesumsatzCent: eurToCent(tagesumsatz || "0"),
          anfangsbestandCent: eurToCent(anfangsbestand || "0"),
          muenzenZielwertCent: eurToCent(muenzenZielwert || "0"),
          ausgabenCent: eurToCent(ausgaben || "0"),
        });
        setResult(r);
      } catch (e: any) { setErr(e.message); return; }
    }
    setSaving(true); setSavedMsg(null);
    const res = await fetch("/api/reconciliation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, tagesumsatz, anfangsbestand, muenzenZielwert, ausgaben, notes }),
    });
    setSaving(false);
    if (res.ok) setSavedMsg(T("saved"));
    else { const j = await res.json().catch(()=>({})); setErr(j.error ?? "Hata"); }
  }

  const sym = CURRENCY_SYMBOL[currency];

  return (
    <div className="grid lg:grid-cols-[440px_1fr] gap-6">
      <div className="card p-6 self-start no-print">
        <h2 className="font-semibold text-lg mb-4">{T("addNew")}</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{T("date")}</label>
              <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="label">{T("time")}</label>
              <input type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          {loadedNotice && (
            <div className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              ℹ {T("loadedFromDb")}
            </div>
          )}
          <div>
            <label className="label">{T("tagesumsatz")} ({sym})</label>
            <input className="input" inputMode="decimal" placeholder="628,50"
                   value={tagesumsatz} onChange={(e) => setTagesumsatz(e.target.value)} />
          </div>
          <div>
            <label className="label">{T("anfangsbestand")} ({sym})</label>
            <input className="input" inputMode="decimal" placeholder="100,00"
                   value={anfangsbestand} onChange={(e) => setAnfangsbestand(e.target.value)} />
          </div>
          <div>
            <label className="label">{T("ausgaben")} ({sym})</label>
            <input className="input" inputMode="decimal" placeholder="0,00"
                   value={ausgaben} onChange={(e) => setAusgaben(e.target.value)} />
          </div>
          <div>
            <label className="label">{T("muenzenZielwert")} ({sym})</label>
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
            <button onClick={save} disabled={saving} className="btn-primary flex-1">
              {saving ? "..." : (loadedNotice ? T("update") : T("save"))}
            </button>
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
                time={time}
                companyName={companyName ?? null}
                tagesumsatzCent={eurToCent(tagesumsatz || "0")}
                anfangsbestandCent={eurToCent(anfangsbestand || "0")}
                ausgabenCent={eurToCent(ausgaben || "0")}
                notes={notes}
              />
            </div>
            <TagesabrechnungTable
              result={result}
              date={date}
              time={time}
              companyName={companyName ?? null}
              tagesumsatzCent={eurToCent(tagesumsatz || "0")}
              anfangsbestandCent={eurToCent(anfangsbestand || "0")}
              ausgabenCent={eurToCent(ausgaben || "0")}
            />
          </>
        ) : (
          <div className="card p-12 text-center text-slate-500">
            <div className="text-4xl mb-2">{sym}</div>
            <p>{T("enterValues")}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function centToInputStr(cent: number): string {
  const sign = cent < 0 ? "-" : "";
  const abs = Math.abs(cent);
  const e = Math.floor(abs / 100);
  const c = abs % 100;
  return sign + e.toString() + "," + c.toString().padStart(2, "0");
}
