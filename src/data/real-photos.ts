/**
 * תמונות שמוצגות במעבר עכבר מעל ההדמיה — בכל האתר (קטלוג, השראה, עמוד הבית).
 * להוספה: שמים את הקובץ ב-public/real ומוסיפים שורה כאן, תחת ה-id של ההדמיה (מ-mockups.ts).
 * אפשר כמה תמונות לאותו חפץ: אם בעיצוב יש עברית — תוצג תמונה עם lang: "he", אחרת תמונה עם lang: "latin".
 * מומלץ תמונה רוחבית 4:3 (למשל 1200×900) — כמו ההדמיות, כדי שלא ייחתך כלום.
 * bg — צבע הרקע של התמונה (למקרה שהיא נטענת לאט).
 */
import type { Design } from "@/lib/design/types";

export interface RealPhoto {
  src: string;
  alt: string;
  caption: string;
  bg: string;
  lang?: "he" | "latin";
}

// זמני — הדמיות ממוחשבות, להחליף בצילומים אמיתיים
export const REAL_PHOTOS: Record<string, RealPhoto[]> = {
  bottle: [
    { src: "/real/bottle.jpg", alt: "בקבוק שתייה ורוד עם מדבקת השם Maya", caption: "דוגמה · Maya על בקבוק ורוד", bg: "#f6efe8", lang: "latin" },
    { src: "/real/bottle-he.jpg", alt: "בקבוק נירוסטה שחור עם מדבקת השם שירה ברוז גולד", caption: "דוגמה · שירה ברוז גולד", bg: "#f6efe8", lang: "he" },
  ],
  lunchbox: [
    { src: "/real/lunchbox.jpg", alt: "קופסת אוכל ירוקה מנומרת עם השם Emma בוויניל ירוק כהה על המכסה", caption: "דוגמה · Emma על קופסת אוכל", bg: "#f6efe8" },
  ],
  "tissue-box": [
    { src: "/real/tissue-box.jpg", alt: "קופסת טישו מאקריליק שקוף עם מדבקת השם Levi בזהב", caption: "דוגמה · Levi בזהב על קופסת טישו", bg: "#f6efe8" },
  ],
};

const HEBREW = /[֐-׿]/;
const isHebrew = (design?: Design) => !!design?.elements.some((e) => e.type === "text" && HEBREW.test(e.text));

export function getRealPhoto(mockupId: string, design?: Design): RealPhoto | undefined {
  const list = REAL_PHOTOS[mockupId];
  if (!list?.length) return undefined;
  const lang = isHebrew(design) ? "he" : "latin";
  return list.find((p) => p.lang === lang) ?? list[0];
}
