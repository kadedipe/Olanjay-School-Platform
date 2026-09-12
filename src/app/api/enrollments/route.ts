import { EnrollmentStatus, Prisma, Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { enrollmentInputSchema } from "@/lib/academic-validation";
import { authorizeApi } from "@/lib/api-authorization";
import { mutationError } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";

function enrollmentScope(role: Role, userId: string): Prisma.EnrollmentWhereInput {
  if (role === Role.ADMIN) return {};
  if (role === Role.TEACHER) return { course: { teachers: { some: { teacher: { userId } } } } };
  if (role === Role.STUDENT) return { student: { userId } };
  return { student: { guardians: { some: { guardian: { userId } } } } };
}

export async function GET() {
  const access = await authorizeApi([Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.GUARDIAN]);
  if (access.response) return access.response;
  const enrollments = await prisma.enrollment.findMany({ where: enrollmentScope(access.user!.role, access.user!.id), include: { student: { include: { user: { select: { firstName: true, lastName: true } } } }, course: true, academicYear: true }, orderBy: { enrolledAt: "desc" } });
  return NextResponse.json({ enrollments });
}

export async function POST(request: Request) {
  const access = await authorizeApi([Role.ADMIN]);
  if (access.response) return access.response;
  const parsed = enrollmentInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid enrollment" }, { status: 400 });
  const [student, course, academicYear] = await Promise.all([
    prisma.student.findFirst({ where: { id: parsed.data.studentId, user: { status: "ACTIVE" } }, select: { id: true } }),
    prisma.course.findFirst({ where: { id: parsed.data.courseId, isActive: true }, select: { id: true } }),
    prisma.academicYear.findUnique({ where: { id: parsed.data.academicYearId }, select: { id: true } }),
  ]);
  if (!student || !course || !academicYear) return NextResponse.json({ error: "Select an active student, course, and valid academic year" }, { status: 400 });
  try {
    const enrollment = await prisma.$transaction(async (tx) => {
      const created = await tx.enrollment.create({ data: { ...parsed.data, status: parsed.data.status as EnrollmentStatus } });
      await tx.auditEvent.create({ data: { actorId: access.user!.id, action: "enrollment.created", entityType: "Enrollment", entityId: created.id, metadata: { studentId: created.studentId, courseId: created.courseId, academicYearId: created.academicYearId } } });
      return created;
    });
    return NextResponse.json({ enrollment }, { status: 201 });
  } catch (error) { return mutationError(error, "This student is already enrolled in that course for the selected academic year"); }
}
