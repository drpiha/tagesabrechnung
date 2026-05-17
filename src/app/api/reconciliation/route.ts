import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { calculate, eurToCent } from "@/lib/calc";

const inputSchema = z.object({
  date: z.string(),
  tagesumsatz: z.union([z.string(), z.number()]),
  anfangsbestand: z.union([z.string(), z.number()]),
  muenzenZielwert: z.union([z.string(), z.number()]),
  ausgaben: z.union([z.string(), z.number()]).optional(),
  notes: z.string().max(2000).optional(),
});

function parseDate(s: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) throw new Error("Geçersiz tarih");
  return new Date(Date.UTC(+m[1]!, +m[2]! - 1, +m[3]!));
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauth" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const url = new URL(req.url);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const date = url.searchParams.get("date");

  if (date) {
    const d = parseDate(date);
    const row = await prisma.dailyReconciliation.findUnique({
      where: { userId_date: { userId, date: d } },
    });
    return NextResponse.json({ row });
  }

  const where: any = { userId };
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = parseDate(from);
    if (to)   where.date.lte = parseDate(to);
  }
  const rows = await prisma.dailyReconciliation.findMany({ where, orderBy: { date: "desc" } });
  return NextResponse.json({ rows });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauth" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const json = await req.json();
  const p = inputSchema.safeParse(json);
  if (!p.success) return NextResponse.json({ error: "Geçersiz veri", details: p.error.flatten() }, { status: 400 });

  const { date, tagesumsatz, anfangsbestand, muenzenZielwert, ausgaben, notes } = p.data;
  let d: Date;
  try { d = parseDate(date); } catch (e) {
    return NextResponse.json({ error: "Geçersiz tarih" }, { status: 400 });
  }

  let result;
  const ausgabenCent = ausgaben != null ? eurToCent(ausgaben) : 0;
  try {
    result = calculate({
      tagesumsatzCent: eurToCent(tagesumsatz),
      anfangsbestandCent: eurToCent(anfangsbestand),
      muenzenZielwertCent: eurToCent(muenzenZielwert),
      ausgabenCent,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }

  const data = {
    userId,
    date: d,
    tagesumsatz: eurToCent(tagesumsatz),
    anfangsbestand: eurToCent(anfangsbestand),
    muenzenZielwert: eurToCent(muenzenZielwert),
    ausgaben: ausgabenCent,
    banknotesJson: JSON.stringify(result.banknotes),
    coinsJson: JSON.stringify(result.coins),
    gesamtI: result.gesamtICent,
    gesamtII: result.gesamtIICent,
    kassenbestand: result.kassenbestandCent,
    notes: notes ?? null,
  };

  const row = await prisma.dailyReconciliation.upsert({
    where: { userId_date: { userId, date: d } },
    create: data,
    update: data,
  });

  return NextResponse.json({ ok: true, id: row.id, result });
}
