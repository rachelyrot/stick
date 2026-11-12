import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ChevronLeft, Package } from "lucide-react";
import { getSession } from "@/lib/server/auth";
import { listOrders } from "@/lib/server/orders-repo";
import { Container, btn } from "@/components/ui/primitives";
import { StatusBadge, fmtDate } from "@/components/orders/OrderParts";
import { formatPrice } from "@/lib/pricing/engine";

export const metadata: Metadata = { title: "ההזמנות שלי" };
export const dynamic = "force-dynamic";

export default async function MyOrdersPage() {
  const session = await getSession();
  if (!session?.user?.email) redirect("/login?callbackUrl=/account/orders");
  const orders = listOrders({ userEmail: session.user.email.toLowerCase() });

  return (
    <Container className="pb-10 pt-12 lg:pt-16">
      <h1 className="font-display text-5xl font-light text-choco md:text-6xl">ההזמנות שלי</h1>
      <p className="mt-3 text-cocoa">מחובר/ת כ-{session.user.email}</p>
      {orders.length === 0 ? (
        <div className="mt-12 rounded-[28px] border border-dashed border-taupe p-14 text-center">
          <Package className="mx-auto h-12 w-12 text-taupe" strokeWidth={1} />
          <p className="mt-4 font-display text-2xl">עדיין אין הזמנות</p>
          <Link href="/studio" className={btn("primary", "lg", "mt-6")}>
            לעצב מדבקה ראשונה
          </Link>
        </div>
      ) : (
        <ul className="mt-10 divide-y divide-stone border-y border-stone">
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/account/orders/${o.id}`} className="flex flex-wrap items-center gap-4 py-5 transition hover:bg-cream sm:px-3">
                <div className="flex -space-x-3 space-x-reverse">
                  {o.items.slice(0, 3).map((it) => (
                    <div key={it.id} className="checker grid h-14 w-14 place-items-center rounded-xl border-2 border-ivory p-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={it.thumbnail} alt="" className="max-h-full max-w-full" />
                    </div>
                  ))}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-xl">{o.code}</p>
                  <p className="text-[13px] text-mocha">
                    {fmtDate(o.createdAt)} · {o.items.length} עיצובים
                  </p>
                </div>
                <StatusBadge status={o.status} />
                <span className="font-display text-xl">{formatPrice(o.total)}</span>
                <ChevronLeft className="h-5 w-5 text-mocha" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
