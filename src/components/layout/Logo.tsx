import Link from "next/link";
import { BRAND } from "@/config/brand";

/** לוגו: "Stick" בטיפוגרפיה לועזית + "בצ׳יק" בעברית, בירוק זית */
export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link
      href="/"
      className={`group inline-flex items-baseline gap-2 ${light ? "text-ivory" : "text-choco"}`}
      aria-label={`${BRAND.name} — דף הבית`}
      dir="ltr"
    >
      <span className="font-latin text-[28px] font-semibold leading-none tracking-[0.06em]">{BRAND.logoLatin}</span>
      <span className="relative font-display text-[26px] font-medium leading-none text-olive" dir="rtl">
        {BRAND.logoHebrew}
        <span className="absolute -bottom-1 right-0 h-px w-0 bg-olive transition-all duration-500 group-hover:w-full" />
      </span>
    </Link>
  );
}
