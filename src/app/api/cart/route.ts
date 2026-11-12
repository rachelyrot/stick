import { NextResponse } from "next/server";
import { getSession } from "@/lib/server/auth";
import { cartInputSchema } from "@/lib/server/validate";
import { getCart, saveCart } from "@/lib/server/carts-repo";

export const runtime = "nodejs";
const MAX_BYTES = 25 * 1024 * 1024;

async function userEmail() {
  const s = await getSession();
  return s?.user?.email?.toLowerCase() ?? null;
}

/** הסל של המשתמשת המחוברת */
export async function GET() {
  const email = await userEmail();
  if (!email) return NextResponse.json({ error: "לא מחובר." }, { status: 401 });
  return NextResponse.json({ items: getCart(email) }, { headers: { "Cache-Control": "no-store" } });
}

/** החלפת תוכן הסל של המשתמשת המחוברת */
export async function PUT(req: Request) {
  const email = await userEmail();
  if (!email) return NextResponse.json({ error: "לא מחובר." }, { status: 401 });

  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > MAX_BYTES) return NextResponse.json({ error: "הסל גדול מדי." }, { status: 413 });
  const raw = await req.text();
  if (raw.length > MAX_BYTES) return NextResponse.json({ error: "הסל גדול מדי." }, { status: 413 });

  let parsed;
  try {
    parsed = cartInputSchema.safeParse(JSON.parse(raw));
  } catch {
    return NextResponse.json({ error: "בקשה לא תקינה." }, { status: 400 });
  }
  if (!parsed.success) return NextResponse.json({ error: "פריטי הסל אינם תקינים." }, { status: 422 });

  saveCart(email, parsed.data.items);
  return NextResponse.json({ ok: true });
}
