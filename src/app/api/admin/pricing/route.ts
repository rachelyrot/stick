import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { getPricing, resetPricing, savePricing } from "@/lib/server/pricing-store";
import { pricingSchema } from "@/lib/pricing/schema";
import type { PricingConfig } from "@/lib/pricing/engine";

export const runtime = "nodejs";

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "אין הרשאה." }, { status: 403 });
  return NextResponse.json({ pricing: getPricing() });
}

/** שמירת מחירון חדש (רק מנהלות) */
export async function PUT(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "אין הרשאה." }, { status: 403 });
  const parsed = pricingSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "ערכים לא תקינים." }, { status: 422 });
  return NextResponse.json({ pricing: savePricing(parsed.data as PricingConfig, session.user!.email!) });
}

/** חזרה לברירת המחדל */
export async function DELETE() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "אין הרשאה." }, { status: 403 });
  return NextResponse.json({ pricing: resetPricing() });
}
