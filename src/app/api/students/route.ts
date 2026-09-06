import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { authorizeApi } from "@/lib/api-authorization";
import { mutationError } from "@/lib/api-errors";
import { studentInputSchema } from "@/lib/academic-validation";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const access = await authorizeApi([Role.ADMIN, Role.TEACHER]);
  if (access.response) return access.response;
  const students = await prisma.student.findMany({
    include: { user: { select: { firstName: true, lastName: true, email: true, status: true } }, _count: { select: { enrollments: true, guardians: true } } },
    orderBy: { admissionNumber: "asc" },
  });
  return NextResponse.json({ students });
}

export async function POST(request: Request) {
  const access = await authorizeApi([Role.ADMIN]);
  if (access.response) return access.response;
  const parsed = studentInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid student details", issues: parsed.error.flatten() }, { status: 400 });
  const account = await prisma.user.findUnique({ where: { id: parsed.data.userId }, select: { role: true, status: true, student: { select: { id: true } } } });
  if (!account || account.role !== Role.STUDENT || account.status !== "ACTIVE") return NextResponse.json({ error: "Select an active student account" }, { status: 400 });
  if (account.student) return NextResponse.json({ error: "This account already has a student record" }, { status: 409 });
  try {
    const student = await prisma.$transaction(async (tx) => {
      const created = await tx.student.create({ data: {
        userId: parsed.data.userId,
        admissionNumber: parsed.data.admissionNumber,
        dateOfBirth: parsed.data.dateOfBirth ? new Date(`${parsed.data.dateOfBirth}T00:00:00.000Z`) : null,
        address: parsed.data.address || null,
      } });
      await tx.auditEvent.create({ data: { actorId: access.user!.id, action: "student.created", entityType: "Student", entityId: created.id, metadata: { admissionNumber: created.admissionNumber } } });
      return created;
    });
    return NextResponse.json({ student }, { status: 201 });
  } catch (error) {
    return mutationError(error, "That admission number is already in use");
  }
}
