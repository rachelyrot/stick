import { ArrowLeft, Sparkles } from "lucide-react";
import { ButtonLink, Container } from "@/components/ui/primitives";
import { MockupPreview } from "@/components/design/MockupPreview";
import { getProduct } from "@/data/products";
import { getMockup } from "@/data/mockups";
import { getRealPhoto } from "@/data/real-photos";
import { RealPhotoReveal } from "@/components/design/RealPhotoReveal";

/** אם יש תמונה אמיתית להדמיה — עוטף אותה בחשיפה במעבר עכבר */
function MaybeReal({ mockupId, className, children }: { mockupId: string; className?: string; children: React.ReactNode }) {
  const photo = getRealPhoto(mockupId);
  if (!photo) return <div className={`relative ${className ?? ""}`}>{children}</div>;
  return <RealPhotoReveal photo={photo} className={className}>{children}</RealPhotoReveal>;
}

/**
 * Hero: קומפוזיציית הדמיות. בבקבוק הראשי — אנימציית "חיתוך":
 * קו המתאר של השם נחתך ואז מתמלא, כמו שהמכונה חותכת את הויניל.
 */
export function Hero() {
  const bottle = getMockup("bottle");
  const mug = getProduct("mug-good-morning")!;
  const logo = getProduct("business-logo")!;
  const jar = getProduct("pantry-label")!;

  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute -left-40 top-10 h-[520px] w-[520px] rounded-full bg-olive-soft/60 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-40 bottom-0 h-[420px] w-[420px] rounded-full bg-sand blur-3xl" />
      <Container className="relative grid items-center gap-14 pb-20 pt-10 lg:grid-cols-[1fr_1.15fr] lg:gap-10 lg:pb-28 lg:pt-16">
        <div className="animate-fade-up">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-stone bg-ivory/70 px-4 py-1.5 text-[13px] text-cocoa backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-olive" />
            מדבקות ויניל בחיתוך צורני · בעבודת יד
          </p>
          <h1 className="font-display text-[44px] font-light leading-[1.02] tracking-tight text-choco sm:text-6xl xl:text-[84px]">
            הפרטים הקטנים
            <br />
            שעושים את זה <em className="relative font-normal not-italic text-olive">אישי.<svg aria-hidden viewBox="0 0 200 20" className="absolute -bottom-2 right-0 w-full text-olive/50" preserveAspectRatio="none"><path d="M2 14 Q60 2 198 10" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" /></svg></em>
          </h1>
          <p className="mt-8 max-w-md text-lg leading-relaxed text-cocoa sm:text-xl">מדבקות בעיצוב שלך, לכל רעיון ולכל מקום.</p>
          <div className="mt-10 flex flex-wrap gap-3">
            <ButtonLink href="/studio" size="lg">
              <Sparkles className="h-5 w-5" strokeWidth={1.6} />
              בואו לעצב מדבקה
            </ButtonLink>
            <ButtonLink href="/inspiration" variant="secondary" size="lg">
              מחפשים השראה?
              <ArrowLeft className="h-4 w-4" />
            </ButtonLink>
          </div>
          <dl className="mt-14 grid max-w-md grid-cols-3 gap-6 border-t border-stone pt-6 text-sm">
            {[
              ["בלי רקע", "רק האותיות והצורות"],
              ["כל חפץ", "גם שלכם — בהדמיה"],
              ["בעיצובכם", "שם, משפט או לוגו"],
            ].map(([t, d]) => (
              <div key={t}>
                <dt className="font-display text-lg text-choco">{t}</dt>
                <dd className="mt-1 leading-snug text-mocha">{d}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative">
          <MaybeReal mockupId="bottle" className="cursor-pointer overflow-hidden rounded-[32px] shadow-[0_40px_80px_-40px_rgba(58,42,33,0.5)] outline-offset-4">
          <div className="relative overflow-hidden rounded-[32px]" style={{ aspectRatio: "4 / 3" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bottle.src} alt="הדמיה: בקבוק שתייה עם מדבקת שם" className="absolute inset-0 h-full w-full" />
            <svg
              viewBox="0 0 200 80"
              className="cut-line absolute -translate-x-1/2 -translate-y-1/2"
              style={{ overflow: "visible", left: `${bottle.area.cx * 100}%`, top: `${bottle.area.cy * 100}%`, width: `${bottle.area.w * 100}%` }}
              aria-label="Maya"
            >
              <text x="100" y="42" textAnchor="middle" dominantBaseline="central" fontFamily='"Dancing Script"' fontWeight="700" fontSize="66" fill="#B07A68" fillOpacity="0" stroke="#B07A68" strokeWidth="0.9">
                Maya
              </text>
            </svg>
            <div className="absolute bottom-5 right-5 flex items-center gap-3 rounded-full bg-ivory/85 py-2 pe-4 ps-2 text-[13px] text-choco backdrop-blur">
              <span className="grid h-8 w-8 place-items-center rounded-full border border-dashed border-choco/50 font-latin text-sm italic">cut</span>
              חיתוך לפי קווי המתאר · 10×4 ס״מ
            </div>
          </div>
          </MaybeReal>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:mt-4 sm:gap-4">
            <MockupPreview mockupId="mug" design={mug.template} eager className="rounded-[24px]" />
            <MockupPreview mockupId="bag" design={logo.template} eager className="rounded-[24px]" />
          </div>
          <div className="absolute -left-3 top-[48%] hidden animate-float items-center gap-3 rounded-2xl border border-stone bg-ivory p-3 pe-5 shadow-xl sm:flex lg:-left-10">
            <div className="checker grid h-14 w-20 place-items-center rounded-xl">
              <svg viewBox="0 0 80 30" className="w-16" aria-hidden>
                <text x="40" y="16" textAnchor="middle" dominantBaseline="central" fontFamily='"Frank Ruhl Libre"' fontSize="20" fill="#1D1B1A">
                  {jar.template.elements[0].type === "text" ? jar.template.elements[0].text : ""}
                </text>
              </svg>
            </div>
            <div className="text-[13px] leading-tight">
              <p className="font-semibold text-choco">המדבקה עצמה</p>
              <p className="text-mocha">ללא רקע · מוכנה להדבקה</p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
