import Link from "next/link";
import Image from "next/image";
import { Role } from "@prisma/client";
import { requireUser } from "@/lib/authorization";
import { SignOutButton } from "@/components/sign-out-button";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(); const initials = user.name?.split(" ").map((part) => part[0]).join("").slice(0,2) || "OU";
  const canViewStudents = user.role === Role.ADMIN || user.role === Role.TEACHER;
  const canViewTeaching = user.role === Role.ADMIN || user.role === Role.TEACHER;
  return <div className="shell"><aside className="sidebar"><div className="brand"><Image className="brandLogo" src="/Olanjay_School_Logo.jpg" alt="Olanjay New Africa Technical School logo" width={1168} height={784} priority /><div><strong>Olanjay</strong><small>Technical School</small></div></div><nav aria-label="Main navigation"><Link href={`/dashboard/${user.role.toLowerCase()}`}>Overview</Link>{canViewStudents && <Link href="/dashboard/students">Students</Link>}<Link href="/dashboard/courses">Courses</Link><Link href="/dashboard/enrollments">Enrollments</Link>{canViewTeaching && <Link href="/dashboard/teaching">Teaching</Link>}<Link href="/dashboard/timetable">Timetable</Link><Link href="/dashboard/attendance">Attendance</Link><Link href="/dashboard/grades">Grades</Link>{user.role!==Role.TEACHER&&<Link href="/dashboard/finance">Finance</Link>}</nav><div className="profile"><div className="avatar">{initials}</div><div><strong>{user.name}</strong><small>{user.role.toLowerCase()}</small></div></div><SignOutButton /></aside>{children}</div>;
}
