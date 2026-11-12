import { NextResponse } from "next/server";
import { getSession } from "@/lib/server/auth";
import { orderInputSchema } from "@/lib/server/validate";
import { createOrder, getOrder, setEmailStatus } from "@/lib/server/orders-repo";
import { sendOrderEmails } from "@/lib/server/mailer";
import { quoteDesign, shippingFor } from "@/lib/pricing/engine";
import { getPricing } from "@/lib/server/pricing-store";
import { loadCatalog } from "@/lib/server/catalog-store";
import { preflight, blocksCheckout } from "@/lib/production/preflight";
import type { Design } from "@/lib/design/types";
import type { OrderItem } from "@/lib/orders/types";

export const runtime = "nodejs";
const MAX_BYTES = 20 * 1024 * 1024;

export async function POST(req: Request) {
  const session = await getSession();
  const email = session?.user?.email?.toLowerCase();
  if (!email) return NextResponse.json({ error: "יש להתחבר כדי להזמין." }, { status: 401 });

  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > MAX_BYTES) return NextResponse.json({ error: "ההזמנה גדולה מדי (קבצים כבדים מדי)." }, { status: 413 });
  const raw = await req.text();
  if (raw.length > MAX_BYTES) return NextResponse.json({ error: "ההזמנה גדולה מדי." }, { status: 413 });

  let parsed;
  try {
    parsed = orderInputSchema.safeParse(JSON.parse(raw));
  } catch {
    return NextResponse.json({ error: "בקשה לא תקינה." }, { status: 400 });
  }
  if (!parsed.success) {
    return NextResponse.json({ error: "חלק מהפרטים אינם תקינים.", issues: parsed.error.issues.slice(0, 5).map((i) => i.path.join(".")) }, { status: 422 });
  }
  const { customer, items } = parsed.data;
  if (customer.delivery === "delivery" && (customer.city.length < 2 || customer.street.length < 3)) {
    return NextResponse.json({ error: "נא למלא כתובת למשלוח." }, { status: 422 });
  }
  if (customer.delivery === "pickup" && !customer.pickupPoint) {
    return NextResponse.json({ error: "נא לבחור נקודת איסוף." }, { status: 422 });
  }

  // מחירים ובדיקות ייצור מחושבים מחדש בשרת — לא סומכים על הדפדפן
  const pricing = getPricing();
  loadCatalog();
  const orderItems: OrderItem[] = [];
  for (const it of items) {
    const design = it.design as Design;
    if (blocksCheckout(preflight(design, {}))) {
      return NextResponse.json({ error: `העיצוב "${design.name}" אינו מתאים לייצור (מידות, צבע או חומר). פתחו אותו בסטודיו לבדיקה.` }, { status: 422 });
    }
    orderItems.push({ id: it.id, design, quantity: it.quantity, thumbnail: it.thumbnail, quote: quoteDesign(design, it.quantity, pricing) });
  }
  const subtotal = Math.round(orderItems.reduce((s, i) => s + i.quote.total, 0) * 100) / 100;
  const shipping = shippingFor(subtotal, customer.delivery, pricing);

  const order = createOrder({
    userEmail: email,
    userName: session?.user?.name ?? customer.fullName,
    customer,
    items: orderItems,
    subtotal,
    shipping,
    total: Math.round((subtotal + shipping) * 100) / 100,
  });

  const mail = await sendOrderEmails(order);
  setEmailStatus(order.id, mail.customer.sent ? "sent" : `not-sent:${mail.customer.error ?? ""}`);

  return NextResponse.json({ id: order.id, code: getOrder(order.id)!.code, emailSent: mail.customer.sent });
}
