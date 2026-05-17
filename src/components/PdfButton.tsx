"use client";
import { type CalcResult, eurToCent } from "@/lib/calc";
import { useLocale } from "./LocaleContext";
import { formatMoney, CURRENCY_SYMBOL } from "@/lib/i18n";
import type { AusgabenItem } from "./CalcForm";

interface Props {
  result: CalcResult;
  date: string;
  time?: string;
  companyName?: string | null;
  verkaufsort?: string | null;
  tagesumsatzCent: number;
  anfangsbestandCent: number;
  ausgabenCent?: number;
  ausgabenItems?: AusgabenItem[];
  notes?: string;
}

const BANKNOTE_VALUES = [50000, 20000, 10000, 5000, 2000, 1000, 500];
const COIN_VALUES = [200, 100, 50, 20, 10, 5, 2, 1];

function itemCent(it: AusgabenItem): number {
  if (!it.amount) return 0;
  try { return eurToCent(it.amount); } catch { return 0; }
}

export function PdfButton(props: Props) {
  const { T, currency } = useLocale();
  const pdfLocale = "de" as const;

  async function exportPdf() {
    const jsPDFmod = await import("jspdf");
    await import("jspdf-autotable");
    const { jsPDF } = jsPDFmod as any;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = 595;
    const left = 40;
    const right = pageWidth - 40;

    const sym = CURRENCY_SYMBOL[currency];
    const fmt = (cent: number) => formatMoney(cent, currency, pdfLocale);

    // --- Header ---
    doc.setFont("helvetica", "bold").setFontSize(15);
    doc.text("Tagesabrechnung", pageWidth / 2, 50, { align: "center" });

    doc.setFont("helvetica", "normal").setFontSize(10);
    let headerY = 78;
    doc.text(`Firma: ${props.companyName ?? "-"}`, left, headerY);
    if (props.verkaufsort) {
      headerY += 14;
      doc.text(`Verkaufsort: ${props.verkaufsort}`, left, headerY);
    }
    const dateText = props.time ? `Datum: ${props.date}   Uhrzeit: ${props.time}` : `Datum: ${props.date}`;
    doc.text(dateText, right, 78, { align: "right" });

    const tableStartY = headerY + 22;

    const headStyles = { fillColor: [240, 240, 240] as any, textColor: 20, fontStyle: "bold" as const, lineColor: [0,0,0] as any, lineWidth: 0.5 };
    const bodyStyles = { textColor: 20, lineColor: [180,180,180] as any, lineWidth: 0.3 };
    const tableTheme = "grid" as const;

    // --- Banknotes table ---
    (doc as any).autoTable({
      startY: tableStartY,
      theme: tableTheme,
      head: [[`${sym} Schein`, "Stück", "Gesamt", "Kontrolle I", "Kontrolle II"]],
      body: [
        ...BANKNOTE_VALUES.map((c) => [
          fmt(c),
          String(props.result.banknotes[c] ?? 0),
          fmt((props.result.banknotes[c] ?? 0) * c),
          "", "",
        ]),
        [
          { content: "Gesamt I", styles: { fontStyle: "bold" } },
          "",
          { content: fmt(props.result.gesamtICent), styles: { fontStyle: "bold", halign: "right" } },
          "", "",
        ],
      ],
      styles: { fontSize: 9, cellPadding: 4, font: "helvetica" },
      headStyles,
      bodyStyles,
      columnStyles: {
        0: { cellWidth: 90 },
        1: { halign: "right", cellWidth: 60 },
        2: { halign: "right", cellWidth: 110 },
        3: { cellWidth: 110 },
        4: { cellWidth: 110 },
      },
      margin: { left, right: 40 },
    });

    let y = (doc as any).lastAutoTable.finalY + 14;

    // --- Coins table ---
    (doc as any).autoTable({
      startY: y,
      theme: tableTheme,
      head: [[`${sym} Münze`, "Stück", "Gesamt", "Kontrolle I", "Kontrolle II"]],
      body: [
        ...COIN_VALUES.map((c) => [
          fmt(c),
          String(props.result.coins[c] ?? 0),
          fmt((props.result.coins[c] ?? 0) * c),
          "", "",
        ]),
        [
          { content: "Gesamt II", styles: { fontStyle: "bold" } },
          "",
          { content: fmt(props.result.gesamtIICent), styles: { fontStyle: "bold", halign: "right" } },
          "", "",
        ],
      ],
      styles: { fontSize: 9, cellPadding: 4, font: "helvetica" },
      headStyles,
      bodyStyles,
      columnStyles: {
        0: { cellWidth: 90 },
        1: { halign: "right", cellWidth: 60 },
        2: { halign: "right", cellWidth: 110 },
        3: { cellWidth: 110 },
        4: { cellWidth: 110 },
      },
      margin: { left, right: 40 },
    });

    y = (doc as any).lastAutoTable.finalY + 14;

    // --- Summary (paper template flow) ---
    const totalKassenbestand = props.result.gesamtICent + props.result.gesamtIICent;
    const tagesumsatzDerived = totalKassenbestand - props.anfangsbestandCent;
    const visibleItems = (props.ausgabenItems ?? []).filter((it) => itemCent(it) > 0 || (it.label && it.label.trim()));
    const ausgabenSum = visibleItems.reduce((s, it) => s + itemCent(it), 0);
    const zwischensumme = tagesumsatzDerived - ausgabenSum;
    const ausgabenRowCount = Math.max(3, visibleItems.length);

    const greyFill = [240, 240, 240] as any;

    const summaryBody: any[] = [
      [
        { content: "Total Kassenbestand (I + II)", styles: { fontStyle: "bold", fillColor: greyFill } },
        { content: fmt(totalKassenbestand), styles: { fontStyle: "bold", halign: "right", fillColor: greyFill } },
      ],
      ["-  Anfangsbestand / Wechselgeld vom Vortag", { content: fmt(props.anfangsbestandCent), styles: { halign: "right" } }],
      [
        { content: "=  Tagesumsatz", styles: { fontStyle: "bold" } },
        { content: fmt(tagesumsatzDerived), styles: { fontStyle: "bold", halign: "right" } },
      ],
    ];

    // Ausgaben rows — min 3, padded with empty
    for (let i = 0; i < ausgabenRowCount; i++) {
      const it = visibleItems[i];
      const label = it?.label?.trim();
      const text = label ? `-  Ausgaben: ${label}` : "-  Ausgaben";
      summaryBody.push([
        text,
        { content: it ? fmt(itemCent(it)) : "", styles: { halign: "right" } },
      ]);
    }

    // Einlage — 2 empty placeholder rows
    summaryBody.push(["+  Einlage", ""]);
    summaryBody.push(["+  Einlage", ""]);

    summaryBody.push([
      { content: "=  Zwischensumme", styles: { fontStyle: "bold" } },
      { content: fmt(zwischensumme), styles: { fontStyle: "bold", halign: "right" } },
    ]);

    // Kassenbestand bei Geschäftsabschluss — value cell empty; "Übertrag zum nächsten Tag" sub-label
    summaryBody.push([
      {
        content: "Kassenbestand bei Geschäftsabschluss\nÜbertrag zum nächsten Tag",
        styles: { fontStyle: "bold", fillColor: greyFill },
      },
      { content: "", styles: { fillColor: greyFill } },
    ]);

    (doc as any).autoTable({
      startY: y,
      theme: tableTheme,
      head: [["Finanzielle Zusammenfassung", sym]],
      body: summaryBody,
      styles: { fontSize: 9, cellPadding: 5, font: "helvetica" },
      headStyles,
      bodyStyles,
      columnStyles: { 0: { cellWidth: "auto" as any }, 1: { halign: "right", cellWidth: 130 } },
      margin: { left, right: 40 },
    });

    // --- Notes (optional) ---
    if (props.notes && props.notes.trim()) {
      y = (doc as any).lastAutoTable.finalY + 16;
      doc.setFont("helvetica", "bold").setFontSize(9);
      doc.text("Notiz:", left, y);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(props.notes, right - left);
      doc.text(lines, left, y + 12);
    }

    // --- Signature line ---
    y = (doc as any).lastAutoTable.finalY + 50;
    if (y < 780) {
      doc.setDrawColor(120).setLineWidth(0.5);
      doc.line(left, y, left + 200, y);
      doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(80);
      doc.text("Unterschrift", left, y + 12);
    }

    doc.save(`Tagesabrechnung_${props.date}.pdf`);
  }

  return <button onClick={exportPdf} className="btn-secondary">{T("exportPdf")}</button>;
}
