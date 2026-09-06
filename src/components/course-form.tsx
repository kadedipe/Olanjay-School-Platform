"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type CourseRecord = { id: string; code: string; name: string; description: string; qualification: string; durationMonths: number; isActive: boolean };

export function CourseForm({ course }: { course?: CourseRecord }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError("");
    const formData = new FormData(event.currentTarget);
    const data = { ...Object.fromEntries(formData), isActive: formData.get("isActive") === "on" };
    const response = await fetch(course ? `/api/courses/${course.id}` : "/api/courses", {
      method: course ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    });
    const body = await response.json(); setPending(false);
    if (!response.ok) return setError(body.error ?? "Course could not be saved.");
    router.push("/dashboard/courses"); router.refresh();
  }
  return <form className="crudForm panel" onSubmit={submit}>
    <div className="formGrid"><label>Course code<input name="code" required maxLength={30} defaultValue={course?.code}/></label><label>Course name<input name="name" required maxLength={120} defaultValue={course?.name}/></label></div>
    <div className="formGrid"><label>Qualification<input name="qualification" required maxLength={120} placeholder="e.g. Certificate or Diploma" defaultValue={course?.qualification}/></label><label>Duration (months)<input name="durationMonths" type="number" required min={1} max={120} defaultValue={course?.durationMonths ?? 12}/></label></div>
    <label>Description<textarea name="description" rows={5} maxLength={1000} defaultValue={course?.description}/></label>
    <label className="checkboxLabel"><input name="isActive" type="checkbox" defaultChecked={course?.isActive ?? true}/> Available for enrollment</label>
    {error && <p className="formError" role="alert">{error}</p>}
    <div className="formActions"><button type="button" className="secondary" onClick={() => router.back()}>Cancel</button><button className="primary" disabled={pending}>{pending ? "Saving…" : course ? "Save changes" : "Create course"}</button></div>
  </form>;
}
