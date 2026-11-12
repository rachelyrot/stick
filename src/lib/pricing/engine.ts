import pricing from "@/config/pricing.json";
import { getMaterial } from "@/config/production";
import { getFont } from "@/config/fonts";
import type { Design } from "@/lib/design/types";
import { usedColorIds } from "@/lib/design/factory";

/** מבנה המחירון. ערכי ברירת המחדל ב-pricing.json; הערכים בפועל — במסד הנתונים (עריכה מממשק הניהול). */
export interface PricingConfig {
  version: string;
  currency: string;
  /** מחיר מדבקה עד אורך הבסיס (₪) */
  basePrice: number;
  /** אורך הבסיס בס"מ — עד האורך הזה משלמים מחיר בסיס */
  baseLengthCm: number;
  /** מחיר לכל ס"מ נוסף מעבר לאורך הבסיס (₪) */
  perExtraCm: number;
  uploadReviewFee: number;
  /** מחיר קבוע לדף שלם (29×29 ס"מ) — כמה כיתובים שרוצים על דף אחד */
  sheetPrice: number;
  materialFactors: Record<string, number>;
  complexity: { freeElements: number; perExtraElement: number; thinFont: number; uploadedGraphic: number; max: number };
  quantityTiers: { min: number; discount: number }[];
  shipping: { flat: number; freeFrom: number; pickup: number };
}

export const DEFAULT_PRICING: PricingConfig = pricing;

/** מקדם המחיר של חומר: מהמחירון, ואם לא הוגדר — מהגדרות החומר */
export const materialFactor = (materialId: string, cfg: PricingConfig = DEFAULT_PRICING) => cfg.materialFactors?.[materialId] ?? getMaterial(materialId).priceFactor;

export interface QuoteInput {
  widthCm: number;
  heightCm: number;
  materialId: string;
  quantity: number;
  colorCount: number;
  elementCount: number;
  hasThinFont: boolean;
  hasUpload: boolean;
  /** דף שלם — מחיר קבוע */
  isSheet?: boolean;
}

export interface QuoteLine {
  label: string;
  amount: number;
}

export interface Quote {
  unitPrice: number;
  quantity: number;
  discountRate: number;
  subtotal: number;
  oneTimeFees: number;
  total: number;
  complexity: number;
  lines: QuoteLine[];
  configVersion: string;
}

const round = (v: number) => Math.round(v * 100) / 100;

export function discountFor(qty: number, cfg: PricingConfig = DEFAULT_PRICING): number {
  let d = 0;
  for (const t of [...cfg.quantityTiers].sort((a, b) => a.min - b.min)) if (qty >= t.min) d = t.discount;
  return d;
}

/**
 * חישוב מחיר. כל הפרמטרים מגיעים מהמחירון — אין מספרי קסם בקוד.
 */
export function quote(input: QuoteInput, cfg: PricingConfig = DEFAULT_PRICING): Quote {
  const qty = Math.max(1, Math.floor(input.quantity));
  // אורך המדבקה = הצלע הארוכה. כל ס"מ שהתחיל נספר (16.2 ס"מ = 17)
  const lengthCm = Math.max(input.widthCm, input.heightCm);
  const extraCm = Math.max(0, Math.ceil(lengthCm - cfg.baseLengthCm - 1e-9));
  const material = getMaterial(input.materialId);
  const mf = materialFactor(input.materialId, cfg);

  const c = cfg.complexity;
  let complexity = 1 + Math.max(0, input.elementCount - c.freeElements) * c.perExtraElement;
  if (input.hasThinFont) complexity += c.thinFont;
  if (input.hasUpload) complexity += c.uploadedGraphic;
  complexity = Math.min(complexity, c.max);

  // דף שלם: מחיר קבוע, בלי תוספות חומר/מורכבות
  const sizePrice = input.isSheet ? cfg.sheetPrice : cfg.basePrice + extraCm * cfg.perExtraCm;
  const materialAdd = input.isSheet ? 0 : sizePrice * (mf - 1);
  const complexityAdd = input.isSheet ? 0 : (sizePrice + materialAdd) * (complexity - 1);
  const unitPrice = round(sizePrice + materialAdd + complexityAdd);
  const discountRate = discountFor(qty, cfg);
  const subtotal = round(unitPrice * qty * (1 - discountRate));
  const oneTimeFees = input.hasUpload ? cfg.uploadReviewFee : 0;

  const lines: QuoteLine[] = [
    {
      label: input.isSheet
        ? "דף שלם 29×29 ס״מ — כמה כיתובים שרוצים"
        : extraCm
        ? `מדבקה באורך ${cfg.baseLengthCm + extraCm} ס״מ (${cfg.baseLengthCm} + ${extraCm} ס״מ נוספים)`
        : `מדבקה עד ${cfg.baseLengthCm} ס״מ`,
      amount: round(sizePrice),
    },
  ];
  if (Math.abs(mf - 1) > 1e-6) lines.push({ label: `${material.name} ${mf > 1 ? "+" : ""}${Math.round((mf - 1) * 100)}%`, amount: round(materialAdd) });
  if (complexityAdd > 0.004) lines.push({ label: "תוספת מורכבות", amount: round(complexityAdd) });
  if (qty > 1) lines.push({ label: `× ${qty} יחידות`, amount: round(unitPrice * qty) });
  if (discountRate) lines.push({ label: `הנחת כמות ${Math.round(discountRate * 100)}%`, amount: -round(unitPrice * qty * discountRate) });
  if (oneTimeFees) lines.push({ label: "בדיקה והכנת קובץ גרפי לחיתוך", amount: oneTimeFees });

  return {
    unitPrice,
    quantity: qty,
    discountRate,
    subtotal,
    oneTimeFees,
    total: round(subtotal + oneTimeFees),
    complexity: round(complexity),
    lines,
    configVersion: cfg.version,
  };
}

export function designQuoteInput(design: Design, quantity: number): QuoteInput {
  return {
    widthCm: design.widthMm / 10,
    heightCm: design.heightMm / 10,
    materialId: design.materialId,
    quantity,
    colorCount: Math.max(1, usedColorIds(design).length),
    elementCount: design.elements.length,
    hasThinFont: design.elements.some((e) => e.type === "text" && getFont(e.fontId).thin),
    hasUpload: design.elements.some((e) => e.type === "image"),
    isSheet: design.sizeMode === "sheet",
  };
}

export const quoteDesign = (design: Design, quantity: number, cfg: PricingConfig = DEFAULT_PRICING) => quote(designQuoteInput(design, quantity), cfg);

export function shippingFor(subtotal: number, method: "delivery" | "pickup", cfg: PricingConfig = DEFAULT_PRICING): number {
  if (method === "pickup") return cfg.shipping.pickup;
  // freeFrom = 0 → אין משלוח חינם
  return cfg.shipping.freeFrom > 0 && subtotal >= cfg.shipping.freeFrom ? 0 : cfg.shipping.flat;
}

export const formatPrice = (v: number) =>
  `₪${v.toLocaleString("he-IL", { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;

export const PRICING = DEFAULT_PRICING;
