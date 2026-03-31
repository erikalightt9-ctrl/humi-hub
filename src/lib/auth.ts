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
    /* ── HUMI ADMIN (Platform Support Staff) ───────────────────── */
    CredentialsProvider({
      id: "humi-admin",
      name: "HUMI Admin Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const humiAdmin = await prisma.humiAdmin.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!humiAdmin) {
          console.error("[auth][humi-admin] Login failed — email not found:", credentials.email);
          throw new Error("Invalid credentials");
        }

        if (!humiAdmin.isActive) {
          throw new Error("Account deactivated. Contact the Super Admin.");
        }

        if (humiAdmin.failedAttempts >= MAX_FAILED_ATTEMPTS) {
          throw new Error("Account locked after too many failed attempts. Contact the Super Admin.");
        }

        const isValid = await bcrypt.compare(credentials.password, humiAdmin.passwordHash);

        if (!isValid) {
          await prisma.humiAdmin.update({
            where: { id: humiAdmin.id },
            data: { failedAttempts: { increment: 1 } },
          });
          console.error("[auth][humi-admin] Login failed — password mismatch for:", credentials.email);
          throw new Error("Invalid credentials");
        }

        // Reset failed attempts on success
        await prisma.humiAdmin.update({
          where: { id: humiAdmin.id },
          data: { failedAttempts: 0 },
        });

        return {
          id: humiAdmin.id,
          email: humiAdmin.email,
          name: humiAdmin.name,
          role: "humi_admin" as const,
          isHumiAdmin: true,
          isSuperAdmin: false,
          isTenantAdmin: false,
          tenantId: null,
          organizationId: null,
          mustChangePassword: humiAdmin.mustChangePassword,
          humiAdminPermissions: {
            canReviewTenants: humiAdmin.canReviewTenants,
            canOnboardTenants: humiAdmin.canOnboardTenants,
            canMonitorPlatform: humiAdmin.canMonitorPlatform,
            canProvideSupport: humiAdmin.canProvideSupport,
            canManageContent: humiAdmin.canManageContent,
          },
        };
      },
    }),

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
        subdomain: { label: "Subdomain", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const student = await prisma.student.findUnique({
          where: { email: credentials.email.toLowerCase() },
          select: {
            id: true,
            email: true,
            name: true,
            passwordHash: true,
            accessGranted: true,
            accessExpiry: true,
            mustChangePassword: true,
            failedAttempts: true,
            organizationId: true,
            createdAt: true,
          },
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

        // Fetch org once for: subdomain (JWT), tenant check, and seat enforcement
        let orgSubdomain: string | null = null;
        if (student.organizationId) {
          const org = await prisma.organization.findUnique({
            where: { id: student.organizationId },
            select: { id: true, isActive: true, maxSeats: true, planExpiresAt: true, subdomain: true },
          });

          orgSubdomain = org?.subdomain ?? null;

          // Tenant membership enforcement: subdomain must match org
          if (credentials.subdomain && org && org.subdomain !== credentials.subdomain) {
            throw new Error(
              "This account does not belong to this organization. Please use the correct login portal.",
            );
          }

          if (!org?.isActive) {
            throw new Error(
              "Your organization account has been suspended. Please contact your administrator.",
            );
          }

          if (org.planExpiresAt && new Date(org.planExpiresAt) < new Date()) {
            throw new Error(
              "Your organization's subscription has expired. Please contact your administrator.",
            );
          }

          // Seat limit: students ordered by creation date retain access first
          const activeStudentCount = await prisma.student.count({
            where: { organizationId: student.organizationId, accessGranted: true },
          });

          if (activeStudentCount > org.maxSeats) {
            const rank = await prisma.student.count({
              where: {
                organizationId: student.organizationId,
                accessGranted: true,
                createdAt: { lte: student.createdAt },
              },
            });
            if (rank > org.maxSeats) {
              throw new Error(
                "Your organization's seat limit has been reached. Please contact your administrator to upgrade your plan.",
              );
            }
          }
        } else if (credentials.subdomain) {
          // Student has no org but is trying to log in on a tenant subdomain — block it
          throw new Error(
            "This account is not associated with any organization. Please use the main portal.",
          );
        }

        return {
          id: student.id,
          email: student.email,
          name: student.name,
          role: "student" as const,
          mustChangePassword: student.mustChangePassword,
          accessExpiry: student.accessExpiry?.toISOString() ?? null,
          tenantId: student.organizationId ?? null,
          orgSubdomain,
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
        subdomain: { label: "Subdomain", type: "text" },
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

        // Resolve trainer's primary tenant via TenantTrainer and enforce subdomain
        const tenantTrainer = await prisma.tenantTrainer.findFirst({
          where: { trainerId: trainer.id, isActive: true },
          select: { tenantId: true },
          orderBy: { assignedAt: "asc" },
        });

        let orgSubdomain: string | null = null;

        if (tenantTrainer?.tenantId) {
          const org = await prisma.organization.findUnique({
            where: { id: tenantTrainer.tenantId },
            select: { subdomain: true, isActive: true },
          });
          orgSubdomain = org?.subdomain ?? null;

          // Tenant membership enforcement: subdomain must match trainer's org
          if (credentials.subdomain && org && org.subdomain !== credentials.subdomain) {
            throw new Error(
              "This account does not belong to this organization. Please use the correct login portal.",
            );
          }

          if (org && !org.isActive) {
            throw new Error(
              "Your organization account has been suspended. Please contact your administrator.",
            );
          }
        } else if (credentials.subdomain) {
          // Trainer has no active tenant assignment but is logging in on a subdomain portal
          throw new Error(
            "This account is not assigned to any organization. Please use the main portal.",
          );
        }

        return {
          id: trainer.id,
          email: trainer.email,
          name: trainer.name,
          role: "trainer" as const,
          mustChangePassword: trainer.mustChangePassword,
          tenantId: tenantTrainer?.tenantId ?? null,
          orgSubdomain,
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
        subdomain: { label: "Subdomain", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const manager = await prisma.corporateManager.findFirst({
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

        // Tenant membership enforcement: if logging in via a tenant subdomain,
        // verify this manager belongs to that tenant.
        if (credentials.subdomain) {
          const org = await prisma.organization.findUnique({
            where: { subdomain: credentials.subdomain, isActive: true },
            select: { id: true },
          });
          if (org && manager.organizationId !== org.id) {
            throw new Error(
              "This account does not belong to this organization. Please use the correct login portal.",
            );
          }
        }

        return {
          id: manager.id,
          email: manager.email,
          name: manager.name,
          role: manager.isTenantAdmin ? ("tenant_admin" as const) : ("corporate" as const),
          organizationId: manager.organizationId,
          tenantId: manager.organizationId,
          // Store org subdomain in JWT for Edge middleware cross-tenant guard (no DB needed)
          orgSubdomain: manager.organization.subdomain ?? null,
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
        token.isHumiAdmin =
          (user as typeof user & { isHumiAdmin?: boolean }).isHumiAdmin ?? false;
        token.humiAdminPermissions =
          ((user as typeof user & { humiAdminPermissions?: unknown }).humiAdminPermissions ?? null) as import("@/types/next-auth").HumiAdminPermissions | null;
        // orgSubdomain stored for Edge middleware cross-tenant guard (avoids DB in middleware)
        token.orgSubdomain =
          (user as typeof user & { orgSubdomain?: string | null }).orgSubdomain ?? null;
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
        (user as typeof user & { isHumiAdmin: boolean }).isHumiAdmin =
          (token.isHumiAdmin as boolean) ?? false;
        session.user.humiAdminPermissions =
          (token.humiAdminPermissions as import("@/types/next-auth").HumiAdminPermissions | null) ?? null;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Relative paths stay on the current origin (preserves subdomain in browser)
      if (url.startsWith("/")) return url;
      // Same-origin absolute URLs are allowed
      try {
        const targetOrigin = new URL(url).origin;
        const baseOrigin = new URL(baseUrl).origin;
        if (targetOrigin === baseOrigin) return url;
        // Allow subdomain redirects within the root domain
        const rootDomain = process.env.ROOT_DOMAIN ?? "";
        if (rootDomain && new URL(url).hostname.endsWith(rootDomain.split(":")[0])) return url;
      } catch {
        // Malformed URL — fall through to baseUrl
      }
      return baseUrl;
    },
  },
};
