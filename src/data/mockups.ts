/**
 * ספריית ההדמיות. להוספת חפץ: מוסיפים קובץ ל-public/mockups ושורה כאן.
 * area          — אזור ההדבקה המומלץ, ביחס לגודל התמונה (0..1).
 * objectPx      — רוחב החפץ בתמונה (בפיקסלים, בתמונה ברוחב 1200) באזור ההדבקה.
 * objectWidthCm — רוחב/קוטר ברירת המחדל של החפץ במציאות. הלקוח/ה יכול/ה להזין את המידה של החפץ שלו/ה.
 * round         — חפץ עגול: מדבקה רחבה נעטפת סביבו ולכן נראית צרה יותר.
 */
export interface MockupScene {
  id: string;
  label: string;
  group: "מטבח ושתייה" | "אחסון וארגון" | "אריזה ומיתוג" | "בית ועיצוב" | "טלפון, מחשב ואביזרים";
  src: string;
  width: number;
  height: number;
  area: { cx: number; cy: number; w: number; h: number };
  tone: "light" | "dark";
  objectPx: number;
  objectWidthCm: number;
  round?: boolean;
  /** איך קוראים למידה שהלקוח/ה מזין/ה */
  dimLabel: string;
}

export const MOCKUPS: MockupScene[] = [
  { id: "bottle", label: "בקבוק שתייה", group: "מטבח ושתייה", src: "/mockups/bottle.svg", width: 1200, height: 900, area: { cx: 0.5, cy: 0.58, w: 0.16, h: 0.3 }, tone: "light", objectPx: 240, objectWidthCm: 7.5, round: true, dimLabel: "קוטר הבקבוק" },
  { id: "mug", label: "ספל קרמיקה", group: "מטבח ושתייה", src: "/mockups/mug.svg", width: 1200, height: 900, area: { cx: 0.497, cy: 0.59, w: 0.21, h: 0.24 }, tone: "light", objectPx: 350, objectWidthCm: 8.5, round: true, dimLabel: "קוטר הספל" },
  { id: "glass", label: "כוס זכוכית", group: "מטבח ושתייה", src: "/mockups/glass.svg", width: 1200, height: 900, area: { cx: 0.5, cy: 0.5, w: 0.15, h: 0.18 }, tone: "dark", objectPx: 232, objectWidthCm: 8, round: true, dimLabel: "קוטר הכוס" },
  { id: "jar", label: "צנצנת אחסון", group: "אחסון וארגון", src: "/mockups/jar.svg", width: 1200, height: 900, area: { cx: 0.5, cy: 0.64, w: 0.2, h: 0.17 }, tone: "light", objectPx: 320, objectWidthCm: 11, round: true, dimLabel: "קוטר הצנצנת" },
  { id: "lunchbox", label: "קופסת אוכל", group: "אחסון וארגון", src: "/mockups/lunchbox.svg", width: 1200, height: 900, area: { cx: 0.5, cy: 0.7, w: 0.34, h: 0.2 }, tone: "light", objectPx: 600, objectWidthCm: 20, dimLabel: "רוחב הקופסה" },
  { id: "dresser", label: "שידה ומגירות", group: "אחסון וארגון", src: "/mockups/dresser.svg", width: 1200, height: 900, area: { cx: 0.5, cy: 0.495, w: 0.26, h: 0.075 }, tone: "light", objectPx: 600, objectWidthCm: 85, dimLabel: "רוחב השידה" },
  { id: "kraft-box", label: "קופסת קרטון", group: "אריזה ומיתוג", src: "/mockups/kraft-box.svg", width: 1200, height: 900, area: { cx: 0.5, cy: 0.69, w: 0.34, h: 0.26 }, tone: "light", objectPx: 540, objectWidthCm: 30, dimLabel: "רוחב הקופסה" },
  { id: "bag", label: "שקית נייר", group: "אריזה ומיתוג", src: "/mockups/bag.svg", width: 1200, height: 900, area: { cx: 0.5, cy: 0.6, w: 0.25, h: 0.32 }, tone: "light", objectPx: 380, objectWidthCm: 25, dimLabel: "רוחב השקית" },
  { id: "window", label: "חלון ראווה", group: "אריזה ומיתוג", src: "/mockups/window.svg", width: 1200, height: 900, area: { cx: 0.5, cy: 0.42, w: 0.44, h: 0.3 }, tone: "dark", objectPx: 692, objectWidthCm: 150, dimLabel: "רוחב הזכוכית" },
  { id: "door", label: "דלת", group: "בית ועיצוב", src: "/mockups/door.svg", width: 1200, height: 900, area: { cx: 0.5, cy: 0.33, w: 0.24, h: 0.2 }, tone: "dark", objectPx: 376, objectWidthCm: 80, dimLabel: "רוחב הדלת" },
  { id: "tissue-box", label: "קופסת טישו", group: "בית ועיצוב", src: "/mockups/tissue-box.svg", width: 1200, height: 900, area: { cx: 0.5, cy: 0.69, w: 0.34, h: 0.24 }, tone: "light", objectPx: 540, objectWidthCm: 25, dimLabel: "רוחב הקופסה" },
  { id: "hairbrush", label: "מברשת שיער", group: "בית ועיצוב", src: "/mockups/hairbrush.svg", width: 1200, height: 900, area: { cx: 0.35, cy: 0.51, w: 0.3, h: 0.24 }, tone: "light", objectPx: 492, objectWidthCm: 12, dimLabel: "אורך ראש המברשת" },
  { id: "diffuser", label: "מפיץ ריח", group: "בית ועיצוב", src: "/mockups/diffuser.svg", width: 1200, height: 900, area: { cx: 0.504, cy: 0.68, w: 0.19, h: 0.24 }, tone: "dark", objectPx: 270, objectWidthCm: 7, dimLabel: "רוחב הבקבוקון" },
  { id: "phone", label: "טלפון", group: "טלפון, מחשב ואביזרים", src: "/mockups/phone.svg", width: 1200, height: 900, area: { cx: 0.5, cy: 0.6, w: 0.22, h: 0.3 }, tone: "light", objectPx: 304, objectWidthCm: 7.5, dimLabel: "רוחב הטלפון" },
  { id: "laptop", label: "מחשב נייד", group: "טלפון, מחשב ואביזרים", src: "/mockups/laptop.svg", width: 1200, height: 900, area: { cx: 0.5, cy: 0.49, w: 0.45, h: 0.4 }, tone: "dark", objectPx: 720, objectWidthCm: 31, dimLabel: "רוחב המחשב" },
  { id: "keychain", label: "מחזיק מפתחות שקוף", group: "טלפון, מחשב ואביזרים", src: "/mockups/keychain.svg", width: 1200, height: 900, area: { cx: 0.5, cy: 0.578, w: 0.2, h: 0.2 }, tone: "light", objectPx: 300, objectWidthCm: 5, dimLabel: "קוטר המחזיק" },
  { id: "wall", label: "קיר בסלון", group: "בית ועיצוב", src: "/mockups/wall.svg", width: 1200, height: 900, area: { cx: 0.5, cy: 0.33, w: 0.48, h: 0.3 }, tone: "light", objectPx: 760, objectWidthCm: 200, dimLabel: "רוחב הספה" },
];

export const getMockup = (id: string): MockupScene => MOCKUPS.find((m) => m.id === id) ?? MOCKUPS[0];

/** רוחב המדבקה (יחסי לרוחב התמונה) כך שתיכנס לאזור ההדבקה — לתמונות שיווק */
export function fitWidthInArea(area: MockupScene["area"], bgW: number, bgH: number, designW: number, designH: number) {
  return Math.min(area.w, ((area.h * bgH) / bgW) * (designW / designH));
}

/**
 * כיווץ אופקי של מדבקה שנעטפת על גליל: מדבקה ברוחב w על קוטר D נראית ברוחב D·sin(w/D).
 * מחזיר יחס (0..1) להחלה כ-scaleX.
 */
export function cylinderSquash(widthCm: number, diameterCm?: number): number {
  if (!diameterCm || widthCm <= 0) return 1;
  const a = Math.min(widthCm / diameterCm, Math.PI / 2);
  return Math.min(1, (diameterCm * Math.sin(a)) / widthCm);
}

/** מיקום בקנה מידה אמיתי: רוחב יחסי + כיווץ לגליל */
export function realScale(pxPerCm: number, imgWidth: number, designWidthMm: number, cylinderCm?: number) {
  const wCm = designWidthMm / 10;
  return { width: (wCm * pxPerCm) / imgWidth, scaleX: cylinderSquash(wCm, cylinderCm) };
}

/** קנה מידה לחפץ מהגלריה, לפי המידה שהלקוח/ה הזין/ה (או ברירת המחדל) */
export function mockupScale(m: MockupScene, designWidthMm: number, objectCm?: number) {
  const cm = objectCm && objectCm > 0 ? objectCm : m.objectWidthCm;
  return realScale(m.objectPx / cm, m.width, designWidthMm, m.round ? cm : undefined);
}

export const objectNote = (m: MockupScene, objectCm?: number) => `${m.label} — ${m.dimLabel} ${objectCm && objectCm > 0 ? objectCm : m.objectWidthCm} ס״מ`;
