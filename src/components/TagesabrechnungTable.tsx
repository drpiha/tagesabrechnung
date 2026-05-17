"use client";
import { type CalcResult } from "@/lib/calc";
import { useLocale } from "./LocaleContext";

interface Props {
  result: CalcResult;
  date?: string;
  time?: string;
  companyName?: string | null;
  tagesumsatzCent: number;
  anfangsbestandCent: number;
  ausgabenCent?: number;
}

const BANKNOTE_VALUES = [50000, 20000, 10000, 5000, 2000, 1000, 500];
const COIN_VALUES = [200, 100, 50, 20, 10, 5, 1];

export function TagesabrechnungTable({
  result, date, time, companyName, tagesumsatzCent, anfangsbestandCent, ausgabenCent = 0,
}: Props) {
  const { T, money } = useLocale();
  const totalEinnahmen = result.gesamtICent + result.gesamtIICent;
  return (
    <div className="space-y-5">
      <div className="card p-5">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">{T("addNew")}</h2>
          <div className="mt-1 flex justify-center gap-x-6 text-sm text-slate-600">
            {companyName && <span>{T("company")}: <b>{companyName}</b></span>}
            {date && <span>{T("date")}: <b>{date}</b></span>}
            {time && <span>{T("time")}: <b>{time}</b></span>}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-slate-800 mb-3">{T("banknotes")}</h3>
        <table className="w-full text-sm border border-slate-300">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="text-left py-2 px-3 border border-slate-300 w-32">{T("bill")}</th>
              <th className="text-right py-2 px-3 border border-slate-300 w-20">{T("stueck")}</th>
              <th className="text-right py-2 px-3 border border-slate-300">{T("total")}</th>
              <th className="py-2 px-3 border border-slate-300 w-24">{T("control")} I</th>
              <th className="py-2 px-3 border border-slate-300 w-24">{T("control")} II</th>
            </tr>
          </thead>
          <tbody>
            {BANKNOTE_VALUES.map((c) => {
              const cnt = result.banknotes[c] ?? 0;
              return (
                <tr key={c}>
                  <td className="py-2 px-3 border border-slate-300">{money(c)}</td>
                  <td className="text-right py-2 px-3 border border-slate-300 tabular-nums">{cnt}</td>
                  <td className="text-right py-2 px-3 border border-slate-300 tabular-nums">{money(cnt * c)}</td>
                  <td className="border border-slate-300"></td>
                  <td className="border border-slate-300"></td>
                </tr>
              );
            })}
            <tr className="bg-slate-50 font-semibold">
              <td className="py-2 px-3 border border-slate-300">{T("gesamtI")}</td>
              <td className="border border-slate-300"></td>
              <td className="text-right py-2 px-3 border border-slate-300 tabular-nums">{money(result.gesamtICent)}</td>
              <td className="border border-slate-300"></td>
              <td className="border border-slate-300"></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-slate-800 mb-3">{T("coins")}</h3>
        <table className="w-full text-sm border border-slate-300">
          <thead className="bg-slate-100 text-slate-700">
            <tr>
              <th className="text-left py-2 px-3 border border-slate-300 w-32">{T("coin")}</th>
              <th className="text-right py-2 px-3 border border-slate-300 w-20">{T("stueck")}</th>
              <th className="text-right py-2 px-3 border border-slate-300">{T("total")}</th>
              <th className="py-2 px-3 border border-slate-300 w-24">{T("control")} I</th>
              <th className="py-2 px-3 border border-slate-300 w-24">{T("control")} II</th>
            </tr>
          </thead>
          <tbody>
            {COIN_VALUES.map((c) => {
              const cnt = result.coins[c] ?? 0;
              return (
                <tr key={c}>
                  <td className="py-2 px-3 border border-slate-300">{money(c)}</td>
                  <td className="text-right py-2 px-3 border border-slate-300 tabular-nums">{cnt}</td>
                  <td className="text-right py-2 px-3 border border-slate-300 tabular-nums">{money(cnt * c)}</td>
                  <td className="border border-slate-300"></td>
                  <td className="border border-slate-300"></td>
                </tr>
              );
            })}
            <tr className="bg-slate-50 font-semibold">
              <td className="py-2 px-3 border border-slate-300">{T("gesamtII")}</td>
              <td className="border border-slate-300"></td>
              <td className="text-right py-2 px-3 border border-slate-300 tabular-nums">{money(result.gesamtIICent)}</td>
              <td className="border border-slate-300"></td>
              <td className="border border-slate-300"></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-slate-800 mb-3">{T("summary")}</h3>
        <table className="w-full text-sm border border-slate-300">
          <tbody>
            <tr className="bg-slate-100">
              <td className="py-2 px-3 border border-slate-300 font-semibold">{T("totalEinnahmen")}</td>
              <td className="text-right py-2 px-3 border border-slate-300 tabular-nums font-semibold">{money(totalEinnahmen)}</td>
            </tr>
            <tr>
              <td className="py-2 px-3 border border-slate-300">− {T("anfangsbestand")}</td>
              <td className="text-right py-2 px-3 border border-slate-300 tabular-nums">{money(anfangsbestandCent)}</td>
            </tr>
            <tr>
              <td className="py-2 px-3 border border-slate-300">+ {T("ausgaben")}</td>
              <td className="text-right py-2 px-3 border border-slate-300 tabular-nums">{money(ausgabenCent)}</td>
            </tr>
            <tr>
              <td className="py-2 px-3 border border-slate-300">= {T("tagesumsatz")}</td>
              <td className="text-right py-2 px-3 border border-slate-300 tabular-nums">{money(tagesumsatzCent)}</td>
            </tr>
            <tr className="bg-slate-100 font-bold">
              <td className="py-2 px-3 border border-slate-300">{T("kassenbestand")}</td>
              <td className="text-right py-2 px-3 border border-slate-300 tabular-nums">{money(result.kassenbestandCent)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
