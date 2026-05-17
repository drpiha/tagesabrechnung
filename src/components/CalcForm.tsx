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

export interface AusgabenItem { label?: string; amount: string }

interface Initial {
  id?: string;
  date?: string;
  tagesumsatz?: string;
  anfangsbestand?: string;
  muenzenZielwert?: string;
  ausgabenItems?: AusgabenItem[];
  verkaufsort?: string;
  notes?: string;
}

function sumItemsCent(items: AusgabenItem[]): number {
  let s = 0;
  for (const it of items) {
    if (!it.amount) continue;
    try { s += eurToCent(it.amount); } catch { /* ignore */ }
  }
  return s;
}

export function CalcForm({ companyName, initial }: { companyName?: string | null; initial?: Initial }) {
  const { T, currency } = useLocale();
  const [date, setDate] = useState(initial?.date ?? todayIso());
  const [time, setTime] = useState(nowHHMM());
  const [verkaufsort, setVerkaufsort] = useState(initial?.verkaufsort ?? "");
  const [tagesumsatz, setTagesumsatz] = useState(initial?.tagesumsatz ?? "");
  const [anfangsbestand, setAnfangsbestand] = useState(initial?.anfangsbestand ?? "");
  const [muenzenZielwert, setMuenzenZielwert] = useState(initial?.muenzenZielwert ?? "50,00");
  const [ausgabenItems, setAusgabenItems] = useState<AusgabenItem[]>(
    initial?.ausgabenItems && initial.ausgabenItems.length > 0
      ? initial.ausgabenItems
      : [{ amount: "" }]
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [result, setResult] = useState<CalcResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [loadedNotice, setLoadedNotice] = useState<boolean>(!!initial?.id);

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
          ausgabenCent: sumItemsCent(initial.ausgabenItems ?? []),
        });
        setResult(r);
      } catch {
        /* ignore */
      }
    }
  }, [initial]);

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
        setVerkaufsort(j.row.verkaufsort ?? "");
        const items = parseRowAusgaben(j.row.ausgabenJson, j.row.ausgaben ?? 0);
        setAusgabenItems(items.length > 0 ? items : [{ amount: "" }]);
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
        ausgabenCent: sumItemsCent(ausgabenItems),
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
          ausgabenCent: sumItemsCent(ausgabenItems),
        });
        setResult(r);
      } catch (e: any) { setErr(e.message); return; }
    }
    setSaving(true); setSavedMsg(null);
    const cleanItems = ausgabenItems
      .map((it) => ({
        label: it.label?.trim() || undefined,
        amount: (it.amount || "0").trim(),
      }))
      .filter((it) => {
        try { return eurToCent(it.amount) > 0 || (it.label && it.label.length > 0); } catch { return false; }
      });
    const res = await fetch("/api/reconciliation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date, tagesumsatz, anfangsbestand, muenzenZielwert,
        ausgabenItems: cleanItems,
        verkaufsort: verkaufsort.trim() || undefined,
        notes,
      }),
    });
    setSaving(false);
    if (res.ok) setSavedMsg(T("saved"));
    else { const j = await res.json().catch(()=>({})); setErr(j.error ?? "Hata"); }
  }

  const sym = CURRENCY_SYMBOL[currency];
  const totalAusgabenCent = sumItemsCent(ausgabenItems);

  function updateItem(idx: number, patch: Partial<AusgabenItem>) {
    setAusgabenItems((curr) => curr.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }
  function addItem() {
    setAusgabenItems((curr) => [...curr, { amount: "" }]);
  }
  function removeItem(idx: number) {
    setAusgabenItems((curr) => (curr.length <= 1 ? [{ amount: "" }] : curr.filter((_, i) => i !== idx)));
  }

  return (
    <div className="grid lg:grid-cols-[440px_1fr] gap-4 sm:gap-6">
      <div className="card p-4 sm:p-6 self-start no-print">
        <h2 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">{T("addNew")}</h2>
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
          <div>
            <label className="label">{T("verkaufsort")}</label>
            <input className="input" placeholder="Berlin / Filiale 1 / Restaurant XY"
                   value={verkaufsort} onChange={(e) => setVerkaufsort(e.target.value)} />
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
            <div className="flex items-center justify-between mb-1">
              <label className="label !mb-0">{T("ausgaben")} ({sym})</label>
              <span className="text-xs text-slate-500 tabular-nums">
                {T("sum")}: {(totalAusgabenCent / 100).toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {sym}
              </span>
            </div>
            <div className="space-y-2">
              {ausgabenItems.map((it, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_110px_32px] gap-2">
                  <input
                    className="input"
                    placeholder={T("ausgabeLabel")}
                    value={it.label ?? ""}
                    onChange={(e) => updateItem(idx, { label: e.target.value })}
                  />
                  <input
                    className="input text-right"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={it.amount}
                    onChange={(e) => updateItem(idx, { amount: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="rounded-lg border border-slate-300 text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-300 text-lg leading-none"
                    aria-label="remove"
                  >×</button>
                </div>
              ))}
              <button
                type="button"
                onClick={addItem}
                className="text-sm text-brand-600 hover:text-brand-700 font-medium"
              >+ {T("addAusgabe")}</button>
            </div>
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
                verkaufsort={verkaufsort || null}
                ausgabenItems={ausgabenItems}
                tagesumsatzCent={eurToCent(tagesumsatz || "0")}
                anfangsbestandCent={eurToCent(anfangsbestand || "0")}
                ausgabenCent={totalAusgabenCent}
                notes={notes}
              />
            </div>
            <TagesabrechnungTable
              result={result}
              date={date}
              time={time}
              companyName={companyName ?? null}
              verkaufsort={verkaufsort || null}
              ausgabenItems={ausgabenItems}
              tagesumsatzCent={eurToCent(tagesumsatz || "0")}
              anfangsbestandCent={eurToCent(anfangsbestand || "0")}
              ausgabenCent={totalAusgabenCent}
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

function parseRowAusgaben(json: string | null | undefined, total: number): AusgabenItem[] {
  if (!json || json === "[]") {
    return total > 0 ? [{ amount: centToInputStr(total) }] : [];
  }
  try {
    const arr = JSON.parse(json) as Array<{ label?: string; amount: number }>;
    return arr.map((it) => ({ label: it.label, amount: centToInputStr(it.amount ?? 0) }));
  } catch {
    return total > 0 ? [{ amount: centToInputStr(total) }] : [];
  }
}
