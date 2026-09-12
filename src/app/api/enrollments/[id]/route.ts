import { EnrollmentStatus, Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { enrollmentUpdateSchema } from "@/lib/academic-validation";
import { authorizeApi } from "@/lib/api-authorization";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const access = await authorizeApi([Role.ADMIN]);
  if (access.response) return access.response;
  const parsed = enrollmentUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid enrollment update" }, { status: 400 });
  const id = (await params).id;
  const existing = await prisma.enrollment.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
  const enrollment = await prisma.$transaction(async (tx) => {
    const updated = await tx.enrollment.update({ where: { id }, data: { yearLevel: parsed.data.yearLevel, status: parsed.data.status as EnrollmentStatus } });
    await tx.auditEvent.create({ data: { actorId: access.user!.id, action: "enrollment.updated", entityType: "Enrollment", entityId: id, metadata: { yearLevel: updated.yearLevel, status: updated.status } } });
    return updated;
  });
  return NextResponse.json({ enrollment });
}

export async function DELETE(_: Request, { params }: Context) {
  const access = await authorizeApi([Role.ADMIN]);
  if (access.response) return access.response;
  const id = (await params).id;
  const existing = await prisma.enrollment.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
  await prisma.$transaction([
    prisma.enrollment.update({ where: { id }, data: { status: EnrollmentStatus.WITHDRAWN } }),
    prisma.auditEvent.create({ data: { actorId: access.user!.id, action: "enrollment.withdrawn", entityType: "Enrollment", entityId: id } }),
  ]);
  return NextResponse.json({ withdrawn: true });
}
