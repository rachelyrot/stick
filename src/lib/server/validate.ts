import "server-only";
import { z } from "zod";
import { PICKUP_POINT_IDS } from "@/config/pickup-points";

/**
 * אימות קלט בצד השרת. אף נתון מהדפדפן (כולל מחירים) לא נחשב אמין.
 */
const num = (min: number, max: number) => z.number().finite().min(min).max(max);
const id = z.string().min(1).max(64);

const base = {
  id,
  x: num(-5000, 5000),
  y: num(-5000, 5000),
  rotation: num(-360, 360),
  colorId: z.string().min(1).max(32),
  locked: z.boolean().optional(),
};

const dataUrl = (types: string, maxChars: number) =>
  z
    .string()
    .max(maxChars)
    .regex(new RegExp(`^data:image/(${types});base64,[A-Za-z0-9+/=]+$`));

const elementSchema = z.discriminatedUnion("type", [
  z.object({
    ...base,
    type: z.literal("text"),
    text: z.string().max(120),
    fontId: z.string().min(1).max(32),
    fontSize: num(0.5, 1000),
    letterSpacing: num(-1, 3),
    lineHeight: num(0.3, 4),
  }),
  z.object({ ...base, type: z.literal("shape"), shapeId: z.string().min(1).max(32), width: num(0.5, 3000), height: num(0.5, 3000) }),
  z.object({
    ...base,
    type: z.literal("image"),
    src: dataUrl("png|jpeg|svg\\+xml", 6_000_000),
    mime: z.enum(["image/png", "image/jpeg", "image/svg+xml"]),
    fileName: z.string().max(80),
    width: num(0.5, 3000),
    height: num(0.5, 3000),
    tint: z.boolean(),
  }),
]);

export const designSchema = z.object({
  schema: z.literal(1),
  id,
  name: z.string().max(80),
  widthMm: num(5, 1000),
  heightMm: num(5, 1000),
  materialId: z.string().min(1).max(32),
  elements: z.array(elementSchema).min(1).max(40),
  sourceProduct: z.string().max(64).optional(),
  // נדרש לחישוב המחיר בשרת (דף שלם = מחיר קבוע)
  sizeMode: z.enum(["fit", "box", "sheet"]).optional(),
  lengthMm: num(0, 1000).optional(),
  matCx: num(-1000, 1000).optional(),
  matCy: num(-1000, 1000).optional(),
  updatedAt: z.number(),
});

export const customerSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  phone: z
    .string()
    .trim()
    .transform((s) => s.replace(/[\s-]/g, ""))
    .pipe(z.string().regex(/^0\d{8,9}$/)),
  delivery: z.enum(["delivery", "pickup"]),
  pickupPoint: z.enum(PICKUP_POINT_IDS).optional(),
  city: z.string().trim().max(60),
  street: z.string().trim().max(120),
  notes: z.string().max(500),
  businessName: z.string().trim().max(80).optional(),
});

export const orderInputSchema = z.object({
  customer: customerSchema,
  items: z
    .array(
      z.object({
        id,
        design: designSchema,
        quantity: z.number().int().min(1).max(999),
        thumbnail: dataUrl("png", 600_000),
      })
    )
    .min(1)
    .max(30),
});

export type OrderInput = z.infer<typeof orderInputSchema>;

/** סל קניות שמור בשרת (משתמשת מחוברת) */
export const cartInputSchema = z.object({
  items: z
    .array(
      z.object({
        id,
        design: designSchema,
        quantity: z.number().int().min(1).max(999),
        thumbnail: dataUrl("png", 600_000),
        productSlug: z.string().max(64).optional(),
        addedAt: z.number(),
      })
    )
    .max(60),
});
