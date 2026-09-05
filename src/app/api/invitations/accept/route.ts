import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, hashToken, isStrongPassword } from "@/lib/security";

const schema = z.object({ token: z.string().min(20).max(200), password: z.string().min(12).max(200) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !isStrongPassword(parsed.data.password)) return NextResponse.json({ error: "Use at least 12 characters with uppercase, lowercase, number, and symbol" }, { status: 400 });
  const invitation = await prisma.invitation.findUnique({ where: { tokenHash: hashToken(parsed.data.token) } });
  if (!invitation || invitation.acceptedAt || invitation.revokedAt || invitation.expiresAt <= new Date()) return NextResponse.json({ error: "This invitation is invalid or has expired" }, { status: 410 });
  const passwordHash = await hashPassword(parsed.data.password);

  try { await prisma.$transaction(async (tx) => {
    const claimed = await tx.invitation.updateMany({ where: { id: invitation.id, acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } }, data: { acceptedAt: new Date() } });
    if (claimed.count !== 1) throw new Error("INVITATION_ALREADY_USED");
    const user = await tx.user.create({ data: { email: invitation.email, firstName: invitation.firstName, lastName: invitation.lastName, role: invitation.role, status: "ACTIVE", passwordHash } });
    await tx.auditEvent.create({ data: { actorId: user.id, action: "invitation.accepted", entityType: "User", entityId: user.id, metadata: { role: user.role } } });
  }); } catch { return NextResponse.json({ error: "This invitation could not be accepted" }, { status: 409 }); }
  return NextResponse.json({ success: true });
}
