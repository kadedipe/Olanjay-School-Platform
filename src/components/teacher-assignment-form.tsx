"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { requestJson } from "@/lib/client-api";

type TeacherOption = { id: string; label: string; hasProfile: boolean; employeeNumber: string };
type CourseOption = { id: string; label: string };
export function TeacherAssignmentForm({ teachers, courses }: { teachers: TeacherOption[]; courses: CourseOption[] }) {
  const router=useRouter(); const [selected,setSelected]=useState(""); const [pending,setPending]=useState(false); const [error,setError]=useState(""); const teacher=teachers.find((item)=>item.id===selected);
  async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setPending(true);setError("");const form=event.currentTarget;try{await requestJson("/api/teacher-assignments",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(Object.fromEntries(new FormData(form)))});form.reset();setSelected("");router.refresh();}catch(cause){setError(cause instanceof Error?cause.message:"Assignment could not be created.");}finally{setPending(false);}}
  return <form className="crudForm compactForm" onSubmit={submit}><div className="formGrid"><label>Teacher<select name="userId" required value={selected} onChange={(event)=>setSelected(event.target.value)}><option value="" disabled>Select teacher</option>{teachers.map((item)=><option value={item.id} key={item.id}>{item.label}{item.hasProfile ? ` — ${item.employeeNumber}` : ""}</option>)}</select></label><label>Course<select name="courseId" required defaultValue=""><option value="" disabled>Select course</option>{courses.map((item)=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label></div><label>Employee number<input name="employeeNumber" required={Boolean(teacher && !teacher.hasProfile)} disabled={teacher?.hasProfile} placeholder={teacher?.hasProfile ? "Existing profile will be used" : "Required for first assignment"} maxLength={40}/></label>{error&&<p className="formError" role="alert">{error}</p>}<div className="formActions"><button className="primary" disabled={pending}>{pending?"Assigning…":"Assign teacher"}</button></div></form>;
}
