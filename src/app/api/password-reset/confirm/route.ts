import { NextResponse } from "next/server";
import { passwordResetConfirmSchema } from "@/lib/account-validation";
import { prisma } from "@/lib/prisma";
import { hashPassword, hashToken, isStrongPassword } from "@/lib/security";

export async function POST(request: Request) {
  const parsed = passwordResetConfirmSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !isStrongPassword(parsed.data.password)) return NextResponse.json({ error: "Use at least 12 characters with uppercase, lowercase, number, and symbol" }, { status: 400 });
  const reset = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(parsed.data.token) }, include: { user: { select: { id: true, status: true } } } });
  if (!reset || reset.usedAt || reset.expiresAt <= new Date() || reset.user.status !== "ACTIVE") return NextResponse.json({ error: "This password reset link is invalid or has expired" }, { status: 410 });
  const passwordHash = await hashPassword(parsed.data.password);
  const now = new Date();
  try { await prisma.$transaction(async (tx) => {
    const consumed = await tx.passwordResetToken.updateMany({ where: { id: reset.id, usedAt: null, expiresAt: { gt: now } }, data: { usedAt: now } });
    if (consumed.count !== 1) throw new Error("RESET_ALREADY_USED");
    await tx.user.update({ where: { id: reset.userId }, data: { passwordHash, tokenVersion: { increment: 1 }, failedLoginAttempts: 0, lockedUntil: null } });
    await tx.passwordResetToken.updateMany({ where: { userId: reset.userId, usedAt: null }, data: { usedAt: now } });
    await tx.auditEvent.create({ data: { actorId: reset.userId, action: "account.password_reset_completed", entityType: "User", entityId: reset.userId } });
  }); } catch (error) {
    if (error instanceof Error && error.message === "RESET_ALREADY_USED") return NextResponse.json({ error: "This password reset link is invalid or has expired" }, { status: 410 });
    throw error;
  }
  return NextResponse.json({ reset: true });
}
