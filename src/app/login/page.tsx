import type { Metadata } from "next";
import { devLoginEnabled, getSession, googleConfigured } from "@/lib/server/auth";
import { LoginPanel } from "@/features/auth/LoginPanel";
import { BRAND } from "@/config/brand";

export const metadata: Metadata = { title: "התחברות" };
export const dynamic = "force-dynamic";

/** מקבל רק כתובות מאותו אתר — מונע הפניה לאתרים חיצוניים */
function safeCallback(raw?: string): string {
  if (!raw) return "/";
  try {
    const base = new URL(process.env.NEXTAUTH_URL ?? "http://localhost:3000");
    const u = new URL(raw, base);
    return u.origin === base.origin ? u.pathname + u.search : "/";
  } catch {
    return "/";
  }
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ callbackUrl?: string; error?: string }> }) {
  const sp = await searchParams;
  const session = await getSession();
  const safe = safeCallback(sp.callbackUrl);

  return (
    <div className="relative grid min-h-[78vh] place-items-center overflow-hidden px-4 py-16">
      <div aria-hidden className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-olive-soft/60 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-sand blur-3xl" />
      <div className="relative w-full max-w-md rounded-[32px] border border-stone bg-ivory p-8 text-center shadow-[0_40px_80px_-40px_rgba(58,42,33,0.45)] sm:p-10">
        <p className="font-latin text-lg italic text-olive">welcome</p>
        <h1 className="mt-2 font-display text-4xl font-light text-choco">התחברות ל{BRAND.name}</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-cocoa">מתחברים עם חשבון Google כדי להזמין, לעקוב אחרי ההזמנות ולקבל אישורים ועדכונים למייל.</p>
        <LoginPanel
          callbackUrl={safe}
          google={googleConfigured()}
          dev={devLoginEnabled()}
          signedInAs={session?.user?.email ?? null}
          notAdmin={!!session?.user && safe.startsWith("/admin") && session.user.role !== "admin"}
          error={sp.error ?? null}
        />
      </div>
    </div>
  );
}
