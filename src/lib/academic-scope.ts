import { Prisma, Role } from "@prisma/client";

export function timetableScope(role: Role, userId: string): Prisma.TimetableEntryWhereInput {
  if (role === Role.ADMIN) return {};
  if (role === Role.TEACHER) return { teacher: { userId } };
  if (role === Role.STUDENT) return { course: { enrollments: { some: { student: { userId }, status: "ENROLLED" } } } };
  return { course: { enrollments: { some: { status: "ENROLLED", student: { guardians: { some: { guardian: { userId } } } } } } } };
}

export function attendanceScope(role: Role, userId: string): Prisma.AttendanceWhereInput {
  if (role === Role.ADMIN) return {};
  if (role === Role.TEACHER) return { timetableEntry: { teacher: { userId } } };
  if (role === Role.STUDENT) return { student: { userId } };
  return { student: { guardians: { some: { guardian: { userId } } } } };
}
