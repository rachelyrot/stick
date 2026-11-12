"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ElementContent, VinylDefs, elementTransform, useSvgPrefix } from "@/components/design/DesignRender";
import type { BoxMap, Design, DesignElement, LocalBox } from "@/lib/design/types";
import { elementSig, estimateLocalBox, scaleElement } from "@/lib/design/geometry";
import { MACHINE } from "@/config/production";

export type CanvasBg = "paper" | "dark" | "checker";

interface Props {
  design: Design;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onBegin: () => void;
  onPreview: (updater: (d: Design) => Design) => void;
  onMeasure: (boxes: BoxMap) => void;
  onEditText: (id: string) => void;
  zoom: number;
  bg: CanvasBg;
}

type Drag =
  | { kind: "move"; id: string; start: DOMPoint; orig: DesignElement }
  | { kind: "scale"; id: string; startDist: number; orig: DesignElement }
  | { kind: "rotate"; id: string; startAngle: number; orig: DesignElement };

/**
 * משטח החיתוך — כמו המשטח של המכונה: 30×30 ס"מ (משטח 12×12 אינץ').
 * המדבקה מונחת במרכז המשטח בגודלה האמיתי, כך שרואים מיד כמה היא גדולה.
 */
const MAT = MACHINE.maxWidthCm * 10;
/** שוליים סביב המשטח (מ"מ) — למספרי הסרגל */
const MAT_MARGIN = 16;
const VB_MIN = -MAT_MARGIN;
const VB_SIZE = MAT + MAT_MARGIN * 2;
/** גודל התצוגה (ביחידות מ"מ) — לחישוב זום "התמקדות במדבקה" */
export const MAT_VIEW_MM = VB_SIZE;

const MAT_THEME: Record<CanvasBg, { body: string; grid: string; major: string; num: string; edge: string }> = {
  paper: { body: "#EFE8DC", grid: "#E0D5C3", major: "#C9B9A0", num: "#8a7360", edge: "#D8CBB6" },
  checker: { body: "#EFE8DC", grid: "#E0D5C3", major: "#C9B9A0", num: "#8a7360", edge: "#D8CBB6" },
  dark: { body: "#241a15", grid: "#3a2d25", major: "#5a4638", num: "#b8a893", edge: "#4a3a2f" },
};

/** הפינה של המדבקה על המשטח, לפי המרכז השמור — תמיד בתוך המשטח */
const matOrigin = (center: number | undefined, size: number) => Math.min(Math.max(0, MAT - size), Math.max(0, (center ?? MAT / 2) - size / 2));

export function DesignCanvas({ design, selectedId, onSelect, onBegin, onPreview, onMeasure, onEditText, zoom, bg }: Props) {
  const prefix = useSvgPrefix();
  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const artRef = useRef<SVGGElement>(null);
  const contentRefs = useRef(new Map<string, SVGGElement>());
  const [wrapSize, setWrapSize] = useState({ w: 600, h: 400 });
  const [boxes, setBoxes] = useState<BoxMap>({});
  const [drag, setDrag] = useState<Drag | null>(null);
  const [guides, setGuides] = useState<{ v: boolean; h: boolean }>({ v: false, h: false });

  const designRef = useRef(design);
  designRef.current = design;
  const W = design.widthMm;
  const H = design.heightMm;
  // מיקום המדבקה על המשטח (ברירת מחדל: מרכז המשטח; זזה יחד עם העיצוב)
  const ox = matOrigin(design.matCx, W);
  const oy = matOrigin(design.matCy, H);
  const fit = Math.min(wrapSize.w / VB_SIZE, wrapSize.h / VB_SIZE);
  const pxPerUnit = fit * zoom;
  const unitsPerPx = 1 / pxPerUnit;
  const theme = MAT_THEME[bg];

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWrapSize({ w: Math.max(200, e.contentRect.width - 32), h: Math.max(200, e.contentRect.height - 32) }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // בכל שינוי זום — ממרכזים את התצוגה על המדבקה
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const d = designRef.current;
    const cx = 16 + (matOrigin(d.matCx, d.widthMm) + d.widthMm / 2 - VB_MIN) * pxPerUnit;
    const cy = 16 + (matOrigin(d.matCy, d.heightMm) + d.heightMm / 2 - VB_MIN) * pxPerUnit;
    el.scrollLeft = cx - el.clientWidth / 2;
    el.scrollTop = cy - el.clientHeight / 2;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, wrapSize.w, wrapSize.h]);

  // מדידת תיבות אמיתיות מה-DOM (כולל גופנים שנטענו)
  const measure = useCallback(() => {
    const next: BoxMap = {};
    contentRefs.current.forEach((g, id) => {
      try {
        const b = g.getBBox();
        const el = designRef.current.elements.find((e) => e.id === id);
        next[id] = { x: b.x, y: b.y, w: b.width, h: b.height, sig: el ? elementSig(el) : undefined };
      } catch {
        /* אלמנט לא מרונדר */
      }
    });
    setBoxes((prev) => {
      const same =
        Object.keys(prev).length === Object.keys(next).length &&
        Object.entries(next).every(([k, v]) => prev[k] && prev[k].sig === v.sig && Math.abs(prev[k].w - v.w) < 0.01 && Math.abs(prev[k].h - v.h) < 0.01 && Math.abs(prev[k].x - v.x) < 0.01);
      return same ? prev : next;
    });
  }, []);

  useLayoutEffect(measure, [design, measure]);
  useEffect(() => {
    onMeasure(boxes);
  }, [boxes, onMeasure]);
  useEffect(() => {
    if (!document.fonts) return;
    const on = () => measure();
    document.fonts.addEventListener("loadingdone", on);
    document.fonts.ready.then(on);
    return () => document.fonts.removeEventListener("loadingdone", on);
  }, [measure]);

  const toLocal = (e: React.PointerEvent | PointerEvent): DOMPoint => {
    // קואורדינטות ביחס ללוח המדבקה (לא למשטח)
    const g = artRef.current!;
    const pt = new DOMPoint(e.clientX, e.clientY);
    return pt.matrixTransform(g.getScreenCTM()!.inverse());
  };

  const boxOf = (el: DesignElement): LocalBox => boxes[el.id] ?? estimateLocalBox(el);

  const startMove = (e: React.PointerEvent, el: DesignElement) => {
    e.stopPropagation();
    onSelect(el.id);
    if (el.locked) return;
    onBegin();
    svgRef.current!.setPointerCapture(e.pointerId);
    setDrag({ kind: "move", id: el.id, start: toLocal(e), orig: el });
  };

  const startScale = (e: React.PointerEvent, el: DesignElement) => {
    e.stopPropagation();
    onBegin();
    svgRef.current!.setPointerCapture(e.pointerId);
    const p = toLocal(e);
    setDrag({ kind: "scale", id: el.id, startDist: Math.max(0.5, Math.hypot(p.x - el.x, p.y - el.y)), orig: el });
  };

  const startRotate = (e: React.PointerEvent, el: DesignElement) => {
    e.stopPropagation();
    onBegin();
    svgRef.current!.setPointerCapture(e.pointerId);
    const p = toLocal(e);
    setDrag({ kind: "rotate", id: el.id, startAngle: Math.atan2(p.y - el.y, p.x - el.x), orig: el });
  };

  const onMove = (e: React.PointerEvent) => {
    if (!drag) return;
    const p = toLocal(e);
    const o = drag.orig;
    if (drag.kind === "move") {
      let x = o.x + (p.x - drag.start.x);
      let y = o.y + (p.y - drag.start.y);
      // הצמדה למרכז המשטח
      const snap = 6 * unitsPerPx;
      const midX = MAT / 2 - ox;
      const midY = MAT / 2 - oy;
      const v = Math.abs(x - midX) < snap;
      const h = Math.abs(y - midY) < snap;
      if (v) x = midX;
      if (h) y = midY;
      setGuides({ v, h });
      onPreview((d) => ({ ...d, elements: d.elements.map((el) => (el.id === drag.id ? { ...el, x, y } : el)) }));
    } else if (drag.kind === "scale") {
      const k = Math.hypot(p.x - o.x, p.y - o.y) / drag.startDist;
      onPreview((d) => ({ ...d, elements: d.elements.map((el) => (el.id === drag.id ? scaleElement(o, Math.max(0.05, k)) : el)) }));
    } else {
      let r = o.rotation + ((Math.atan2(p.y - o.y, p.x - o.x) - drag.startAngle) * 180) / Math.PI;
      r = ((((r + 180) % 360) + 360) % 360) - 180;
      const step = e.shiftKey ? 15 : 45;
      const nearest = Math.round(r / step) * step;
      if (e.shiftKey || Math.abs(r - nearest) < 3) r = nearest;
      onPreview((d) => ({ ...d, elements: d.elements.map((el) => (el.id === drag.id ? { ...el, rotation: Math.round(r * 10) / 10 } : el)) }));
    }
  };

  const endDrag = () => {
    setDrag(null);
    setGuides({ v: false, h: false });
  };

  const selected = design.elements.find((e) => e.id === selectedId);
  const hs = 9 * unitsPerPx; // גודל ידית קבוע בפיקסלים
  const stroke = 1.25 * unitsPerPx;

  const artFill = bg === "dark" ? "#3a2a21" : bg === "checker" ? `url(#${prefix}-checker)` : "#FFFDF9";
  const vbPx = VB_SIZE * pxPerUnit;
  /** מספרים על הסרגל: כל ס"מ, או כל 5 ס"מ כשהתצוגה צפופה */
  const numStep = 10 * pxPerUnit >= 18 ? 1 : 5;
  const cms = Array.from({ length: MAT / 10 + 1 }, (_, i) => i);

  return (
    <div ref={wrapRef} dir="ltr" className="relative h-full w-full overflow-auto" onPointerDown={() => onSelect(null)}>
      <div className="grid min-h-full min-w-full place-items-center p-4" style={{ width: vbPx + 32, height: vbPx + 32 }}>
        <svg
          ref={svgRef}
          viewBox={`${VB_MIN} ${VB_MIN} ${VB_SIZE} ${VB_SIZE}`}
          width={vbPx}
          height={vbPx}
          className="touch-none select-none"
          onPointerMove={onMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onPointerDown={(e) => {
            e.stopPropagation();
            if (e.target === svgRef.current || (e.target as Element).getAttribute("data-artboard")) onSelect(null);
          }}
          aria-label="אזור העיצוב"
        >
          <defs>
            <pattern id={`${prefix}-checker`} width={6 * unitsPerPx * 2} height={6 * unitsPerPx * 2} patternUnits="userSpaceOnUse">
              <rect width={12 * unitsPerPx} height={12 * unitsPerPx} fill="#FBF8F3" />
              <rect width={6 * unitsPerPx} height={6 * unitsPerPx} fill="#EFE8DC" />
              <rect x={6 * unitsPerPx} y={6 * unitsPerPx} width={6 * unitsPerPx} height={6 * unitsPerPx} fill="#EFE8DC" />
            </pattern>
          </defs>
          <VinylDefs prefix={prefix} colorIds={design.elements.map((e) => e.colorId)} />

          {/* משטח החיתוך 30×30 ס"מ עם רשת סנטימטרים */}
          <rect data-artboard="1" x={VB_MIN + 2} y={VB_MIN + 2} width={VB_SIZE - 4} height={VB_SIZE - 4} rx={6} fill={theme.body} stroke={theme.edge} strokeWidth={stroke} />
          {/* אזור החיתוך עצמו — הרקע שנבחר (בהיר / כהה / שקוף) */}
          <rect data-artboard="1" x={0} y={0} width={MAT} height={MAT} fill={artFill} />
          <g pointerEvents="none">
            {cms.map((i) => {
              const v = i * 10;
              const major = i % 5 === 0;
              const c = major ? theme.major : theme.grid;
              const sw = (major ? 1.2 : 0.8) * unitsPerPx;
              return (
                <g key={i}>
                  <line x1={v} x2={v} y1={0} y2={MAT} stroke={c} strokeWidth={sw} />
                  <line y1={v} y2={v} x1={0} x2={MAT} stroke={c} strokeWidth={sw} />
                </g>
              );
            })}
            <g fill={theme.num} fontSize={Math.min(MAT_MARGIN * 0.45, 10 * unitsPerPx)} fontFamily="Assistant, sans-serif" textAnchor="middle" dominantBaseline="central">
              {cms
                .filter((i) => i % numStep === 0)
                .map((i) => (
                  <g key={i}>
                    <text x={i * 10} y={-MAT_MARGIN / 2}>{i}</text>
                    <text x={-MAT_MARGIN / 2} y={i * 10}>{i}</text>
                  </g>
                ))}
            </g>
          </g>

          {/* העיצוב — ממורכז על המשטח, בלי מסגרת נפרדת; הקואורדינטות בתוכו ביחס למדבקה */}
          <g ref={artRef} transform={`translate(${ox} ${oy})`}>
          {/* במידות קבועות — קו דק שמראה את גבולות המדבקה */}
          {design.sizeMode === "box" && (
            <rect x={0} y={0} width={W} height={H} fill="none" stroke={bg === "dark" ? "#b8a893" : "#8a7360"} strokeWidth={stroke} strokeDasharray={`${4 * unitsPerPx} ${3 * unitsPerPx}`} pointerEvents="none" />
          )}
          {guides.v && <line x1={MAT / 2 - ox} x2={MAT / 2 - ox} y1={-oy} y2={MAT - oy} stroke="#b5624a" strokeWidth={stroke} pointerEvents="none" />}
          {guides.h && <line y1={MAT / 2 - oy} y2={MAT / 2 - oy} x1={-ox} x2={MAT - ox} stroke="#b5624a" strokeWidth={stroke} pointerEvents="none" />}

          {design.elements.map((el) => (
            <g
              key={el.id}
              transform={elementTransform(el)}
              onPointerDown={(e) => startMove(e, el)}
              onDoubleClick={() => el.type === "text" && onEditText(el.id)}
              className={el.locked ? "cursor-default" : "cursor-move"}
            >
              <g
                ref={(n) => {
                  if (n) contentRefs.current.set(el.id, n);
                  else contentRefs.current.delete(el.id);
                }}
              >
                <ElementContent el={el} prefix={prefix} />
              </g>
              {/* אזור לחיצה נוח גם לאותיות דקות */}
              {(() => {
                const b = boxOf(el);
                return <rect x={b.x} y={b.y} width={b.w} height={b.h} fill="transparent" />;
              })()}
            </g>
          ))}

          {selected &&
            (() => {
              const b = boxOf(selected);
              const m = 2 * unitsPerPx;
              const x = b.x - m;
              const y = b.y - m;
              const w = b.w + m * 2;
              const h = b.h + m * 2;
              const corners: [number, number][] = [
                [x, y],
                [x + w, y],
                [x + w, y + h],
                [x, y + h],
              ];
              const rotY = y - 26 * unitsPerPx;
              return (
                <g transform={elementTransform(selected)}>
                  <rect x={x} y={y} width={w} height={h} fill="none" stroke="#6b7049" strokeWidth={stroke} pointerEvents="none" />
                  {!selected.locked && (
                    <>
                      <line x1={0} x2={0} y1={y} y2={rotY} stroke="#6b7049" strokeWidth={stroke} pointerEvents="none" />
                      <circle cx={0} cy={rotY} r={hs * 0.75} fill="#FBF8F3" stroke="#6b7049" strokeWidth={stroke * 1.4} className="cursor-grab" onPointerDown={(e) => startRotate(e, selected)}>
                        <title>סיבוב</title>
                      </circle>
                      {corners.map(([cx, cy], i) => (
                        <rect
                          key={i}
                          x={cx - hs / 2}
                          y={cy - hs / 2}
                          width={hs}
                          height={hs}
                          rx={hs * 0.25}
                          fill="#FBF8F3"
                          stroke="#6b7049"
                          strokeWidth={stroke * 1.4}
                          className={i % 2 === 0 ? "cursor-nwse-resize" : "cursor-nesw-resize"}
                          onPointerDown={(e) => startScale(e, selected)}
                        >
                          <title>שינוי גודל</title>
                        </rect>
                      ))}
                    </>
                  )}
                </g>
              );
            })()}

          {!design.elements.length && (
            <text x={W / 2} y={H / 2} textAnchor="middle" dominantBaseline="central" fontSize={Math.min(W, H) * 0.09} fill="#b8a893" fontFamily="Assistant, sans-serif" pointerEvents="none">
              הוסיפו טקסט, צורה או לוגו
            </text>
          )}
          </g>
        </svg>
      </div>
    </div>
  );
}
