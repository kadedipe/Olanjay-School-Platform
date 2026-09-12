import { describe, expect, it } from "vitest";
import { academicYearInputSchema, courseInputSchema, enrollmentInputSchema, studentInputSchema, studentUpdateSchema, teacherAssignmentInputSchema } from "./academic-validation";

describe("academic CRUD validation", () => {
  it("normalizes admission numbers and course codes", () => {
    expect(studentInputSchema.parse({ userId: "user-1", admissionNumber: " nat-001 " }).admissionNumber).toBe("NAT-001");
    expect(courseInputSchema.parse({ code: " cse-101 ", name: "Software Engineering", qualification: "Diploma", durationMonths: "24" }).code).toBe("CSE-101");
  });

  it("rejects invalid course durations", () => {
    expect(courseInputSchema.safeParse({ code: "IT", name: "IT Support", qualification: "Certificate", durationMonths: 0 }).success).toBe(false);
    expect(courseInputSchema.safeParse({ code: "IT", name: "IT Support", qualification: "Certificate", durationMonths: 121 }).success).toBe(false);
  });

  it("limits mutable student statuses", () => {
    const base = { admissionNumber: "NAT-002", status: "INVITED" };
    expect(studentUpdateSchema.safeParse(base).success).toBe(false);
    expect(studentUpdateSchema.safeParse({ ...base, status: "SUSPENDED" }).success).toBe(true);
  });

  it("validates academic year chronology", () => {
    expect(academicYearInputSchema.safeParse({ name: "2026/2027", startsAt: "2026-09-01", endsAt: "2027-07-31" }).success).toBe(true);
    expect(academicYearInputSchema.safeParse({ name: "Invalid", startsAt: "2027-09-01", endsAt: "2027-07-31" }).success).toBe(false);
  });

  it("validates enrollment levels and normalizes employee numbers", () => {
    expect(enrollmentInputSchema.safeParse({ studentId: "s1", courseId: "c1", academicYearId: "y1", yearLevel: 0 }).success).toBe(false);
    expect(teacherAssignmentInputSchema.parse({ userId: "u1", courseId: "c1", employeeNumber: " ont-001 " }).employeeNumber).toBe("ONT-001");
  });
});
