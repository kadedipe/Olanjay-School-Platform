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

export type StudentInput = z.infer<typeof studentInputSchema>;
export type CourseInput = z.infer<typeof courseInputSchema>;
