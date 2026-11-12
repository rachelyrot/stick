import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/auth";
import { getCatalog, resetCatalog, saveCatalog } from "@/lib/server/catalog-store";
import { catalogSchema } from "@/lib/catalog/catalog-schema";
import type { Catalog } from "@/config/production";

export const runtime = "nodejs";

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "אין הרשאה." }, { status: 403 });
  return NextResponse.json({ catalog: getCatalog() });
}

/** שמירת מלאי החומרים והצבעים (רק מנהלות) */
export async function PUT(req: Request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "אין הרשאה." }, { status: 403 });
  const parsed = catalogSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "ערכים לא תקינים." }, { status: 422 });
  return NextResponse.json({ catalog: saveCatalog(parsed.data as Catalog, session.user!.email!) });
}

export async function DELETE() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "אין הרשאה." }, { status: 403 });
  return NextResponse.json({ catalog: resetCatalog() });
}
