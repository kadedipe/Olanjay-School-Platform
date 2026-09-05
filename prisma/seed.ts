import { PrismaClient, Role, UserStatus } from "@prisma/client";
import { hashPassword, isStrongPassword } from "../src/lib/security";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD are required for the initial seed");
  if (!isStrongPassword(password)) throw new Error("ADMIN_PASSWORD must have 12+ characters including uppercase, lowercase, number, and symbol");
  const passwordHash = await hashPassword(password);
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      firstName: process.env.ADMIN_FIRST_NAME ?? "School",
      lastName: process.env.ADMIN_LAST_NAME ?? "Administrator",
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
    },
  });
  console.log(`Bootstrap administrator ready: ${email}`);
}

main().finally(() => prisma.$disconnect());
