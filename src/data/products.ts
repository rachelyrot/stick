import type { Design, ShapeElement, TextElement } from "@/lib/design/types";
import { quote } from "@/lib/pricing/engine";
import { designQuoteInput, type PricingConfig } from "@/lib/pricing/engine";

/**
 * קטלוג מוצרים לדוגמה. כל מוצר מגיע עם תבנית עיצוב עריכה (נתונים, לא תמונה),
 * כך שניתן לפתוח אותו בסטודיו ולהתאים אישית.
 */
export interface Product {
  slug: string;
  name: string;
  category: "names" | "branding" | "home" | "gifts" | "ready";
  short: string;
  description: string;
  uses: string[];
  shapeType: "text" | "logo";
  packs: boolean;
  template: Design;
  sizes: { label: string; widthMm: number }[];
  mockups: string[];
  personalize?: { elementId: string; label: string; placeholder: string; maxLength: number };
  badge?: string;
  popular?: boolean;
  defaultQty: number;
}

const T = (id: string, text: string, fontId: string, fontSize: number, x: number, y: number, colorId: string, extra: Partial<TextElement> = {}): TextElement => ({
  id,
  type: "text",
  text,
  fontId,
  fontSize,
  letterSpacing: 0,
  lineHeight: 1.1,
  x,
  y,
  rotation: 0,
  colorId,
  ...extra,
});

const S = (id: string, shapeId: string, x: number, y: number, w: number, h: number, colorId: string, rotation = 0): ShapeElement => ({
  id,
  type: "shape",
  shapeId,
  x,
  y,
  width: w,
  height: h,
  rotation,
  colorId,
});

const D = (name: string, widthMm: number, heightMm: number, materialId: string, elements: Design["elements"], sourceProduct: string): Design => ({
  schema: 1,
  id: `tpl_${sourceProduct}`,
  name,
  widthMm,
  heightMm,
  materialId,
  elements,
  sourceProduct,
  updatedAt: 0,
});

export const PRODUCTS: Product[] = [
  {
    slug: "name-script",
    name: "שם בכתב יד",
    category: "names",
    short: "שם אישי בכתב מחובר — לבקבוק, לספל או לקופסה",
    description:
      "השם שלכם בכתב יד זורם ואלגנטי, נחתך אות אחר אות בדיוק לפי קווי המתאר. בלי רקע, בלי מסגרת — רק השם, כאילו נכתב על החפץ.",
    uses: ["bottle", "mug", "lunchbox", "gift"],
    shapeType: "text",
    packs: false,
    template: D("שם בכתב יד", 100, 42, "metallic", [T("name", "Maya", "dancing", 34, 50, 21, "rosegold")], "name-script"),
    sizes: [
      { label: "S", widthMm: 70 },
      { label: "M", widthMm: 100 },
      { label: "L", widthMm: 140 },
    ],
    mockups: ["bottle", "mug", "lunchbox"],
    personalize: { elementId: "name", label: "השם שלכם (באנגלית)", placeholder: "Maya", maxLength: 16 },
    badge: "רב מכר",
    popular: true,
    defaultQty: 1,
  },
  {
    slug: "name-hebrew",
    name: "שם בעברית · קלאסי",
    category: "names",
    short: "אותיות סריף עבריות, נקיות ומדויקות",
    description: "טיפוגרפיה עברית קלאסית עם נוכחות. מושלם לבקבוקים, צנצנות, מחברות ומתנות אישיות.",
    uses: ["bottle", "jar", "lunchbox", "gift"],
    shapeType: "text",
    packs: false,
    template: D("שם בעברית", 90, 40, "iridescent", [T("name", "נועה", "frank", 30, 45, 20, "iri-blue")], "name-hebrew"),
    sizes: [
      { label: "S", widthMm: 60 },
      { label: "M", widthMm: 90 },
      { label: "L", widthMm: 130 },
    ],
    mockups: ["bottle", "jar", "mug"],
    personalize: { elementId: "name", label: "השם שלכם", placeholder: "נועה", maxLength: 14 },
    popular: true,
    defaultQty: 1,
  },
  {
    slug: "lunchbox-name",
    name: "שם לקופסת אוכל",
    category: "names",
    short: "שם עגול וידידותי — לגן ולבית הספר",
    description: "שם עמיד לקופסאות אוכל ובקבוקים לגן ולבית הספר. גופן עגול שקל לקרוא.",
    uses: ["lunchbox", "bottle"],
    shapeType: "text",
    packs: true,
    template: D(
      "שם לקופסת אוכל",
      90,
      36,
      "permanent",
      [T("name", "יונתן", "rubik", 26, 45, 18, "red")],
      "lunchbox-name"
    ),
    sizes: [
      { label: "S", widthMm: 80 },
      { label: "M", widthMm: 110 },
      { label: "L", widthMm: 150 },
    ],
    mockups: ["lunchbox", "bottle"],
    personalize: { elementId: "name", label: "שם הילד/ה", placeholder: "יונתן", maxLength: 12 },
    defaultQty: 3,
  },
  {
    slug: "pantry-label",
    name: "תווית למזווה",
    category: "home",
    short: "מילה אחת שעושה סדר — קמח, סוכר, אורז",
    description: "תוויות מינימליסטיות לצנצנות ולכלי אחסון. מזמינים כמה יחד ויוצרים מזווה אחיד ומעוצב.",
    uses: ["jar"],
    shapeType: "text",
    packs: true,
    template: D("תווית למזווה", 80, 30, "permanent", [T("word", "קמח", "frank", 22, 40, 15, "black", { letterSpacing: 0.08 })], "pantry-label"),
    sizes: [
      { label: "S", widthMm: 60 },
      { label: "M", widthMm: 80 },
      { label: "L", widthMm: 110 },
    ],
    mockups: ["jar", "lunchbox"],
    personalize: { elementId: "word", label: "מה בצנצנת?", placeholder: "קמח", maxLength: 12 },
    popular: true,
    defaultQty: 6,
  },
  {
    slug: "drawer-label",
    name: "תווית למגירה",
    category: "home",
    short: "Socks, Towels, צעצועים — סדר אלגנטי",
    description: "כיתוב עדין לשידות, מגירות וארונות. מתאים לחדרי ילדים, חדרי רחצה ומטבחים.",
    uses: ["furniture"],
    shapeType: "text",
    packs: true,
    template: D("תווית למגירה", 120, 26, "metallic", [T("word", "SOCKS", "cormorant", 20, 60, 13, "rosegold", { letterSpacing: 0.3 })], "drawer-label"),
    sizes: [
      { label: "S", widthMm: 90 },
      { label: "M", widthMm: 120 },
      { label: "L", widthMm: 160 },
    ],
    mockups: ["dresser"],
    personalize: { elementId: "word", label: "הכיתוב", placeholder: "SOCKS", maxLength: 14 },
    defaultQty: 3,
  },
  {
    slug: "family-door",
    name: "שלט משפחה לדלת",
    category: "home",
    short: "שם המשפחה בזהב איירידסנט, ישירות על הדלת",
    description: "שלט כניסה בלי שלט: האותיות נחתכות ונדבקות ישירות על הדלת.",
    uses: ["furniture"],
    shapeType: "text",
    packs: false,
    template: D(
      "שלט משפחה לדלת",
      240,
      70,
      "iridescent",
      [T("name", "משפחת לוי", "frank", 42, 120, 35, "iri-gold")],
      "family-door"
    ),
    sizes: [
      { label: "M", widthMm: 200 },
      { label: "L", widthMm: 240 },
      { label: "XL", widthMm: 280 },
    ],
    mockups: ["door"],
    personalize: { elementId: "name", label: "שם המשפחה", placeholder: "משפחת לוי", maxLength: 18 },
    badge: "חדש",
    popular: true,
    defaultQty: 1,
  },
  {
    slug: "mug-good-morning",
    name: "בוקר טוב · לספל",
    category: "ready",
    short: "עיצוב מוכן: כיתוב לבוקר טוב",
    description: "עיצוב מוכן להזמנה מיידית — או לשינוי בסטודיו. נראה מעולה על ספלים, צנצנות קפה ומגשים.",
    uses: ["mug", "jar"],
    shapeType: "text",
    packs: false,
    template: D(
      "בוקר טוב",
      75,
      30,
      "permanent",
      [T("text", "בוקר טוב", "suez", 14, 37.5, 15, "red")],
      "mug-good-morning"
    ),
    sizes: [
      { label: "S", widthMm: 70 },
      { label: "M", widthMm: 90 },
    ],
    mockups: ["mug", "jar"],
    defaultQty: 1,
  },
  {
    slug: "business-logo",
    name: "לוגו לעסק",
    category: "branding",
    short: "מונוגרמה במסגרת עגולה — לאריזות ושקיות",
    description:
      "לוגו בסגנון חותמת שמתאים לכל אריזה. אפשר להתחיל מהתבנית, או להעלות את הלוגו שלכם בסטודיו — הקובץ ייבדק ויוכן לחיתוך לפני ייצור.",
    uses: ["packaging", "window"],
    shapeType: "logo",
    packs: true,
    template: D(
      "לוגו לעסק",
      90,
      90,
      "permanent",
      [
        S("ring", "ring", 45, 45, 86, 86, "black"),
        T("brand", "OLIVE & CO", "cormorant", 9.5, 45, 43, "black", { letterSpacing: 0.06 }),
        S("leaf", "branch", 45, 58, 40, 9, "black"),
        T("est", "EST. 2026", "montserrat", 4.6, 45, 28, "black", { letterSpacing: 0.3 }),
      ],
      "business-logo"
    ),
    sizes: [
      { label: "S", widthMm: 50 },
      { label: "M", widthMm: 70 },
      { label: "L", widthMm: 90 },
    ],
    mockups: ["bag", "kraft-box", "window"],
    personalize: { elementId: "brand", label: "שם העסק", placeholder: "OLIVE & CO", maxLength: 16 },
    badge: "לעסקים",
    popular: true,
    defaultQty: 50,
  },
  {
    slug: "thank-you-label",
    name: "תודה שקניתם אצלנו",
    category: "branding",
    short: "מדבקת מיתוג לאריזות משלוח",
    description: "הרגע שבו הלקוח פותח את החבילה. כיתוב חם, בכמויות לעסקים.",
    uses: ["packaging", "gift"],
    shapeType: "text",
    packs: true,
    template: D(
      "תודה שקניתם",
      85,
      24,
      "metallic",
      [T("text", "תודה שקניתם אצלנו", "frank", 11, 42.5, 12, "rosegold")],
      "thank-you-label"
    ),
    sizes: [
      { label: "S", widthMm: 70 },
      { label: "M", widthMm: 100 },
    ],
    mockups: ["kraft-box", "bag"],
    defaultQty: 50,
  },
  {
    slug: "gift-mazal-tov",
    name: "מזל טוב · למתנה",
    category: "gifts",
    short: "כיתוב חגיגי בזהב איירידסנט",
    description: "להפוך קופסת מתנה פשוטה למתנה מעוצבת. מתאים ללידה, יום הולדת, חתונה ובר/בת מצווה.",
    uses: ["gift", "packaging"],
    shapeType: "text",
    packs: true,
    template: D(
      "מזל טוב",
      100,
      40,
      "iridescent",
      [T("text", "מזל טוב", "frank", 26, 50, 20, "iri-gold")],
      "gift-mazal-tov"
    ),
    sizes: [
      { label: "S", widthMm: 80 },
      { label: "M", widthMm: 110 },
      { label: "L", widthMm: 150 },
    ],
    mockups: ["kraft-box", "bag"],
    badge: "איירידסנט",
    popular: true,
    defaultQty: 1,
  },
  {
    slug: "kids-room",
    name: "שם לחדר ילדים",
    category: "gifts",
    short: "שם התינוק/ת — לדלת או לשידה",
    description: "מתנת לידה מרגשת: שם התינוק/ת בכתב עגול, בצבעים רכים.",
    uses: ["furniture", "wall", "gift"],
    shapeType: "text",
    packs: false,
    template: D(
      "חדר ילדים",
      120,
      70,
      "iridescent",
      [T("name", "Lia", "pacifico", 44, 60, 35, "iri-rosered")],
      "kids-room"
    ),
    sizes: [
      { label: "M", widthMm: 140 },
      { label: "L", widthMm: 180 },
      { label: "XL", widthMm: 240 },
    ],
    mockups: ["door", "dresser", "wall"],
    personalize: { elementId: "name", label: "השם", placeholder: "Lia", maxLength: 12 },
    defaultQty: 1,
  },
  {
    slug: "tissue-box",
    name: "כיתוב לקופסת טישו",
    category: "home",
    short: "״לבריאות!״ — או כל מילה אחרת",
    description: "נגיעה של הומור ואופי לקופסת הטישו בסלון או בחדר הרחצה. מתאים לקופסאות מעץ, קרמיקה, פלסטיק וקרטון קשיח.",
    uses: ["home-items", "gift"],
    shapeType: "text",
    packs: false,
    template: D(
      "קופסת טישו",
      140,
      45,
      "permanent",
      [T("text", "לבריאות!", "frank", 30, 70, 22.5, "white")],
      "tissue-box"
    ),
    sizes: [
      { label: "S", widthMm: 120 },
      { label: "M", widthMm: 160 },
      { label: "L", widthMm: 200 },
    ],
    mockups: ["tissue-box"],
    personalize: { elementId: "text", label: "הכיתוב", placeholder: "לבריאות!", maxLength: 16 },
    badge: "חדש",
    defaultQty: 1,
  },
  {
    slug: "hairbrush-name",
    name: "שם למברשת שיער",
    category: "names",
    short: "שם קטן ומתוק על גב המברשת",
    description: "לכל אחת המברשת שלה. שם בכתב יד על גב המברשת — מתנה קטנה לבנות, לאחיות ולחברות.",
    uses: ["home-items", "gift"],
    shapeType: "text",
    packs: true,
    template: D("שם למברשת", 80, 32, "permanent", [T("name", "Noa", "pacifico", 22, 40, 15, "white")], "hairbrush-name"),
    sizes: [
      { label: "S", widthMm: 60 },
      { label: "M", widthMm: 80 },
      { label: "L", widthMm: 100 },
    ],
    mockups: ["hairbrush"],
    personalize: { elementId: "name", label: "השם", placeholder: "Noa", maxLength: 12 },
    badge: "חדש",
    defaultQty: 1,
  },
  {
    slug: "diffuser-label",
    name: "תווית למפיץ ריח",
    category: "branding",
    short: "שם הניחוח בטיפוגרפיה עדינה — לבית או לעסק",
    description: "תווית אלגנטית לבקבוקי מפיצי ריח, נרות וסבונים. מושלם לעסקים קטנים שמייצרים בעצמם, או לבית שאוהב פרטים.",
    uses: ["home-items", "packaging"],
    shapeType: "text",
    packs: true,
    template: D(
      "מפיץ ריח",
      60,
      20,
      "permanent",
      [T("name", "LAVENDER", "cormorant", 8.5, 30, 10, "white", { letterSpacing: 0.18 })],
      "diffuser-label"
    ),
    sizes: [
      { label: "S", widthMm: 50 },
      { label: "M", widthMm: 60 },
      { label: "L", widthMm: 75 },
    ],
    mockups: ["diffuser"],
    personalize: { elementId: "name", label: "שם הניחוח", placeholder: "LAVENDER", maxLength: 14 },
    badge: "חדש",
    defaultQty: 10,
  },
  {
    slug: "phone-name",
    name: "שם לכיסוי טלפון",
    category: "names",
    short: "שם בכתב יד — על גב הכיסוי",
    description: "הופכים כיסוי פשוט לאישי. מדבקה דקה שנצמדת לכיסוי חלק (סיליקון קשיח, פלסטיק או עור מלאכותי חלק).",
    uses: ["tech", "gift"],
    shapeType: "text",
    packs: false,
    template: D(
      "שם לטלפון",
      50,
      24,
      "iridescent",
      [T("name", "Maya", "pacifico", 15, 25, 12, "iri-rosered")],
      "phone-name"
    ),
    sizes: [
      { label: "S", widthMm: 40 },
      { label: "M", widthMm: 55 },
      { label: "L", widthMm: 70 },
    ],
    mockups: ["phone"],
    personalize: { elementId: "name", label: "השם", placeholder: "Maya", maxLength: 10 },
    badge: "חדש",
    defaultQty: 1,
  },
  {
    slug: "laptop-sticker",
    name: "מדבקה למחשב נייד",
    category: "ready",
    short: "משפט השראה בויניל קשת על המכסה",
    description: "המחשב שלך, עם אמירה. כיתוב גדול בויניל קשת נוצץ שנצמד למכסה המחשב — או כל משפט שתבחרו.",
    uses: ["tech"],
    shapeType: "text",
    packs: false,
    template: D(
      "מדבקה למחשב",
      140,
      40,
      "glitter",
      [T("text", "לחלום בגדול", "suez", 21, 70, 20, "rainbow-glitter")],
      "laptop-sticker"
    ),
    sizes: [
      { label: "S", widthMm: 100 },
      { label: "M", widthMm: 140 },
      { label: "L", widthMm: 180 },
    ],
    mockups: ["laptop"],
    personalize: { elementId: "text", label: "המשפט", placeholder: "לחלום בגדול", maxLength: 18 },
    badge: "חדש",
    defaultQty: 1,
  },
  {
    slug: "keychain-name",
    name: "שם למחזיק מפתחות שקוף",
    category: "gifts",
    short: "שם על אקריליק שקוף — מתנה קטנה ואישית",
    description: "מדבקה קטנה למחזיק מפתחות שקוף מאקריליק. המחזיק עצמו אינו כלול — מדביקים על מחזיק קיים. מומלץ לשמות קצרים.",
    uses: ["tech", "gift"],
    shapeType: "text",
    packs: true,
    template: D("מחזיק מפתחות", 40, 18, "metallic", [T("name", "נועם", "frank", 13, 20, 9, "rosegold")], "keychain-name"),
    sizes: [
      { label: "S", widthMm: 30 },
      { label: "M", widthMm: 40 },
      { label: "L", widthMm: 48 },
    ],
    mockups: ["keychain"],
    personalize: { elementId: "name", label: "השם", placeholder: "נועם", maxLength: 8 },
    badge: "חדש",
    defaultQty: 1,
  },
];

export const getProduct = (slug: string) => PRODUCTS.find((p) => p.slug === slug);

/** סקייל עיצוב לרוחב חדש, תוך שמירה על פרופורציות */
export function scaleDesignToWidth(design: Design, widthMm: number): Design {
  const k = widthMm / design.widthMm;
  if (Math.abs(k - 1) < 0.0001) return design;
  return {
    ...design,
    widthMm: Math.round(design.widthMm * k * 10) / 10,
    heightMm: Math.round(design.heightMm * k * 10) / 10,
    elements: design.elements.map((el) =>
      el.type === "text"
        ? { ...el, x: el.x * k, y: el.y * k, fontSize: el.fontSize * k }
        : { ...el, x: el.x * k, y: el.y * k, width: el.width * k, height: el.height * k }
    ),
  };
}

/**
 * שינוי מידות המדבקה לכל רוחב×גובה. העיצוב מוקטן/מוגדל באופן אחיד (בלי עיוות)
 * כך שייכנס בתוך המידות, וממורכז.
 */
export function resizeDesignTo(design: Design, widthMm: number, heightMm: number): Design {
  const k = Math.min(widthMm / design.widthMm, heightMm / design.heightMm);
  const dx = (widthMm - design.widthMm * k) / 2;
  const dy = (heightMm - design.heightMm * k) / 2;
  return {
    ...design,
    widthMm: Math.round(widthMm * 10) / 10,
    heightMm: Math.round(heightMm * 10) / 10,
    elements: design.elements.map((el) =>
      el.type === "text"
        ? { ...el, x: el.x * k + dx, y: el.y * k + dy, fontSize: el.fontSize * k }
        : { ...el, x: el.x * k + dx, y: el.y * k + dy, width: el.width * k, height: el.height * k }
    ),
  };
}

export function fromPrice(p: Product, cfg?: PricingConfig): number {
  const smallest = Math.min(...p.sizes.map((s) => s.widthMm));
  return quote(designQuoteInput(scaleDesignToWidth(p.template, smallest), 1), cfg).total;
}

export function productColorIds(p: Product): string[] {
  return [...new Set(p.template.elements.map((e) => e.colorId))];
}
