import Link from "next/link";
import { notFound } from "next/navigation";
import { Role } from "@prisma/client";
import { requireUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { CourseForm } from "@/components/course-form";

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser([Role.ADMIN]);
  const course = await prisma.course.findUnique({ where: { id: (await params).id } });
  if (!course) notFound();
  return <main className="formPage"><Link className="backLink" href="/dashboard/courses">← Course catalogue</Link><header><div><p className="eyebrow">COURSE RECORD</p><h1>Edit {course.code}</h1><p>Update programme details and availability.</p></div></header><CourseForm course={{ ...course, description: course.description ?? "" }}/></main>;
}
