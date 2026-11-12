import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/server/auth";
import { getOrder, setAdminNote, updateStatus } from "@/lib/server/orders-repo";
import { sendStatusEmail } from "@/lib/server/mailer";
import { loadCatalog } from "@/lib/server/catalog-store";
import { ORDER_STATUSES } from "@/lib/orders/types";

export const runtime = "nodejs";

const bodySchema = z.object({
  status: z.enum(ORDER_STATUSES.map((s) => s.id) as [string, ...string[]]).optional(),
  note: z.string().max(1000).optional(),
  notify: z.boolean().optional(),
  adminNote: z.string().max(2000).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "אין הרשאה." }, { status: 403 });

  loadCatalog();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || !getOrder(id)) return NextResponse.json({ error: "הזמנה לא נמצאה." }, { status: 404 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "בקשה לא תקינה." }, { status: 400 });
  const { status, note, notify, adminNote } = parsed.data;

  if (adminNote !== undefined) setAdminNote(id, adminNote);
  let emailSent: boolean | undefined;
  if (status) {
    const updated = updateStatus(id, status as (typeof ORDER_STATUSES)[number]["id"], session.user!.email!, note);
    if (notify && updated) emailSent = (await sendStatusEmail(updated, note)).sent;
  }
  return NextResponse.json({ order: getOrder(id), emailSent });
}
