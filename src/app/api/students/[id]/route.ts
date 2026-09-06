import { Role, UserStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { authorizeApi } from "@/lib/api-authorization";
import { mutationError } from "@/lib/api-errors";
import { studentUpdateSchema } from "@/lib/academic-validation";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Context) {
  const access = await authorizeApi([Role.ADMIN, Role.TEACHER]);
  if (access.response) return access.response;
  const student = await prisma.student.findUnique({ where: { id: (await params).id }, include: { user: { select: { firstName: true, lastName: true, email: true, status: true } } } });
  return student ? NextResponse.json({ student }) : NextResponse.json({ error: "Student not found" }, { status: 404 });
}

export async function PATCH(request: Request, { params }: Context) {
  const access = await authorizeApi([Role.ADMIN]);
  if (access.response) return access.response;
  const parsed = studentUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid student details", issues: parsed.error.flatten() }, { status: 400 });
  const id = (await params).id;
  try {
    const student = await prisma.$transaction(async (tx) => {
      const existing = await tx.student.findUnique({ where: { id }, select: { userId: true } });
      if (!existing) return null;
      const updated = await tx.student.update({ where: { id }, data: {
        admissionNumber: parsed.data.admissionNumber,
        dateOfBirth: parsed.data.dateOfBirth ? new Date(`${parsed.data.dateOfBirth}T00:00:00.000Z`) : null,
        address: parsed.data.address || null,
      } });
      await tx.user.update({ where: { id: existing.userId }, data: { status: parsed.data.status as UserStatus, tokenVersion: { increment: parsed.data.status === "ACTIVE" ? 0 : 1 } } });
      await tx.auditEvent.create({ data: { actorId: access.user!.id, action: "student.updated", entityType: "Student", entityId: id, metadata: { status: parsed.data.status } } });
      return updated;
    });
    return student ? NextResponse.json({ student }) : NextResponse.json({ error: "Student not found" }, { status: 404 });
  } catch (error) {
    return mutationError(error, "That admission number is already in use");
  }
}

export async function DELETE(_: Request, { params }: Context) {
  const access = await authorizeApi([Role.ADMIN]);
  if (access.response) return access.response;
  const id = (await params).id;
  const student = await prisma.student.findUnique({ where: { id }, select: { userId: true } });
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });
  await prisma.$transaction([
    prisma.user.update({ where: { id: student.userId }, data: { status: UserStatus.ARCHIVED, tokenVersion: { increment: 1 } } }),
    prisma.auditEvent.create({ data: { actorId: access.user!.id, action: "student.archived", entityType: "Student", entityId: id } }),
  ]);
  return NextResponse.json({ archived: true });
}
