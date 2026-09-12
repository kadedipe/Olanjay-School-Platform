import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { authorizeApi } from "@/lib/api-authorization";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const access = await authorizeApi([Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.GUARDIAN]);
  if (access.response) return access.response;
  const user = access.user!;
  const where = user.role === Role.ADMIN ? {}
    : user.role === Role.TEACHER ? { assessment: { course: { teachers: { some: { teacher: { userId: user.id } } } } } }
    : user.role === Role.STUDENT ? { student: { userId: user.id }, publishedAt: { not: null } }
    : { student: { guardians: { some: { guardian: { userId: user.id } } } }, publishedAt: { not: null } };
  const results = await prisma.result.findMany({
    where,
    include: {
      student: { include: { user: true } },
      assessment: { include: { course: true, term: { include: { academicYear: true } } } },
    },
    orderBy: { assessment: { dueAt: "desc" } },
  });
  return NextResponse.json({ results });
}
