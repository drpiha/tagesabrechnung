import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";

const schema = z.object({
  name: z.string().min(1).max(120).optional(),
  companyName: z.string().max(160).optional(),
  verkaufsort: z.string().max(160).optional(),
  locale: z.enum(["tr", "de"]).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).max(200).optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauth" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const json = await req.json();
  const p = schema.safeParse(json);
  if (!p.success) return NextResponse.json({ error: "Geçersiz veri" }, { status: 400 });

  const data: any = {};
  if (p.data.name !== undefined) data.name = p.data.name;
  if (p.data.companyName !== undefined) data.companyName = p.data.companyName;
  if (p.data.verkaufsort !== undefined) data.verkaufsort = p.data.verkaufsort;
  if (p.data.locale) data.locale = p.data.locale;

  if (p.data.newPassword) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
    const ok = await bcrypt.compare(p.data.currentPassword ?? "", user.passwordHash);
    if (!ok) return NextResponse.json({ error: "Mevcut parola hatalı" }, { status: 400 });
    data.passwordHash = await bcrypt.hash(p.data.newPassword, 10);
  }
  await prisma.user.update({ where: { id: userId }, data });
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauth" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, companyName: true, verkaufsort: true, locale: true },
  });
  return NextResponse.json({ user: u });
}
