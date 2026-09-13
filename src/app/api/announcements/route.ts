import { Prisma, Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { announcementSchema, canPublishToCourse } from "@/lib/communication-validation";
import { authorizeApi } from "@/lib/api-authorization";
import { sendAnnouncementEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const access = await authorizeApi([Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.GUARDIAN]);
  if (access.response) return access.response;
  const notifications = await prisma.notification.findMany({
    where: { userId: access.user!.id, announcement: { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] } },
    include: { announcement: { include: { course: true, createdBy: { select: { firstName: true, lastName: true, role: true } } } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ notifications, unread: notifications.filter((item) => !item.readAt).length });
}

export async function POST(request: Request) {
  const access = await authorizeApi([Role.ADMIN, Role.TEACHER]);
  if (access.response) return access.response;
  const parsed = announcementSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid announcement" }, { status: 400 });
  const user = access.user!;
  const courseId = parsed.data.courseId || null;
  if (!canPublishToCourse(user.role, courseId ?? "")) return NextResponse.json({ error: "Teachers must target one assigned course" }, { status: 400 });
  if (user.role === Role.TEACHER && parsed.data.audienceRoles.some((role) => role !== Role.STUDENT && role !== Role.GUARDIAN)) return NextResponse.json({ error: "Teachers may notify only students and guardians in their assigned course" }, { status: 403 });
  if (courseId) {
    const course = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true, teachers: { where: { teacher: { userId: user.id } }, select: { teacherId: true } } } });
    if (!course || user.role === Role.TEACHER && !course.teachers.length) return NextResponse.json({ error: "Select a course assigned to your account" }, { status: 403 });
  }
  const expiresAt = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null;
  if (expiresAt && expiresAt <= new Date()) return NextResponse.json({ error: "Expiry must be in the future" }, { status: 400 });
  const recipients = await prisma.user.findMany({ where: { status: "ACTIVE", OR: recipientConditions(parsed.data.audienceRoles, courseId) }, select: { id: true, email: true, firstName: true }, orderBy: { id: "asc" } });
  if (!recipients.length) return NextResponse.json({ error: "No active recipients match this audience" }, { status: 400 });
  const announcement = await prisma.$transaction(async (tx) => {
    const created = await tx.announcement.create({ data: { title: parsed.data.title, body: parsed.data.body, priority: parsed.data.priority, audienceRoles: parsed.data.audienceRoles, courseId, createdById: user.id, expiresAt } });
    await tx.notification.createMany({ data: recipients.map((recipient) => ({ announcementId: created.id, userId: recipient.id })) });
    await tx.auditEvent.create({ data: { actorId: user.id, action: "announcement.published", entityType: "Announcement", entityId: created.id, metadata: { audienceRoles: parsed.data.audienceRoles, courseId, recipientCount: recipients.length, priority: parsed.data.priority } } });
    return created;
  });
  let emailed = 0;
  let emailReason: string | undefined;
  if (parsed.data.sendEmail) {
    if (recipients.length > 50) emailReason = "recipient_limit";
    else {
      const delivery = await Promise.allSettled(recipients.map((recipient) => sendAnnouncementEmail({ to: recipient.email, firstName: recipient.firstName, title: announcement.title, body: announcement.body, priority: announcement.priority })));
      const deliveredIds = delivery.flatMap((result, index) => result.status === "fulfilled" && result.value.delivered ? [recipients[index].id] : []);
      emailed = deliveredIds.length;
      if (deliveredIds.length) await prisma.notification.updateMany({ where: { announcementId: announcement.id, userId: { in: deliveredIds } }, data: { emailedAt: new Date() } });
      if (!emailed) emailReason = "email_not_configured_or_failed";
    }
  }
  return NextResponse.json({ announcement, recipientCount: recipients.length, email: { requested: parsed.data.sendEmail, delivered: emailed, reason: emailReason } }, { status: 201 });
}

function recipientConditions(roles: Role[], courseId: string | null): Prisma.UserWhereInput[] {
  return roles.map((role) => {
    if (!courseId) return { role };
    if (role === Role.STUDENT) return { role, student: { enrollments: { some: { courseId, status: "ENROLLED" } } } };
    if (role === Role.GUARDIAN) return { role, guardian: { students: { some: { student: { enrollments: { some: { courseId, status: "ENROLLED" } } } } } } };
    if (role === Role.TEACHER) return { role, teacher: { courses: { some: { courseId } } } };
    return { role };
  });
}
