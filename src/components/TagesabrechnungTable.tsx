"use client";
import { type CalcResult, eurToCent } from "@/lib/calc";
import { useLocale } from "./LocaleContext";
import type { AusgabenItem } from "./CalcForm";

interface Props {
  result: CalcResult;
  date?: string;
  time?: string;
  companyName?: string | null;
  verkaufsort?: string | null;
  tagesumsatzCent: number;
  anfangsbestandCent: number;
  ausgabenCent?: number;
  ausgabenItems?: AusgabenItem[];
}

const BANKNOTE_VALUES = [50000, 20000, 10000, 5000, 2000, 1000, 500];
const COIN_VALUES = [200, 100, 50, 20, 10, 5, 2, 1];

function itemCent(it: AusgabenItem): number {
  if (!it.amount) return 0;
  try { return eurToCent(it.amount); } catch { return 0; }
}

export function TagesabrechnungTable({
  result, date, time, companyName, verkaufsort, tagesumsatzCent, anfangsbestandCent, ausgabenItems = [],
}: Props) {
  const { T, money } = useLocale();
  const totalKassenbestand = result.gesamtICent + result.gesamtIICent;
  const tagesumsatzDerived = totalKassenbestand - anfangsbestandCent;
  const visibleItems = ausgabenItems.filter((it) => itemCent(it) > 0 || (it.label && it.label.trim()));
  const ausgabenSum = visibleItems.reduce((s, it) => s + itemCent(it), 0);
  const zwischensumme = tagesumsatzDerived - ausgabenSum;
  const ausgabenRowCount = Math.max(3, visibleItems.length);

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="card p-4 sm:p-5">
        <div className="text-center">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">{T("addNew")}</h2>
          <div className="mt-1 flex justify-center flex-wrap gap-x-4 sm:gap-x-6 gap-y-1 text-xs sm:text-sm text-slate-600">
            {companyName && <span>{T("company")}: <b>{companyName}</b></span>}
            {verkaufsort && <span>{T("verkaufsort")}: <b>{verkaufsort}</b></span>}
            {date && <span>{T("date")}: <b>{date}</b></span>}
            {time && <span>{T("time")}: <b>{time}</b></span>}
          </div>
        </div>
      </div>

      <div className="card p-4 sm:p-5">
        <h3 className="font-semibold text-slate-800 mb-3 text-sm sm:text-base">{T("banknotes")}</h3>
        <div className="table-scroll">
          <table className="w-full text-xs sm:text-sm border border-slate-300">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="text-left py-2 px-2 sm:px-3 border border-slate-300">{T("bill")}</th>
                <th className="text-right py-2 px-2 sm:px-3 border border-slate-300 w-16">{T("stueck")}</th>
                <th className="text-right py-2 px-2 sm:px-3 border border-slate-300">{T("total")}</th>
                <th className="py-2 px-2 sm:px-3 border border-slate-300 w-20">{T("control")} I</th>
                <th className="py-2 px-2 sm:px-3 border border-slate-300 w-20">{T("control")} II</th>
              </tr>
            </thead>
            <tbody>
              {BANKNOTE_VALUES.map((c) => {
                const cnt = result.banknotes[c] ?? 0;
                return (
                  <tr key={c}>
                    <td className="py-2 px-2 sm:px-3 border border-slate-300 whitespace-nowrap">{money(c)}</td>
                    <td className="text-right py-2 px-2 sm:px-3 border border-slate-300 tabular-nums">{cnt}</td>
                    <td className="text-right py-2 px-2 sm:px-3 border border-slate-300 tabular-nums whitespace-nowrap">{money(cnt * c)}</td>
                    <td className="border border-slate-300"></td>
                    <td className="border border-slate-300"></td>
                  </tr>
                );
              })}
              <tr className="bg-slate-50 font-semibold">
                <td className="py-2 px-2 sm:px-3 border border-slate-300">{T("gesamtI")}</td>
                <td className="border border-slate-300"></td>
                <td className="text-right py-2 px-2 sm:px-3 border border-slate-300 tabular-nums whitespace-nowrap">{money(result.gesamtICent)}</td>
                <td className="border border-slate-300"></td>
                <td className="border border-slate-300"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-4 sm:p-5">
        <h3 className="font-semibold text-slate-800 mb-3 text-sm sm:text-base">{T("coins")}</h3>
        <div className="table-scroll">
          <table className="w-full text-xs sm:text-sm border border-slate-300">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="text-left py-2 px-2 sm:px-3 border border-slate-300">{T("coin")}</th>
                <th className="text-right py-2 px-2 sm:px-3 border border-slate-300 w-16">{T("stueck")}</th>
                <th className="text-right py-2 px-2 sm:px-3 border border-slate-300">{T("total")}</th>
                <th className="py-2 px-2 sm:px-3 border border-slate-300 w-20">{T("control")} I</th>
                <th className="py-2 px-2 sm:px-3 border border-slate-300 w-20">{T("control")} II</th>
              </tr>
            </thead>
            <tbody>
              {COIN_VALUES.map((c) => {
                const cnt = result.coins[c] ?? 0;
                return (
                  <tr key={c}>
                    <td className="py-2 px-2 sm:px-3 border border-slate-300 whitespace-nowrap">{money(c)}</td>
                    <td className="text-right py-2 px-2 sm:px-3 border border-slate-300 tabular-nums">{cnt}</td>
                    <td className="text-right py-2 px-2 sm:px-3 border border-slate-300 tabular-nums whitespace-nowrap">{money(cnt * c)}</td>
                    <td className="border border-slate-300"></td>
                    <td className="border border-slate-300"></td>
                  </tr>
                );
              })}
              <tr className="bg-slate-50 font-semibold">
                <td className="py-2 px-2 sm:px-3 border border-slate-300">{T("gesamtII")}</td>
                <td className="border border-slate-300"></td>
                <td className="text-right py-2 px-2 sm:px-3 border border-slate-300 tabular-nums whitespace-nowrap">{money(result.gesamtIICent)}</td>
                <td className="border border-slate-300"></td>
                <td className="border border-slate-300"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-4 sm:p-5">
        <h3 className="font-semibold text-slate-800 mb-3 text-sm sm:text-base">{T("summary")}</h3>
        <table className="w-full text-xs sm:text-sm border border-slate-300">
          <tbody>
            <tr className="bg-slate-100 font-bold">
              <td className="py-2 px-2 sm:px-3 border border-slate-300">{T("totalKassenbestand")} (I + II)</td>
              <td className="text-right py-2 px-2 sm:px-3 border border-slate-300 tabular-nums whitespace-nowrap">{money(totalKassenbestand)}</td>
            </tr>
            <tr>
              <td className="py-2 px-2 sm:px-3 border border-slate-300">-  {T("anfangsbestand")} / Wechselgeld vom Vortag</td>
              <td className="text-right py-2 px-2 sm:px-3 border border-slate-300 tabular-nums whitespace-nowrap">{money(anfangsbestandCent)}</td>
            </tr>
            <tr className="font-semibold">
              <td className="py-2 px-2 sm:px-3 border border-slate-300">=  {T("tagesumsatz")}</td>
              <td className="text-right py-2 px-2 sm:px-3 border border-slate-300 tabular-nums whitespace-nowrap">{money(tagesumsatzDerived)}</td>
            </tr>
            {Array.from({ length: ausgabenRowCount }).map((_, i) => {
              const it = visibleItems[i];
              const label = it?.label?.trim();
              return (
                <tr key={`a${i}`}>
                  <td className="py-2 px-2 sm:px-3 border border-slate-300">
                    -  {T("ausgaben")}{label ? `: ${label}` : ""}
                  </td>
                  <td className="text-right py-2 px-2 sm:px-3 border border-slate-300 tabular-nums whitespace-nowrap">
                    {it ? money(itemCent(it)) : ""}
                  </td>
                </tr>
              );
            })}
            {[0, 1].map((i) => (
              <tr key={`e${i}`}>
                <td className="py-2 px-2 sm:px-3 border border-slate-300">+  {T("einlage")}</td>
                <td className="text-right py-2 px-2 sm:px-3 border border-slate-300"></td>
              </tr>
            ))}
            <tr className="font-semibold">
              <td className="py-2 px-2 sm:px-3 border border-slate-300">=  {T("zwischensumme")}</td>
              <td className="text-right py-2 px-2 sm:px-3 border border-slate-300 tabular-nums whitespace-nowrap">{money(zwischensumme)}</td>
            </tr>
            <tr className="bg-slate-100 font-bold">
              <td className="py-2 px-2 sm:px-3 border border-slate-300">
                {T("kassenbestand")}
                <span className="block text-[10px] sm:text-xs font-normal text-slate-500 italic">{T("uebertrag")}</span>
              </td>
              <td className="border border-slate-300"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
