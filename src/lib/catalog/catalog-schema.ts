import { z } from "zod";

/** אימות מלאי החומרים והצבעים — משותף לשרת ולעורך */
const id = z.string().regex(/^[a-z0-9-]{1,40}$/);
const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/);
const finish = z.enum(["matte", "gloss", "metallic", "holographic"]);
const texture = z
  .string()
  .regex(/^(\/vinyl\/[a-z0-9-]+\.(jpg|png)|\/api\/textures\/[0-9a-f-]{36})$/)
  .optional();

export const colorSchema = z.object({
  id,
  name: z.string().trim().min(1, "לכל צבע צריך שם").max(40),
  supplierName: z.string().trim().max(60).optional(),
  hex,
  finish,
  inStock: z.boolean(),
  gradient: z.array(hex).max(8).optional(),
  texture,
});

export const materialSchema = z.object({
  id,
  name: z.string().trim().min(1, "לכל חומר צריך שם").max(60),
  short: z.string().trim().min(1).max(20),
  description: z.string().max(400),
  finish,
  priceFactor: z.number().finite().min(0.1).max(10),
  active: z.boolean(),
  colorIds: z.array(id).max(60),
  care: z.string().max(300),
  surfaces: z.array(z.string().max(40)).max(20),
});

export const catalogSchema = z
  .object({ colors: z.array(colorSchema).max(300), materials: z.array(materialSchema).min(1).max(30) })
  .refine((c) => new Set(c.colors.map((x) => x.id)).size === c.colors.length, { message: "יש שני צבעים עם אותו מזהה" })
  .refine((c) => c.materials.every((m) => m.colorIds.every((cid) => c.colors.some((x) => x.id === cid))), { message: "חומר מפנה לצבע שלא קיים" })
  .refine((c) => c.materials.some((m) => m.active && m.colorIds.length), { message: "צריך לפחות חומר פעיל אחד עם צבע" });
