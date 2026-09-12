import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { attendanceScope } from "@/lib/academic-scope";
import { authorizeApi } from "@/lib/api-authorization";
import { prisma } from "@/lib/prisma";

export async function GET(){const access=await authorizeApi([Role.ADMIN,Role.TEACHER,Role.STUDENT,Role.GUARDIAN]);if(access.response)return access.response;const records=await prisma.attendance.findMany({where:attendanceScope(access.user!.role,access.user!.id),include:{student:{include:{user:true}},timetableEntry:{include:{course:true,teacher:{include:{user:true}}}},term:{include:{academicYear:true}}},orderBy:{attendanceDate:"desc"},take:500});return NextResponse.json({records});}
