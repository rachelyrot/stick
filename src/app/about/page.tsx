import { Suspense } from "react";
import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Container, Eyebrow } from "@/components/ui/primitives";
import { MockupPreview } from "@/components/design/MockupPreview";
import { getProduct } from "@/data/products";
import { personalize } from "@/lib/catalog/personalize";
import { BRAND } from "@/config/brand";
import { ContactForm } from "@/features/contact/ContactForm";

export const metadata: Metadata = { title: "אודות ויצירת קשר" };

export default function AboutPage() {
  return (
    <>
      <PageHeader eyebrow="אודות" title={<>סטודיו קטן. <span className="text-olive">פרטים מדויקים.</span></>} />
      <Container className="grid items-center gap-14 lg:grid-cols-2">
        <div className="space-y-5 text-lg leading-relaxed text-cocoa">
          <p>
            {BRAND.name} נולד מאהבה לפרטים הקטנים: שם שנכתב בדיוק נכון, לוגו שיושב בול על האריזה, מילה אחת על צנצנת שהופכת מטבח לבית.
          </p>
          <p>
            כל מדבקה נחתכת אצלנו במכונת חיתוך מקצועית מויניל איכותי, מנוקה ביד מכל עודף, ונארזת עם סרט העברה — כך שמה שמגיע אליכם הוא רק העיצוב עצמו, מוכן להדבקה.
          </p>
          <p>
            אנחנו עובדים גם עם אנשים פרטיים שמזמינים מדבקה אחת, וגם עם עסקים שצריכים מאות. לכל אחד מגיעה אותה תשומת לב.
          </p>
        </div>
        <div className="overflow-hidden rounded-[32px]">
          <MockupPreview mockupId="kraft-box" design={personalize(getProduct("business-logo")!, { text: BRAND.logoLatin.toUpperCase() })} />
        </div>
      </Container>

      <section id="contact" className="mt-24 scroll-mt-28 bg-cream py-24">
        <Container className="grid gap-14 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <Eyebrow>יצירת קשר</Eyebrow>
            <h2 className="mt-4 font-display text-4xl font-light md:text-5xl">נשמח לשמוע מכם</h2>
            <p className="mt-5 text-lg text-cocoa">רעיון שלא בטוחים איך לבצע? הזמנה גדולה לעסק? כתבו לנו.</p>
            <ul className="mt-10 space-y-5 text-[15px]">
              <li className="flex items-center gap-4">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-ivory text-olive">
                  <Mail className="h-5 w-5" strokeWidth={1.4} />
                </span>
                <a href={`mailto:${BRAND.contact.email}`} className="hover:underline" dir="ltr">
                  {BRAND.contact.email}
                </a>
              </li>
              {BRAND.contact.phoneDisplay && (
                <li className="flex items-center gap-4">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-ivory text-olive">
                    <Phone className="h-5 w-5" strokeWidth={1.4} />
                  </span>
                  {BRAND.contact.phoneDisplay}
                </li>
              )}
              <li className="flex items-center gap-4">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-ivory text-olive">
                  <MapPin className="h-5 w-5" strokeWidth={1.4} />
                </span>
                {BRAND.contact.area}
              </li>
            </ul>
          </div>
          <div className="rounded-[28px] bg-ivory p-7 sm:p-9">
            <Suspense>
              <ContactForm />
            </Suspense>
          </div>
        </Container>
      </section>
    </>
  );
}
