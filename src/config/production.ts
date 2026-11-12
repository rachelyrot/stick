/**
 * הגדרות ייצור — מכונה, חומרים וצבעי ויניל שבמלאי.
 * בעתיד ינוהלו מממשק הניהול (מסד נתונים). כרגע: מקור אמת יחיד בקוד.
 * להוספת צבע: שורה ב-VINYL_COLORS + הוספת ה-id לחומר המתאים ב-MATERIALS.
 */

export type VinylFinish = "matte" | "gloss" | "metallic" | "holographic";

export interface VinylColor {
  id: string;
  name: string;
  /** השם המקורי של הספק */
  supplierName?: string;
  hex: string;
  finish: VinylFinish;
  inStock: boolean;
  /** גרדיאנט להמחשת גימור מטאלי / איירידסנט */
  gradient?: string[];
  /** תמונת מרקם אמיתית של הויניל (public/vinyl) — ממלאת את האותיות בתצוגה */
  texture?: string;
}

export interface Material {
  id: string;
  name: string;
  short: string;
  description: string;
  finish: VinylFinish;
  priceFactor: number;
  active: boolean;
  colorIds: string[];
  care: string;
  surfaces: string[];
}

/** ברירת המחדל. המלאי בפועל נטען מהמסד (עריכה בממשק הניהול) אל המערכים VINYL_COLORS / MATERIALS. */
export const DEFAULT_VINYL_COLORS: VinylColor[] = [
  { id: "white", name: "לבן", hex: "#FFFFFF", finish: "gloss", inStock: true },
  { id: "red", name: "אדום", hex: "#C8102E", finish: "gloss", inStock: true },
  { id: "black", name: "שחור", hex: "#1D1B1A", finish: "gloss", inStock: true },
  {
    id: "rosegold",
    name: "רוז גולד מטאלי",
    supplierName: "Metal Rose Gold",
    hex: "#C08A78",
    finish: "metallic",
    inStock: true,
    gradient: ["#9A6553", "#EBC1B0", "#B87D69", "#F5D5C8", "#A06B59"],
  },
  {
    id: "iri-green",
    name: "ירוק איירידסנט",
    supplierName: "Iridescent Green",
    hex: "#4FB89A",
    finish: "holographic",
    inStock: true,
    gradient: ["#2E9E86", "#9BE3C1", "#5CC0B5", "#D8F2A8", "#3AA78F"],
  },
  {
    id: "iri-rosered",
    name: "ורוד-אדום איירידסנט",
    supplierName: "Iridescent Rose Red",
    hex: "#E0336E",
    finish: "holographic",
    inStock: true,
    gradient: ["#C2185B", "#FF6F9C", "#B23AC4", "#FF9FB8", "#E0336E"],
  },
  {
    id: "iri-gold",
    name: "זהב איירידסנט",
    supplierName: "Iridescent Gold",
    hex: "#D4A63E",
    finish: "holographic",
    inStock: true,
    gradient: ["#B3832A", "#F7E08A", "#E6A86B", "#FFF2B8", "#C49A35"],
  },
  {
    id: "iri-blue",
    name: "כחול איירידסנט",
    supplierName: "Iridescent Blue",
    hex: "#3E7FE0",
    finish: "holographic",
    inStock: true,
    gradient: ["#2559C9", "#7FB6FF", "#36C2D9", "#B8D9FF", "#2F6FE0"],
  },
  {
    id: "iri-blue-vt",
    name: "כחול-סגול איירידסנט",
    supplierName: "Iridescent Blue VT",
    hex: "#6A4FD6",
    finish: "holographic",
    inStock: true,
    gradient: ["#3B2A9E", "#7FA2FF", "#9B4FE0", "#C6B8FF", "#4B3FC4"],
  },
  {
    id: "holo-pink-teal",
    name: "קשת טורקיז-ורוד",
    supplierName: "Cyan-Pink Rainbow",
    hex: "#B45BC8",
    finish: "holographic",
    inStock: true,
    gradient: ["#2FD6C4", "#F0558A", "#9B4FD1", "#2FD6C4"],
    texture: "/vinyl/holo-pink-teal.jpg",
  },
  {
    id: "rainbow-glitter",
    name: "קשת",
    supplierName: "Rainbow",
    hex: "#4FA0E0",
    finish: "holographic",
    inStock: true,
    gradient: ["#F2453D", "#F7D23E", "#3FC46B", "#3A7BE0", "#B14FD8"],
    texture: "/vinyl/rainbow-glitter.jpg",
  },
  {
    id: "glitter-purple-pink",
    name: "קשת כחולה",
    supplierName: "Blue Rainbow",
    hex: "#8A47D9",
    finish: "holographic",
    inStock: true,
    gradient: ["#3C6BE8", "#9B4FE0", "#F0359B"],
    texture: "/vinyl/glitter-purple-pink.jpg",
  },
];

/** רקע CSS לדוגמית צבע (מרקם → גרדיאנט → צבע אחיד) */
export const swatchCss = (c: VinylColor): string =>
  c.texture ? `url(${c.texture}) center/cover` : c.gradient ? `linear-gradient(135deg, ${c.gradient.join(", ")})` : c.hex;

export const DEFAULT_MATERIALS: Material[] = [
  {
    id: "permanent",
    name: "ויניל קבוע",
    short: "קבוע",
    description: "ויניל איכותי בגימור מבריק עם צבע חד. עמיד למים ולשימוש יומיומי.",
    finish: "gloss",
    priceFactor: 1,
    active: true,
    colorIds: ["black", "white", "red"],
    care: "שטיפת ידיים מומלצת. לא מומלץ למדיח.",
    surfaces: ["זכוכית", "נירוסטה", "קרמיקה מזוגגת", "פלסטיק קשיח", "עץ צבוע/לכה", "חלונות"],
  },
  {
    id: "metallic",
    name: "ויניל מטאלי",
    short: "מטאלי",
    description: "ברק מתכתי יוקרתי ברוז גולד — למתנות, אירועים ומיתוג.",
    finish: "metallic",
    priceFactor: 1.35,
    active: true,
    colorIds: ["rosegold"],
    care: "שטיפת ידיים עדינה. לא לשפשף בספוג מחוספס.",
    surfaces: ["זכוכית", "קופסאות מתנה", "קרמיקה", "אריזות", "נירוסטה"],
  },
  {
    id: "iridescent",
    name: "ויניל איירידסנט",
    short: "איירידסנט",
    description: "ויניל נוצץ שמשנה גוון לפי זווית האור. בתמונות באתר הגוונים הם המחשה בלבד.",
    finish: "holographic",
    priceFactor: 1.45,
    active: true,
    colorIds: ["iri-green", "iri-rosered", "iri-gold", "iri-blue", "iri-blue-vt"],
    care: "שטיפת ידיים עדינה. לא לשפשף בספוג מחוספס.",
    surfaces: ["זכוכית", "בקבוקים", "ספלים", "מחשבים ניידים", "קופסאות מתנה"],
  },
  {
    id: "glitter",
    name: "ויניל קשת",
    short: "קשת",
    description: "ויניל נוצץ עם מעברי צבעי קשת. כל מדבקה ייחודית — הגוונים משתנים לפי המקום שנחתך בגליל.",
    finish: "holographic",
    priceFactor: 1.5,
    active: true,
    colorIds: ["holo-pink-teal", "rainbow-glitter", "glitter-purple-pink"],
    care: "שטיפת ידיים עדינה. לא לשפשף בספוג מחוספס.",
    surfaces: ["בקבוקים", "ספלים", "קופסאות", "מחברות", "מחשבים ניידים", "מתנות"],
  },
];

/**
 * פרופיל מכונה.
 * Cricut Explore 3 עם ויניל רגיל על משטח 12×12 אינץ' (30.5 ס"מ). הלוח בסטודיו: 30×30 ס"מ.
 */
export const MACHINE = {
  model: "Cricut Explore 3",
  maxWidthCm: 30,
  maxHeightCm: 30,
  minSizeCm: 2,
  /** גובה אות מינימלי מומלץ (מ"מ) לניקוי (weeding) נוח */
  minLetterHeightMm: 7,
  /** גובה אות מינימלי לגופנים דקים / כתב יד */
  minThinFontLetterHeightMm: 14,
  transferTape: true,
} as const;

export const DEFAULT_MATERIAL = "metallic";
export const DEFAULT_COLOR = "rosegold";

/* ---------- המלאי הפעיל ---------- */

export interface Catalog {
  colors: VinylColor[];
  materials: Material[];
}

/** המערכים הפעילים — מתעדכנים במקום (applyCatalog) כך שכל האתר רואה את המלאי העדכני */
export const VINYL_COLORS: VinylColor[] = [...DEFAULT_VINYL_COLORS];
export const MATERIALS: Material[] = [...DEFAULT_MATERIALS];
export const DEFAULT_CATALOG: Catalog = { colors: DEFAULT_VINYL_COLORS, materials: DEFAULT_MATERIALS };

let appliedKey = "";
export function applyCatalog(c: Catalog) {
  const key = JSON.stringify(c);
  if (key === appliedKey) return;
  appliedKey = key;
  VINYL_COLORS.splice(0, VINYL_COLORS.length, ...c.colors);
  MATERIALS.splice(0, MATERIALS.length, ...c.materials);
}

const FALLBACK_COLOR: VinylColor = { id: "unknown", name: "צבע שהוסר", hex: "#9A8F84", finish: "matte", inStock: false };

export const getColor = (id: string): VinylColor => VINYL_COLORS.find((c) => c.id === id) ?? DEFAULT_VINYL_COLORS.find((c) => c.id === id) ?? FALLBACK_COLOR;

export const getMaterial = (id: string): Material => MATERIALS.find((m) => m.id === id) ?? MATERIALS[0];

/** החומר שמכיל צבע מסוים */
export const materialForColor = (colorId: string): Material | undefined => MATERIALS.find((m) => m.active && m.colorIds.includes(colorId));

export const colorsForMaterial = (materialId: string): VinylColor[] => getMaterial(materialId).colorIds.map(getColor);
