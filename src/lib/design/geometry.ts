import type { BoxMap, Design, DesignElement, LocalBox } from "./types";

/** תיבה מקומית משוערת — משמשת כשאין עדיין מדידה מה-DOM (למשל בצד שרת) */
export function estimateLocalBox(el: DesignElement): LocalBox {
  if (el.type === "text") {
    const lines = el.text.split("\n");
    const longest = Math.max(...lines.map((l) => l.length), 1);
    const w = longest * el.fontSize * (0.55 + el.letterSpacing);
    const h = el.fontSize * (1 + (lines.length - 1) * el.lineHeight);
    return { x: -w / 2, y: -h / 2, w, h };
  }
  return { x: -el.width / 2, y: -el.height / 2, w: el.width, h: el.height };
}

export function rotatedCorners(el: DesignElement, box: LocalBox): [number, number][] {
  const r = (el.rotation * Math.PI) / 180;
  const cos = Math.cos(r);
  const sin = Math.sin(r);
  const pts: [number, number][] = [
    [box.x, box.y],
    [box.x + box.w, box.y],
    [box.x + box.w, box.y + box.h],
    [box.x, box.y + box.h],
  ];
  return pts.map(([px, py]) => [el.x + px * cos - py * sin, el.y + px * sin + py * cos]);
}

/** תיבה תוחמת בקואורדינטות הלוח (כולל סיבוב) */
export function worldBox(el: DesignElement, box: LocalBox) {
  const c = rotatedCorners(el, box);
  const xs = c.map((p) => p[0]);
  const ys = c.map((p) => p[1]);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return { minX, minY, maxX: Math.max(...xs), maxY: Math.max(...ys), w: Math.max(...xs) - minX, h: Math.max(...ys) - minY };
}

export function contentBounds(design: Design, boxes: BoxMap) {
  if (!design.elements.length) return null;
  const all = design.elements.map((el) => worldBox(el, boxes[el.id] ?? estimateLocalBox(el)));
  const minX = Math.min(...all.map((b) => b.minX));
  const minY = Math.min(...all.map((b) => b.minY));
  const maxX = Math.max(...all.map((b) => b.maxX));
  const maxY = Math.max(...all.map((b) => b.maxY));
  return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
}

/**
 * התאמת כל התוכן ללוח: ממרכז ומגדיל/מקטין את העיצוב כך שימלא את המדבקה עם שוליים.
 */
export function fitContentToArtboard(design: Design, boxes: BoxMap, margin = 0.06): Design {
  const b = contentBounds(design, boxes);
  if (!b || b.w === 0 || b.h === 0) return design;
  const availW = design.widthMm * (1 - margin * 2);
  const availH = design.heightMm * (1 - margin * 2);
  const k = Math.min(availW / b.w, availH / b.h);
  const cx = (b.minX + b.maxX) / 2;
  const cy = (b.minY + b.maxY) / 2;
  return {
    ...design,
    elements: design.elements.map((el) => scaleElement({ ...el, x: design.widthMm / 2 + (el.x - cx) * k, y: design.heightMm / 2 + (el.y - cy) * k }, k)),
  };
}

/** גודל מדבקה שמתאים בדיוק לתוכן (חיתוך הדוק) */
export function shrinkArtboardToContent(design: Design, boxes: BoxMap, padMm = 2): Design {
  const b = contentBounds(design, boxes);
  if (!b) return design;
  const w = b.w + padMm * 2;
  const h = b.h + padMm * 2;
  return {
    ...design,
    widthMm: round1(w),
    heightMm: round1(h),
    elements: design.elements.map((el) => ({ ...el, x: el.x - b.minX + padMm, y: el.y - b.minY + padMm })),
  };
}

export function scaleElement<T extends DesignElement>(el: T, k: number): T {
  if (el.type === "text") return { ...el, fontSize: clamp(el.fontSize * k, 2, 600) };
  return { ...el, width: clamp(el.width * k, 2, 2000), height: clamp(el.height * k, 2, 2000) };
}

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
export const round1 = (v: number) => Math.round(v * 10) / 10;

/** חתימה של המאפיינים שמשפיעים על גודל הרכיב (לא מיקום/סיבוב) */
export function elementSig(el: DesignElement): string {
  return el.type === "text" ? `t|${el.text}|${el.fontId}|${el.fontSize.toFixed(3)}|${el.letterSpacing}|${el.lineHeight}` : `${el.type}|${el.width.toFixed(3)}|${el.height.toFixed(3)}`;
}

/** האם יש מדידה עדכנית לכל הרכיבים */
export const boxesFresh = (design: Design, boxes: BoxMap) => design.elements.every((el) => boxes[el.id]?.sig === elementSig(el));

/**
 * מצב "מידות קבועות" אחרי הזזה/שינוי גודל ידני: המדבקה עוטפת את העיצוב מחדש
 * (באותם שוליים של fitContentToArtboard, כך ששינוי רוחב/גובה אחר כך ממשיך למלא בדיוק).
 */
export function wrapArtboardToContent(design: Design, boxes: BoxMap, margin = 0.04): Design {
  const b = contentBounds(design, boxes);
  if (!b || b.w <= 0 || b.h <= 0) return design;
  const W = b.w / (1 - margin * 2);
  const H = b.h / (1 - margin * 2);
  const dx = (W - b.w) / 2 - b.minX;
  const dy = (H - b.h) / 2 - b.minY;
  return {
    ...design,
    widthMm: round1(W),
    heightMm: round1(H),
    elements: design.elements.map((el) => ({ ...el, x: el.x + dx, y: el.y + dy })),
  };
}

/**
 * מצב "לפי אורך": מגדיל/מקטין את כל העיצוב כך שהצלע הארוכה שלו תהיה בדיוק lengthMm,
 * והמדבקה עוטפת אותו (עם שוליים קטנים).
 */
export function fitToLength(design: Design, boxes: BoxMap, lengthMm: number, padMm = 1): Design {
  const b = contentBounds(design, boxes);
  if (!b || b.w <= 0 || b.h <= 0) return design;
  const k = (lengthMm - padMm * 2) / Math.max(b.w, b.h);
  return {
    ...design,
    widthMm: round1(b.w * k + padMm * 2),
    heightMm: round1(b.h * k + padMm * 2),
    elements: design.elements.map((el) => scaleElement({ ...el, x: (el.x - b.minX) * k + padMm, y: (el.y - b.minY) * k + padMm }, k)),
  };
}