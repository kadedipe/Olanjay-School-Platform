import { describe, expect, it } from "vitest";
import { academicYearInputSchema, assessmentInputSchema, attendanceBulkSchema, courseInputSchema, enrollmentInputSchema, resultBulkSchema, studentInputSchema, studentUpdateSchema, teacherAssignmentInputSchema, termInputSchema, timetableInputSchema } from "./academic-validation";

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

  it("rejects invalid timetable ranges", () => {
    const base = { courseId: "c1", teacherId: "t1", weekday: 1, room: "Lab 1" };
    expect(timetableInputSchema.safeParse({ ...base, startsAt: "09:00", endsAt: "10:30" }).success).toBe(true);
    expect(timetableInputSchema.safeParse({ ...base, startsAt: "11:00", endsAt: "10:30" }).success).toBe(false);
  });

  it("validates terms and attendance batches", () => {
    expect(termInputSchema.safeParse({ name: "Term 1", academicYearId: "y1", startsAt: "2026-09-01", endsAt: "2026-12-15" }).success).toBe(true);
    expect(attendanceBulkSchema.safeParse({ timetableEntryId: "t1", termId: "term1", attendanceDate: "2026-09-07", records: [] }).success).toBe(false);
  });

  it("validates assessments and result batches",()=>{expect(assessmentInputSchema.safeParse({courseId:"c1",termId:"t1",title:"Final exam",type:"EXAM",maximumScore:100,weight:60}).success).toBe(true);expect(resultBulkSchema.safeParse({assessmentId:"a1",publish:true,records:[{studentId:"s1",score:-1}]}).success).toBe(false);});
});
