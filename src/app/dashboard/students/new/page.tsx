import Link from "next/link";
import { Role } from "@prisma/client";
import { requireUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { StudentForm } from "@/components/student-form";

export default async function NewStudentPage() {
  await requireUser([Role.ADMIN]);
  const accounts = await prisma.user.findMany({ where: { role: Role.STUDENT, status: "ACTIVE", student: { is: null } }, select: { id: true, firstName: true, lastName: true, email: true }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }] });
  return <main className="formPage"><Link className="backLink" href="/dashboard/students">← Student directory</Link><header><div><p className="eyebrow">NEW RECORD</p><h1>Add a student</h1><p>Connect an invited student account to its academic record.</p></div></header>{accounts.length ? <StudentForm accounts={accounts}/> : <section className="panel emptyState"><h2>No eligible student accounts</h2><p>Invite a user with the Student role and ask them to accept the invitation first.</p><Link className="primary buttonLink" href="/dashboard/admin">Open invitations</Link></section>}</main>;
}
