"use client";
import { type CalcResult } from "@/lib/calc";
import { useLocale } from "./LocaleContext";
import { formatMoney, CURRENCY_SYMBOL } from "@/lib/i18n";

interface Props {
  result: CalcResult;
  date: string;
  time?: string;
  companyName?: string | null;
  tagesumsatzCent: number;
  anfangsbestandCent: number;
  ausgabenCent?: number;
  notes?: string;
}

const BANKNOTE_VALUES = [50000, 20000, 10000, 5000, 2000, 1000, 500];
const COIN_VALUES = [200, 100, 50, 20, 10, 5, 1];

export function PdfButton(props: Props) {
  const { T, currency } = useLocale();
  // PDF is always rendered in German (it's a GoBD document for German tax authorities).
  // We use German labels regardless of UI locale.
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
    doc.text(`Firma: ${props.companyName ?? "—"}`, left, 78);
    const dateText = props.time ? `Datum: ${props.date}   Uhrzeit: ${props.time}` : `Datum: ${props.date}`;
    doc.text(dateText, right, 78, { align: "right" });

    // --- Common table style ---
    const headStyles = { fillColor: [240, 240, 240] as any, textColor: 20, fontStyle: "bold" as const, lineColor: [0,0,0] as any, lineWidth: 0.5 };
    const bodyStyles = { textColor: 20, lineColor: [180,180,180] as any, lineWidth: 0.3 };
    const tableTheme = "grid" as const;

    // --- Banknotes table ---
    (doc as any).autoTable({
      startY: 100,
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
      styles: { fontSize: 9, cellPadding: 4 },
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
      styles: { fontSize: 9, cellPadding: 4 },
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

    // --- Financial Summary (paper-template flow) ---
    const totalEinnahmen = props.result.gesamtICent + props.result.gesamtIICent;
    (doc as any).autoTable({
      startY: y,
      theme: tableTheme,
      head: [["Finanzielle Zusammenfassung", sym]],
      body: [
        [
          { content: "Total Einnahmen (I + II)", styles: { fontStyle: "bold" } },
          { content: fmt(totalEinnahmen), styles: { fontStyle: "bold", halign: "right" } },
        ],
        ["−  Anfangsbestand · Wechselgeld vom Vortag", { content: fmt(props.anfangsbestandCent), styles: { halign: "right" } }],
        ["+  Ausgaben", { content: fmt(props.ausgabenCent ?? 0), styles: { halign: "right" } }],
        ["=  Tagesumsatz", { content: fmt(props.tagesumsatzCent), styles: { halign: "right" } }],
        [
          { content: "Kassenbestand bei Geschäftsabschluss", styles: { fontStyle: "bold", fillColor: [240,240,240] } },
          { content: fmt(props.result.kassenbestandCent), styles: { fontStyle: "bold", halign: "right", fillColor: [240,240,240] } },
        ],
      ],
      styles: { fontSize: 9, cellPadding: 5 },
      headStyles,
      bodyStyles,
      columnStyles: { 1: { halign: "right", cellWidth: 130 } },
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
