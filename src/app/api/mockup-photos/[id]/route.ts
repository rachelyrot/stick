import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/server/auth";
import { deletePhoto, getPhotoFile, updateCalib } from "@/lib/server/photos-repo";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };
const idSchema = z.string().uuid();

async function auth(ctx: Ctx) {
  const s = await getSession();
  const email = s?.user?.email?.toLowerCase();
  const id = (await ctx.params).id;
  return { email, id: idSchema.safeParse(id).success ? id : null };
}

/** הקובץ עצמו — רק לבעלים */
export async function GET(_req: Request, ctx: Ctx) {
  const { email, id } = await auth(ctx);
  if (!email) return new NextResponse("Unauthorized", { status: 401 });
  if (!id) return new NextResponse("Not found", { status: 404 });
  const file = getPhotoFile(email, id);
  if (!file) return new NextResponse("Not found", { status: 404 });
  return new NextResponse(new Uint8Array(file.buf), {
    headers: {
      "Content-Type": file.mime,
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

const calibSchema = z
  .object({ x1: z.number().min(0).max(1), y1: z.number().min(0).max(1), x2: z.number().min(0).max(1), y2: z.number().min(0).max(1), cm: z.number().min(0.1).max(1000) })
  .nullable();

/** עדכון כיול קנה מידה */
export async function PATCH(req: Request, ctx: Ctx) {
  const { email, id } = await auth(ctx);
  if (!email) return NextResponse.json({ error: "יש להתחבר." }, { status: 401 });
  const body = z.object({ calib: calibSchema }).safeParse(await req.json().catch(() => null));
  if (!id || !body.success) return NextResponse.json({ error: "בקשה לא תקינה." }, { status: 400 });
  return updateCalib(email, id, body.data.calib) ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "לא נמצא." }, { status: 404 });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { email, id } = await auth(ctx);
  if (!email) return NextResponse.json({ error: "יש להתחבר." }, { status: 401 });
  if (!id) return NextResponse.json({ error: "לא נמצא." }, { status: 404 });
  return deletePhoto(email, id) ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "לא נמצא." }, { status: 404 });
}
