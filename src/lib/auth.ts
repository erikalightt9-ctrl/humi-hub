import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
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
          throw new Error("Invalid credentials");
        }

        const isValid = await bcrypt.compare(credentials.password, admin.passwordHash);

        if (!isValid) {
          throw new Error("Invalid credentials");
        }

        return {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: "admin" as const,
        };
      },
    }),
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
          throw new Error("Invalid credentials");
        }

        const isValid = await bcrypt.compare(credentials.password, student.passwordHash);

        if (!isValid) {
          throw new Error("Invalid credentials");
        }

        // Access control: check if access has been granted
        if (!student.accessGranted) {
          throw new Error("Your access has not been granted yet. Please contact admin.");
        }

        // Access control: check if access has expired
        if (student.accessExpiry && new Date(student.accessExpiry) < new Date()) {
          throw new Error("Your access has expired. Please contact admin to renew.");
        }

        return {
          id: student.id,
          email: student.email,
          name: student.name,
          role: "student" as const,
          mustChangePassword: student.mustChangePassword,
          accessExpiry: student.accessExpiry?.toISOString() ?? null,
        };
      },
    }),
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
          throw new Error("Invalid credentials");
        }

        const isValid = await bcrypt.compare(credentials.password, trainer.passwordHash);

        if (!isValid) {
          throw new Error("Invalid credentials");
        }

        if (!trainer.isActive) {
          throw new Error("Your account has been deactivated. Please contact admin.");
        }

        if (!trainer.accessGranted) {
          throw new Error("Your access has not been granted yet. Please contact admin.");
        }

        return {
          id: trainer.id,
          email: trainer.email,
          name: trainer.name,
          role: "trainer" as const,
        };
      },
    }),
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
          throw new Error("Invalid credentials");
        }

        const isValid = await bcrypt.compare(credentials.password, manager.passwordHash);

        if (!isValid) {
          throw new Error("Invalid credentials");
        }

        if (!manager.isActive) {
          throw new Error("Your account has been deactivated. Please contact admin.");
        }

        if (!manager.organization.isActive) {
          throw new Error("Your organization has been deactivated. Please contact admin.");
        }

        return {
          id: manager.id,
          email: manager.email,
          name: manager.name,
          role: "corporate" as const,
          organizationId: manager.organizationId,
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
        token.mustChangePassword = (user as typeof user & { mustChangePassword?: boolean }).mustChangePassword ?? false;
        token.accessExpiry = (user as typeof user & { accessExpiry?: string | null }).accessExpiry ?? null;
        token.organizationId = (user as typeof user & { organizationId?: string }).organizationId ?? null;
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
        };
        user.id = token.id as string;
        user.role = token.role as string;
        user.mustChangePassword = (token.mustChangePassword as boolean) ?? false;
        user.organizationId = (token.organizationId as string) ?? null;
      }
      return session;
    },
  },
};
