import type { Design } from "@/lib/design/types";
import type { Quote } from "@/lib/pricing/engine";

/** סטטוסים של הזמנה — בסדר התהליך */
export const ORDER_STATUSES = [
  { id: "received", label: "הזמנה התקבלה", tone: "bg-sand text-choco" },
  { id: "awaiting-approval", label: "ממתין לאישור עיצוב", tone: "bg-[#f3e3c3] text-[#7a5212]" },
  { id: "preparing", label: "בהכנה", tone: "bg-olive-soft text-olive-dark" },
  { id: "cutting", label: "בחיתוך", tone: "bg-olive-soft text-olive-dark" },
  { id: "ready", label: "מוכן", tone: "bg-olive text-ivory" },
  { id: "shipped", label: "נשלח", tone: "bg-choco text-ivory" },
  { id: "completed", label: "הושלם", tone: "bg-ink text-ivory" },
  { id: "cancelled", label: "בוטלה", tone: "bg-clay/15 text-clay" },
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number]["id"];

export const statusInfo = (id: string) => ORDER_STATUSES.find((s) => s.id === id) ?? ORDER_STATUSES[0];

export interface CustomerInfo {
  fullName: string;
  phone: string;
  delivery: "delivery" | "pickup";
  /** נקודת איסוף (כשבוחרים איסוף עצמי) — מזהה מ-PICKUP_POINTS */
  pickupPoint?: string;
  city: string;
  street: string;
  notes: string;
  businessName?: string;
}

export interface OrderItem {
  id: string;
  design: Design;
  quantity: number;
  quote: Quote;
  thumbnail: string;
}

export interface OrderEvent {
  status: OrderStatus;
  at: number;
  by: string;
  note?: string;
}

export interface OrderRecord {
  id: number;
  code: string;
  userEmail: string;
  userName: string;
  status: OrderStatus;
  customer: CustomerInfo;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  adminNote: string;
  emailStatus: string;
  createdAt: number;
  updatedAt: number;
  events: OrderEvent[];
}

export const orderCode = (id: number) => `SB-${1000 + id}`;
