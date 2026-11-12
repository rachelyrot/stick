import { getFont } from "@/config/fonts";
import { getMaterial, materialForColor } from "@/config/production";
import type { Design, TextElement } from "@/lib/design/types";
import { scaleDesignToWidth, type Product } from "@/data/products";

let measureCtx: CanvasRenderingContext2D | null = null;

/** רוחב טקסט במ"מ (מדידה אמיתית בדפדפן; הערכה בצד השרת) */
export function measureTextMm(el: TextElement, precise = true): number {
  const lines = el.text.split("\n");
  if (!precise || typeof document === "undefined") {
    return Math.max(...lines.map((l) => l.length)) * el.fontSize * (0.55 + el.letterSpacing);
  }
  measureCtx ??= document.createElement("canvas").getContext("2d");
  const ctx = measureCtx!;
  const f = getFont(el.fontId);
  ctx.font = `${f.weight} 100px "${f.family}"`;
  return Math.max(
    ...lines.map((l) => (ctx.measureText(l).width + Math.max(0, l.length - 1) * el.letterSpacing * 100) / 100)
  ) * el.fontSize;
}

/** מקטין טקסט כך שייכנס לרוחב המדבקה (לעולם לא מגדיל מעבר לגודל התבנית) */
export function fitText(design: Design, elementId: string, baseFontSize: number, maxFrac = 0.9, precise = true): Design {
  return {
    ...design,
    elements: design.elements.map((el) => {
      if (el.id !== elementId || el.type !== "text") return el;
      const atBase = measureTextMm({ ...el, fontSize: baseFontSize }, precise);
      const avail = design.widthMm * maxFrac;
      const fontSize = atBase > avail ? (baseFontSize * avail) / atBase : baseFontSize;
      return { ...el, fontSize };
    }),
  };
}

export interface PersonalizeOptions {
  text?: string;
  colorId?: string;
  widthMm?: number;
  /** מדידה מדויקת בדפדפן. כבוי ברינדור הראשון כדי למנוע אי-התאמת hydration */
  precise?: boolean;
}

/** יוצר עיצוב מותאם מתבנית מוצר */
export function personalize(product: Product, opts: PersonalizeOptions = {}): Design {
  let d: Design = structuredClone(product.template);
  if (opts.colorId) {
    const mat = getMaterial(d.materialId);
    const materialId = mat.colorIds.includes(opts.colorId) ? d.materialId : (materialForColor(opts.colorId)?.id ?? d.materialId);
    d = { ...d, materialId, elements: d.elements.map((e) => ({ ...e, colorId: opts.colorId! })) };
  }
  const pe = product.personalize;
  if (pe && opts.text !== undefined) {
    const base = (product.template.elements.find((e) => e.id === pe.elementId) as TextElement | undefined)?.fontSize ?? 20;
    d = { ...d, elements: d.elements.map((e) => (e.id === pe.elementId && e.type === "text" ? { ...e, text: opts.text || pe.placeholder } : e)) };
    d = fitText(d, pe.elementId, base, 0.9, opts.precise ?? false);
  }
  if (opts.widthMm) d = scaleDesignToWidth(d, opts.widthMm);
  return d;
}
