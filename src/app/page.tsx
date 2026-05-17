import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");
  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 text-center">
        <div className="w-20 h-20 rounded-2xl bg-brand-600 text-white grid place-items-center text-3xl font-bold mb-6">€</div>
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-3">Tagesabrechnung</h1>
        <p className="text-lg text-slate-600 max-w-2xl mb-2">Professionelle tägliche Kassenabrechnung</p>
        <p className="text-sm text-slate-500 max-w-xl mb-8">
          Tagesumsatz eingeben, Banknoten- und Münzaufteilung in Sekunden bereit.
          Vollständiger Verlauf, Berichte und GoBD-konformer PDF-Export.
        </p>
        <div className="flex gap-3">
          <Link href="/signup" className="btn-primary">Konto erstellen</Link>
          <Link href="/login" className="btn-secondary">Anmelden</Link>
        </div>
      </div>
    </main>
  );
}
