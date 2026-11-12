import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/server/auth";
import { mailConfigured } from "@/lib/server/mailer";
import { Container } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "ניהול", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  if (!session) redirect("/login?callbackUrl=/admin");
  return (
    <Container className="pb-10 pt-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone pb-5">
        <div className="flex items-center gap-6">
          <h1 className="font-display text-3xl">ניהול</h1>
          <nav className="flex gap-1 text-[14px]">
            <Link href="/admin" className="rounded-full px-4 py-2 hover:bg-sand">
              הזמנות
            </Link>
            <Link href="/admin/settings" className="rounded-full px-4 py-2 hover:bg-sand">
              מחירון ומלאי
            </Link>
          </nav>
        </div>
        <p className="text-[13px] text-mocha">מחוברת כ-{session.user?.email}</p>
      </div>
      {!mailConfigured() && (
        <p className="mt-5 rounded-2xl border border-[#e0c48f] bg-[#f8ecd4] px-4 py-3 text-[13.5px] text-[#7a5212]">
          שליחת מיילים עדיין לא הוגדרה (GMAIL_USER / GMAIL_APP_PASSWORD ב-.env.local). ההזמנות נשמרות, אבל אישורים ועדכונים לא נשלחים.
        </p>
      )}
      <div className="mt-8">{children}</div>
    </Container>
  );
}
