"use client";

import Link from "next/link";
import { FileDown, PenLine, ShoppingBag, Trash2, Sparkles, ArrowLeft } from "lucide-react";
import { useCart } from "@/lib/cart/cart-store";
import { getColor, getMaterial, swatchCss } from "@/config/production";
import { formatPrice, shippingFor } from "@/lib/pricing/engine";
import { usePricing } from "@/lib/pricing/pricing-context";
import { downloadText, exportProductionSvg, fileSlug } from "@/lib/production/export-svg";
import { Stepper } from "@/features/studio/controls";
import { btn } from "@/components/ui/primitives";

export function CartView() {
  const cart = useCart();
  const PRICING = usePricing();

  if (!cart.ready) return <p className="py-20 text-center text-mocha">טוענים את הסל…</p>;

  if (!cart.items.length)
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <ShoppingBag className="mx-auto h-14 w-14 text-taupe" strokeWidth={1} />
        <h2 className="mt-6 font-display text-3xl">הסל עדיין ריק</h2>
        <p className="mt-3 text-cocoa">כל מדבקה מתחילה ברעיון. בואו ניצור את הראשונה.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/studio" className={btn("primary", "lg")}>
            <Sparkles className="h-5 w-5" strokeWidth={1.5} /> לסטודיו
          </Link>
          <Link href="/studio" className={btn("secondary", "lg")}>
            לסטודיו
          </Link>
        </div>
      </div>
    );

  const shipping = shippingFor(cart.subtotal, "delivery", PRICING);
  const toFree = PRICING.shipping.freeFrom > 0 ? PRICING.shipping.freeFrom - cart.subtotal : 0;

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_380px]">
      <ul className="divide-y divide-stone border-y border-stone">
        {cart.items.map((item) => {
          const d = item.design;
          const colors = [...new Set(d.elements.map((e) => e.colorId))].map(getColor);
          const hasUpload = d.elements.some((e) => e.type === "image");
          return (
            <li key={item.id} className="grid grid-cols-[96px_1fr] gap-5 py-7 sm:grid-cols-[140px_1fr_auto]">
              <div className="checker grid aspect-square place-items-center overflow-hidden rounded-2xl border border-stone p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.thumbnail} alt={d.name} className="max-h-full max-w-full object-contain" />
              </div>
              <div className="min-w-0">
                <h3 className="font-display text-2xl leading-tight text-choco">{d.name}</h3>
                <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[13.5px] text-cocoa">
                  <dt className="text-mocha">מידות</dt>
                  <dd dir="ltr" className="text-right">
                    {(d.widthMm / 10).toFixed(1)} × {(d.heightMm / 10).toFixed(1)} cm
                  </dd>
                  <dt className="text-mocha">חומר</dt>
                  <dd>{getMaterial(d.materialId).name}</dd>
                  <dt className="text-mocha">צבע</dt>
                  <dd className="flex flex-wrap items-center gap-1.5">
                    {colors.map((c) => (
                      <span key={c.id} className="inline-flex items-center gap-1">
                        <span className="h-3 w-3 rounded-full ring-1 ring-black/15" style={{ background: swatchCss(c) }} />
                        {c.name}
                      </span>
                    ))}
                  </dd>
                  <dt className="text-mocha">רכיבים</dt>
                  <dd>{d.elements.length} · נתוני עיצוב עריכים נשמרו</dd>
                </dl>
                {hasUpload && <p className="mt-2 inline-block rounded-full bg-olive-soft px-3 py-0.5 text-[12px] text-olive-dark">כולל קובץ גרפי — ייבדק לפני ייצור</p>}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Link href={`/studio?edit=${item.id}`} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-stone px-3.5 text-[13px] text-choco hover:border-choco">
                    <PenLine className="h-3.5 w-3.5" /> עריכה
                  </Link>
                  <button type="button" onClick={() => cart.remove(item.id)} className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] text-mocha hover:text-clay">
                    <Trash2 className="h-3.5 w-3.5" /> הסרה
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadText(exportProductionSvg(d), `${fileSlug(d.name)}.svg`)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] text-mocha hover:text-choco"
                    title="קובץ SVG במידות אמיתיות, שכבה לכל צבע"
                  >
                    <FileDown className="h-3.5 w-3.5" /> קובץ עבודה (טיוטה)
                  </button>
                </div>
              </div>
              <div className="col-span-2 flex items-center justify-between gap-4 sm:col-span-1 sm:flex-col sm:items-end sm:justify-between">
                <Stepper value={item.quantity} onChange={(n) => cart.setQuantity(item.id, n)} />
                <div className="text-left">
                  <p className="font-display text-2xl text-choco">{formatPrice(item.quote.total)}</p>
                  <p className="text-[12px] text-mocha">
                    {formatPrice(item.quote.unitPrice)} ליח׳{item.quote.discountRate ? ` · −${Math.round(item.quote.discountRate * 100)}%` : ""}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-[28px] bg-cream p-7">
          <h2 className="font-display text-2xl">סיכום</h2>
          <dl className="mt-6 space-y-3 text-[15px]">
            <div className="flex justify-between">
              <dt className="text-cocoa">מדבקות ({cart.count})</dt>
              <dd>{formatPrice(cart.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-cocoa">משלוח</dt>
              <dd>{shipping ? formatPrice(shipping) : "חינם"}</dd>
            </div>
          </dl>
          <p className="mt-3 text-[12.5px] text-mocha">איסוף עצמי מנקודות האיסוף — ללא עלות, תוך 2 ימי עסקים</p>
          {toFree > 0 &&<p className="mt-3 rounded-xl bg-ivory px-3 py-2 text-[12.5px] text-cocoa">עוד {formatPrice(toFree)} למשלוח חינם</p>}
          <div className="mt-6 flex items-end justify-between border-t border-stone pt-5">
            <span className="text-cocoa">סה״כ לדוגמה</span>
            <span className="font-display text-4xl text-choco">{formatPrice(cart.subtotal + shipping)}</span>
          </div>
          <Link href="/checkout" className={btn("primary", "lg", "mt-7 w-full")}>
            להשלמת ההזמנה <ArrowLeft className="h-4 w-4" />
          </Link>
          <Link href="/studio?start=blank" className="mt-3 block text-center text-[14px] text-cocoa underline-offset-4 hover:text-choco hover:underline">
            + עיצוב נוסף לאותה הזמנה
          </Link>
          <p className="mt-6 text-[12px] leading-relaxed text-mocha">הסל נשמר בדפדפן זה בלבד. המחירים מחושבים לפי המחירון העדכני ({PRICING.version}).</p>
        </div>
      </aside>
    </div>
  );
}
