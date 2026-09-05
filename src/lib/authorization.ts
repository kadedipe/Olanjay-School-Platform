import type { Role } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export const roleHome: Record<Role, string> = {
  ADMIN: "/dashboard/admin",
  TEACHER: "/dashboard/teacher",
  STUDENT: "/dashboard/student",
  GUARDIAN: "/dashboard/guardian",
};

export async function requireUser(allowedRoles?: readonly Role[]) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (allowedRoles && !allowedRoles.includes(session.user.role)) redirect(roleHome[session.user.role]);
  return session.user;
}
