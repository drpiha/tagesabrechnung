import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";

const schema = z.object({
  name: z.string().min(1).max(120),
  companyName: z.string().max(160).optional().default(""),
  email: z.string().email().max(160),
  password: z.string().min(8).max(200),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const p = schema.safeParse(json);
  if (!p.success) {
    return NextResponse.json({ error: "Geçersiz veri", details: p.error.flatten() }, { status: 400 });
  }
  const { name, companyName, email, password } = p.data;
  const lower = email.toLowerCase().trim();
  const exists = await prisma.user.findUnique({ where: { email: lower } });
  if (exists) return NextResponse.json({ error: "Bu e-posta zaten kayıtlı" }, { status: 400 });
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { email: lower, passwordHash, name, companyName: companyName || null },
  });
  return NextResponse.json({ ok: true });
}
