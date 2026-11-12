import { readTexture } from "@/lib/server/catalog-store";

export const runtime = "nodejs";

/** תמונות מרקם של ויניל — ציבוריות (מוצגות לכל הלקוחות) */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const buf = readTexture((await params).id);
  if (!buf) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(buf), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
  });
}
