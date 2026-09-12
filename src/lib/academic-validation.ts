import { z } from "zod";

const optionalText = (maximum: number) => z.string().trim().max(maximum).optional().default("");

export const studentInputSchema = z.object({
  userId: z.string().trim().min(1),
  admissionNumber: z.string().trim().min(2).max(40).transform((value) => value.toUpperCase()),
  dateOfBirth: z.union([z.literal(""), z.iso.date()]).optional().default("").refine((value) => !value || value <= new Date().toISOString().slice(0, 10), "Date of birth cannot be in the future"),
  address: optionalText(300),
});

export const studentUpdateSchema = studentInputSchema.omit({ userId: true }).extend({
  status: z.enum(["ACTIVE", "SUSPENDED", "ARCHIVED"]),
});

export const courseInputSchema = z.object({
  code: z.string().trim().min(2).max(30).transform((value) => value.toUpperCase()),
  name: z.string().trim().min(2).max(120),
  description: optionalText(1000),
  qualification: z.string().trim().min(2).max(120),
  durationMonths: z.coerce.number().int().min(1).max(120),
  isActive: z.boolean().optional().default(true),
});

export const academicYearInputSchema = z.object({
  name: z.string().trim().min(3).max(40),
  startsAt: z.iso.date(),
  endsAt: z.iso.date(),
  isCurrent: z.boolean().optional().default(false),
}).refine((value) => value.endsAt > value.startsAt, { message: "End date must be after start date", path: ["endsAt"] });

export const enrollmentInputSchema = z.object({
  studentId: z.string().trim().min(1),
  courseId: z.string().trim().min(1),
  academicYearId: z.string().trim().min(1),
  yearLevel: z.coerce.number().int().min(1).max(10),
  status: z.enum(["APPLIED", "ENROLLED", "DEFERRED", "WITHDRAWN", "GRADUATED"]).default("ENROLLED"),
});

export const enrollmentUpdateSchema = enrollmentInputSchema.pick({ yearLevel: true, status: true });

export const teacherAssignmentInputSchema = z.object({
  userId: z.string().trim().min(1),
  courseId: z.string().trim().min(1),
  employeeNumber: z.string().trim().max(40).transform((value) => value.toUpperCase()).optional().default("").refine((value) => !value || value.length >= 2, "Employee number must contain at least 2 characters"),
});

const schoolTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24-hour time in HH:MM format");
const timetableBaseSchema = z.object({ weekday: z.coerce.number().int().min(1).max(7), startsAt: schoolTime, endsAt: schoolTime, room: z.string().trim().min(1).max(80) }).refine((value) => value.endsAt > value.startsAt, { message: "End time must be after start time", path: ["endsAt"] });
export const timetableInputSchema = z.intersection(timetableBaseSchema, z.object({ courseId: z.string().trim().min(1), teacherId: z.string().trim().min(1) }));
export const timetableUpdateSchema = timetableBaseSchema;

export const termInputSchema = z.object({ name: z.string().trim().min(2).max(40), academicYearId: z.string().trim().min(1), startsAt: z.iso.date(), endsAt: z.iso.date() }).refine((value) => value.endsAt > value.startsAt, { message: "End date must be after start date", path: ["endsAt"] });

export const attendanceBulkSchema = z.object({
  timetableEntryId: z.string().trim().min(1), termId: z.string().trim().min(1), attendanceDate: z.iso.date(),
  records: z.array(z.object({ studentId: z.string().trim().min(1), status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]), note: z.string().trim().max(300).optional().default("") })).min(1).max(500),
});

export type StudentInput = z.infer<typeof studentInputSchema>;
export type CourseInput = z.infer<typeof courseInputSchema>;
