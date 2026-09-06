import Link from "next/link";
import { Role } from "@prisma/client";
import { requireUser } from "@/lib/authorization";
import { CourseForm } from "@/components/course-form";

export default async function NewCoursePage() {
  await requireUser([Role.ADMIN]);
  return <main className="formPage"><Link className="backLink" href="/dashboard/courses">← Course catalogue</Link><header><div><p className="eyebrow">NEW PROGRAMME</p><h1>Add a course</h1><p>Create a programme and make it available for enrollment.</p></div></header><CourseForm/></main>;
}
