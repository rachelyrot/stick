/**
 * ספריית הגופנים של הסטודיו. כל הגופנים נטענים מ-Google Fonts.
 * thin=true מסמן גופן עם קווים דקים — נדרש גודל מינימלי גדול יותר לחיתוך.
 */
export interface FontDef {
  id: string;
  family: string;
  label: string;
  weight: number;
  hebrew: boolean;
  category: "serif" | "sans" | "script" | "display" | "rounded";
  thin?: boolean;
}

export const FONTS: FontDef[] = [
  { id: "frank", family: "Frank Ruhl Libre", label: "פרנק רוהל", weight: 500, hebrew: true, category: "serif" },
  { id: "suez", family: "Suez One", label: "סואץ", weight: 400, hebrew: true, category: "serif" },
  { id: "bellefair", family: "Bellefair", label: "בלפייר", weight: 400, hebrew: true, category: "serif", thin: true },
  { id: "heebo", family: "Heebo", label: "היבו", weight: 600, hebrew: true, category: "sans" },
  { id: "rubik", family: "Rubik", label: "רוביק", weight: 500, hebrew: true, category: "rounded" },
  { id: "varela", family: "Varela Round", label: "וארלה", weight: 400, hebrew: true, category: "rounded" },
  { id: "fredoka", family: "Fredoka", label: "פרדוקה", weight: 600, hebrew: true, category: "rounded" },
  { id: "secular", family: "Secular One", label: "סקולר", weight: 400, hebrew: true, category: "display" },
  { id: "karantina", family: "Karantina", label: "קרנטינה", weight: 700, hebrew: true, category: "display" },
  { id: "amatic", family: "Amatic SC", label: "אמאטיק", weight: 700, hebrew: true, category: "script", thin: true },
  { id: "playfair", family: "Playfair Display", label: "Playfair", weight: 600, hebrew: false, category: "serif" },
  { id: "cormorant", family: "Cormorant Garamond", label: "Cormorant", weight: 600, hebrew: false, category: "serif" },
  { id: "montserrat", family: "Montserrat", label: "Montserrat", weight: 600, hebrew: false, category: "sans" },
  { id: "pacifico", family: "Pacifico", label: "Pacifico", weight: 400, hebrew: false, category: "script" },
  { id: "dancing", family: "Dancing Script", label: "Dancing", weight: 700, hebrew: false, category: "script" },
  { id: "greatvibes", family: "Great Vibes", label: "Great Vibes", weight: 400, hebrew: false, category: "script", thin: true },
];

export const getFont = (id: string): FontDef => FONTS.find((f) => f.id === id) ?? FONTS[0];

/** כתובת Google Fonts אחת לכל הספרייה + גופני הממשק */
export function googleFontsHref(): string {
  const ui = [
    "family=Assistant:wght@300;400;500;600;700",
    "family=Frank+Ruhl+Libre:wght@300;400;500;700",
    "family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500",
  ];
  const lib = FONTS.filter((f) => !["Frank Ruhl Libre", "Cormorant Garamond"].includes(f.family)).map(
    (f) => `family=${f.family.replace(/ /g, "+")}:wght@${f.weight}`
  );
  return `https://fonts.googleapis.com/css2?${[...ui, ...lib].join("&")}&display=swap`;
}
