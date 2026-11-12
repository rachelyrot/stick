import Link from "next/link";
import { ArrowLeft, Lightbulb, PenTool, Upload, Image as ImageIcon, Recycle, Ruler, Scissors, Package } from "lucide-react";
import { Hero } from "@/components/home/Hero";
import { ButtonLink, Container, Eyebrow, SectionTitle } from "@/components/ui/primitives";
import { Reveal } from "@/components/ui/Reveal";
import { MockupPreview } from "@/components/design/MockupPreview";
import { INSPIRATION } from "@/data/inspiration";
import { getProduct } from "@/data/products";
import { personalize } from "@/lib/catalog/personalize";
import { getPricing } from "@/lib/server/pricing-store";
import type { Design } from "@/lib/design/types";

const USES_MARQUEE = ["שמות על בקבוקים", "לוגו לאריזות", "צנצנות במזווה", "שלט לדלת", "כיתוב לחלון ראווה", "מתנות לאירועים", "קופסאות אוכל לגן", "ספלים עם אופי", "מגירות מסודרות", "משפט על הקיר"];

export default function HomePage() {
  const PRICING = getPricing();
  const nameProduct = getProduct("name-script")!;
  const cut: Design = personalize(nameProduct, { text: "Maya" });
  const printed: Design = {
    ...cut,
    elements: [{ id: "bg", type: "shape", shapeId: "square", x: 50, y: 21, width: 100, height: 42, rotation: 0, colorId: "white" }, ...cut.elements],
  };

  return (
    <>
      <Hero />

      {/* רצועת שימושים */}
      <div className="overflow-hidden border-y border-stone/70 bg-cream py-5" aria-hidden>
        <div className="flex w-max animate-marquee gap-10 whitespace-nowrap font-display text-2xl text-cocoa/80">
          {[...USES_MARQUEE, ...USES_MARQUEE].map((u, i) => (
            <span key={i} className="flex items-center gap-10">
              {u}
              <span className="text-olive">✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* שני מסלולים */}
      <section className="py-24 lg:py-32">
        <Container>
          <SectionTitle center eyebrow="מאיפה מתחילים?" title={<>שתי דרכים. תוצאה אחת — <span className="text-olive">שלכם.</span></>} />
          <div className="mt-14 grid gap-5 md:grid-cols-2">
            <Reveal>
              <Link href="/studio" className="group relative flex h-full min-h-[340px] flex-col justify-between overflow-hidden rounded-[32px] bg-choco p-8 text-ivory sm:p-10">
                <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full border border-ivory/10 transition-transform duration-1000 group-hover:scale-125" />
                <div className="absolute -left-4 -top-4 h-40 w-40 rounded-full border border-ivory/10 transition-transform duration-1000 group-hover:scale-150" />
                <PenTool className="h-9 w-9 text-taupe" strokeWidth={1.2} />
                <div>
                  <h3 className="font-display text-4xl font-light">יש לי רעיון משלי</h3>
                  <p className="mt-3 max-w-sm text-ivory/70">מקלידים שם או משפט, מעלים לוגו, בוחרים צבע ומידות — ורואים את המדבקה מיד.</p>
                  <span className="mt-8 inline-flex items-center gap-3 text-sm font-semibold tracking-wide">
                    כניסה לסטודיו
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-ivory text-choco transition-transform duration-500 group-hover:-translate-x-2">
                      <ArrowLeft className="h-4 w-4" />
                    </span>
                  </span>
                </div>
              </Link>
            </Reveal>
            <Reveal delay={120}>
              <Link href="/inspiration" className="group relative flex h-full min-h-[340px] flex-col justify-between overflow-hidden rounded-[32px] bg-olive-soft p-8 sm:p-10">
                <div className="absolute -bottom-10 -left-10 w-[58%] rotate-[-6deg] overflow-hidden rounded-3xl shadow-2xl transition-transform duration-1000 ease-out-soft group-hover:rotate-[-2deg] group-hover:scale-105">
                  <MockupPreview mockupId="jar" design={personalize(getProduct("pantry-label")!, { text: "סוכר" })} />
                </div>
                <Lightbulb className="h-9 w-9 text-olive" strokeWidth={1.2} />
                <div className="relative max-w-[55%]">
                  <h3 className="font-display text-4xl font-light text-choco">אני מחפש/ת השראה</h3>
                  <p className="mt-3 text-cocoa">גלריית רעיונות מעוצבת. בוחרים מה שאהבתם ומתאימים אותו אישית.</p>
                  <span className="mt-8 inline-flex items-center gap-3 text-sm font-semibold tracking-wide text-choco">
                    לגלריה
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-choco text-ivory transition-transform duration-500 group-hover:-translate-x-2">
                      <ArrowLeft className="h-4 w-4" />
                    </span>
                  </span>
                </div>
              </Link>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* חיתוך צורני מול מדבקה מודפסת */}
      <section className="py-24 lg:py-32">
        <Container className="grid items-center gap-14 lg:grid-cols-[1fr_1.3fr]">
          <Reveal>
            <Eyebrow>מה זה חיתוך צורני?</Eyebrow>
            <h2 className="mt-4 font-display text-4xl font-light leading-[1.1] md:text-5xl">
              רק האותיות.
              <br />
              <span className="text-olive">בלי רקע.</span>
            </h2>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-cocoa">
              המכונה חותכת את הויניל בדיוק לפי קווי המתאר של כל אות, צורה או לוגו. מה שנשאר על החפץ הוא העיצוב עצמו — בלי מלבן לבן, בלי שוליים שקופים, כאילו נכתב עליו.
            </p>
            <ul className="mt-8 space-y-4 text-[15px] text-choco">
              {[
                [Scissors, "נחתך במכונת חיתוך מקצועית מגליל ויניל איכותי"],
                [Package, "מגיע על נייר גב עם סרט העברה — מוכן להדבקה"],
                [Ruler, "במידות שבחרתם, בסנטימטרים מדויקים"],
              ].map(([Icon, t], i) => {
                const I = Icon as typeof Scissors;
                return (
                  <li key={i} className="flex items-center gap-4">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-olive-soft text-olive">
                      <I className="h-5 w-5" strokeWidth={1.4} />
                    </span>
                    {t as string}
                  </li>
                );
              })}
            </ul>
          </Reveal>
          <Reveal delay={120} className="grid grid-cols-2 gap-4">
            <figure>
              <MockupPreview mockupId="bottle" design={printed} noReveal className="rounded-[24px] opacity-90 grayscale-[30%]" />
              <figcaption className="mt-3 flex items-center gap-2 text-sm text-mocha">
                <span className="h-2 w-2 rounded-full bg-stone" /> מדבקה מודפסת רגילה
              </figcaption>
            </figure>
            <figure>
              <MockupPreview mockupId="bottle" design={cut} noReveal className="rounded-[24px] ring-2 ring-olive ring-offset-4 ring-offset-ivory" />
              <figcaption className="mt-3 flex items-center gap-2 text-sm font-semibold text-olive">
                <span className="h-2 w-2 rounded-full bg-olive" /> ויניל בחיתוך צורני
              </figcaption>
            </figure>
          </Reveal>
        </Container>
      </section>

      {/* איך זה עובד */}
      <section className="relative overflow-hidden bg-choco py-24 text-ivory lg:py-32">
        <Container>
          <SectionTitle eyebrow="איך זה עובד" title={<span className="text-ivory">ארבעה צעדים, מרעיון למדבקה</span>} />
          <ol className="mt-16 grid gap-px overflow-hidden rounded-[28px] bg-ivory/10 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [Lightbulb, "בוחרים רעיון או יוצרים עיצוב", "מתבנית מוכנה, מהגלריה או מדף לבן בסטודיו."],
              [PenTool, "מתאימים צבע, גודל וצורה", "גופנים, צבעי ויניל ומידות בסנטימטרים."],
              [ImageIcon, "רואים את המדבקה בהדמיה", "על חפץ מהגלריה — או על תמונה של החפץ שלכם."],
              [Package, "מזמינים ומקבלים מוכן להדבקה", "חתוך, מנוקה ועם סרט העברה."],
            ].map(([Icon, t, d], i) => {
              const I = Icon as typeof Lightbulb;
              return (
                <Reveal as="li" key={i} delay={i * 100} className="relative bg-choco p-8 lg:p-10">
                  <span className="font-latin text-6xl italic text-ivory/15">0{i + 1}</span>
                  <I className="mt-6 h-8 w-8 text-taupe" strokeWidth={1.2} />
                  <h3 className="mt-5 font-display text-2xl">{t as string}</h3>
                  <p className="mt-3 leading-relaxed text-ivory/65">{d as string}</p>
                </Reveal>
              );
            })}
          </ol>
          <div className="mt-12 flex flex-wrap gap-3">
            <ButtonLink href="/studio" variant="light" size="lg">
              מתחילים לעצב <ArrowLeft className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink href="/studio?start=upload" size="lg" className="border border-ivory/25 !bg-transparent hover:!bg-ivory/10">
              <Upload className="h-4 w-4" /> יש לי לוגו
            </ButtonLink>
          </div>
        </Container>
      </section>

      {/* גלריית השראה */}
      <section className="py-24 lg:py-32">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionTitle eyebrow="השראה" title="איפה עוד אפשר להדביק?" sub="בכל מקום. הנה כמה רעיונות — כל אחד מהם נפתח בסטודיו לעריכה." />
            <ButtonLink href="/inspiration" variant="secondary">
              לגלריה המלאה <ArrowLeft className="h-4 w-4" />
            </ButtonLink>
          </div>
          <div className="mt-14 columns-2 gap-4 md:columns-3 lg:gap-6">
            {INSPIRATION.slice(0, 6).map((it, i) => {
              const p = getProduct(it.product)!;
              const d = personalize(p, { text: it.text, colorId: it.color });
              return (
                <Reveal key={it.id} delay={(i % 3) * 80} className="mb-4 break-inside-avoid lg:mb-6">
                  <Link href={`/studio?template=${it.product}&mockup=${it.mockup}${it.text ? `&text=${encodeURIComponent(it.text)}` : ""}${it.color ? `&color=${it.color}` : ""}`} className="group block">
                    <div className="overflow-hidden rounded-[22px]">
                      <MockupPreview mockupId={it.mockup} design={d} className="transition-transform duration-[1.2s] ease-out-soft group-hover:scale-105" />
                    </div>
                    <div className="mt-3 flex items-baseline justify-between gap-2">
                      <h3 className="font-display text-lg text-choco">{it.title}</h3>
                      <span className="text-xs text-mocha">{it.tag}</span>
                    </div>
                    <p className="text-sm text-mocha">{it.caption}</p>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </Container>
      </section>

      {/* אזור שיווקי — שדרוג במקום קנייה */}
      <section className="py-24 lg:py-32">
        <Container className="grid items-center gap-14 lg:grid-cols-2">
          <Reveal className="relative">
            <div className="grid grid-cols-5 gap-4">
              <div className="col-span-3 overflow-hidden rounded-[28px]">
                <MockupPreview mockupId="door" design={getProduct("family-door")!.template} />
              </div>
              <div className="col-span-2 flex flex-col gap-4 pt-16">
                <div className="overflow-hidden rounded-[22px]">
                  <MockupPreview mockupId="dresser" design={personalize(getProduct("drawer-label")!, { text: "TOWELS" })} />
                </div>
                <div className="overflow-hidden rounded-[22px]">
                  <MockupPreview mockupId="glass" design={personalize(nameProduct, { text: "Noa", colorId: "white" })} />
                </div>
              </div>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <Eyebrow>לשדרג, לא להחליף</Eyebrow>
            <h2 className="mt-4 font-display text-4xl font-light leading-[1.1] md:text-5xl">
              החפצים שכבר אוהבים.
              <br />
              <span className="text-olive">עכשיו — שלכם באמת.</span>
            </h2>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-cocoa">
              אין צורך לקנות בקבוק חדש, ספל חדש או דלת חדשה. מדבקה אחת מדויקת הופכת חפץ קיים לאישי, מעוצב ומזוהה — בעלות קטנה ובלי לזרוק כלום.
            </p>
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {[
                [Recycle, "בלי לקנות מחדש", "משדרגים את מה שיש"],
                [Ruler, "בדיוק בגודל", "מידות בסנטימטרים"],
                [ImageIcon, "רואים לפני", "הדמיה על החפץ שלכם"],
              ].map(([Icon, t, d], i) => {
                const I = Icon as typeof Recycle;
                return (
                  <div key={i} className="border-t border-stone pt-5">
                    <I className="h-6 w-6 text-olive" strokeWidth={1.3} />
                    <p className="mt-3 font-display text-lg">{t as string}</p>
                    <p className="text-sm text-mocha">{d as string}</p>
                  </div>
                );
              })}
            </div>
          </Reveal>
        </Container>
      </section>

      {/* עסקים */}
      <section className="pb-8">
        <Container>
          <Reveal className="relative overflow-hidden rounded-[36px] bg-olive px-6 py-16 text-ivory sm:px-12 lg:px-16 lg:py-20">
            <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
              <div>
                <Eyebrow className="!text-ivory/80 [&>span]:!bg-ivory/50">לעסקים</Eyebrow>
                <h2 className="mt-4 font-display text-4xl font-light leading-tight md:text-5xl">המותג שלכם, על כל אריזה.</h2>
                <p className="mt-5 max-w-md text-lg text-ivory/75">לוגואים, מדבקות תודה, כיתובים לחלונות ומיתוג מוצרים. מעלים לוגו, רואים הדמיה על האריזה שלכם, ומזמינים בכמויות.</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <ButtonLink href="/business" variant="light" size="lg">
                    מיתוג לעסקים <ArrowLeft className="h-4 w-4" />
                  </ButtonLink>
                  <ButtonLink href="/studio?start=upload" size="lg" className="border border-ivory/30 !bg-transparent hover:!bg-ivory/10">
                    <Upload className="h-4 w-4" /> העלאת לוגו
                  </ButtonLink>
                </div>
              </div>
              <div className="rounded-[28px] bg-ivory/10 p-6 backdrop-blur sm:p-8">
                <p className="text-sm text-ivory/70">הנחות כמות (לדוגמה)</p>
                <ul className="mt-4 divide-y divide-ivory/10">
                  {PRICING.quantityTiers
                    .filter((t) => t.discount > 0)
                    .map((t) => (
                      <li key={t.min} className="flex items-center justify-between py-3">
                        <span>מ־{t.min} יחידות</span>
                        <span className="font-display text-2xl">−{Math.round(t.discount * 100)}%</span>
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
