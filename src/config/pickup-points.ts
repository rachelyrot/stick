/** נקודות איסוף עצמי (ללא עלות) */
export const PICKUP_POINTS = [
  { id: "bnei-brak", city: "בני ברק", address: "מעונות ויז׳ניץ 10" },
  { id: "emanuel", city: "עמנואל", address: "פנחס לוין 21" },
  { id: "achisamach", city: "אחיסמך", address: "" },
  { id: "jerusalem", city: "ירושלים", address: "מעלות דפנה" },
] as const;

export type PickupPointId = (typeof PICKUP_POINTS)[number]["id"];

export const PICKUP_POINT_IDS = PICKUP_POINTS.map((p) => p.id) as [PickupPointId, ...PickupPointId[]];

/** תיאור נקודת איסוף לתצוגה, לדוגמה "בני ברק — מעונות ויז׳ניץ 10" */
export function pickupLabel(id?: string): string {
  const p = PICKUP_POINTS.find((x) => x.id === id);
  if (!p) return "איסוף עצמי בתיאום";
  return p.address ? `${p.city} — ${p.address}` : p.city;
}
