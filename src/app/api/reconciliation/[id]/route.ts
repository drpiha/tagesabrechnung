import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauth" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const row = await prisma.dailyReconciliation.findUnique({ where: { id: params.id } });
  if (!row || row.userId !== userId) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  await prisma.dailyReconciliation.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauth" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const row = await prisma.dailyReconciliation.findUnique({ where: { id: params.id } });
  if (!row || row.userId !== userId) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  return NextResponse.json({ row });
}
