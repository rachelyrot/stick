import type { Design, DesignElement, ImageElement, ShapeElement, TextElement } from "./types";
import { DEFAULT_COLOR, DEFAULT_MATERIAL, getMaterial } from "@/config/production";

export const uid = (prefix = "el"): string =>
  `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;

export function createDesign(partial: Partial<Design> = {}): Design {
  return {
    schema: 1,
    id: uid("d"),
    name: "העיצוב שלי",
    widthMm: 120,
    heightMm: 50,
    materialId: DEFAULT_MATERIAL,
    elements: [],
    updatedAt: Date.now(),
    ...partial,
  };
}

export function createText(design: Design, overrides: Partial<TextElement> = {}): TextElement {
  return {
    id: uid("t"),
    type: "text",
    text: "שם",
    fontId: "frank",
    fontSize: Math.max(10, Math.min(design.heightMm * 0.6, 40)),
    letterSpacing: 0,
    lineHeight: 1.1,
    x: design.widthMm / 2,
    y: design.heightMm / 2,
    rotation: 0,
    colorId: lastColor(design),
    ...overrides,
  };
}

export function createShape(design: Design, shapeId: string): ShapeElement {
  const s = Math.min(design.widthMm, design.heightMm) * 0.5;
  return {
    id: uid("s"),
    type: "shape",
    shapeId,
    width: s,
    height: s,
    x: design.widthMm / 2,
    y: design.heightMm / 2,
    rotation: 0,
    colorId: lastColor(design),
  };
}

export function createImage(
  design: Design,
  data: Pick<ImageElement, "src" | "mime" | "fileName">,
  naturalW: number,
  naturalH: number
): ImageElement {
  const maxW = design.widthMm * 0.7;
  const maxH = design.heightMm * 0.8;
  const k = Math.min(maxW / naturalW, maxH / naturalH);
  return {
    id: uid("i"),
    type: "image",
    ...data,
    width: naturalW * k,
    height: naturalH * k,
    x: design.widthMm / 2,
    y: design.heightMm / 2,
    rotation: 0,
    colorId: lastColor(design),
    tint: false,
  };
}

function lastColor(design: Design): string {
  return design.elements.at(-1)?.colorId ?? getMaterial(design.materialId).colorIds[0] ?? DEFAULT_COLOR;
}

export function cloneElement<T extends DesignElement>(el: T, offset = 4): T {
  return { ...el, id: uid(el.type[0]), x: el.x + offset, y: el.y + offset };
}

/** צבעים ייחודיים בשימוש = מספר שכבות ויניל בייצור */
export const usedColorIds = (design: Design): string[] => [...new Set(design.elements.map((e) => e.colorId))];

export const elementLabel = (el: DesignElement): string => {
  if (el.type === "text") return el.text.split("\n")[0].slice(0, 18) || "טקסט";
  if (el.type === "image") return el.fileName.slice(0, 18);
  return "צורה";
};
