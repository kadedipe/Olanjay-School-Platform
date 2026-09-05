import { redirect } from "next/navigation";
import { requireUser, roleHome } from "@/lib/authorization";
export default async function DashboardRouter() { const user = await requireUser(); redirect(roleHome[user.role]); }
