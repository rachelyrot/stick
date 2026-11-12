import { fitWidthInArea, getMockup, mockupScale } from "@/data/mockups";
import type { Design } from "@/lib/design/types";
import { DesignSvg } from "./DesignRender";
import { Camera } from "lucide-react";
import { getRealPhoto } from "@/data/real-photos";

interface Props {
  mockupId: string;
  design: Design;
  colorOverride?: string;
  className?: string;
  /** מכפיל לגודל המדבקה בתוך אזור ההדבקה */
  scale?: number;
  /** קנה מידה אמיתי: המדבקה מוצגת בגודלה הפיזי ביחס לחפץ */
  real?: boolean;
  /** המידה האמיתית של החפץ של הלקוח/ה (רוחב/קוטר בס"מ) */
  objectCm?: number;
  eager?: boolean;
  /** לא להחליף לתמונה אמיתית במעבר עכבר (למשל בזמן עריכה) */
  noReveal?: boolean;
  children?: React.ReactNode;
}

/**
 * הדמיה סטטית: תמונת חפץ + המדבקה כשכבה נפרדת (SVG) מעליה.
 * המדבקה אינה "נאפית" לתוך התמונה — כך ניתן לשנות טקסט/צבע/גודל בזמן אמת.
 */
export function MockupPreview({ mockupId, design, colorOverride, className = "", scale = 1, real, objectCm, eager, noReveal, children }: Props) {
  const m = getMockup(mockupId);
  const photo = noReveal ? undefined : getRealPhoto(mockupId, design);
  const r = real ? mockupScale(m, design.widthMm, objectCm) : null;
  const w = r ? r.width : fitWidthInArea(m.area, m.width, m.height, design.widthMm, design.heightMm) * scale;
  return (
    <div className={`group/real relative overflow-hidden bg-sand ${className}`} style={{ aspectRatio: `${m.width} / ${m.height}` }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={m.src} alt={`הדמיה: ${m.label}`} className="absolute inset-0 h-full w-full object-cover" loading={eager ? "eager" : "lazy"} draggable={false} />
      <div
        className="vinyl-layer absolute transition-[width,transform] duration-300"
        style={{
          // ערכים מעוגלים — כדי שה-HTML מהשרת יהיה זהה לזה שבדפדפן
          left: `${+(m.area.cx * 100).toFixed(3)}%`,
          top: `${+(m.area.cy * 100).toFixed(3)}%`,
          width: `${+(w * 100).toFixed(3)}%`,
          transform: `translate(-50%, -50%)${r && r.scaleX < 0.9995 ? ` scaleX(${r.scaleX.toFixed(4)})` : ""}`,
        }}
      >
        <DesignSvg design={design} colorOverride={colorOverride} className="block h-auto w-full" />
      </div>
      {photo && (
        <figure className="pointer-events-none absolute inset-0 m-0 opacity-0 transition-opacity duration-500 ease-out group-hover/real:opacity-100" style={{ background: photo.bg }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.src} alt={photo.alt} loading="lazy" className="h-full w-full object-cover" draggable={false} />
          <figcaption className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-choco/80 px-3 py-1 text-[11.5px] text-ivory backdrop-blur">
            <Camera className="h-3.5 w-3.5" strokeWidth={1.7} />
            {photo.caption}
          </figcaption>
        </figure>
      )}
      {children}
    </div>
  );
}
