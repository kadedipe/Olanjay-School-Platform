import { describe, expect, it } from "vitest";
import { courseInputSchema, studentInputSchema, studentUpdateSchema } from "./academic-validation";

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
});
