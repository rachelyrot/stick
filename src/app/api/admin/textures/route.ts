import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/server/auth";
import { saveTexture } from "@/lib/server/catalog-store";
import { sniffImage } from "@/lib/server/photos-repo";

export const runtime = "nodejs";

/** העלאת תמונת מרקם לויניל חדש (רק מנהלות). התמונה כבר הוקטנה בדפדפן ל-JPEG. */
export async function POST(req: Request) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "אין הרשאה." }, { status: 403 });
  const body = z
    .object({ src: z.string().regex(/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/).max(2_000_000) })
    .safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "תמונה לא תקינה." }, { status: 422 });
  const buf = Buffer.from(body.data.src.split(",")[1], "base64");
  if (sniffImage(buf) !== "image/jpeg") return NextResponse.json({ error: "תמונה לא תקינה." }, { status: 415 });
  return NextResponse.json({ url: saveTexture(buf) });
}
