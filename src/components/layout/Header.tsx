"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, ShoppingBag, X, Sparkles } from "lucide-react";
import { useCart } from "@/lib/cart/cart-store";
import { Logo } from "./Logo";
import { btn } from "@/components/ui/primitives";
import { BRAND } from "@/config/brand";
import { UserMenu } from "@/components/auth/UserMenu";

export const NAV = [
  { href: "/inspiration", label: "השראה" },
  { href: "/studio", label: "סטודיו" },
  { href: "/business", label: "לעסקים" },
  { href: "/faq", label: "הדבקה ושאלות" },
  { href: "/about", label: "אודות" },
];

export function Header() {
  const { count, ready } = useCart();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  const isStudio = pathname?.startsWith("/studio");

  return (
    <>
      {BRAND.demoMode && !isStudio && (
        <div className="bg-choco text-center text-[12.5px] tracking-wide text-ivory/85">
          <p className="mx-auto max-w-[1320px] px-4 py-2">
            אתר בהרצה · המחירים לדוגמה · התשלום מתואם אישית לאחר אישור העיצוב
          </p>
        </div>
      )}
      <header
        className={`sticky top-0 z-40 transition-all duration-500 ${scrolled || isStudio ? "border-b border-stone/70 bg-ivory/85 backdrop-blur-xl" : "bg-transparent"}`}
      >
        <div className={`mx-auto flex max-w-[1320px] items-center justify-between px-4 sm:px-6 lg:px-10 ${isStudio ? "h-16" : "h-[72px]"}`}>
          <div className="flex items-center gap-10">
            <Logo />
            <nav className="hidden items-center gap-1 lg:flex" aria-label="ניווט ראשי">
              {NAV.map((n) => {
                const active = pathname === n.href || pathname?.startsWith(n.href + "/");
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    className={`relative rounded-full px-3.5 py-2 text-[15px] transition-colors ${active ? "text-choco" : "text-cocoa hover:text-choco"}`}
                  >
                    {n.label}
                    {active && <span className="absolute inset-x-3.5 -bottom-0.5 h-px bg-choco" />}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            {!isStudio && (
              <Link href="/studio" className={btn("primary", "sm", "hidden sm:inline-flex")}>
                <Sparkles className="h-4 w-4" strokeWidth={1.6} />
                בואו לעצב
              </Link>
            )}
            <UserMenu />
            <Link href="/cart" className="relative grid h-11 w-11 place-items-center rounded-full text-choco transition hover:bg-sand" aria-label={`סל קניות, ${count} פריטים`}>
              <ShoppingBag className="h-[22px] w-[22px]" strokeWidth={1.5} />
              {ready && count > 0 && (
                <span className="absolute -left-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-olive px-1 text-[11px] font-bold text-ivory">{count > 99 ? "99+" : count}</span>
              )}
            </Link>
            <button type="button" className="grid h-11 w-11 place-items-center rounded-full text-choco hover:bg-sand lg:hidden" onClick={() => setOpen(true)} aria-label="פתיחת תפריט">
              <Menu className="h-6 w-6" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </header>

      {/* תפריט נייד */}
      <div className={`fixed inset-0 z-50 lg:hidden ${open ? "" : "pointer-events-none"}`} aria-hidden={!open}>
        <div className={`absolute inset-0 bg-ink/40 backdrop-blur-sm transition-opacity duration-500 ${open ? "opacity-100" : "opacity-0"}`} onClick={() => setOpen(false)} />
        <div className={`absolute inset-y-0 right-0 flex w-[86%] max-w-sm flex-col bg-ivory p-6 shadow-2xl transition-transform duration-500 ease-out-soft ${open ? "translate-x-0" : "translate-x-full"}`}>
          <div className="flex items-center justify-between">
            <Logo />
            <button type="button" onClick={() => setOpen(false)} className="grid h-11 w-11 place-items-center rounded-full hover:bg-sand" aria-label="סגירת תפריט">
              <X className="h-6 w-6" strokeWidth={1.5} />
            </button>
          </div>
          <nav className="mt-10 flex flex-col" aria-label="ניווט נייד">
            {[{ href: "/", label: "דף הבית" }, ...NAV, { href: "/cart", label: "סל הקניות" }].map((n, i) => (
              <Link key={n.href} href={n.href} className="border-b border-stone/60 py-4 font-display text-2xl text-choco" style={{ transitionDelay: `${i * 40}ms` }}>
                {n.label}
              </Link>
            ))}
          </nav>
          <Link href="/studio" className={btn("primary", "lg", "mt-auto w-full")}>
            <Sparkles className="h-5 w-5" strokeWidth={1.6} /> בואו לעצב מדבקה
          </Link>
        </div>
      </div>
    </>
  );
}
