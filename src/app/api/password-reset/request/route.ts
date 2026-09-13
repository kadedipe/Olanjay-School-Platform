import { NextResponse } from "next/server";
import { passwordResetRequestSchema } from "@/lib/account-validation";
import { sendPasswordResetEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { createOpaqueToken, hashToken, PASSWORD_RESET_TTL_MS } from "@/lib/security";

const genericResponse = { message: "If an active account matches that email, a password reset link has been sent." };

function publicOrigin(request: Request) {
  const configured = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL;
  return configured ? new URL(configured).origin : new URL(request.url).origin;
}

export async function POST(request: Request) {
  const parsed = passwordResetRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json(genericResponse);
  const user = await prisma.user.findFirst({ where: { email: parsed.data.email, status: "ACTIVE" }, select: { id: true, email: true, firstName: true } });
  if (!user) return NextResponse.json(genericResponse);

  const token = createOpaqueToken();
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
  const reset = await prisma.$transaction(async (tx) => {
    await tx.passwordResetToken.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } });
    const created = await tx.passwordResetToken.create({ data: { userId: user.id, tokenHash: hashToken(token), expiresAt } });
    await tx.auditEvent.create({ data: { action: "account.password_reset_requested", entityType: "User", entityId: user.id } });
    return created;
  });
  const resetUrl = `${publicOrigin(request)}/reset-password?token=${encodeURIComponent(token)}`;
  const delivery = await sendPasswordResetEmail({ to: user.email, firstName: user.firstName, resetUrl, expiresAt: reset.expiresAt }).catch(() => ({ delivered: false as const, reason: "provider_error" as const }));
  if (!delivery.delivered) console.error("Password reset email was not delivered", { userId: user.id, reason: delivery.reason });
  return NextResponse.json(process.env.NODE_ENV === "production" ? genericResponse : { ...genericResponse, previewUrl: resetUrl });
}
