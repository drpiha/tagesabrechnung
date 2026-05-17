import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Nav } from "@/components/Nav";
import { ReportsClient } from "@/components/ReportsClient";

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const userId = (session.user as { id: string }).id;
  const rows = await prisma.dailyReconciliation.findMany({
    where: { userId },
    orderBy: { date: "asc" },
  });
  const data = rows.map(r => ({
    date: r.date.toISOString().slice(0,10),
    tagesumsatz: r.tagesumsatz / 100,
    kassenbestand: r.kassenbestand / 100,
  }));
  return (
    <>
      <Nav />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <ReportsClient data={data} />
      </main>
    </>
  );
}
