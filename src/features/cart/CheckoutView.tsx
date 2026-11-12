"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { CreditCard, Loader2, Lock, Mail, MapPin, Send, Store, Truck } from "lucide-react";
import { PICKUP_POINTS } from "@/config/pickup-points";
import { useCart } from "@/lib/cart/cart-store";
import { formatPrice, shippingFor } from "@/lib/pricing/engine";
import { usePricing } from "@/lib/pricing/pricing-context";
import type { CustomerInfo } from "@/lib/orders/types";
import { btn } from "@/components/ui/primitives";

const EMPTY: CustomerInfo = { fullName: "", phone: "", delivery: "delivery", city: "", street: "", notes: "", businessName: "" };

function validate(c: CustomerInfo) {
  const e: Partial<Record<keyof CustomerInfo, string>> = {};
  if (c.fullName.trim().length < 2) e.fullName = "נא להזין שם מלא";
  if (!/^0\d{8,9}$/.test(c.phone.replace(/[\s-]/g, ""))) e.phone = "מספר טלפון ישראלי, לדוגמה 050-1234567";
  if (c.delivery === "delivery") {
    if (c.city.trim().length < 2) e.city = "נא להזין עיר";
    if (c.street.trim().length < 3) e.street = "נא להזין רחוב ומספר";
  } else if (!c.pickupPoint) e.pickupPoint = "נא לבחור נקודת איסוף";
  return e;
}

export function CheckoutView() {
  const cart = useCart();
  const pricing = usePricing();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [c, setC] = useState<CustomerInfo>(EMPTY);
  const [touched, setTouched] = useState(false);
  const [sending, setSending] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // שם מלא מגיע מחשבון Google
  useEffect(() => {
    if (session?.user?.name) setC((p) => (p.fullName ? p : { ...p, fullName: session.user!.name! }));
  }, [session?.user?.name]);

  const errors = validate(c);
  const valid = Object.keys(errors).length === 0;
  const shipping = shippingFor(cart.subtotal, c.delivery, pricing);
  const total = cart.subtotal + shipping;
  const set = <K extends keyof CustomerInfo>(k: K, v: CustomerInfo[K]) => setC((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!valid || sending) return;
    setSending(true);
    setServerError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer: c, items: cart.items.map(({ id, design, quantity, thumbnail }) => ({ id, design, quantity, thumbnail })) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setServerError(data.error ?? "שליחת ההזמנה נכשלה. נסו שוב.");
        return;
      }
      cart.clear();
      router.push(`/account/orders/${data.id}?new=1`);
    } catch {
      setServerError("אין חיבור לשרת. בדקו את החיבור ונסו שוב.");
    } finally {
      setSending(false);
    }
  };

  if (!cart.ready || status === "loading") return <p className="py-20 text-center text-mocha">טוענים…</p>;

  if (!cart.items.length)
    return (
      <div className="py-16 text-center">
        <p className="font-display text-3xl">אין פריטים להזמנה</p>
        <Link href="/studio" className={btn("primary", "lg", "mt-8")}>
          לסטודיו
        </Link>
      </div>
    );

  if (!session?.user)
    return (
      <div className="mx-auto max-w-lg rounded-[32px] border border-stone bg-cream p-8 text-center sm:p-10">
        <Mail className="mx-auto h-10 w-10 text-olive" strokeWidth={1.3} />
        <h2 className="mt-5 font-display text-3xl font-light">כמעט שם — רק מתחברים</h2>
        <p className="mt-3 leading-relaxed text-cocoa">כדי להשלים הזמנה מתחברים עם חשבון Google. אישור ההזמנה ועדכוני הסטטוס יישלחו למייל שלך. הסל נשמר.</p>
        <Link href={`/login?callbackUrl=${encodeURIComponent("/checkout")}`} className={btn("primary", "lg", "mt-8 w-full")}>
          התחברות והמשך להזמנה
        </Link>
      </div>
    );

  const field = (k: keyof CustomerInfo, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="block">
      <span className="mb-1.5 block text-[13px] text-cocoa">{label}</span>
      <input
        value={(c[k] as string) ?? ""}
        onChange={(e) => set(k, e.target.value as never)}
        className={`h-12 w-full rounded-xl border bg-ivory px-4 text-[15px] text-choco outline-none transition focus:border-choco ${touched && errors[k] ? "border-clay" : "border-stone"}`}
        aria-invalid={touched && !!errors[k]}
        {...props}
      />
      {touched && errors[k] && <span className="mt-1 block text-[12px] text-clay">{errors[k]}</span>}
    </label>
  );

  return (
    <form onSubmit={submit} noValidate className="grid gap-12 lg:grid-cols-[1fr_400px]">
      <div className="space-y-10">
        <section>
          <h2 className="font-display text-2xl">פרטי התקשרות</h2>
          <p className="mt-2 flex items-center gap-2 text-[14px] text-cocoa">
            <Mail className="h-4 w-4 text-olive" /> אישור ההזמנה יישלח אל <b dir="ltr">{session.user.email}</b>
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {field("fullName", "שם מלא", { autoComplete: "name" })}
            {field("phone", "טלפון", { autoComplete: "tel", inputMode: "tel", dir: "ltr" })}
            {field("businessName", "שם העסק (לא חובה)", { autoComplete: "organization" })}
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl">קבלת ההזמנה</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {(
              [
                ["delivery", Truck, "משלוח עד הבית", `${formatPrice(pricing.shipping.flat)} · 3–5 ימי עסקים מאישור העיצוב`],
                ["pickup", Store, "איסוף עצמי", "ללא עלות · 2 ימי עסקים מאישור העיצוב"],
              ] as const
            ).map(([id, Icon, t, d]) => (
              <button
                key={id}
                type="button"
                onClick={() => set("delivery", id)}
                className={`flex items-start gap-3 rounded-2xl border p-4 text-right transition ${c.delivery === id ? "border-choco bg-cream" : "border-stone hover:border-taupe"}`}
                aria-pressed={c.delivery === id}
              >
                <Icon className="mt-0.5 h-5 w-5 text-olive" strokeWidth={1.5} />
                <span>
                  <span className="block font-medium text-choco">{t}</span>
                  <span className="block text-[13px] text-mocha">{d}</span>
                </span>
              </button>
            ))}
          </div>
          {c.delivery === "delivery" && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {field("city", "עיר", { autoComplete: "address-level2" })}
              {field("street", "רחוב ומספר", { autoComplete: "street-address" })}
            </div>
          )}
          {c.delivery === "pickup" && (
            <fieldset className="mt-4">
              <legend className="mb-2 text-[13px] text-cocoa">נקודת איסוף</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {PICKUP_POINTS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => set("pickupPoint", p.id)}
                    aria-pressed={c.pickupPoint === p.id}
                    className={`flex items-start gap-2 rounded-xl border p-3 text-right transition ${c.pickupPoint === p.id ? "border-choco bg-cream" : touched && errors.pickupPoint ? "border-clay" : "border-stone hover:border-taupe"}`}
                  >
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-olive" strokeWidth={1.5} />
                    <span>
                      <span className="block text-[14px] font-medium text-choco">{p.city}</span>
                      {p.address && <span className="block text-[12.5px] text-mocha">{p.address}</span>}
                    </span>
                  </button>
                ))}
              </div>
              {touched && errors.pickupPoint && <span className="mt-1 block text-[12px] text-clay">{errors.pickupPoint}</span>}
            </fieldset>
          )}
          <label className="mt-4 block">
            <span className="mb-1.5 block text-[13px] text-cocoa">הערות להזמנה (לא חובה)</span>
            <textarea value={c.notes} onChange={(e) => set("notes", e.target.value.slice(0, 500))} rows={3} className="w-full rounded-xl border border-stone bg-ivory px-4 py-3 text-[15px] outline-none focus:border-choco" />
          </label>
        </section>

        <section className="rounded-[24px] border border-dashed border-taupe p-6">
          <h2 className="flex items-center gap-2 font-display text-2xl">
            <CreditCard className="h-6 w-6 text-mocha" strokeWidth={1.3} /> תשלום
          </h2>
          <p className="mt-3 text-[14px] leading-relaxed text-cocoa">
            אין צורך לשלם עכשיו. אחרי שליחת ההזמנה נבדוק את העיצוב, נחזור אלייך לאישור סופי ונתאם את התשלום. תשלום מקוון מאובטח יתווסף בהמשך.
          </p>
          <p className="mt-3 flex items-center gap-2 text-[12.5px] text-mocha">
            <Lock className="h-3.5 w-3.5" /> פרטי אשראי לעולם לא מוזנים או נשמרים באתר
          </p>
        </section>
      </div>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-[28px] bg-cream p-7">
          <h2 className="font-display text-2xl">ההזמנה שלך</h2>
          <ul className="mt-5 space-y-4">
            {cart.items.map((i) => (
              <li key={i.id} className="flex items-center gap-3">
                <div className="checker grid h-14 w-14 shrink-0 place-items-center rounded-xl border border-stone p-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={i.thumbnail} alt="" className="max-h-full max-w-full" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] text-choco">{i.design.name}</p>
                  <p className="text-[12px] text-mocha">
                    {i.quantity} יח׳ · {(i.design.widthMm / 10).toFixed(1)}×{(i.design.heightMm / 10).toFixed(1)} ס״מ
                  </p>
                </div>
                <span className="text-[14px]">{formatPrice(i.quote.total)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-6 space-y-2 border-t border-stone pt-5 text-[15px]">
            <div className="flex justify-between">
              <dt className="text-cocoa">ביניים</dt>
              <dd>{formatPrice(cart.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-cocoa">משלוח</dt>
              <dd>{shipping ? formatPrice(shipping) : "חינם"}</dd>
            </div>
            <div className="flex items-end justify-between pt-3">
              <dt className="text-cocoa">סה״כ</dt>
              <dd className="font-display text-4xl text-choco">{formatPrice(total)}</dd>
            </div>
          </dl>
          {serverError && <p className="mt-5 rounded-xl bg-clay/10 px-3 py-2 text-[13px] text-clay">{serverError}</p>}
          <button type="submit" disabled={sending} className={btn("primary", "lg", "mt-6 w-full")}>
            {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" strokeWidth={1.5} />}
            שליחת ההזמנה
          </button>
          <p className="mt-3 text-center text-[12px] leading-relaxed text-mocha">ללא חיוב. נחזור אלייך לאישור העיצוב והתשלום.</p>
        </div>
      </aside>
    </form>
  );
}
