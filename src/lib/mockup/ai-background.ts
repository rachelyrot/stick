/**
 * תשתית עתידית: יצירת רקע להדמיה באמצעות AI.
 *
 * עקרון מפתח: ה-AI יוצר *רק את תמונת הרקע* (החפץ/הסביבה).
 * המדבקה עצמה לעולם אינה עוברת דרך מודל התמונה — היא נשארת שכבה וקטורית נפרדת,
 * כך שהעיצוב והמידות לייצור לא משתנים.
 *
 * אין כרגע אינטגרציה פעילה, ולכן הממשק מוצג כ"בקרוב" ואינו מדמה תוצאה.
 */

export interface AiBackgroundRequest {
  prompt: string;
  aspect: "4:3" | "1:1" | "3:4";
}

export interface AiBackgroundProvider {
  readonly available: boolean;
  generate(req: AiBackgroundRequest): Promise<{ imageUrl: string }>;
}

export const aiBackgroundProvider: AiBackgroundProvider = {
  available: false,
  async generate() {
    throw new Error("יצירת רקע AI אינה זמינה עדיין. תחובר דרך נקודת קצה מאובטחת בצד השרת.");
  },
};

export const AI_PROMPT_EXAMPLES = [
  "בקבוק נירוסטה בגוון שמנת על שולחן עץ בהיר",
  "קופסת קרטון חומה על מדף לבן, אור בוקר רך",
  "צנצנת זכוכית עם עדשים במזווה כפרי",
  "ספל קרמיקה ירוק זית ליד חלון",
];
