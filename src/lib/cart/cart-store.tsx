"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import type { Design } from "@/lib/design/types";
import { quoteDesign, type Quote } from "@/lib/pricing/engine";
import { usePricing } from "@/lib/pricing/pricing-context";
import { uid } from "@/lib/design/factory";

/**
 * סל קניות — כמו בחנות אמיתית:
 * - אורחת (לא מחוברת): הסל נשמר בדפדפן (localStorage) — לכל דפדפן סל משלו.
 * - בכניסה לחשבון: פריטי האורחת מתמזגים לסל האישי בשרת ונמחקים מהדפדפן.
 * - מחוברת: הסל נשמר בשרת לפי כתובת המייל — זמין מכל מכשיר, ולא נחשף למי שמשתמש אחריה באותו מחשב.
 * - ביציאה מהחשבון: מוצג סל אורחת ריק; הסל האישי נשאר שמור בחשבון.
 * כל פריט מחזיק את נתוני העיצוב המלאים (לייצור ולעריכה), ולא רק תמונה.
 */
export interface CartItem {
  id: string;
  design: Design;
  thumbnail: string;
  quantity: number;
  quote: Quote;
  productSlug?: string;
  addedAt: number;
}

type StoredItem = Omit<CartItem, "quote">;

interface CartContextValue {
  items: CartItem[];
  ready: boolean;
  count: number;
  subtotal: number;
  add: (design: Design, quantity: number, thumbnail: string, productSlug?: string) => CartItem;
  update: (id: string, design: Design, quantity: number, thumbnail: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  get: (id: string) => CartItem | undefined;
  storageError: string | null;
  lastAdded: CartItem | null;
  dismissLastAdded: () => void;
}

const GUEST_KEY = "stick-studio:cart:guest:v2";
/** מפתחות ישנים — סל משותף לכל מי שהשתמש בדפדפן. נמחקים. */
const LEGACY_KEYS = ["stick-studio:cart:v1"];
const GUEST = "guest";
const SAVE_DELAY_MS = 500;

const CartContext = createContext<CartContextValue | null>(null);

const slim = (items: CartItem[]): StoredItem[] =>
  items.map(({ id, design, thumbnail, quantity, productSlug, addedAt }) => ({ id, design, thumbnail, quantity, productSlug, addedAt }));

function readGuest(): StoredItem[] {
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function removeKey(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* אין גישה לאחסון */
  }
}

async function putServerCart(items: StoredItem[], keepalive = false) {
  const body = JSON.stringify({ items });
  const res = await fetch("/api/cart", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body,
    // keepalive מוגבל ל-64KB — רק לשמירה אחרונה לפני עזיבת הדף
    keepalive: keepalive && body.length < 60_000,
  });
  if (!res.ok) throw new Error(String(res.status));
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const email = status === "authenticated" ? session?.user?.email?.toLowerCase() ?? null : null;
  /** בעלת הסל הנוכחי: "guest" או כתובת מייל. undefined = עוד לא ידוע אם מחוברת */
  const owner = status === "loading" ? undefined : (email ?? GUEST);

  const [items, setItems] = useState<CartItem[]>([]);
  const [loadedOwner, setLoadedOwner] = useState<string | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [lastAdded, setLastAdded] = useState<CartItem | null>(null);
  const pricing = usePricing();
  const pricingRef = useRef(pricing);
  pricingRef.current = pricing;

  /** מה שנשמר לאחרונה (למניעת שמירות מיותרות) */
  const lastSaved = useRef<string>("");
  /** שמירה לשרת שממתינה (debounce) */
  const pending = useRef<{ timer: ReturnType<typeof setTimeout>; items: StoredItem[] } | null>(null);
  /** אם טעינת הסל מהשרת נכשלה — לא דורסים אותו */
  const syncBlocked = useRef(false);

  const ready = owner !== undefined && loadedOwner === owner;

  const hydrate = useCallback(
    (stored: StoredItem[]): CartItem[] =>
      stored
        .filter((i) => i && i.id && i.design)
        .map((i) => ({ ...i, quote: quoteDesign(i.design, i.quantity, pricingRef.current) })),
    []
  );

  const flushPending = useCallback((keepalive = false) => {
    const p = pending.current;
    if (!p) return;
    clearTimeout(p.timer);
    pending.current = null;
    putServerCart(p.items, keepalive).catch(() => {});
  }, []);

  // טעינת הסל בכל החלפת בעלים (טעינת דף / כניסה / יציאה)
  useEffect(() => {
    if (owner === undefined) return;
    let cancelled = false;
    flushPending();
    LEGACY_KEYS.forEach(removeKey);
    setLoadedOwner(null);
    setLastAdded(null);
    setStorageError(null);
    syncBlocked.current = false;

    if (owner === GUEST) {
      const guest = readGuest();
      lastSaved.current = JSON.stringify(guest);
      setItems(hydrate(guest));
      setLoadedOwner(GUEST);
      return;
    }

    setItems([]);
    (async () => {
      const guest = readGuest();
      try {
        const res = await fetch("/api/cart", { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as { items?: StoredItem[] };
        const server = Array.isArray(data.items) ? data.items : [];
        // מיזוג: פריטים שנבחרו כאורחת מצטרפים לסל האישי
        const ids = new Set(server.map((i) => i.id));
        const merged = [...server, ...guest.filter((i) => !ids.has(i.id))];
        if (guest.length) {
          await putServerCart(merged);
          removeKey(GUEST_KEY);
        }
        if (cancelled) return;
        lastSaved.current = JSON.stringify(merged);
        setItems(hydrate(merged));
      } catch {
        if (cancelled) return;
        // לא דורסים את הסל השמור בשרת; מציגים את פריטי האורחת בינתיים
        syncBlocked.current = true;
        lastSaved.current = JSON.stringify(guest);
        setItems(hydrate(guest));
        setStorageError("לא הצלחנו לטעון את הסל מהחשבון. נסו לרענן את הדף.");
      }
      if (!cancelled) setLoadedOwner(owner);
    })();

    return () => {
      cancelled = true;
    };
  }, [owner, hydrate, flushPending]);

  // שמירת הסל בכל שינוי
  useEffect(() => {
    if (!ready || owner === undefined) return;
    const stored = slim(items);
    const json = JSON.stringify(stored);
    if (json === lastSaved.current) return;

    if (owner === GUEST) {
      try {
        localStorage.setItem(GUEST_KEY, json);
        lastSaved.current = json;
        setStorageError(null);
      } catch {
        setStorageError("הדפדפן לא הצליח לשמור את הסל (ייתכן שהקבצים שהועלו גדולים מדי). הסל יישמר עד לסגירת הלשונית.");
      }
      return;
    }

    if (syncBlocked.current) return;
    if (pending.current) clearTimeout(pending.current.timer);
    const timer = setTimeout(() => {
      pending.current = null;
      putServerCart(stored)
        .then(() => {
          lastSaved.current = json;
          setStorageError(null);
        })
        .catch(() => setStorageError("לא הצלחנו לשמור את הסל בחשבון. בדקו את החיבור לאינטרנט."));
    }, SAVE_DELAY_MS);
    pending.current = { timer, items: stored };
  }, [items, ready, owner]);

  // שמירה אחרונה לפני סגירת הלשונית
  useEffect(() => {
    const onHide = () => flushPending(true);
    window.addEventListener("pagehide", onHide);
    return () => window.removeEventListener("pagehide", onHide);
  }, [flushPending]);

  // אם המחירון השתנה — מחשבים מחדש את מחירי הסל
  useEffect(() => {
    setItems((prev) => prev.map((i) => ({ ...i, quote: quoteDesign(i.design, i.quantity, pricing) })));
  }, [pricing]);

  const add = useCallback((design: Design, quantity: number, thumbnail: string, productSlug?: string) => {
    const item: CartItem = {
      id: uid("ci"),
      design: { ...design, updatedAt: Date.now() },
      thumbnail,
      quantity,
      quote: quoteDesign(design, quantity, pricingRef.current),
      productSlug,
      addedAt: Date.now(),
    };
    setItems((prev) => [...prev, item]);
    setLastAdded(item);
    return item;
  }, []);

  const update = useCallback((id: string, design: Design, quantity: number, thumbnail: string) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, design: { ...design, updatedAt: Date.now() }, quantity, thumbnail, quote: quoteDesign(design, quantity, pricingRef.current) } : i
      )
    );
  }, []);

  const setQuantity = useCallback((id: string, quantity: number) => {
    const q = Math.max(1, Math.min(999, Math.floor(quantity) || 1));
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: q, quote: quoteDesign(i.design, q, pricingRef.current) } : i)));
  }, []);

  const remove = useCallback((id: string) => setItems((prev) => prev.filter((i) => i.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      ready,
      count: items.reduce((s, i) => s + i.quantity, 0),
      subtotal: Math.round(items.reduce((s, i) => s + i.quote.total, 0) * 100) / 100,
      add,
      update,
      setQuantity,
      remove,
      clear,
      get: (id) => items.find((i) => i.id === id),
      storageError,
      lastAdded,
      dismissLastAdded: () => setLastAdded(null),
    }),
    [items, ready, add, update, setQuantity, remove, clear, storageError, lastAdded]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
