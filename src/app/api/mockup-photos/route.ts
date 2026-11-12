import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/server/auth";
import { PHOTO_LIMITS, countPhotos, createPhoto, listPhotos, sniffImage } from "@/lib/server/photos-repo";

export const runtime = "nodejs";

const calibSchema = z.object({ x1: z.number().min(0).max(1), y1: z.number().min(0).max(1), x2: z.number().min(0).max(1), y2: z.number().min(0).max(1), cm: z.number().min(0.1).max(1000) });

const uploadSchema = z.object({
  src: z.string().regex(/^data:image\/(jpeg|png);base64,[A-Za-z0-9+/=]+$/).max(12_000_000),
  width: z.number().int().min(1).max(10000),
  height: z.number().int().min(1).max(10000),
  label: z.string().max(80),
  calib: calibSchema.nullish(),
});

async function userEmail() {
  const s = await getSession();
  return s?.user?.email?.toLowerCase() ?? null;
}

/** רשימת התמונות של המשתמש/ת המחובר/ת */
export async function GET() {
  const email = await userEmail();
  if (!email) return NextResponse.json({ error: "יש להתחבר." }, { status: 401 });
  return NextResponse.json({ photos: listPhotos(email) });
}

/** העלאת תמונה חדשה לחשבון */
export async function POST(req: Request) {
  const email = await userEmail();
  if (!email) return NextResponse.json({ error: "יש להתחבר." }, { status: 401 });
  if (countPhotos(email) >= PHOTO_LIMITS.maxPerUser) return NextResponse.json({ error: `אפשר לשמור עד ${PHOTO_LIMITS.maxPerUser} תמונות. מחקו תמונות ישנות.` }, { status: 409 });

  const parsed = uploadSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "קובץ לא תקין." }, { status: 422 });

  const buf = Buffer.from(parsed.data.src.split(",")[1], "base64");
  if (buf.length > PHOTO_LIMITS.maxBytes) return NextResponse.json({ error: "התמונה גדולה מדי." }, { status: 413 });
  const mime = sniffImage(buf);
  if (!mime) return NextResponse.json({ error: "ניתן לשמור תמונות JPG או PNG בלבד." }, { status: 415 });

  const label = parsed.data.label.replace(/[^\p{L}\p{N}._ -]/gu, "").slice(0, 60) || "photo";
  const photo = createPhoto(email, { buf, mime, width: parsed.data.width, height: parsed.data.height, label, calib: parsed.data.calib ?? null });
  return NextResponse.json({ photo });
}
