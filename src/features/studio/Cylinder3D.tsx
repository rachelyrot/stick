"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import type { Design } from "@/lib/design/types";
import { loadImage, renderDesignPng } from "@/lib/render/canvas";

/**
 * תצוגת 360°: המדבקה עוטפת חפץ גלילי (בקבוק, ספל, כוס, צנצנת) בגודל האמיתי.
 * כל עמודת פיקסלים בגליל נלקחת מהנקודה המתאימה על המדבקה (מיפוי לפי זווית),
 * כך שמדבקה ארוכה מתעקלת ונעלמת מאחורי החפץ — ואפשר לסובב ולראות אותה מכל צד.
 */
export interface CylinderSpec {
  /** קוטר החפץ (ס"מ) */
  diameterCm: number;
  /** גובה הגוף הגלילי (ס"מ) */
  heightCm: number;
  /** גובה מרכז המדבקה מתחתית הגוף (חלק 0–1) */
  stickerAt: number;
  body: [string, string];
  cap?: string;
  glass?: boolean;
  handle?: boolean;
}

export const CYLINDERS: Record<string, Omit<CylinderSpec, "diameterCm">> = {
  bottle: { heightCm: 20, stickerAt: 0.45, body: ["#f3ece2", "#cbbca8"], cap: "#a67c52" },
  mug: { heightCm: 9.5, stickerAt: 0.5, body: ["#fbf8f3", "#d6cbbb"], handle: true },
  glass: { heightCm: 12, stickerAt: 0.5, body: ["#e8eef0", "#b9c6ca"], glass: true },
  jar: { heightCm: 12, stickerAt: 0.45, body: ["#f1ead8", "#cdbf9f"], cap: "#b08a5a" },
};

/** איך המדבקה מונחת על החפץ — נלקח מהמיקום שנבחר בתצוגת "תמונה" */
export interface CylinderPlacement {
  /** סיבוב המדבקה (מעלות) */
  rotation: number;
  /** הזזה מהמרכז לאורך ההיקף (ס"מ, ימינה = חיובי) */
  offsetXCm: number;
  /** הזזה מהמרכז לגובה (ס"מ, למטה = חיובי) */
  offsetYCm: number;
}

/** המדבקה כתמונה, מסובבת לפי המיקום — מחזירה גם את מידות התיבה המסובבת (ס"מ) */
async function stickerTexture(design: Design, rotationDeg: number) {
  const img = await loadImage(await renderDesignPng(design, 1400, 0));
  const a = (rotationDeg * Math.PI) / 180;
  const c = Math.abs(Math.cos(a));
  const s = Math.abs(Math.sin(a));
  const cv = document.createElement("canvas");
  cv.width = Math.ceil(img.width * c + img.height * s);
  cv.height = Math.ceil(img.width * s + img.height * c);
  const ctx = cv.getContext("2d")!;
  ctx.translate(cv.width / 2, cv.height / 2);
  ctx.rotate(a);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);
  const w = design.widthMm / 10;
  const h = design.heightMm / 10;
  return { tex: cv, wCm: w * c + h * s, hCm: w * s + h * c };
}

export function Cylinder3D({ design, spec, place }: { design: Design; spec: CylinderSpec; place: CylinderPlacement }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tex, setTex] = useState<{ tex: HTMLCanvasElement; wCm: number; hCm: number } | null>(null);
  const [rot, setRot] = useState(0);
  const [spin, setSpin] = useState(true);
  const drag = useRef<{ x: number; rot: number } | null>(null);

  // המדבקה כתמונה (בלי שוליים — כדי שהגודל על הגליל יהיה מדויק)
  useEffect(() => {
    let alive = true;
    stickerTexture(design, place.rotation)
      .then((t) => alive && setTex(t))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [design, place.rotation]);

  // סיבוב אוטומטי
  useEffect(() => {
    if (!spin) return;
    let raf = 0;
    let last = performance.now();
    const tick = (t: number) => {
      setRot((r) => r + ((t - last) / 1000) * 0.6);
      last = t;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [spin]);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d")!;
    const W = cv.width;
    const H = cv.height;
    ctx.clearRect(0, 0, W, H);

    const { diameterCm: D, heightCm: Hc } = spec;
    // קנה מידה: הגוף תופס עד ~70% מהגובה ו-45% מהרוחב
    const pxPerCm = Math.min((H * 0.68) / (Hc + (spec.cap ? 3 : 0)), (W * 0.42) / D);
    const R = (D / 2) * pxPerCm;
    const bodyH = Hc * pxPerCm;
    const cx = W / 2;
    const bottom = H * 0.9;
    const top = bottom - bodyH;
    const ell = R * 0.18; // עומק האליפסה (פרספקטיבה קלה)

    // צל על השולחן
    const sh = ctx.createRadialGradient(cx, bottom + ell * 0.4, R * 0.2, cx, bottom + ell * 0.4, R * 1.6);
    sh.addColorStop(0, "rgba(58,42,33,0.28)");
    sh.addColorStop(1, "rgba(58,42,33,0)");
    ctx.fillStyle = sh;
    ctx.beginPath();
    ctx.ellipse(cx, bottom + ell * 0.4, R * 1.6, ell * 1.6, 0, 0, Math.PI * 2);
    ctx.fill();

    // ידית (ספל) — מאחור/מלפנים לפי הסיבוב
    const handleSide = Math.sin(rot + Math.PI / 2);
    const drawHandle = () => {
      if (!spec.handle) return;
      const hx = cx + Math.cos(rot) * R;
      ctx.strokeStyle = spec.body[1];
      ctx.lineWidth = R * 0.22;
      ctx.beginPath();
      ctx.ellipse(hx, top + bodyH * 0.48, R * 0.38 * Math.abs(Math.cos(rot)) + R * 0.05, bodyH * 0.27, 0, 0, Math.PI * 2);
      ctx.stroke();
    };
    if (handleSide < 0) drawHandle();

    // גוף הגליל
    const g = ctx.createLinearGradient(cx - R, 0, cx + R, 0);
    g.addColorStop(0, spec.body[1]);
    g.addColorStop(0.35, spec.body[0]);
    g.addColorStop(0.55, spec.body[0]);
    g.addColorStop(1, spec.body[1]);
    ctx.globalAlpha = spec.glass ? 0.55 : 1;
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(cx - R, top);
    ctx.lineTo(cx - R, bottom);
    ctx.ellipse(cx, bottom, R, ell, 0, Math.PI, 0, true);
    ctx.lineTo(cx + R, top);
    ctx.ellipse(cx, top, R, ell, 0, 0, Math.PI, true);
    ctx.fill();
    ctx.globalAlpha = 1;

    // המדבקה על הגליל
    if (tex) {
      const { wCm, hCm } = tex;
      const img = tex.tex;
      const span = wCm / (D / 2); // זווית שהמדבקה תופסת (רדיאנים)
      const offA = place.offsetXCm / (D / 2); // המיקום לאורך ההיקף, כמו בתצוגת התמונה
      const sH = hCm * pxPerCm;
      const sY = Math.min(bottom - sH, Math.max(top, top + bodyH * (1 - spec.stickerAt) + place.offsetYCm * pxPerCm - sH / 2));
      for (let x = Math.ceil(cx - R); x < cx + R; x++) {
        const s = (x + 0.5 - cx) / R;
        if (s <= -1 || s >= 1) continue;
        const theta = Math.asin(s); // זווית העמודה מול הצופה
        const facing = Math.cos(theta);
        // הזווית על פני החפץ, ביחס למרכז המדבקה
        let phi = theta - rot - offA;
        phi = ((((phi + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI;
        const u = phi / span + 0.5;
        if (u < 0 || u >= 1) continue;
        // מראה מימין לשמאל: u=0 בצד שמאל של המדבקה
        const sx = u * img.width;
        // עקמומיות: נקודות בצדדים נמוכות מעט יותר (פרספקטיבה של האליפסה)
        const dy = (1 - facing) * ell;
        ctx.globalAlpha = 0.55 + 0.45 * facing;
        ctx.drawImage(img, sx, 0, Math.max(1, img.width / (span * R)), img.height, x, sY + dy, 1, sH);
      }
      ctx.globalAlpha = 1;
    }

    // הברקה
    const hl = ctx.createLinearGradient(cx - R, 0, cx + R, 0);
    hl.addColorStop(0, "rgba(255,255,255,0)");
    hl.addColorStop(0.28, "rgba(255,255,255,0.32)");
    hl.addColorStop(0.36, "rgba(255,255,255,0)");
    hl.addColorStop(0.85, "rgba(0,0,0,0)");
    hl.addColorStop(1, "rgba(58,42,33,0.18)");
    ctx.fillStyle = hl;
    ctx.fillRect(cx - R, top, R * 2, bodyH);

    // שפה עליונה + מכסה
    ctx.fillStyle = spec.glass ? "rgba(255,255,255,0.5)" : spec.body[0];
    ctx.strokeStyle = spec.body[1];
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(cx, top, R, ell, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (spec.cap) {
      const capR = R * 0.62;
      const capH = 2.6 * pxPerCm;
      ctx.fillStyle = spec.cap;
      ctx.fillRect(cx - capR, top - capH, capR * 2, capH);
      ctx.beginPath();
      ctx.ellipse(cx, top - capH, capR, ell * 0.62, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.fillRect(cx - capR * 0.55, top - capH, capR * 0.25, capH);
    }

    if (handleSide >= 0) drawHandle();
  }, [tex, rot, spec, place.offsetXCm, place.offsetYCm]);

  const circumference = Math.PI * spec.diameterCm;
  const wraps = (tex?.wCm ?? design.widthMm / 10) / circumference;

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3">
      <canvas
        ref={canvasRef}
        width={900}
        height={900}
        className="aspect-square w-full max-w-[min(100%,calc(100vh-260px))] cursor-grab touch-none rounded-[20px] bg-gradient-to-b from-[#f7f2ea] to-[#e9dfcf] shadow-[0_30px_70px_-35px_rgba(38,27,21,0.55)] active:cursor-grabbing"
        onPointerDown={(e) => {
          setSpin(false);
          drag.current = { x: e.clientX, rot };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          setRot(drag.current.rot + (e.clientX - drag.current.x) / 120);
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
        aria-label="תצוגת 360 מעלות — גררו כדי לסובב"
      />
      <div className="flex flex-wrap items-center justify-center gap-2 text-[12.5px] text-cocoa">
        <button type="button" onClick={() => setSpin((s) => !s)} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-stone bg-ivory px-3 hover:border-choco">
          {spin ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />} {spin ? "עצירה" : "סיבוב אוטומטי"}
        </button>
        <button type="button" onClick={() => { setSpin(false); setRot(0); }} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-stone bg-ivory px-3 hover:border-choco">
          <RotateCcw className="h-3.5 w-3.5" /> מבט מלפנים
        </button>
        <span>
          גררו לסיבוב · היקף החפץ {circumference.toFixed(1)} ס״מ · המדבקה מכסה {Math.min(100, Math.round(wraps * 100))}% מההיקף
          {wraps > 1 && " (ארוכה מההיקף — הקצוות יחפפו)"}
        </span>
      </div>
    </div>
  );
}
