import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { authorizeApi } from "@/lib/api-authorization";
import { mutationError } from "@/lib/api-errors";
import { courseInputSchema } from "@/lib/academic-validation";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Context) {
  const access = await authorizeApi([Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.GUARDIAN]);
  if (access.response) return access.response;
  const course = await prisma.course.findUnique({ where: { id: (await params).id }, include: { _count: { select: { enrollments: true, teachers: true } } } });
  return course ? NextResponse.json({ course }) : NextResponse.json({ error: "Course not found" }, { status: 404 });
}

export async function PATCH(request: Request, { params }: Context) {
  const access = await authorizeApi([Role.ADMIN]);
  if (access.response) return access.response;
  const parsed = courseInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid course details", issues: parsed.error.flatten() }, { status: 400 });
  const id = (await params).id;
  try {
    const course = await prisma.$transaction(async (tx) => {
      const existing = await tx.course.findUnique({ where: { id }, select: { id: true } });
      if (!existing) return null;
      const updated = await tx.course.update({ where: { id }, data: { ...parsed.data, description: parsed.data.description || null } });
      await tx.auditEvent.create({ data: { actorId: access.user!.id, action: "course.updated", entityType: "Course", entityId: id, metadata: { code: updated.code, isActive: updated.isActive } } });
      return updated;
    });
    return course ? NextResponse.json({ course }) : NextResponse.json({ error: "Course not found" }, { status: 404 });
  } catch (error) {
    return mutationError(error, "That course code is already in use");
  }
}

export async function DELETE(_: Request, { params }: Context) {
  const access = await authorizeApi([Role.ADMIN]);
  if (access.response) return access.response;
  const id = (await params).id;
  const existing = await prisma.course.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "Course not found" }, { status: 404 });
  await prisma.$transaction([
    prisma.course.update({ where: { id }, data: { isActive: false } }),
    prisma.auditEvent.create({ data: { actorId: access.user!.id, action: "course.archived", entityType: "Course", entityId: id } }),
  ]);
  return NextResponse.json({ archived: true });
}
