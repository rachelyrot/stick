import { z } from "zod";

/** אימות מחירון — משותף לשרת ולעורך בממשק הניהול */
const money = z.number().finite().min(0).max(100000);
const ratio = z.number().finite().min(0).max(5);

export const pricingSchema = z.object({
  version: z.string().max(40),
  currency: z.literal("ILS"),
  basePrice: money,
  baseLengthCm: z.number().finite().min(0).max(100),
  perExtraCm: money,
  uploadReviewFee: money,
  /** מחיר קבוע לדף שלם 29×29 עם כמה כיתובים שרוצים */
  sheetPrice: money,
  materialFactors: z.record(z.string().max(32), z.number().finite().min(0.1).max(10)),
  complexity: z.object({
    freeElements: z.number().int().min(0).max(100),
    perExtraElement: ratio,
    thinFont: ratio,
    uploadedGraphic: ratio,
    max: z.number().finite().min(1).max(10),
  }),
  quantityTiers: z
    .array(z.object({ min: z.number().int().min(1).max(100000), discount: z.number().finite().min(0).max(0.9) }))
    .min(1)
    .max(20)
    .refine((t) => t.some((x) => x.min === 1), { message: "חייבת להיות מדרגה שמתחילה מיחידה אחת" })
    .refine((t) => new Set(t.map((x) => x.min)).size === t.length, { message: "אסור שתי מדרגות עם אותה כמות" }),
  shipping: z.object({ flat: money, freeFrom: money, pickup: money }),
});
