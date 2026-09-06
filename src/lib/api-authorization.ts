import type { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function authorizeApi(allowedRoles: readonly Role[]) {
  const session = await auth();
  if (!session?.user) return { user: null, response: NextResponse.json({ error: "Authentication required" }, { status: 401 }) };
  if (!allowedRoles.includes(session.user.role)) return { user: null, response: NextResponse.json({ error: "You do not have permission to perform this action" }, { status: 403 }) };
  return { user: session.user, response: null };
}
