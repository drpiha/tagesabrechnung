"use client";
import { centToEurDe, type CalcResult } from "@/lib/calc";
import { useLocale } from "./LocaleContext";

interface Props {
  result: CalcResult;
  date: string;
  companyName?: string | null;
  tagesumsatzCent: number;
  anfangsbestandCent: number;
}

export function PdfButton(props: Props) {
  const { T } = useLocale();

  async function exportPdf() {
    const jsPDFmod = await import("jspdf");
    await import("jspdf-autotable");
    const { jsPDF } = jsPDFmod as any;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const left = 40, right = 555;

    doc.setFont("helvetica", "bold").setFontSize(16);
    doc.text("Tagesabrechnung", 297, 50, { align: "center" });
    doc.setFont("helvetica", "normal").setFontSize(10);
    if (props.companyName) doc.text(`Firma: ${props.companyName}`, left, 75);
    doc.text(`Datum: ${props.date}`, right, 75, { align: "right" });

    const banknotes = [
      [50000,"500,00 €"],[20000,"200,00 €"],[10000,"100,00 €"],
      [5000,"50,00 €"],[2000,"20,00 €"],[1000,"10,00 €"],[500,"5,00 €"]
    ] as const;
    const coins = [
      [200,"2,00 €"],[100,"1,00 €"],[50,"0,50 €"],
      [20,"0,20 €"],[10,"0,10 €"],[5,"0,05 €"],[1,"0,01 €"]
    ] as const;

    (doc as any).autoTable({
      startY: 95,
      head: [["€ Schein","Stück","Gesamt €","Kontrolle I","Kontrolle II"]],
      body: [
        ...banknotes.map(([c,l]) => [
          l,
          String(props.result.banknotes[c] ?? 0),
          centToEurDe((props.result.banknotes[c] ?? 0) * c) + " €",
          "", ""
        ]),
        [{content:"Gesamt I", styles:{fontStyle:"bold"}}, "", {content: centToEurDe(props.result.gesamtICent)+" €", styles:{fontStyle:"bold", halign:"right"}}, "", ""]
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [79, 87, 255] },
      columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } }
    });

    let y = (doc as any).lastAutoTable.finalY + 20;
    (doc as any).autoTable({
      startY: y,
      head: [["€ Münze","Stück","Gesamt €","Kontrolle I","Kontrolle II"]],
      body: [
        ...coins.map(([c,l]) => [
          l,
          String(props.result.coins[c] ?? 0),
          centToEurDe((props.result.coins[c] ?? 0) * c) + " €",
          "", ""
        ]),
        [{content:"Gesamt II", styles:{fontStyle:"bold"}}, "", {content: centToEurDe(props.result.gesamtIICent)+" €", styles:{fontStyle:"bold", halign:"right"}}, "", ""]
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [79, 87, 255] },
      columnStyles: { 1: { halign: "right" }, 2: { halign: "right" } }
    });

    y = (doc as any).lastAutoTable.finalY + 20;
    (doc as any).autoTable({
      startY: y,
      head: [["Finanzielle Zusammenfassung", "€"]],
      body: [
        ["Total Einnahmen (I+II)", centToEurDe(props.result.gesamtICent + props.result.gesamtIICent) + " €"],
        ["Anfangbestand · Wechselgeld vom Vortag", centToEurDe(props.anfangsbestandCent) + " €"],
        ["Tagesumsatz", centToEurDe(props.tagesumsatzCent) + " €"],
        [{content:"Kassenbestand bei Geschäftsabschluss", styles:{fontStyle:"bold"}}, {content: centToEurDe(props.result.kassenbestandCent)+" €", styles:{fontStyle:"bold", halign:"right"}}]
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [79, 87, 255] },
      columnStyles: { 1: { halign: "right" } }
    });

    doc.setFontSize(8).setTextColor(120);
    doc.text("Tagesabrechnung – generiert mit dem Kassenmodul · " + new Date().toLocaleString("de-DE"), 297, 820, { align: "center" });
    doc.save(`Tagesabrechnung_${props.date}.pdf`);
  }

  return <button onClick={exportPdf} className="btn-secondary">{T("exportPdf")}</button>;
}
