import Link from "next/link";
import { notFound } from "next/navigation";
import { Role } from "@prisma/client";
import { requireUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { StudentForm } from "@/components/student-form";

export default async function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser([Role.ADMIN]);
  const student = await prisma.student.findUnique({ where: { id: (await params).id }, include: { user: true } });
  if (!student) notFound();
  return <main className="formPage"><Link className="backLink" href="/dashboard/students">← Student directory</Link><header><div><p className="eyebrow">STUDENT RECORD</p><h1>Edit {student.user.firstName} {student.user.lastName}</h1><p>{student.user.email}</p></div></header><StudentForm student={{ id: student.id, admissionNumber: student.admissionNumber, dateOfBirth: student.dateOfBirth?.toISOString().slice(0,10) ?? "", address: student.address ?? "", status: student.user.status as "ACTIVE" | "SUSPENDED" | "ARCHIVED" }}/></main>;
}
