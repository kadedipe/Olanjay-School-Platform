import { Prisma, Role } from "@prisma/client";
import { requireUser } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { AssessmentForm } from "@/components/assessment-form";
import { GradebookForm } from "@/components/gradebook-form";
import { RemoveAssignmentButton } from "@/components/remove-assignment-button";

export default async function GradesPage() {
  const user = await requireUser([Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.GUARDIAN]);
  const manage = user.role === Role.ADMIN || user.role === Role.TEACHER;
  const courseWhere: Prisma.CourseWhereInput = user.role === Role.TEACHER ? { teachers: { some: { teacher: { userId: user.id } } } } : {};
  const assessmentWhere: Prisma.AssessmentWhereInput = user.role === Role.ADMIN ? {}
    : user.role === Role.TEACHER ? { course: courseWhere }
    : user.role === Role.STUDENT ? { course: { enrollments: { some: { student: { userId: user.id }, status: "ENROLLED" } } } }
    : { course: { enrollments: { some: { status: "ENROLLED", student: { guardians: { some: { guardian: { userId: user.id } } } } } } } };
  const resultWhere: Prisma.ResultWhereInput = user.role === Role.ADMIN ? {}
    : user.role === Role.TEACHER ? { assessment: { course: courseWhere } }
    : user.role === Role.STUDENT ? { student: { userId: user.id }, publishedAt: { not: null } }
    : { student: { guardians: { some: { guardian: { userId: user.id } } } }, publishedAt: { not: null } };

  const [assessments, results, courses, terms, enrollments] = await Promise.all([
    prisma.assessment.findMany({ where: assessmentWhere, include: { course: true, term: { include: { academicYear: true } }, _count: { select: { results: true } } }, orderBy: { dueAt: "desc" } }),
    prisma.result.findMany({ where: resultWhere, include: { student: { include: { user: true } }, assessment: { include: { course: true, term: { include: { academicYear: true } } } } }, orderBy: { assessment: { dueAt: "desc" } } }),
    manage ? prisma.course.findMany({ where: { isActive: true, ...courseWhere }, orderBy: { code: "asc" } }) : Promise.resolve([]),
    manage ? prisma.term.findMany({ include: { academicYear: true }, orderBy: { startsAt: "desc" } }) : Promise.resolve([]),
    manage ? prisma.enrollment.findMany({ where: { status: "ENROLLED", ...(user.role === Role.TEACHER ? { course: courseWhere } : {}) }, include: { student: { include: { user: true } } } }) : Promise.resolve([]),
  ]);
  const recordCount = manage ? assessments.length : results.length;

  return <main>
    <header><div><p className="eyebrow">GRADES &amp; EXAMINATIONS</p><h1>{manage ? "Assessment gradebook" : "My results"}</h1><p>{manage ? "Create assessments, record scores, and control publication." : "View published academic results available to your account."}</p></div></header>
    {manage && <>
      <section className="panel managementPanel"><div className="panelHead"><div><p className="eyebrow">NEW ASSESSMENT</p><h2>Create assessment</h2></div></div>
        {courses.length && terms.length ? <AssessmentForm courses={courses.map((course) => ({ id: course.id, label: `${course.code} — ${course.name}` }))} terms={terms.map((term) => ({ id: term.id, label: `${term.academicYear.name} — ${term.name}` }))} /> : <p>An assigned course and term are required.</p>}
      </section>
      <section className="panel managementPanel"><div className="panelHead"><div><p className="eyebrow">SCORE ENTRY</p><h2>Record results</h2></div></div>
        {assessments.length ? <GradebookForm
          assessments={assessments.map((assessment) => ({ id: assessment.id, courseId: assessment.courseId, academicYearId: assessment.term.academicYearId, label: `${assessment.course.code} — ${assessment.title} (${assessment.term.name})`, maximumScore: Number(assessment.maximumScore) }))}
          students={enrollments.map((enrollment) => ({ studentId: enrollment.studentId, courseId: enrollment.courseId, academicYearId: enrollment.academicYearId, label: `${enrollment.student.admissionNumber} — ${enrollment.student.user.firstName} ${enrollment.student.user.lastName}` }))}
          results={results.map((result) => ({ assessmentId: result.assessmentId, studentId: result.studentId, score: Number(result.score), feedback: result.feedback ?? "", published: Boolean(result.publishedAt) }))}
        /> : <p>Create an assessment before entering results.</p>}
      </section>
    </>}
    <section className="panel tablePanel"><div className="panelHead"><div><h2>{manage ? "Assessment register" : "Published results"}</h2><p>{recordCount} record{recordCount === 1 ? "" : "s"}</p></div></div>
      {manage ? (assessments.length ? <div className="tableWrap"><table><thead><tr><th>Course</th><th>Assessment</th><th>Term</th><th>Maximum</th><th>Weight</th><th>Results</th><th>Action</th></tr></thead><tbody>{assessments.map((assessment) => <tr key={assessment.id}><td>{assessment.course.code}</td><td><strong>{assessment.title}</strong><small>{assessment.type}</small></td><td>{assessment.term.academicYear.name}<small>{assessment.term.name}</small></td><td>{Number(assessment.maximumScore)}</td><td>{Number(assessment.weight)}%</td><td>{assessment._count.results}</td><td>{!assessment._count.results && <RemoveAssignmentButton endpoint={`/api/assessments/${assessment.id}`} label={assessment.title} />}</td></tr>)}</tbody></table></div> : <div className="emptyState"><h2>No assessments</h2></div>)
        : (results.length ? <div className="tableWrap"><table><thead><tr><th>Student</th><th>Course</th><th>Assessment</th><th>Score</th><th>Grade</th><th>Feedback</th></tr></thead><tbody>{results.map((result) => <tr key={result.id}><td>{result.student.user.firstName} {result.student.user.lastName}</td><td>{result.assessment.course.code}</td><td>{result.assessment.title}<small>{result.assessment.term.name}</small></td><td>{Number(result.score)} / {Number(result.assessment.maximumScore)}</td><td><strong>{result.grade}</strong></td><td>{result.feedback ?? "—"}</td></tr>)}</tbody></table></div> : <div className="emptyState"><h2>No published results</h2></div>)}
    </section>
  </main>;
}
