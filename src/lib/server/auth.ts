import "server-only";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

/** רשימת מיילים עם הרשאת מנהלת — מוגדרת ב-ADMIN_EMAILS (מופרדים בפסיק) */
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}
export const isAdminEmail = (email?: string | null) => !!email && adminEmails().includes(email.toLowerCase());

export const googleConfigured = () => !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

/**
 * כניסת בדיקה — רק בסביבת פיתוח ורק כש-DEV_LOGIN=true.
 * מאפשרת לבדוק את האתר לפני שהוגדרו מפתחות Google. לעולם לא פעילה בגרסת production.
 */
export const devLoginEnabled = () => process.env.NODE_ENV !== "production" && process.env.DEV_LOGIN === "true";

const providers: NextAuthOptions["providers"] = [];
if (googleConfigured()) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  );
}
if (devLoginEnabled()) {
  providers.push(
    CredentialsProvider({
      id: "dev",
      name: "כניסת בדיקה",
      credentials: { email: { label: "Email", type: "email" }, name: { label: "Name", type: "text" } },
      async authorize(c) {
        const email = String(c?.email ?? "").trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
        return { id: email, email, name: String(c?.name || email.split("@")[0]) };
      },
    })
  );
}

export const authOptions: NextAuthOptions = {
  providers,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token }) {
      token.role = isAdminEmail(token.email) ? "admin" : "customer";
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.role = token.role === "admin" ? "admin" : "customer";
      return session;
    },
  },
};

export const getSession = () => getServerSession(authOptions);

export async function requireAdmin() {
  const s = await getSession();
  return s?.user?.email && isAdminEmail(s.user.email) ? s : null;
}
