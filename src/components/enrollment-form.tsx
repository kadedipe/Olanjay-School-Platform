"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { requestJson } from "@/lib/client-api";

type Option = { id: string; label: string };
export function EnrollmentForm({ students, courses, academicYears }: { students: Option[]; courses: Option[]; academicYears: Array<Option & { isCurrent: boolean }> }) {
  const router = useRouter(); const [pending, setPending] = useState(false); const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError(""); const form = event.currentTarget;
    try { await requestJson("/api/enrollments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(form))) }); form.reset(); router.refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Enrollment could not be created."); }
    finally { setPending(false); }
  }
  return <form className="crudForm compactForm" onSubmit={submit}><div className="formGrid"><label>Student<select name="studentId" required defaultValue=""><option value="" disabled>Select student</option>{students.map((item)=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label><label>Course<select name="courseId" required defaultValue=""><option value="" disabled>Select course</option>{courses.map((item)=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label></div><div className="formGrid threeColumns"><label>Academic year<select name="academicYearId" required defaultValue={academicYears.find((item)=>item.isCurrent)?.id ?? ""}><option value="" disabled>Select year</option>{academicYears.map((item)=><option key={item.id} value={item.id}>{item.label}{item.isCurrent ? " (current)" : ""}</option>)}</select></label><label>Year level<input name="yearLevel" type="number" min={1} max={10} required defaultValue={1}/></label><label>Status<select name="status" defaultValue="ENROLLED"><option value="APPLIED">Applied</option><option value="ENROLLED">Enrolled</option><option value="DEFERRED">Deferred</option><option value="WITHDRAWN">Withdrawn</option><option value="GRADUATED">Graduated</option></select></label></div>{error && <p className="formError" role="alert">{error}</p>}<div className="formActions"><button className="primary" disabled={pending}>{pending ? "Enrolling…" : "Enroll student"}</button></div></form>;
}
