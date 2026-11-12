/**
 * ספריית צורות וקטוריות. כל הנתיבים מנורמלים לתיבה של 100x100 יחידות.
 * evenodd=true — צורה עם "חור" (מסגרות), נחתכת כקו מתאר כפול.
 */
export interface ShapeDef {
  id: string;
  label: string;
  group: "basic" | "frames" | "decor" | "icons";
  d: string;
  evenodd?: boolean;
}

const star = (points: number, outer: number, inner: number, rot = -90): string => {
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = ((rot + (i * 180) / points) * Math.PI) / 180;
    pts.push(`${(50 + r * Math.cos(a)).toFixed(2)},${(50 + r * Math.sin(a)).toFixed(2)}`);
  }
  return `M${pts.join("L")}Z`;
};

const polygon = (sides: number, r: number, rot = -90): string => {
  const pts: string[] = [];
  for (let i = 0; i < sides; i++) {
    const a = ((rot + (i * 360) / sides) * Math.PI) / 180;
    pts.push(`${(50 + r * Math.cos(a)).toFixed(2)},${(50 + r * Math.sin(a)).toFixed(2)}`);
  }
  return `M${pts.join("L")}Z`;
};

const circle = (cx: number, cy: number, r: number) =>
  `M${cx - r},${cy}a${r},${r} 0 1,0 ${r * 2},0a${r},${r} 0 1,0 ${-r * 2},0Z`;

const roundRect = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h - r}Q${x + w},${y + h} ${x + w - r},${y + h}H${x + r}Q${x},${y + h} ${x},${y + h - r}V${y + r}Q${x},${y} ${x + r},${y}Z`;

export const SHAPES: ShapeDef[] = [
  { id: "circle", label: "עיגול", group: "basic", d: circle(50, 50, 50) },
  {
    id: "heart",
    label: "לב",
    group: "basic",
    d: "M50,92C48,90 6,62 6,33C6,16 19,6 32,6C41,6 47,11 50,18C53,11 59,6 68,6C81,6 94,16 94,33C94,62 52,90 50,92Z",
  },
  { id: "star", label: "כוכב", group: "basic", d: star(5, 50, 21) },
  { id: "hexagon", label: "משושה", group: "basic", d: polygon(6, 50, 0) },
  { id: "triangle", label: "משולש", group: "basic", d: "M50,4L97,92H3Z" },
  { id: "diamond", label: "מעוין", group: "basic", d: "M50,0L100,50L50,100L0,50Z" },
  { id: "pill", label: "גלולה", group: "basic", d: roundRect(0, 25, 100, 50, 25) },
  { id: "square", label: "ריבוע מעוגל", group: "basic", d: roundRect(0, 0, 100, 100, 14) },

  { id: "ring", label: "מסגרת עגולה", group: "frames", d: circle(50, 50, 50) + circle(50, 50, 44), evenodd: true },
  {
    id: "frame-rect",
    label: "מסגרת מלבנית",
    group: "frames",
    d: roundRect(0, 0, 100, 100, 10) + roundRect(5, 5, 90, 90, 6),
    evenodd: true,
  },
  {
    id: "frame-arch",
    label: "קשת",
    group: "frames",
    d: "M0,100V45A50,45 0 0,1 100,45V100Z M5,95V45.5A45,40.5 0 0,1 95,45.5V95Z",
    evenodd: true,
  },
  {
    id: "frame-oval",
    label: "מסגרת אובלית",
    group: "frames",
    d: "M0,50A50,32 0 1,0 100,50A50,32 0 1,0 0,50Z M5,50A45,27 0 1,0 95,50A45,27 0 1,0 5,50Z",
    evenodd: true,
  },
  { id: "underline", label: "קו תחתון", group: "frames", d: "M0,46Q50,36 100,46L100,54Q50,44 0,54Z" },

  { id: "sparkle", label: "נצנוץ", group: "decor", d: "M50,0C53,35 65,47 100,50C65,53 53,65 50,100C47,65 35,53 0,50C35,47 47,35 50,0Z" },
  { id: "leaf", label: "עלה", group: "decor", d: "M50,2C82,18 92,52 50,98C8,52 18,18 50,2ZM50,14L49,90L51,90Z", evenodd: true },
  {
    id: "flower",
    label: "פרח",
    group: "decor",
    d:
      circle(50, 22, 20) +
      circle(78, 42, 20) +
      circle(68, 74, 20) +
      circle(32, 74, 20) +
      circle(22, 42, 20) +
      circle(50, 50, 18),
  },
  {
    id: "branch",
    label: "ענף",
    group: "decor",
    d: "M4,52Q50,46 96,52L96,55Q50,49 4,55Z M24,50Q20,30 34,22Q36,40 24,50Z M24,55Q22,74 36,80Q36,62 24,55Z M48,49Q46,28 60,20Q62,38 48,49Z M48,54Q48,74 62,80Q60,61 48,54Z M72,50Q72,32 86,26Q86,42 72,50Z M72,55Q74,72 88,76Q86,60 72,55Z",
  },
  { id: "wave", label: "גל", group: "decor", d: "M0,45Q12.5,30 25,45T50,45T75,45T100,45V55Q87.5,40 75,55T50,55T25,55T0,55Z" },
  { id: "dots", label: "נקודות", group: "decor", d: circle(12, 50, 10) + circle(50, 50, 10) + circle(88, 50, 10) },

  {
    id: "moon",
    label: "ירח",
    group: "icons",
    d: "M62,4A48,48 0 1,0 96,72A40,40 0 1,1 62,4Z",
  },
  { id: "sun", label: "שמש", group: "icons", d: circle(50, 50, 22) + star(12, 50, 30, -90) + circle(50, 50, 26), evenodd: true },
  {
    id: "crown",
    label: "כתר",
    group: "icons",
    d: "M6,30L28,52L50,14L72,52L94,30L86,84H14Z M14,90H86V98H14Z",
  },
  {
    id: "paw",
    label: "כף רגל",
    group: "icons",
    d:
      "M50,48C66,48 80,66 80,80C80,92 68,96 50,90C32,96 20,92 20,80C20,66 34,48 50,48Z" +
      circle(22, 40, 10) +
      circle(40, 20, 11) +
      circle(60, 20, 11) +
      circle(78, 40, 10),
  },
  { id: "arrow", label: "חץ", group: "icons", d: "M0,44H70V28L100,50L70,72V56H0Z" },
  {
    id: "cup",
    label: "כוס קפה",
    group: "icons",
    d: "M12,30H74V64C74,82 62,94 43,94C24,94 12,82 12,64Z M74,38H82C93,38 98,46 98,54C98,64 90,70 80,70H74V62H80C86,62 90,59 90,54C90,49 86,46 82,46H74Z M30,4Q24,14 30,22L34,20Q30,14 35,6Z M46,4Q40,14 46,22L50,20Q46,14 51,6Z",
  },
  {
    id: "house",
    label: "בית",
    group: "icons",
    d: "M50,4L98,46H86V96H60V66H40V96H14V46H2Z",
  },
];

export const getShape = (id: string): ShapeDef => SHAPES.find((s) => s.id === id) ?? SHAPES[0];

export const SHAPE_GROUPS: { id: ShapeDef["group"]; label: string }[] = [
  { id: "basic", label: "צורות בסיס" },
  { id: "frames", label: "מסגרות וקווים" },
  { id: "decor", label: "אלמנטים דקורטיביים" },
  { id: "icons", label: "אייקונים" },
];
