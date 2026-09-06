import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { sendInvitationEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { createOpaqueToken, hashToken, INVITATION_TTL_MS } from "@/lib/security";

const invitationSchema = z.object({
  email: z.string().email().transform((value) => value.trim().toLowerCase()),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  role: z.enum([Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.GUARDIAN]),
});

function getPublicOrigin(request: Request) {
  const configuredUrl = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL;
  if (configuredUrl) return new URL(configuredUrl).origin;
  return new URL(request.url).origin;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  if (session.user.role !== Role.ADMIN) return NextResponse.json({ error: "Administrator access required" }, { status: 403 });
  const actor = session.user;
  const parsed = invitationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid invitation details", issues: parsed.error.flatten() }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } });
  if (existing) return NextResponse.json({ error: "An account already uses this email" }, { status: 409 });

  const token = createOpaqueToken();
  const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);
  const invitation = await prisma.$transaction(async (tx) => {
    await tx.invitation.updateMany({ where: { email: parsed.data.email, acceptedAt: null, revokedAt: null }, data: { revokedAt: new Date() } });
    const created = await tx.invitation.create({ data: { ...parsed.data, tokenHash: hashToken(token), expiresAt, invitedById: actor.id } });
    await tx.auditEvent.create({ data: { actorId: actor.id, action: "invitation.created", entityType: "Invitation", entityId: created.id, metadata: { email: parsed.data.email, role: parsed.data.role } } });
    return created;
  });

  const acceptUrl = `${getPublicOrigin(request)}/accept-invitation?token=${encodeURIComponent(token)}`;
  const delivery = await sendInvitationEmail({ to: invitation.email, firstName: invitation.firstName, acceptUrl, expiresAt });
  return NextResponse.json({ invitationId: invitation.id, expiresAt, delivery, acceptUrl: delivery.delivered ? undefined : acceptUrl }, { status: 201 });
}
