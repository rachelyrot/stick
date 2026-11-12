import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { Container, SectionTitle } from "@/components/ui/primitives";
import { MATERIALS, VINYL_COLORS, MACHINE, swatchCss } from "@/config/production";
import { loadCatalog } from "@/lib/server/catalog-store";

export const metadata: Metadata = { title: "הוראות הדבקה ושאלות נפוצות" };

const STEPS = [
  ["מכינים את המשטח", "מנקים במטלית עם אלכוהול (או מים וסבון) ומייבשים היטב. בלי שומן, אבק או לחות."],
  ["מחליקים את המדבקה", "משפשפים את סרט ההעברה בכרטיס או באצבע, כדי שהאותיות ייצמדו אליו היטב."],
  ["מקלפים את נייר הגב", "באיטיות, בזווית חדה. אם אות נשארת על הגב — מחזירים, משפשפים שוב וממשיכים."],
  ["ממקמים ומדביקים", "מניחים את המדבקה במקום, ומחליקים מהמרכז החוצה בלחץ אחיד כדי להוציא בועות אוויר."],
  ["מסירים את סרט ההעברה", "מקלפים לאט, בזווית כמעט מקבילה למשטח. האותיות נשארות על החפץ."],
  ["נותנים לזה זמן", "ממתינים 48–72 שעות לפני שטיפה או חשיפה למים, עד שהדבק מתייצב לגמרי."],
];

const FAQ = [
  ["מה ההבדל בין ויניל בחיתוך צורני למדבקה מודפסת?", "מדבקה מודפסת היא הדפסה על נייר או ויניל לבן/שקוף, עם רקע ושוליים. בחיתוך צורני המכונה חותכת את הויניל הצבעוני בדיוק לפי קווי המתאר — ועל החפץ נשארות רק האותיות והצורות עצמן, בלי רקע."],
  ["האם החפץ שבתמונה כלול?", "לא. אנחנו מוכרים את המדבקה בלבד. הבקבוקים, הספלים והאריזות בתמונות הם הדמיות להמחשה."],
  ["האם ההדמיה מדויקת בגודל?", "ההדמיה מיועדת להמחשה. המדבקה מיוצרת במידות שבחרתם בסנטימטרים, אבל על תמונה שהעליתם אין לנו את מידות החפץ — לכן קנה המידה בתמונה משוער. מומלץ למדוד את החפץ בסרגל לפני ההזמנה."],
  ["אפשר להעלות לוגו?", "כן — SVG, PNG או JPG. קובץ וקטורי (SVG) הוא הטוב ביותר. תמונות פיקסלים עוברות אצלנו המרה ידנית לקווי חיתוך ובדיקה, ונאשר איתכם את התוצאה לפני הייצור."],
  ["מה הגודל המקסימלי?", `שטח החיתוך של המכונה הוא עד ${MACHINE.maxWidthCm}×${MACHINE.maxHeightCm} ס״מ. לפריטים גדולים יותר — צרו קשר ונבדוק חלוקה למקטעים.`],
  ["מה הגודל המינימלי לאותיות?", `מומלץ גובה אות של ${MACHINE.minLetterHeightMm / 10} ס״מ לפחות, ובגופנים דקים או בכתב יד — ${MACHINE.minThinFontLetterHeightMm / 10} ס״מ. פרטים קטנים מדי קשים לניקוי ולהדבקה. הסטודיו מתריע על כך אוטומטית.`],
  ["אפשר מדיח כלים?", "ויניל קבוע עמיד למים ולשטיפה ידנית. מדיח כלים מקצר משמעותית את חיי המדבקה ואינו מומלץ."],
  ["אפשר כמה צבעים במדבקה אחת?", "כן. כל צבע נחתך כשכבה נפרדת ומודבק לצד האחרות. כל צבע נוסף מוסיף מעט למחיר."],
  ["האם התשלום באתר מאובטח?", "סליקה מאובטחת דרך ספק מורשה נמצאת בפיתוח. פרטי אשראי לעולם לא יישמרו באתר. כרגע ניתן לשמור טיוטת הזמנה בלבד."],
];

export default function FaqPage() {
  loadCatalog();
  return (
    <>
      <PageHeader eyebrow="הדבקה ושאלות" title="מדביקים כמו מקצוענים" sub="שישה צעדים פשוטים, וכל מה שרציתם לדעת על חומרים, גדלים והדמיות." />

      <section id="apply" className="scroll-mt-28">
        <Container>
          <ol className="grid gap-px overflow-hidden rounded-[28px] bg-stone sm:grid-cols-2 lg:grid-cols-3">
            {STEPS.map(([t, d], i) => (
              <li key={t} className="bg-ivory p-8">
                <span className="font-latin text-5xl italic text-olive/40">0{i + 1}</span>
                <h3 className="mt-4 font-display text-2xl">{t}</h3>
                <p className="mt-2 leading-relaxed text-cocoa">{d}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className="py-24">
        <Container className="grid gap-12 lg:grid-cols-[1fr_1.6fr]">
          <SectionTitle eyebrow="שאלות נפוצות" title="שאלנו את עצמנו בשבילכם" />
          <div className="divide-y divide-stone border-y border-stone">
            {FAQ.map(([q, a]) => (
              <details key={q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-xl text-choco [&::-webkit-details-marker]:hidden">
                  {q}
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-stone text-lg transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 max-w-2xl leading-relaxed text-cocoa">{a}</p>
              </details>
            ))}
          </div>
        </Container>
      </section>

      <section id="materials" className="scroll-mt-28 bg-cream py-24">
        <Container>
          <SectionTitle eyebrow="חומרים וצבעים" title="מה יש במלאי" sub="רשימת החומרים והצבעים מנוהלת במערכת — מה שלא מופיע כאן אינו זמין להזמנה." />
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {MATERIALS.map((m) => (
              <article key={m.id} className={`rounded-[24px] bg-ivory p-7 ${m.active ? "" : "opacity-60"}`}>
                <h3 className="font-display text-2xl">{m.name}</h3>
                {!m.active && <p className="mt-1 text-[12px] text-clay">לא זמין כרגע</p>}
                <p className="mt-2 text-[15px] leading-relaxed text-cocoa">{m.description}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {m.colorIds.map((id) => {
                    const c = VINYL_COLORS.find((x) => x.id === id)!;
                    return (
                      <span
                        key={id}
                        title={`${c.name}${c.inStock ? "" : " · חסר"}`}
                        className={`h-7 w-7 rounded-full ring-1 ring-black/10 ${c.inStock ? "" : "opacity-30"}`}
                        style={{ background: swatchCss(c) }}
                      />
                    );
                  })}
                </div>
                <p className="mt-5 text-[13px] text-mocha">{m.care}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
