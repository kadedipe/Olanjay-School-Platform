import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

export function mutationError(error: unknown, duplicateMessage: string) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return NextResponse.json({ error: duplicateMessage }, { status: 409 });
  }
  console.error(error);
  return NextResponse.json({ error: "The operation could not be completed" }, { status: 500 });
}
