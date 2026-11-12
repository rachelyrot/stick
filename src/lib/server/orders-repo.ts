import "server-only";
import { db } from "./db";
import { orderCode, type CustomerInfo, type OrderEvent, type OrderItem, type OrderRecord, type OrderStatus } from "@/lib/orders/types";

interface Row {
  id: number;
  user_email: string;
  user_name: string;
  status: string;
  customer_json: string;
  items_json: string;
  subtotal: number;
  shipping: number;
  total: number;
  admin_note: string;
  email_status: string;
  created_at: number;
  updated_at: number;
}

function toRecord(r: Row, events: OrderEvent[] = []): OrderRecord {
  return {
    id: r.id,
    code: orderCode(r.id),
    userEmail: r.user_email,
    userName: r.user_name,
    status: r.status as OrderStatus,
    customer: JSON.parse(r.customer_json) as CustomerInfo,
    items: JSON.parse(r.items_json) as OrderItem[],
    subtotal: r.subtotal,
    shipping: r.shipping,
    total: r.total,
    adminNote: r.admin_note,
    emailStatus: r.email_status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    events,
  };
}

function eventsFor(id: number): OrderEvent[] {
  return (db().prepare("SELECT status, note, by_email, at FROM order_events WHERE order_id = ? ORDER BY at ASC").all(id) as {
    status: OrderStatus;
    note: string | null;
    by_email: string;
    at: number;
  }[]).map((e) => ({ status: e.status, note: e.note ?? undefined, by: e.by_email, at: e.at }));
}

export function createOrder(input: {
  userEmail: string;
  userName: string;
  customer: CustomerInfo;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
}): OrderRecord {
  const now = Date.now();
  const tx = db().transaction(() => {
    const res = db()
      .prepare(
        `INSERT INTO orders (user_email, user_name, status, customer_json, items_json, subtotal, shipping, total, created_at, updated_at)
         VALUES (?, ?, 'received', ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(input.userEmail, input.userName, JSON.stringify(input.customer), JSON.stringify(input.items), input.subtotal, input.shipping, input.total, now, now);
    const id = Number(res.lastInsertRowid);
    db().prepare("INSERT INTO order_events (order_id, status, note, by_email, at) VALUES (?, 'received', NULL, ?, ?)").run(id, input.userEmail, now);
    return id;
  });
  return getOrder(tx())!;
}

export function getOrder(id: number): OrderRecord | null {
  const r = db().prepare("SELECT * FROM orders WHERE id = ?").get(id) as Row | undefined;
  return r ? toRecord(r, eventsFor(r.id)) : null;
}

export function listOrders(filter: { status?: string; userEmail?: string } = {}): OrderRecord[] {
  const where: string[] = [];
  const args: string[] = [];
  if (filter.status) {
    where.push("status = ?");
    args.push(filter.status);
  }
  if (filter.userEmail) {
    where.push("user_email = ?");
    args.push(filter.userEmail);
  }
  const sql = `SELECT * FROM orders ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY created_at DESC LIMIT 500`;
  return (db().prepare(sql).all(...args) as Row[]).map((r) => toRecord(r));
}

export function updateStatus(id: number, status: OrderStatus, by: string, note?: string): OrderRecord | null {
  const now = Date.now();
  db().transaction(() => {
    db().prepare("UPDATE orders SET status = ?, updated_at = ? WHERE id = ?").run(status, now, id);
    db().prepare("INSERT INTO order_events (order_id, status, note, by_email, at) VALUES (?, ?, ?, ?, ?)").run(id, status, note || null, by, now);
  })();
  return getOrder(id);
}

export function setAdminNote(id: number, note: string) {
  db().prepare("UPDATE orders SET admin_note = ?, updated_at = ? WHERE id = ?").run(note, Date.now(), id);
}

export function setEmailStatus(id: number, s: string) {
  db().prepare("UPDATE orders SET email_status = ? WHERE id = ?").run(s, id);
}

export function orderStats() {
  const byStatus = db().prepare("SELECT status, COUNT(*) AS n FROM orders GROUP BY status").all() as { status: string; n: number }[];
  const totals = db()
    .prepare("SELECT COUNT(*) AS n, COALESCE(SUM(total),0) AS revenue FROM orders WHERE status != 'cancelled'")
    .get() as { n: number; revenue: number };
  const month = db()
    .prepare("SELECT COUNT(*) AS n, COALESCE(SUM(total),0) AS revenue FROM orders WHERE status != 'cancelled' AND created_at >= ?")
    .get(new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime()) as { n: number; revenue: number };
  return { byStatus: Object.fromEntries(byStatus.map((r) => [r.status, r.n])) as Record<string, number>, totals, month };
}
