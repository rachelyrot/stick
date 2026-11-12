import type { Metadata } from "next";
import { Camera, FileCheck2, Layers, Upload } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { ButtonLink, Container, SectionTitle } from "@/components/ui/primitives";
import { formatPrice, quote } from "@/lib/pricing/engine";
import { getPricing } from "@/lib/server/pricing-store";

export const metadata: Metadata = { title: "מיתוג לעסקים" };

export default function BusinessPage() {
  const PRICING = getPricing();
  const sample = (qty: number) => quote({ widthCm: 6, heightCm: 6, materialId: "permanent", quantity: qty, colorCount: 1, elementCount: 2, hasThinFont: false, hasUpload: false }, PRICING);
  return (
    <>
      <PageHeader eyebrow="לעסקים" title={<>המותג שלכם, <span className="text-olive">בכל נקודת מגע.</span></>} sub="מדבקות לוגו לאריזות ושקיות, מדבקות תודה למשלוחים, כיתובים לחלונות ומיתוג מוצרים — בחיתוך צורני מדויק ובכמויות.">
        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink href="/studio?start=upload" size="lg">
            <Upload className="h-5 w-5" strokeWidth={1.5} /> העלאת הלוגו שלכם
          </ButtonLink>
          <ButtonLink href="/about?topic=business#contact" variant="secondary" size="lg">
            בקשת הצעת מחיר
          </ButtonLink>
        </div>
      </PageHeader>

      <Container>
        <ol className="grid gap-5 md:grid-cols-4">
          {[
            [Upload, "מעלים לוגו", "SVG מומלץ. גם PNG/JPG — נמיר עבורכם."],
            [Camera, "רואים על האריזה שלכם", "מצלמים את השקית או הקופסה ומניחים עליה את הלוגו."],
            [FileCheck2, "מאשרים קובץ חיתוך", "נבדוק את קווי המתאר ונשלח לאישור לפני ייצור."],
            [Layers, "מקבלים בכמויות", "מוכן להדבקה, עם הנחות כמות."],
          ].map(([Icon, t, d], i) => {
            const I = Icon as typeof Upload;
            return (
              <li key={i} className="rounded-[24px] bg-cream p-7">
                <I className="h-7 w-7 text-olive" strokeWidth={1.3} />
                <h3 className="mt-5 font-display text-xl">{t as string}</h3>
                <p className="mt-2 text-[15px] text-cocoa">{d as string}</p>
              </li>
            );
          })}
        </ol>
      </Container>

      <section className="py-24">
        <Container className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          <SectionTitle eyebrow="תמחור לדוגמה" title="ככל שמזמינים יותר — משלמים פחות" sub="לוגו בצבע אחד, 6×6 ס״מ, ויניל קבוע. המחירים לדוגמה בלבד ומחושבים במנוע התמחור של האתר." />
          <div className="overflow-hidden rounded-[24px] border border-stone">
            <table className="w-full text-right text-[15px]">
              <thead className="bg-cream text-[13px] text-mocha">
                <tr>
                  <th className="px-5 py-3 font-medium">כמות</th>
                  <th className="px-5 py-3 font-medium">הנחה</th>
                  <th className="px-5 py-3 font-medium">ליחידה</th>
                  <th className="px-5 py-3 font-medium">סה״כ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone">
                {PRICING.quantityTiers.map((t) => {
                  const q = sample(Math.max(t.min, 1));
                  return (
                    <tr key={t.min}>
                      <td className="px-5 py-3.5">{t.min}+</td>
                      <td className="px-5 py-3.5 text-olive">{t.discount ? `${Math.round(t.discount * 100)}%` : "—"}</td>
                      <td className="px-5 py-3.5">{formatPrice(q.subtotal / q.quantity)}</td>
                      <td className="px-5 py-3.5 font-semibold">{formatPrice(q.total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Container>
      </section>

    </>
  );
}
