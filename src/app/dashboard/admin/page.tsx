import { Role } from "@prisma/client";
import { requireUser } from "@/lib/authorization";
import { RoleDashboard } from "@/components/role-dashboard";
import { InvitationForm } from "@/components/invitation-form";
export default async function AdminDashboard(){ await requireUser([Role.ADMIN]); return <main><RoleDashboard eyebrow="ADMINISTRATION" title="School operations" description="Manage access, academics, finance, and institutional performance." metrics={[["Active users","—","Connected to live records"],["Pending invitations","—","Invitation management"],["Students","—","Enrollment records"],["Outstanding fees","—","Finance records"]]} actions={["Manage students","Manage courses","Review attendance","Publish reports"]}/><section className="panel dashboardSection"><div className="panelHead"><div><p className="eyebrow">ACCESS MANAGEMENT</p><h2>Invite a user</h2></div></div><InvitationForm/></section></main>; }
