import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { authorizeApi } from "@/lib/api-authorization";
import { mutationError } from "@/lib/api-errors";
import { courseInputSchema } from "@/lib/academic-validation";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const access = await authorizeApi([Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.GUARDIAN]);
  if (access.response) return access.response;
  const courses = await prisma.course.findMany({ where: access.user!.role === Role.ADMIN ? {} : { isActive: true }, include: { _count: { select: { enrollments: true, teachers: true } } }, orderBy: { code: "asc" } });
  return NextResponse.json({ courses });
}

export async function POST(request: Request) {
  const access = await authorizeApi([Role.ADMIN]);
  if (access.response) return access.response;
  const parsed = courseInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid course details", issues: parsed.error.flatten() }, { status: 400 });
  try {
    const course = await prisma.$transaction(async (tx) => {
      const created = await tx.course.create({ data: { ...parsed.data, description: parsed.data.description || null } });
      await tx.auditEvent.create({ data: { actorId: access.user!.id, action: "course.created", entityType: "Course", entityId: created.id, metadata: { code: created.code } } });
      return created;
    });
    return NextResponse.json({ course }, { status: 201 });
  } catch (error) {
    return mutationError(error, "That course code is already in use");
  }
}
