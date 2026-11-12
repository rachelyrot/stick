# Stick בצ׳יק — אתר וסטודיו למדבקות ויניל בחיתוך צורני

Next.js 15 · React 19 · TypeScript · Tailwind CSS 4. עברית מלאה, RTL.

## הפעלה

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

## התחברות, הזמנות וניהול

- לקוחות מתחברים עם **Google**. בלי התחברות אפשר לעצב ולמלא סל, אבל לא לשלוח הזמנה.
- הזמנה נשמרת במסד נתונים (`data/stick.db`). השרת מחשב את המחיר מחדש ולא סומך על הדפדפן.
- אחרי הזמנה נשלח **אישור במייל ללקוח/ה** והתראה למנהלת. כל שינוי סטטוס יכול לשלוח עדכון במייל.
- `/account/orders`: ההזמנות של הלקוח/ה. `/admin`: ממשק ניהול, פתוח רק למיילים שב-`ADMIN_EMAILS`.
- התשלום עדיין לא מקוון: מתאמים אותו אישית אחרי אישור העיצוב.
- תמונות של חפצים שמעלים להדמיה:
  - **מחוברים:** נשמרות בחשבון (`data/mockup-photos` + טבלת `mockup_photos`), יחד עם הכיול, וזמינות מכל מכשיר. רק הבעלים יכולים לראות אותן.
  - **לא מחוברים:** נשמרות בדפדפן (IndexedDB). אחרי התחברות הן עוברות לחשבון אוטומטית.

כל ההגדרות נמצאות בקובץ `.env.local`. אחרי כל שינוי בו צריך לעצור את השרת ולהפעיל אותו מחדש (`npm run dev`).

### הגדרת Google (התחברות)
1. נכנסים ל-https://console.cloud.google.com ויוצרים פרויקט חדש (למשל "Stick").
2. **APIs & Services → OAuth consent screen**: בוחרים External וממלאים שם אפליקציה ומייל. ב-Audience מוסיפים את עצמך כ-Test user (או לוחצים Publish).
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application**
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
4. מעתיקים את Client ID ואת Client secret לשדות `GOOGLE_CLIENT_ID` ו-`GOOGLE_CLIENT_SECRET` ב-`.env.local`.
5. כשהאתר יעלה לכתובת אמיתית, מוסיפים גם אותה (origin ו-redirect) ומעדכנים את `NEXTAUTH_URL`.

### הגדרת Gmail (שליחת מיילים)
1. בחשבון Google של העסק מפעילים **אימות דו-שלבי**: https://myaccount.google.com/security
2. יוצרים **סיסמת אפליקציה**: https://myaccount.google.com/apppasswords (שם: Stick). מקבלים 16 תווים.
3. ב-`.env.local` ממלאים `GMAIL_USER=הכתובת@gmail.com` ו-`GMAIL_APP_PASSWORD=` עם 16 התווים, בלי רווחים.

### כניסת בדיקה
`DEV_LOGIN=true` מוסיף לעמוד ההתחברות כניסה עם כל מייל, כדי לבדוק לפני שמגדירים את Google. הכניסה פועלת רק במחשב הפיתוח, ובאתר החי היא כבויה אוטומטית.

## עמודים

| נתיב | תיאור |
|---|---|
| `/` | עמוד הבית: Hero עם אנימציית חיתוך, מסלולים, קטגוריות, חיתוך צורני מול מודפס, השראה, מוצרים, עסקים |
| `/catalog` | קטלוג עם סינון (סוג, שימוש, צורה, גודל, כמות, חומר, צבע). הסינון נשמר ב-URL |
| `/product/[slug]` | עמוד מוצר: התאמה חיה (טקסט, צבע, גודל, כמות), גלריית הדמיות, מחיר דינמי |
| `/studio` | **סטודיו העיצוב**: שלב 1 עיצוב, שלב 2 הדמיה |
| `/inspiration` | גלריית השראה. כל פריט נפתח בסטודיו |
| `/cart`, `/checkout` | סל (localStorage), ושליחת הזמנה אחרי התחברות עם Google |
| `/login` | התחברות |
| `/account/orders` | ההזמנות שלי + סטטוס |
| `/faq`, `/about`, `/business` | הוראות הדבקה, חומרים, אודות + יצירת קשר, עסקים |
| `/admin` | ניהול (רק מנהלות): נתוני מכירות, הזמנות לפי סטטוס, עדכון סטטוס עם מייל ללקוח/ה, הערות פנימיות, הורדת קובצי חיתוך |

פרמטרים לסטודיו: `?template=<slug>&text=&color=&w=<mm>&mockup=<id>&step=mockup`, `?start=blank|upload`, `?edit=<cartItemId>`.

## מבנה

```
src/
  config/          brand.ts · production.ts (מכונה, חומרים, צבעים, מלאי) · fonts.ts · pricing.json
  data/            products (תבניות עיצוב עריכות) · categories · mockups · inspiration
  lib/
    design/        מודל נתונים (types), factory, geometry, shapes, useHistory (undo/redo)
    pricing/       מנוע תמחור. כל הפרמטרים מגיעים מ-pricing.json
    production/    preflight (בדיקת התאמה לייצור) · export-svg (קובץ עבודה במ"מ, שכבה לכל צבע)
    render/        רינדור Canvas לתמונות ממוזערות ולייצוא הדמיה (PNG/JPG)
    uploads/       אימות לפי magic bytes, הגבלת גודל, ניקוי SVG, הקטנת תמונות
    cart/, orders/ סל וטיוטות הזמנה (מקומי)
    mockup/        ממשק עתידי ל-AI: רקע בלבד. המדבקה נשארת שכבה נפרדת
  components/      UI, layout, DesignSvg/MockupPreview (רינדור המדבקה ללא רקע)
  features/        studio · catalog · cart · admin · contact
public/mockups/    סצנות הדמיה וקטוריות. להוספת חפץ: קובץ + שורה ב-data/mockups.ts
```

### עקרונות
- **שלוש שכבות נפרדות:** נתוני עיצוב (JSON עריך, מידות במ"מ) ← קובץ ייצור (SVG במידות אמיתיות) ← תמונת הדמיה (להמחשה בלבד).
- המדבקה מוצגת תמיד ללא רקע. רק הרכיבים שהלקוח בחר.
- גודל מדבקה מרבי: 29×29 ס"מ (Cricut Explore 3, משטח 12×12) (`MACHINE` ב-`src/config/production.ts`).
- צבעים, חומרים ומלאי מוגדרים במפורש. צבע שחסר במלאי או חומר לא פעיל חוסמים הוספה לסל.

## מגבלות ידועות / השלבים הבאים
- **קובץ הייצור הוא טיוטה:** הטקסט נשמר כ-`<text>` ועדיין לא הומר לקווי מתאר (מתוכנן עם opentype.js). צריך לבדוק ייבוא ל-Cricut Design Space בפועל.
- תמונות PNG/JPG מסומנות לבדיקה ידנית. המרה אוטומטית לווקטור עוד לא מומשה.
- עלייה לאוויר: SQLite מתאים לשרת אחד. באחסון ענן (Vercel וכדומה) צריך לעבור ל-Postgres. כל הגישה למסד הנתונים מרוכזת ב-`src/lib/server/orders-repo.ts`.
- עוד לא נבנו: ספק סליקה, ועריכה של מחירון ומלאי מתוך ממשק הניהול.
- הדמיות: פרספקטיבה, עיוות למשטחים מעוגלים, תאורה, קנה מידה אמיתי, ורקע AI (הממשק מוכן ומסומן "בקרוב").
- פרטי הקשר ב-`src/config/brand.ts` הם לדוגמה.
