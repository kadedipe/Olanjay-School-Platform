import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { Role } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/security";

const credentialsSchema = z.object({ email: z.string().email().transform((v) => v.toLowerCase()), password: z.string().min(1).max(200) });

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [Credentials({
    credentials: { email: { type: "email" }, password: { type: "password" } },
    async authorize(raw) {
      const parsed = credentialsSchema.safeParse(raw);
      if (!parsed.success) return null;
      const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
      if (!user?.passwordHash || user.status !== "ACTIVE") return null;
      if (user.lockedUntil && user.lockedUntil > new Date()) return null;
      if (!(await verifyPassword(parsed.data.password, user.passwordHash))) {
        const failures = user.failedLoginAttempts + 1;
        await prisma.user.update({ where: { id: user.id }, data: {
          failedLoginAttempts: failures >= 5 ? 0 : failures,
          lockedUntil: failures >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null,
        }});
        return null;
      }
      await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date(), failedLoginAttempts: 0, lockedUntil: null } });
      return { id: user.id, email: user.email, name: `${user.firstName} ${user.lastName}`, role: user.role, tokenVersion: user.tokenVersion };
    },
  })],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id!;
        token.role = user.role;
        token.tokenVersion = (user as typeof user & { tokenVersion: number }).tokenVersion;
      } else if (token.userId) {
        const account = await prisma.user.findUnique({ where: { id: token.userId as string }, select: { status: true, tokenVersion: true } });
        if (!account || account.status !== "ACTIVE" || account.tokenVersion !== token.tokenVersion) return null;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.userId as string;
      session.user.role = token.role as Role;
      return session;
    },
    authorized({ auth: session, request }) {
      if (!request.nextUrl.pathname.startsWith("/dashboard")) return true;
      return Boolean(session?.user);
    },
  },
});
