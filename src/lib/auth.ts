import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const MAX_FAILED_ATTEMPTS = 5;

/* ------------------------------------------------------------------ */
/*  auth.ts                                                            */
/*  NextAuth configuration — 4 credential providers:                  */
/*    admin | student | trainer | corporate                            */
/*                                                                     */
/*  All providers:                                                     */
/*  • Throw specific errors so PortalTabs can surface them             */
/*  • Track failedAttempts; lock after MAX_FAILED_ATTEMPTS             */
/*  • Reset failedAttempts on successful login                         */
/*  • Debug-log every failed attempt (server-side only)               */
/* ------------------------------------------------------------------ */

export const authOptions: NextAuthOptions = {
  providers: [
    /* ── ADMIN ─────────────────────────────────────────────────── */
    CredentialsProvider({
      id: "admin",
      name: "Admin Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const admin = await prisma.admin.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!admin) {
          console.error("[auth][admin] Login failed — email not found:", credentials.email);
          throw new Error("Invalid credentials");
        }

        const isValid = await bcrypt.compare(credentials.password, admin.passwordHash);

        if (!isValid) {
          console.error("[auth][admin] Login failed — password mismatch for:", credentials.email);
          throw new Error("Invalid credentials");
        }

        return {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: "admin" as const,
          isSuperAdmin: admin.isSuperAdmin,
          tenantId: null,
        };
      },
    }),

    /* ── STUDENT ───────────────────────────────────────────────── */
    CredentialsProvider({
      id: "student",
      name: "Student Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const student = await prisma.student.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!student) {
          console.error("[auth][student] Login failed — email not found:", credentials.email);
          throw new Error("Invalid credentials");
        }

        // Lock check — before bcrypt to avoid timing attacks revealing lock status
        if (student.failedAttempts >= MAX_FAILED_ATTEMPTS) {
          console.error(
            "[auth][student] Account locked — too many failed attempts:",
            credentials.email,
          );
          throw new Error(
            "Account locked after too many failed attempts. Please contact admin.",
          );
        }

        const isValid = await bcrypt.compare(credentials.password, student.passwordHash);

        if (!isValid) {
          const attempts = student.failedAttempts + 1;
          console.error(
            "[auth][student] Password mismatch for:",
            credentials.email,
            `(attempt ${attempts}/${MAX_FAILED_ATTEMPTS})`,
          );
          await prisma.student.update({
            where: { id: student.id },
            data: { failedAttempts: attempts },
          });
          throw new Error("Invalid credentials");
        }

        // Successful password match — access control checks
        if (!student.accessGranted) {
          throw new Error(
            "Your access has not been granted yet. Please contact admin.",
          );
        }

        if (student.accessExpiry && new Date(student.accessExpiry) < new Date()) {
          throw new Error(
            "Your access has expired. Please contact admin to renew.",
          );
        }

        // Reset failed counter on successful login
        if (student.failedAttempts > 0) {
          await prisma.student.update({
            where: { id: student.id },
            data: { failedAttempts: 0 },
          });
        }

        return {
          id: student.id,
          email: student.email,
          name: student.name,
          role: "student" as const,
          mustChangePassword: student.mustChangePassword,
          accessExpiry: student.accessExpiry?.toISOString() ?? null,
          tenantId: student.organizationId ?? null,
          isSuperAdmin: false,
        };
      },
    }),

    /* ── TRAINER ───────────────────────────────────────────────── */
    CredentialsProvider({
      id: "trainer",
      name: "Trainer Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const trainer = await prisma.trainer.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!trainer || !trainer.passwordHash) {
          console.error("[auth][trainer] Login failed — not found or no password:", credentials.email);
          throw new Error("Invalid credentials");
        }

        // Lock check
        if (trainer.failedAttempts >= MAX_FAILED_ATTEMPTS) {
          console.error(
            "[auth][trainer] Account locked — too many failed attempts:",
            credentials.email,
          );
          throw new Error(
            "Account locked after too many failed attempts. Please contact admin.",
          );
        }

        const isValid = await bcrypt.compare(credentials.password, trainer.passwordHash);

        if (!isValid) {
          const attempts = trainer.failedAttempts + 1;
          console.error(
            "[auth][trainer] Password mismatch for:",
            credentials.email,
            `(attempt ${attempts}/${MAX_FAILED_ATTEMPTS})`,
          );
          await prisma.trainer.update({
            where: { id: trainer.id },
            data: { failedAttempts: attempts },
          });
          throw new Error("Invalid credentials");
        }

        // Access control checks
        if (!trainer.isActive) {
          throw new Error(
            "Your account has been deactivated. Please contact admin.",
          );
        }

        if (!trainer.accessGranted) {
          throw new Error(
            "Your portal access has not been granted yet. Please contact admin.",
          );
        }

        // Reset failed counter on successful login
        if (trainer.failedAttempts > 0) {
          await prisma.trainer.update({
            where: { id: trainer.id },
            data: { failedAttempts: 0 },
          });
        }

        return {
          id: trainer.id,
          email: trainer.email,
          name: trainer.name,
          role: "trainer" as const,
          mustChangePassword: trainer.mustChangePassword,
          tenantId: null,
          isSuperAdmin: false,
        };
      },
    }),

    /* ── CORPORATE ─────────────────────────────────────────────── */
    CredentialsProvider({
      id: "corporate",
      name: "Corporate Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const manager = await prisma.corporateManager.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: { organization: true },
        });

        if (!manager) {
          console.error("[auth][corporate] Login failed — email not found:", credentials.email);
          throw new Error("Invalid credentials");
        }

        const isValid = await bcrypt.compare(credentials.password, manager.passwordHash);

        if (!isValid) {
          console.error("[auth][corporate] Password mismatch for:", credentials.email);
          throw new Error("Invalid credentials");
        }

        if (!manager.isActive) {
          throw new Error(
            "Your account has been deactivated. Please contact admin.",
          );
        }

        if (!manager.organization.isActive) {
          throw new Error(
            "Your organization has been deactivated. Please contact admin.",
          );
        }

        return {
          id: manager.id,
          email: manager.email,
          name: manager.name,
          role: manager.isTenantAdmin ? ("tenant_admin" as const) : ("corporate" as const),
          organizationId: manager.organizationId,
          tenantId: manager.organizationId,
          isSuperAdmin: false,
          isTenantAdmin: manager.isTenantAdmin,
          mustChangePassword: manager.mustChangePassword,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },

  pages: {
    signIn: "/portal",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as typeof user & { role: string }).role;
        token.mustChangePassword =
          (user as typeof user & { mustChangePassword?: boolean }).mustChangePassword ?? false;
        token.accessExpiry =
          (user as typeof user & { accessExpiry?: string | null }).accessExpiry ?? null;
        token.organizationId =
          (user as typeof user & { organizationId?: string }).organizationId ?? null;
        token.tenantId =
          (user as typeof user & { tenantId?: string | null }).tenantId ?? null;
        token.isSuperAdmin =
          (user as typeof user & { isSuperAdmin?: boolean }).isSuperAdmin ?? false;
        token.isTenantAdmin =
          (user as typeof user & { isTenantAdmin?: boolean }).isTenantAdmin ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        const user = session.user as typeof session.user & {
          id: string;
          role: string;
          mustChangePassword: boolean;
          organizationId: string | null;
          tenantId: string | null;
          isSuperAdmin: boolean;
          isTenantAdmin: boolean;
        };
        user.id = token.id as string;
        user.role = token.role as string;
        user.mustChangePassword = (token.mustChangePassword as boolean) ?? false;
        user.organizationId = (token.organizationId as string) ?? null;
        user.tenantId = (token.tenantId as string) ?? null;
        user.isSuperAdmin = (token.isSuperAdmin as boolean) ?? false;
        user.isTenantAdmin = (token.isTenantAdmin as boolean) ?? false;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
};
