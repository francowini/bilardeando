import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";

// In-memory error store (persists within same serverless instance)
let lastAuthError: { timestamp: string; code: string; detail: string } | null =
  null;

export function getLastAuthError() {
  return lastAuthError;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "database",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      console.log("[NextAuth signIn]", {
        userId: user?.id,
        provider: account?.provider,
        email: profile?.email,
      });
      return true;
    },
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  debug: true,
  logger: {
    error(code, metadata) {
      const detail =
        metadata instanceof Error
          ? metadata.stack || metadata.message
          : JSON.stringify(metadata, null, 2);
      lastAuthError = {
        timestamp: new Date().toISOString(),
        code: String(code),
        detail,
      };
      console.error("[NextAuth Error]", code, detail);
    },
    warn(code) {
      console.warn("[NextAuth Warn]", code);
    },
    debug(code, metadata) {
      console.log("[NextAuth Debug]", code, metadata);
    },
  },
};
