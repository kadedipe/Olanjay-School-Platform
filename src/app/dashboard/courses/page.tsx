import Link from "next/link";
import { Role } from "@prisma/client";
import { requireUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { ArchiveButton } from "@/components/archive-button";

export default async function CoursesPage() {
  const user = await requireUser([Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.GUARDIAN]);
  const courses = await prisma.course.findMany({ include: { _count: { select: { enrollments: true, teachers: true } } }, orderBy: { code: "asc" } });
  return <main><header><div><p className="eyebrow">ACADEMIC CATALOGUE</p><h1>Courses</h1><p>Manage programmes, qualifications, and enrollment availability.</p></div>{user.role === Role.ADMIN && <Link className="primary buttonLink" href="/dashboard/courses/new">Add course</Link>}</header>
    <section className="panel tablePanel">{courses.length === 0 ? <div className="emptyState"><h2>No courses yet</h2><p>Create the first programme in the school catalogue.</p></div> : <div className="tableWrap"><table><thead><tr><th>Code</th><th>Course</th><th>Qualification</th><th>Duration</th><th>Status</th><th>Students</th><th>Teachers</th>{user.role === Role.ADMIN && <th>Actions</th>}</tr></thead><tbody>{courses.map((course) => <tr key={course.id}><td><strong>{course.code}</strong></td><td>{course.name}<small>{course.description || "No description"}</small></td><td>{course.qualification}</td><td>{course.durationMonths} months</td><td><span className={`status ${course.isActive ? "statusACTIVE" : "statusARCHIVED"}`}>{course.isActive ? "active" : "archived"}</span></td><td>{course._count.enrollments}</td><td>{course._count.teachers}</td>{user.role === Role.ADMIN && <td><div className="rowActions"><Link href={`/dashboard/courses/${course.id}/edit`}>Edit</Link>{course.isActive && <ArchiveButton endpoint={`/api/courses/${course.id}`} label={course.code}/>}</div></td>}</tr>)}</tbody></table></div>}</section></main>;
}
