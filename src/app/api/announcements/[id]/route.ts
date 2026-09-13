import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { authorizeApi } from "@/lib/api-authorization";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ id: string }> };

export async function DELETE(_: Request, { params }: Context) {
  const access = await authorizeApi([Role.ADMIN, Role.TEACHER]);
  if (access.response) return access.response;
  const id = (await params).id;
  const announcement = await prisma.announcement.findUnique({ where: { id }, select: { id: true, createdById: true } });
  if (!announcement) return NextResponse.json({ error: "Announcement not found" }, { status: 404 });
  if (access.user!.role === Role.TEACHER && announcement.createdById !== access.user!.id) return NextResponse.json({ error: "Teachers may remove only their own announcements" }, { status: 403 });
  await prisma.$transaction([
    prisma.announcement.delete({ where: { id } }),
    prisma.auditEvent.create({ data: { actorId: access.user!.id, action: "announcement.removed", entityType: "Announcement", entityId: id } }),
  ]);
  return NextResponse.json({ deleted: true });
}
