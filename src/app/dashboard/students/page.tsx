import Link from "next/link";
import { Role } from "@prisma/client";
import { requireUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { ArchiveButton } from "@/components/archive-button";

export default async function StudentsPage() {
  const user = await requireUser([Role.ADMIN, Role.TEACHER]);
  const students = await prisma.student.findMany({ include: { user: true, _count: { select: { enrollments: true, guardians: true } } }, orderBy: { admissionNumber: "asc" } });
  return <main><header><div><p className="eyebrow">STUDENT MANAGEMENT</p><h1>Students</h1><p>Create and maintain authoritative student records.</p></div>{user.role === Role.ADMIN && <Link className="primary buttonLink" href="/dashboard/students/new">Add student</Link>}</header>
    <section className="panel tablePanel"><div className="panelHead"><div><h2>Student directory</h2><p>{students.length} record{students.length === 1 ? "" : "s"}</p></div></div>
      {students.length === 0 ? <div className="emptyState"><h2>No student records yet</h2><p>Invite a student account, then create its academic record.</p></div> : <div className="tableWrap"><table><thead><tr><th>Admission no.</th><th>Student</th><th>Status</th><th>Enrollments</th><th>Guardians</th>{user.role === Role.ADMIN && <th>Actions</th>}</tr></thead><tbody>{students.map((student) => <tr key={student.id}><td><strong>{student.admissionNumber}</strong></td><td>{student.user.firstName} {student.user.lastName}<small>{student.user.email}</small></td><td><span className={`status status${student.user.status}`}>{student.user.status.toLowerCase()}</span></td><td>{student._count.enrollments}</td><td>{student._count.guardians}</td>{user.role === Role.ADMIN && <td><div className="rowActions"><Link href={`/dashboard/students/${student.id}/edit`}>Edit</Link>{student.user.status !== "ARCHIVED" && <ArchiveButton endpoint={`/api/students/${student.id}`} label={student.admissionNumber}/>}</div></td>}</tr>)}</tbody></table></div>}
    </section></main>;
}
