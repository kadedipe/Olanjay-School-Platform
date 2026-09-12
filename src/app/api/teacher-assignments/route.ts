import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { teacherAssignmentInputSchema } from "@/lib/academic-validation";
import { authorizeApi } from "@/lib/api-authorization";
import { mutationError } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const access = await authorizeApi([Role.ADMIN, Role.TEACHER]);
  if (access.response) return access.response;
  const assignments = await prisma.courseTeacher.findMany({ where: access.user!.role === Role.TEACHER ? { teacher: { userId: access.user!.id } } : {}, include: { course: true, teacher: { include: { user: { select: { firstName: true, lastName: true, email: true } } } } }, orderBy: { course: { code: "asc" } } });
  return NextResponse.json({ assignments });
}

export async function POST(request: Request) {
  const access = await authorizeApi([Role.ADMIN]);
  if (access.response) return access.response;
  const parsed = teacherAssignmentInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid teacher assignment" }, { status: 400 });
  const [account, course] = await Promise.all([
    prisma.user.findFirst({ where: { id: parsed.data.userId, role: Role.TEACHER, status: "ACTIVE" }, include: { teacher: true } }),
    prisma.course.findFirst({ where: { id: parsed.data.courseId, isActive: true }, select: { id: true } }),
  ]);
  if (!account || !course) return NextResponse.json({ error: "Select an active teacher and course" }, { status: 400 });
  if (!account.teacher && !parsed.data.employeeNumber) return NextResponse.json({ error: "Employee number is required for this teacher's first assignment" }, { status: 400 });
  try {
    const assignment = await prisma.$transaction(async (tx) => {
      const teacher = account.teacher ?? await tx.teacher.create({ data: { userId: account.id, employeeNumber: parsed.data.employeeNumber } });
      const created = await tx.courseTeacher.create({ data: { teacherId: teacher.id, courseId: course.id } });
      await tx.auditEvent.create({ data: { actorId: access.user!.id, action: "teacherCourse.assigned", entityType: "CourseTeacher", entityId: `${created.teacherId}:${created.courseId}`, metadata: { teacherId: created.teacherId, courseId: created.courseId } } });
      return created;
    });
    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error) { return mutationError(error, "The teacher is already assigned to this course, or the employee number is already in use"); }
}
