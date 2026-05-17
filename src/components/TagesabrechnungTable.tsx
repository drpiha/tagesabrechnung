"use client";
import { centToEurDe, type CalcResult } from "@/lib/calc";
import { useLocale } from "./LocaleContext";

interface Props {
  result: CalcResult;
  date?: string;
  companyName?: string | null;
  tagesumsatzCent: number;
  anfangsbestandCent: number;
}

const BANKNOTE_LABELS = [
  { c: 50000, l: "500,00 €" },
  { c: 20000, l: "200,00 €" },
  { c: 10000, l: "100,00 €" },
  { c:  5000, l:  "50,00 €" },
  { c:  2000, l:  "20,00 €" },
  { c:  1000, l:  "10,00 €" },
  { c:   500, l:   "5,00 €" },
];
const COIN_LABELS = [
  { c: 200, l: "2,00 €"  },
  { c: 100, l: "1,00 €"  },
  { c:  50, l: "0,50 €"  },
  { c:  20, l: "0,20 €"  },
  { c:  10, l: "0,10 €"  },
  { c:   5, l: "0,05 €"  },
  { c:   1, l: "0,01 €"  },
];

export function TagesabrechnungTable({ result, date, companyName, tagesumsatzCent, anfangsbestandCent }: Props) {
  const { T } = useLocale();
  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold text-slate-900">Tagesabrechnung</h2>
          {companyName && <div className="text-slate-600 mt-1">Firma: {companyName}</div>}
          {date && <div className="text-slate-500 text-sm">Datum: {date}</div>}
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold text-slate-800 mb-3">1. {T("banknotes")}</h3>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left py-2 px-3">€ Schein</th>
              <th className="text-right py-2 px-3">Stück</th>
              <th className="text-right py-2 px-3">Gesamt €</th>
              <th className="w-16 py-2 px-3">Kontrolle I</th>
              <th className="w-16 py-2 px-3">Kontrolle II</th>
            </tr>
          </thead>
          <tbody>
            {BANKNOTE_LABELS.map(({ c, l }) => {
              const cnt = result.banknotes[c] ?? 0;
              const total = cnt * c;
              return (
                <tr key={c} className="border-t border-slate-100">
                  <td className="py-2 px-3">{l}</td>
                  <td className="text-right py-2 px-3 tabular-nums">{cnt}</td>
                  <td className="text-right py-2 px-3 tabular-nums">{centToEurDe(total)} €</td>
                  <td></td><td></td>
                </tr>
              );
            })}
            <tr className="border-t-2 border-slate-300 font-semibold bg-slate-50">
              <td className="py-2 px-3">Gesamt I</td>
              <td></td>
              <td className="text-right py-2 px-3 tabular-nums">{centToEurDe(result.gesamtICent)} €</td>
              <td></td><td></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold text-slate-800 mb-3">2. {T("coins")}</h3>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left py-2 px-3">€ Münze</th>
              <th className="text-right py-2 px-3">Stück</th>
              <th className="text-right py-2 px-3">Gesamt €</th>
              <th className="w-16 py-2 px-3">Kontrolle I</th>
              <th className="w-16 py-2 px-3">Kontrolle II</th>
            </tr>
          </thead>
          <tbody>
            {COIN_LABELS.map(({ c, l }) => {
              const cnt = result.coins[c] ?? 0;
              const total = cnt * c;
              return (
                <tr key={c} className="border-t border-slate-100">
                  <td className="py-2 px-3">{l}</td>
                  <td className="text-right py-2 px-3 tabular-nums">{cnt}</td>
                  <td className="text-right py-2 px-3 tabular-nums">{centToEurDe(total)} €</td>
                  <td></td><td></td>
                </tr>
              );
            })}
            <tr className="border-t-2 border-slate-300 font-semibold bg-slate-50">
              <td className="py-2 px-3">Gesamt II</td>
              <td></td>
              <td className="text-right py-2 px-3 tabular-nums">{centToEurDe(result.gesamtIICent)} €</td>
              <td></td><td></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold text-slate-800 mb-3">3. Finanzielle Zusammenfassung</h3>
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-t border-slate-100">
              <td className="py-2 px-3 text-slate-700">Total Einnahmen (I+II)</td>
              <td className="text-right py-2 px-3 tabular-nums font-medium">{centToEurDe(result.gesamtICent + result.gesamtIICent)} €</td>
            </tr>
            <tr className="border-t border-slate-100">
              <td className="py-2 px-3 text-slate-700">Anfangbestand · Wechselgeld vom Vortag</td>
              <td className="text-right py-2 px-3 tabular-nums">{centToEurDe(anfangsbestandCent)} €</td>
            </tr>
            <tr className="border-t border-slate-100">
              <td className="py-2 px-3 text-slate-700">Tagesumsatz</td>
              <td className="text-right py-2 px-3 tabular-nums">{centToEurDe(tagesumsatzCent)} €</td>
            </tr>
            <tr className="border-t-2 border-slate-300 font-semibold bg-slate-50">
              <td className="py-2 px-3">Kassenbestand bei Geschäftsabschluss</td>
              <td className="text-right py-2 px-3 tabular-nums">{centToEurDe(result.kassenbestandCent)} €</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
