import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { academicYearInputSchema } from "@/lib/academic-validation";
import { authorizeApi } from "@/lib/api-authorization";
import { mutationError } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const access = await authorizeApi([Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.GUARDIAN]);
  if (access.response) return access.response;
  const academicYears = await prisma.academicYear.findMany({ orderBy: { startsAt: "desc" } });
  return NextResponse.json({ academicYears });
}

export async function POST(request: Request) {
  const access = await authorizeApi([Role.ADMIN]);
  if (access.response) return access.response;
  const parsed = academicYearInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid academic year" }, { status: 400 });
  try {
    const academicYear = await prisma.$transaction(async (tx) => {
      if (parsed.data.isCurrent) await tx.academicYear.updateMany({ data: { isCurrent: false } });
      const created = await tx.academicYear.create({ data: { ...parsed.data, startsAt: new Date(`${parsed.data.startsAt}T00:00:00.000Z`), endsAt: new Date(`${parsed.data.endsAt}T23:59:59.999Z`) } });
      await tx.auditEvent.create({ data: { actorId: access.user!.id, action: "academicYear.created", entityType: "AcademicYear", entityId: created.id, metadata: { name: created.name, isCurrent: created.isCurrent } } });
      return created;
    });
    return NextResponse.json({ academicYear }, { status: 201 });
  } catch (error) { return mutationError(error, "That academic year already exists"); }
}
