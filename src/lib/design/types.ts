/**
 * מודל נתוני העיצוב — העיצוב נשמר כנתונים עריכים (לא כתמונה שטוחה).
 * כל המידות במילימטרים, בקואורדינטות של לוח המדבקה (artboard).
 * x/y של כל רכיב = מרכז הרכיב.
 */

interface BaseElement {
  id: string;
  x: number;
  y: number;
  rotation: number;
  colorId: string;
  locked?: boolean;
}

export interface TextElement extends BaseElement {
  type: "text";
  text: string;
  fontId: string;
  /** גודל הגופן (em) במ"מ */
  fontSize: number;
  /** ריווח אותיות ביחידות em */
  letterSpacing: number;
  lineHeight: number;
}

export interface ShapeElement extends BaseElement {
  type: "shape";
  shapeId: string;
  width: number;
  height: number;
}

export interface ImageElement extends BaseElement {
  type: "image";
  /** data URL לאחר בדיקה וניקוי */
  src: string;
  mime: "image/png" | "image/jpeg" | "image/svg+xml";
  fileName: string;
  width: number;
  height: number;
  /** הצגה כצללית בצבע הויניל — המחשה לאופן שבו לוגו נחתך */
  tint: boolean;
}

export type DesignElement = TextElement | ShapeElement | ImageElement;

export interface Design {
  schema: 1;
  id: string;
  name: string;
  /** מידות המדבקה הפיזיות (מ"מ) */
  widthMm: number;
  heightMm: number;
  materialId: string;
  elements: DesignElement[];
  /**
   * fit — המדבקה "עוטפת" את העיצוב, והאורך (הצלע הארוכה) קבוע: טקסט ארוך יותר = אותיות קטנות יותר.
   * box — מידות קבועות (רוחב×גובה) והעיצוב ממורכז בתוכן.
   * sheet — דף שלם 29×29 ס"מ, כמה כיתובים שרוצים, מחיר קבוע.
   */
  sizeMode?: "fit" | "box" | "sheet";
  /** האורך הרצוי במצב fit (מ"מ). 0 = לגזור מחדש מהעיצוב (אחרי הזזה/שינוי גודל ידני, בשני המצבים) */
  lengthMm?: number;
  /** מרכז המדבקה על משטח החיתוך בסטודיו (מ"מ). לא קיים = מרכז המשטח. תצוגה בלבד — לא משפיע על הייצור */
  matCx?: number;
  matCy?: number;
  /** מוצר מקור בקטלוג, אם העיצוב התחיל מתבנית */
  sourceProduct?: string;
  updatedAt: number;
}

/** תיבה תוחמת מקומית (לפני סיבוב) ביחס למרכז הרכיב */
export interface LocalBox {
  x: number;
  y: number;
  w: number;
  h: number;
  /** חתימת המאפיינים שנמדדו — כדי לזהות מדידה ישנה */
  sig?: string;
}

export type BoxMap = Record<string, LocalBox>;
