import Link from "next/link";
import { BRAND } from "@/config/brand";
import { Logo } from "./Logo";

const cols = [
  {
    title: "לעצב",
    links: [
      { href: "/studio", label: "סטודיו העיצוב" },
      { href: "/studio?start=upload", label: "העלאת לוגו" },
      { href: "/studio?step=mockup", label: "הדמיה על חפץ שלכם" },
      { href: "/inspiration", label: "גלריית השראה" },
    ],
  },
  {
    title: "לקנות",
    links: [
      { href: "/studio?start=sheet", label: "דף כיתובים שלם" },
      { href: "/business", label: "מיתוג לעסקים" },
      { href: "/cart", label: "סל הקניות" },
    ],
  },
  {
    title: "מידע",
    links: [
      { href: "/faq", label: "הוראות הדבקה" },
      { href: "/faq#materials", label: "חומרים וצבעים" },
      { href: "/about", label: "אודות וצור קשר" },
      { href: "/account/orders", label: "ההזמנות שלי" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative mt-24 overflow-hidden bg-choco text-ivory/80">
      <div className="mx-auto max-w-[1320px] px-4 pb-10 pt-20 sm:px-6 lg:px-10">
        <div className="grid gap-14 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <Logo light />
            <p className="mt-6 max-w-sm font-display text-2xl font-light leading-snug text-ivory">{BRAND.tagline}</p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ivory/60">{BRAND.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            {cols.map((c) => (
              <div key={c.title}>
                <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-taupe">{c.title}</h3>
                <ul className="mt-5 space-y-3">
                  {c.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="text-[15px] text-ivory/75 transition hover:text-ivory">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-20 flex flex-col gap-4 border-t border-ivory/10 pt-8 text-[13px] text-ivory/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {BRAND.name} · כל ההדמיות באתר הן להמחשה בלבד</p>
          <p>{BRAND.contact.area}</p>
        </div>
      </div>
      <div aria-hidden className="pointer-events-none absolute -bottom-10 left-1/2 -translate-x-1/2 select-none whitespace-nowrap font-latin text-[18vw] italic leading-none text-ivory/[0.04]" dir="ltr">
        {BRAND.logoLatin.toLowerCase()}
      </div>
    </footer>
  );
}
