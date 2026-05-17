import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Nav } from "@/components/Nav";
import { HistoryClient } from "@/components/HistoryClient";

export default async function HistoryPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const userId = (session.user as { id: string }).id;
  const rows = await prisma.dailyReconciliation.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 365,
  });
  // Date'i ISO string'e çevirelim ki client'a serialize edilebilsin
  const serialized = rows.map(r => ({
    id: r.id,
    date: r.date.toISOString().slice(0,10),
    tagesumsatz: r.tagesumsatz,
    anfangsbestand: r.anfangsbestand,
    muenzenZielwert: r.muenzenZielwert,
    ausgaben: r.ausgaben ?? 0,
    gesamtI: r.gesamtI,
    gesamtII: r.gesamtII,
    kassenbestand: r.kassenbestand,
    notes: r.notes,
  }));
  return (
    <>
      <Nav />
      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <HistoryClient rows={serialized} />
      </main>
    </>
  );
}
