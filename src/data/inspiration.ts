/**
 * גלריית השראה — כל פריט = הדמיה + תבנית מוצר עם שינויים קטנים.
 * לחיצה מובילה לסטודיו עם אותו עיצוב ואותה הדמיה.
 */
export interface Inspiration {
  id: string;
  title: string;
  caption: string;
  mockup: string;
  product: string;
  text?: string;
  color?: string;
  tag: "פרטי" | "עסקי";
  tall?: boolean;
}

export const INSPIRATION: Inspiration[] = [
  { id: "i1", title: "בקבוק לחדר כושר", caption: "שם בכתב יד ברוז גולד", mockup: "bottle", product: "name-script", text: "Daniel", tag: "פרטי", tall: true },
  { id: "i2", title: "מיתוג שקיות", caption: "לוגו חותמת לחנות בוטיק", mockup: "bag", product: "business-logo", tag: "עסקי" },
  { id: "i3", title: "מזווה מסודר", caption: "תוויות אחידות לצנצנות", mockup: "jar", product: "pantry-label", text: "אורז", tag: "פרטי" },
  { id: "i5", title: "הדלת של המשפחה", caption: "זהב איירידסנט על דלת", mockup: "door", product: "family-door", text: "משפחת כהן", tag: "פרטי", tall: true },
  { id: "i6", title: "קפה של בוקר", caption: "עיצוב מוכן לספל", mockup: "mug", product: "mug-good-morning", tag: "פרטי" },
  { id: "i7", title: "מתנה שמספרת סיפור", caption: "מזל טוב בזהב", mockup: "kraft-box", product: "gift-mazal-tov", tag: "פרטי" },
  { id: "i8", title: "לגן, עם כוכב", caption: "שם עמיד לקופסת אוכל", mockup: "lunchbox", product: "lunchbox-name", text: "אלה", color: "iri-rosered", tag: "פרטי" },
  { id: "i10", title: "אריזת משלוח", caption: "תודה שקניתם — בכמויות", mockup: "kraft-box", product: "thank-you-label", tag: "עסקי" },
  { id: "i11", title: "שידה בחדר הילדים", caption: "כיתוב עדין למגירות", mockup: "dresser", product: "drawer-label", text: "TOYS", tag: "פרטי" },
  { id: "i13", title: "לבריאות!", caption: "קופסת טישו עם הומור", mockup: "tissue-box", product: "tissue-box", tag: "פרטי" },
  { id: "i14", title: "ניחוח עם מותג", caption: "תוויות לעסק של נרות ומפיצי ריח", mockup: "diffuser", product: "diffuser-label", text: "VANILLA", tag: "עסקי", tall: true },
  { id: "i15", title: "המברשת של נועה", caption: "שם קטן, הבדל גדול", mockup: "hairbrush", product: "hairbrush-name", text: "Noa", tag: "פרטי" },
  { id: "i16", title: "הטלפון של מאיה", caption: "שם בכתב יד, איירידסנט", mockup: "phone", product: "phone-name", tag: "פרטי", tall: true },
  { id: "i17", title: "מחשב עם אמירה", caption: "ויניל קשת על המכסה", mockup: "laptop", product: "laptop-sticker", tag: "פרטי" },
  { id: "i18", title: "מפתחות עם שם", caption: "רוז גולד על אקריליק שקוף", mockup: "keychain", product: "keychain-name", tag: "פרטי" },
  { id: "i12", title: "כוס קרה, שם חם", caption: "לבן על זכוכית", mockup: "glass", product: "name-script", text: "Noa", color: "white", tag: "פרטי" },
];
