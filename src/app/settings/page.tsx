import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Nav } from "@/components/Nav";
import { SettingsClient } from "@/components/SettingsClient";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const userId = (session.user as { id: string }).id;
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, companyName: true, locale: true },
  });
  return (
    <>
      <Nav />
      <main className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <SettingsClient initial={u!} />
      </main>
    </>
  );
}
