"use client";
import { useMemo, useState } from "react";
import { useLocale } from "./LocaleContext";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, Legend
} from "recharts";

interface Row { date: string; tagesumsatz: number; kassenbestand: number }

export function ReportsClient({ data }: { data: Row[] }) {
  const { T } = useLocale();
  const [period, setPeriod] = useState<"7" | "30" | "90" | "all">("30");

  const filtered = useMemo(() => {
    if (period === "all") return data;
    const days = parseInt(period, 10);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    return data.filter(r => r.date >= cutoffStr);
  }, [data, period]);

  const stats = useMemo(() => {
    if (filtered.length === 0) return null;
    const total = filtered.reduce((s, r) => s + r.tagesumsatz, 0);
    const avg = total / filtered.length;
    const sorted = [...filtered].sort((a, b) => b.tagesumsatz - a.tagesumsatz);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    return { total, avg, best, worst, count: filtered.length };
  }, [filtered]);

  // Haftanın günlerine göre ortalama ciro
  const weekdayData = useMemo(() => {
    const days = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
    const buckets: { day: string; total: number; count: number }[] =
      days.map(d => ({ day: d, total: 0, count: 0 }));
    for (const r of filtered) {
      const d = new Date(r.date);
      const idx = (d.getUTCDay() + 6) % 7; // Pzt = 0
      buckets[idx]!.total += r.tagesumsatz;
      buckets[idx]!.count += 1;
    }
    return buckets.map(b => ({ day: b.day, avg: b.count ? b.total / b.count : 0 }));
  }, [filtered]);

  const fmt = (n: number) => n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{T("reports")}</h1>
        <div className="inline-flex rounded-lg border border-slate-300 overflow-hidden text-sm">
          {[
            ["7", T("last7")], ["30", T("last30")], ["90", T("last90")], ["all", T("allTime")],
          ].map(([k, l]) => (
            <button key={k}
              onClick={() => setPeriod(k as any)}
              className={`px-3 py-1.5 ${period === k ? "bg-brand-600 text-white" : "bg-white text-slate-700 hover:bg-slate-50"}`}
            >{l}</button>
          ))}
        </div>
      </div>

      {!stats ? (
        <div className="card p-12 text-center text-slate-500">{T("noData")}</div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-4">
              <div className="text-xs text-slate-500 uppercase">{T("totalRecords")}</div>
              <div className="text-2xl font-bold mt-1">{stats.count}</div>
            </div>
            <div className="card p-4">
              <div className="text-xs text-slate-500 uppercase">Toplam Ciro</div>
              <div className="text-2xl font-bold mt-1 tabular-nums">{fmt(stats.total)}</div>
            </div>
            <div className="card p-4">
              <div className="text-xs text-slate-500 uppercase">{T("averageDaily")}</div>
              <div className="text-2xl font-bold mt-1 tabular-nums">{fmt(stats.avg)}</div>
            </div>
            <div className="card p-4">
              <div className="text-xs text-slate-500 uppercase">{T("bestDay")}</div>
              <div className="text-2xl font-bold mt-1 tabular-nums">{stats.best ? fmt(stats.best.tagesumsatz) : "-"}</div>
              <div className="text-xs text-slate-500">{stats.best?.date}</div>
            </div>
          </div>

          <div className="card p-4">
            <h2 className="font-semibold mb-3">{T("revenueTrend")}</h2>
            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer>
                <LineChart data={filtered}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: any) => fmt(Number(v))} />
                  <Line type="monotone" dataKey="tagesumsatz" stroke="#4f57ff" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card p-4">
            <h2 className="font-semibold mb-3">Haftanın Günlerine Göre Ortalama</h2>
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <BarChart data={weekdayData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip formatter={(v: any) => fmt(Number(v))} />
                  <Bar dataKey="avg" fill="#4f57ff" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
