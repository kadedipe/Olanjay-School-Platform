import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { authorizeApi } from "@/lib/api-authorization";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ teacherId: string; courseId: string }> };

export async function DELETE(_: Request, { params }: Context) {
  const access = await authorizeApi([Role.ADMIN]);
  if (access.response) return access.response;
  const { teacherId, courseId } = await params;
  const existing = await prisma.courseTeacher.findUnique({ where: { courseId_teacherId: { courseId, teacherId } } });
  if (!existing) return NextResponse.json({ error: "Teacher assignment not found" }, { status: 404 });
  await prisma.$transaction([
    prisma.courseTeacher.delete({ where: { courseId_teacherId: { courseId, teacherId } } }),
    prisma.auditEvent.create({ data: { actorId: access.user!.id, action: "teacherCourse.removed", entityType: "CourseTeacher", entityId: `${teacherId}:${courseId}`, metadata: { teacherId, courseId } } }),
  ]);
  return NextResponse.json({ removed: true });
}
