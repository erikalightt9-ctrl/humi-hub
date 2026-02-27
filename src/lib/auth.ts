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

        return {
          id: student.id,
          email: student.email,
          name: student.name,
          role: "student" as const,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as typeof user & { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        const user = session.user as typeof session.user & { id: string; role: string };
        user.id = token.id as string;
        user.role = token.role as string;
      }
      return session;
    },
  },
};
