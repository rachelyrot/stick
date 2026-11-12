import { MACHINE, getColor, getMaterial, materialForColor } from "@/config/production";
import { getFont } from "@/config/fonts";
import type { BoxMap, Design } from "@/lib/design/types";
import { estimateLocalBox, worldBox } from "@/lib/design/geometry";

export type CheckLevel = "ok" | "info" | "review" | "warn" | "error";

export interface PreflightCheck {
  level: CheckLevel;
  message: string;
  elementId?: string;
}

/**
 * בדיקת התאמה בסיסית לייצור. זו בדיקה מקדימה בלבד —
 * כל הזמנה עוברת בדיקה ידנית לפני חיתוך, ובדיקת קווי מתאר מלאה מתוכננת לשלב הבא.
 */
export function preflight(design: Design, boxes: BoxMap): PreflightCheck[] {
  const checks: PreflightCheck[] = [];
  const wCm = design.widthMm / 10;
  const hCm = design.heightMm / 10;

  if (!design.elements.length) {
    checks.push({ level: "error", message: "העיצוב ריק — הוסיפו טקסט, צורה או לוגו." });
    return checks;
  }

  const fitsNormal = wCm <= MACHINE.maxWidthCm && hCm <= MACHINE.maxHeightCm;
  const fitsRotated = hCm <= MACHINE.maxWidthCm && wCm <= MACHINE.maxHeightCm;
  if (!fitsNormal && !fitsRotated) {
    checks.push({
      level: "error",
      message: `המידות חורגות משטח החיתוך (${MACHINE.maxWidthCm}×${MACHINE.maxHeightCm} ס״מ). לפריטים גדולים יותר — צרו קשר.`,
    });
  }

  // מידות קבועות = מדבקה אחת עם רכיב אחד. לכמה כיתובים — דף שלם
  if (design.sizeMode === "box" && design.elements.length > 1) {
    checks.push({
      level: "error",
      message: `במידות קבועות אפשר רק רכיב אחד (יש ${design.elements.length}). מחקו את המיותרים, או עברו ל"דף שלם" כדי לשים כמה כיתובים.`,
    });
  }

  const material = getMaterial(design.materialId);
  if (!material.active) checks.push({ level: "error", message: `${material.name} אינו זמין כרגע.` });

  for (const el of design.elements) {
    const color = getColor(el.colorId);
    if (!color.inStock) checks.push({ level: "error", message: `הצבע "${color.name}" חסר במלאי.`, elementId: el.id });
    // בדף שלם כל כיתוב בחומר משלו — מספיק שהצבע שייך לחומר פעיל כלשהו
    if (design.sizeMode === "sheet" ? !materialForColor(el.colorId) : !material.colorIds.includes(el.colorId))
      checks.push({ level: "warn", message: `הצבע "${color.name}" אינו זמין בחומר ${material.short}.`, elementId: el.id });

    const wb = worldBox(el, boxes[el.id] ?? estimateLocalBox(el));
    if (wb.minX < -0.5 || wb.minY < -0.5 || wb.maxX > design.widthMm + 0.5 || wb.maxY > design.heightMm + 0.5)
      checks.push({ level: "warn", message: "חלק מהעיצוב חורג מגבולות המדבקה ולא ייחתך.", elementId: el.id });

    if (el.type === "text") {
      const font = getFont(el.fontId);
      const letterH = el.fontSize * 0.7; // גובה אות משוער (cap height)
      const min = font.thin ? MACHINE.minThinFontLetterHeightMm : MACHINE.minLetterHeightMm;
      if (letterH < min)
        checks.push({
          level: "warn",
          message: `האותיות ב"${el.text.slice(0, 12)}" קטנות (~${letterH.toFixed(0)} מ״מ). מומלץ לפחות ${min} מ״מ${font.thin ? " לגופן דק" : ""}.`,
          elementId: el.id,
        });
      if (!el.text.trim()) checks.push({ level: "warn", message: "יש רכיב טקסט ריק.", elementId: el.id });
      if (!font.hebrew && /[֐-׿]/.test(el.text))
        checks.push({ level: "warn", message: `הגופן ${font.label} אינו תומך בעברית.`, elementId: el.id });
    }
    if (el.type === "image") {
      checks.push({
        level: "review",
        message:
          el.mime === "image/svg+xml"
            ? `"${el.fileName}" — קובץ וקטורי. נבדוק את קווי המתאר לפני חיתוך.`
            : `"${el.fileName}" — תמונה (פיקסלים). תעבור המרה ידנית לקווי חיתוך ובדיקה לפני ייצור.`,
        elementId: el.id,
      });
    }
  }

  const colors = new Set(design.elements.map((e) => e.colorId));
  if (colors.size > 1)
    checks.push({ level: "info", message: `${colors.size} צבעים = ${colors.size} שכבות ויניל שמודבקות זו לצד זו.` });

  if (!checks.some((c) => c.level === "error" || c.level === "warn" || c.level === "review"))
    checks.unshift({ level: "ok", message: "העיצוב עובר את הבדיקה המקדימה." });

  return checks;
}

export const blocksCheckout = (checks: PreflightCheck[]) => checks.some((c) => c.level === "error");
