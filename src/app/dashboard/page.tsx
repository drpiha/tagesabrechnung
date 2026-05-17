import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Nav } from "@/components/Nav";
import { CalcForm } from "@/components/CalcForm";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const userId = (session.user as { id: string }).id;
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyName: true, name: true },
  });
  return (
    <>
      <Nav />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <CalcForm companyName={u?.companyName ?? null} />
      </main>
    </>
  );
}
