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

export type StudentInput = z.infer<typeof studentInputSchema>;
export type CourseInput = z.infer<typeof courseInputSchema>;
