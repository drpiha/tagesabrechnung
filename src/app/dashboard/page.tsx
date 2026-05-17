import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Nav } from "@/components/Nav";
import { CalcForm } from "@/components/CalcForm";
import { centToEurDe } from "@/lib/calc";

function todayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}
function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

interface AusgabenItem { label?: string; amount: string }

function parseAusgabenJson(s: string | null | undefined, total: number): AusgabenItem[] {
  if (!s || s === "[]") {
    return total > 0 ? [{ amount: centToEurDe(total) }] : [];
  }
  try {
    const arr = JSON.parse(s) as Array<{ label?: string; amount: number }>;
    return arr.map((it) => ({
      label: it.label,
      amount: centToEurDe(it.amount ?? 0),
    }));
  } catch {
    return total > 0 ? [{ amount: centToEurDe(total) }] : [];
  }
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const userId = (session.user as { id: string }).id;
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyName: true, name: true },
  });

  const today = todayUtc();
  const existing = await prisma.dailyReconciliation.findUnique({
    where: { userId_date: { userId, date: today } },
  });

  // Son kullanılan verkaufsort'u öneri olarak getir
  const lastRow = existing
    ? null
    : await prisma.dailyReconciliation.findFirst({
        where: { userId, verkaufsort: { not: null } },
        orderBy: { date: "desc" },
        select: { verkaufsort: true },
      });

  const initial = existing
    ? {
        id: existing.id,
        date: isoDate(existing.date),
        tagesumsatz: centToEurDe(existing.tagesumsatz),
        anfangsbestand: centToEurDe(existing.anfangsbestand),
        muenzenZielwert: centToEurDe(existing.muenzenZielwert),
        ausgabenItems: parseAusgabenJson(existing.ausgabenJson, existing.ausgaben ?? 0),
        verkaufsort: existing.verkaufsort ?? "",
        notes: existing.notes ?? "",
      }
    : {
        date: isoDate(today),
        verkaufsort: lastRow?.verkaufsort ?? "",
      };

  return (
    <>
      <Nav />
      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <CalcForm companyName={u?.companyName ?? null} initial={initial} />
      </main>
    </>
  );
}
