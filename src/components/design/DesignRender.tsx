import { useId } from "react";
import { getColor, VINYL_COLORS } from "@/config/production";
import { getFont } from "@/config/fonts";
import { getShape } from "@/lib/design/shapes";
import type { Design, DesignElement } from "@/lib/design/types";

const isHebrew = (s: string) => /[֐-׿]/.test(s);

/** הגדרות גרדיאנט לצבעים מטאליים/הולוגרפיים */
export function VinylDefs({ prefix, colorIds }: { prefix: string; colorIds: string[] }) {
  const grads = VINYL_COLORS.filter((c) => (c.gradient || c.texture) && colorIds.includes(c.id));
  if (!grads.length) return null;
  return (
    <defs>
      {grads.map((c) =>
        c.texture ? (
          // מרקם אמיתי של הויניל, נמתח על התיבה של כל רכיב
          <pattern key={c.id} id={`${prefix}-${c.id}`} patternContentUnits="objectBoundingBox" width="1" height="1">
            <image href={c.texture} width="1" height="1" preserveAspectRatio="xMidYMid slice" />
          </pattern>
        ) : (
          <linearGradient key={c.id} id={`${prefix}-${c.id}`} x1="0" y1="0" x2="1" y2="1">
            {c.gradient!.map((stop, i) => (
              <stop key={i} offset={i / (c.gradient!.length - 1)} stopColor={stop} />
            ))}
          </linearGradient>
        )
      )}
      {grads.map((c) => (
        <filter key={`f-${c.id}`} id={`${prefix}-tint-${c.id}`} colorInterpolationFilters="sRGB">
          <feFlood floodColor={c.hex} />
          <feComposite in2="SourceAlpha" operator="in" />
        </filter>
      ))}
    </defs>
  );
}

export function fillFor(prefix: string, colorId: string) {
  const c = getColor(colorId);
  return c.gradient || c.texture ? `url(#${prefix}-${c.id})` : c.hex;
}

/** רינדור רכיב בודד — ללא טרנספורמציה (מקומי סביב 0,0) */
export function ElementContent({ el, prefix, colorOverride }: { el: DesignElement; prefix: string; colorOverride?: string }) {
  const colorId = colorOverride ?? el.colorId;
  const fill = fillFor(prefix, colorId);

  if (el.type === "text") {
    const f = getFont(el.fontId);
    const lines = el.text.split("\n");
    return (
      <text
        fontFamily={`"${f.family}"`}
        fontWeight={f.weight}
        fontSize={el.fontSize}
        letterSpacing={el.letterSpacing * el.fontSize}
        textAnchor="middle"
        dominantBaseline="central"
        direction={isHebrew(el.text) ? "rtl" : "ltr"}
        fill={fill}
        style={{ whiteSpace: "pre" }}
      >
        {lines.map((line, i) => (
          <tspan key={i} x={0} y={(i - (lines.length - 1) / 2) * el.fontSize * el.lineHeight}>
            {line || " "}
          </tspan>
        ))}
      </text>
    );
  }
  if (el.type === "shape") {
    const s = getShape(el.shapeId);
    return (
      <path
        d={s.d}
        fill={fill}
        fillRule={s.evenodd ? "evenodd" : "nonzero"}
        transform={`scale(${el.width / 100} ${el.height / 100}) translate(-50 -50)`}
      />
    );
  }
  const c = getColor(colorId);
  return (
    <>
      {el.tint && !c.gradient && (
        <defs>
          <filter id={`${prefix}-t-${el.id}`} colorInterpolationFilters="sRGB">
            <feFlood floodColor={c.hex} />
            <feComposite in2="SourceAlpha" operator="in" />
          </filter>
        </defs>
      )}
      <image
        href={el.src}
        x={-el.width / 2}
        y={-el.height / 2}
        width={el.width}
        height={el.height}
        preserveAspectRatio="none"
        filter={el.tint ? (c.gradient ? `url(#${prefix}-tint-${c.id})` : `url(#${prefix}-t-${el.id})`) : undefined}
      />
    </>
  );
}

export const elementTransform = (el: DesignElement) => `translate(${el.x} ${el.y}) rotate(${el.rotation})`;

export function useSvgPrefix() {
  return "v" + useId().replace(/[^a-zA-Z0-9]/g, "");
}

interface DesignSvgProps {
  design: Design;
  colorOverride?: string;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

/**
 * המדבקה עצמה — ללא רקע וללא מסגרת. רק קווי המתאר של הרכיבים.
 */
export function DesignSvg({ design, colorOverride, className, style, title }: DesignSvgProps) {
  const prefix = useSvgPrefix();
  const colorIds = colorOverride ? [colorOverride] : design.elements.map((e) => e.colorId);
  return (
    <svg
      viewBox={`0 0 ${design.widthMm} ${design.heightMm}`}
      className={className}
      style={{ overflow: "visible", ...style }}
      role="img"
      aria-label={title ?? design.name}
    >
      <VinylDefs prefix={prefix} colorIds={colorIds} />
      {design.elements.map((el) => (
        <g key={el.id} transform={elementTransform(el)}>
          <ElementContent el={el} prefix={prefix} colorOverride={colorOverride} />
        </g>
      ))}
    </svg>
  );
}
