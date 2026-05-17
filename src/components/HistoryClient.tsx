"use client";
import { useState, useMemo } from "react";
import { useLocale } from "./LocaleContext";

interface Row {
  id: string;
  date: string;
  tagesumsatz: number;
  anfangsbestand: number;
  muenzenZielwert: number;
  ausgaben?: number;
  gesamtI: number;
  gesamtII: number;
  kassenbestand: number;
  notes: string | null;
}

export function HistoryClient({ rows: initialRows }: { rows: Row[] }) {
  const { T, money } = useLocale();
  const [rows, setRows] = useState(initialRows);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    if (!q) return rows;
    return rows.filter(r => r.date.includes(q) || (r.notes ?? "").toLowerCase().includes(q.toLowerCase()));
  }, [rows, q]);

  async function del(id: string) {
    if (!confirm(T("confirmDelete"))) return;
    const res = await fetch(`/api/reconciliation/${id}`, { method: "DELETE" });
    if (res.ok) setRows(rows.filter(r => r.id !== id));
  }

  async function exportXlsx() {
    const XLSX = await import("xlsx");
    const data = rows.map(r => ({
      [T("date")]: r.date,
      [T("tagesumsatz")]: r.tagesumsatz / 100,
      [T("anfangsbestand")]: r.anfangsbestand / 100,
      [T("ausgaben")]: (r.ausgaben ?? 0) / 100,
      [T("muenzenZielwert")]: r.muenzenZielwert / 100,
      [T("gesamtI")]: r.gesamtI / 100,
      [T("gesamtII")]: r.gesamtII / 100,
      [T("kassenbestand")]: r.kassenbestand / 100,
      [T("notes")]: r.notes ?? "",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tagesabrechnung");
    XLSX.writeFile(wb, `Tagesabrechnung_${new Date().toISOString().slice(0,10)}.xlsx`);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap items-center justify-between">
        <h1 className="text-2xl font-bold">{T("history")}</h1>
        <div className="flex gap-2 items-center">
          <input className="input max-w-xs" placeholder="2026-05" value={q} onChange={(e) => setQ(e.target.value)} />
          <button onClick={exportXlsx} className="btn-secondary">{T("exportXlsx")}</button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center text-slate-500">{T("noData")}</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left py-2 px-3">{T("date")}</th>
                <th className="text-right py-2 px-3">{T("tagesumsatz")}</th>
                <th className="text-right py-2 px-3">{T("anfangsbestand")}</th>
                <th className="text-right py-2 px-3">{T("ausgaben")}</th>
                <th className="text-right py-2 px-3">{T("gesamtI")}</th>
                <th className="text-right py-2 px-3">{T("gesamtII")}</th>
                <th className="text-right py-2 px-3">{T("kassenbestand")}</th>
                <th className="text-left py-2 px-3">{T("notes")}</th>
                <th className="py-2 px-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="py-2 px-3 font-medium">{r.date}</td>
                  <td className="text-right py-2 px-3 tabular-nums">{money(r.tagesumsatz)}</td>
                  <td className="text-right py-2 px-3 tabular-nums">{money(r.anfangsbestand)}</td>
                  <td className="text-right py-2 px-3 tabular-nums">{money(r.ausgaben ?? 0)}</td>
                  <td className="text-right py-2 px-3 tabular-nums">{money(r.gesamtI)}</td>
                  <td className="text-right py-2 px-3 tabular-nums">{money(r.gesamtII)}</td>
                  <td className="text-right py-2 px-3 tabular-nums font-semibold">{money(r.kassenbestand)}</td>
                  <td className="py-2 px-3 text-slate-600 max-w-xs truncate">{r.notes}</td>
                  <td className="py-2 px-3">
                    <button onClick={() => del(r.id)} className="text-red-600 hover:underline text-xs">{T("delete")}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
