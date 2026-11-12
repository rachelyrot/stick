"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Focus, Image as ImageIcon, Layers, Maximize, Minus, Palette, PenTool, Plus, Redo2, ShoppingBag, Shapes, SlidersHorizontal, Type, Undo2, Upload, Check } from "lucide-react";
import type { BoxMap, Design, DesignElement } from "@/lib/design/types";
import { cloneElement, createDesign, createText } from "@/lib/design/factory";
import { boxesFresh, contentBounds, elementSig, estimateLocalBox, fitToLength, worldBox, wrapArtboardToContent } from "@/lib/design/geometry";
import { StickerSize, toSheet } from "./StickerSize";
import { useHistory } from "@/lib/design/useHistory";
import { quoteDesign } from "@/lib/pricing/engine";
import { usePricing } from "@/lib/pricing/pricing-context";
import { blocksCheckout, preflight } from "@/lib/production/preflight";
import { renderDesignPng } from "@/lib/render/canvas";
import { useCart } from "@/lib/cart/cart-store";
import { getProduct, resizeDesignTo } from "@/data/products";
import { DEFAULT_COLOR, MACHINE, getMaterial, materialForColor } from "@/config/production";
import { personalize } from "@/lib/catalog/personalize";
import { formatPrice } from "@/lib/pricing/engine";
import type { StudioApi } from "./api";
import { DesignCanvas, MAT_VIEW_MM, type CanvasBg } from "./DesignCanvas";
import { LayersPanel, ShapesPanel, TextPanel, UploadPanel } from "./panels-add";
import { Inspector, OrderPanel, StickerSettings } from "./panels-edit";
import { MockupStudio } from "./MockupStudio";
import { Segmented } from "./controls";

const DRAFT_KEY = "stick-studio:studio-draft:v2";
/** טיוטות ישנות — נמחקו (איפוס הסטודיו) */
const LEGACY_DRAFT_KEYS = ["stick-studio:studio-draft:v1"];
/** זום מקסימלי — מספיק כדי שגם מדבקה של 2 ס"מ תמלא את המסך על משטח 29×29 */
const MAX_ZOOM = 12;

/** שינויים "גיאומטריים" — אחריהם האורך נגזר מחדש מהעיצוב, ולא נכפה בחזרה */
const GEOMETRY_KEYS = ["width", "height", "fontSize", "rotation", "x", "y"];
/** אחרי הזזה/שינוי גודל ידני — המדבקה (המלבן) תעטוף מחדש את העיצוב, בשני המצבים */
const releaseLength = (d: Design): Design => ({ ...d, lengthMm: 0 });
const MAT_MM = MACHINE.maxWidthCm * 10;
type ToolTab = "text" | "shapes" | "upload" | "layers";
type MobileTab = ToolTab | "edit" | "order";

function useIsDesktop() {
  const [d, setD] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const on = () => setD(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return d;
}

function starterDesign(): Design {
  const d = createDesign({ name: "המדבקה שלי", widthMm: 120, heightMm: 50 });
  return { ...d, elements: [createText(d, { text: "השם שלכם", fontId: "frank", fontSize: 22, colorId: DEFAULT_COLOR })] };
}

export function StudioApp() {
  const params = useSearchParams();
  const router = useRouter();
  const cart = useCart();
  const isDesktop = useIsDesktop();
  const pricing = usePricing();

  const h = useHistory<Design>(starterDesign());
  const design = h.present;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [boxes, setBoxes] = useState<BoxMap>({});
  const [step, setStep] = useState<"design" | "mockup">("design");
  const [toolTab, setToolTab] = useState<ToolTab>("text");
  const [mobileTab, setMobileTab] = useState<MobileTab>("text");
  const [quantity, setQuantity] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [canvasBg, setCanvasBg] = useState<CanvasBg>("paper");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [initialMockup, setInitialMockup] = useState<string | undefined>();
  const [adding, setAdding] = useState(false);
  const [mockupVisited, setMockupVisited] = useState(false);
  useEffect(() => {
    if (step === "mockup") setMockupVisited(true);
  }, [step]);
  const [loaded, setLoaded] = useState(false);
  const focusTextRef = useRef<HTMLTextAreaElement | null>(null);

  // ---- טעינה ראשונית לפי פרמטרים ----
  useEffect(() => {
    if (loaded || !cart.ready) return;
    try {
      LEGACY_DRAFT_KEYS.forEach((k) => localStorage.removeItem(k));
    } catch {
      /* אין גישה לאחסון */
    }
    const editId = params.get("edit");
    const template = params.get("template");
    const start = params.get("start");
    const mockup = params.get("mockup");
    if (mockup) setInitialMockup(mockup);
    if (params.get("step") === "mockup" || (mockup && !template)) setStep("mockup");

    let next: Design | null = null;
    if (editId) {
      const item = cart.get(editId);
      if (item) {
        next = structuredClone(item.design);
        setQuantity(item.quantity);
        setEditingId(item.id);
      }
    } else if (template) {
      const p = getProduct(template);
      if (p) {
        const text = params.get("text") ?? undefined;
        const colorId = params.get("color") ?? undefined;
        const w = parseFloat(params.get("w") ?? "");
        const widthMm = Number.isFinite(w) && w >= MACHINE.minSizeCm * 10 && w <= MACHINE.maxWidthCm * 10 ? w : undefined;
        const h = parseFloat(params.get("h") ?? "");
        const heightMm = Number.isFinite(h) && h >= MACHINE.minSizeCm * 10 && h <= MACHINE.maxHeightCm * 10 ? h : undefined;
        let d = personalize(p, { text, colorId, widthMm: heightMm ? undefined : widthMm, precise: true });
        if (widthMm && heightMm) d = resizeDesignTo(d, widthMm, heightMm);
        // מידות שנבחרו בעמוד המוצר (רוחב×גובה) → מידות קבועות; אחרת → לפי אורך
        next = { ...d, id: createDesign().id, updatedAt: Date.now(), ...(widthMm && heightMm ? { sizeMode: "box" as const } : { sizeMode: "fit" as const, lengthMm: Math.max(d.widthMm, d.heightMm) }) };
        setQuantity(p.defaultQty);
      }
    } else if (start === "blank") {
      next = createDesign({ name: "עיצוב חדש", sizeMode: "fit", lengthMm: 120 });
      setToolTab("text");
    } else if (start === "sheet") {
      // דף שלם: כל המשטח, כיתוב ראשון במרכז
      const blank = createDesign({ name: "דף כיתובים", widthMm: 120, heightMm: 50 });
      next = toSheet({ ...blank, elements: [createText(blank, { text: "כיתוב ראשון", fontId: "frank", fontSize: 22, colorId: DEFAULT_COLOR })] });
      setToolTab("text");
    } else if (start === "upload") {
      next = createDesign({ name: "הלוגו שלי", widthMm: 80, heightMm: 80, sizeMode: "fit", lengthMm: 80 });
      setToolTab("upload");
      setMobileTab("upload");
    } else {
      try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (raw) next = JSON.parse(raw) as Design;
      } catch {
        /* טיוטה פגומה */
      }
    }
    if (next) h.reset(next);
    setLoaded(true);
  }, [cart.ready, loaded, params, cart, h]);

  // ---- שמירה אוטומטית ----
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(design));
      } catch {
        /* חריגה ממכסת אחסון — מתעלמים */
      }
    }, 600);
    return () => clearTimeout(t);
  }, [design, loaded]);

  const selected = design.elements.find((e) => e.id === selectedId) ?? null;

  const select = useCallback(
    (id: string | null) => {
      setSelectedId(id);
      if (id && isDesktop === false) setMobileTab("edit");
    },
    [isDesktop]
  );

  const mapEl = (id: string, fn: (el: DesignElement) => DesignElement) => (d: Design) => ({ ...d, elements: d.elements.map((e) => (e.id === id ? fn(e) : e)) });

  const api: StudioApi = useMemo(
    () => ({
      design,
      selected,
      boxes,
      commit: h.commit,
      begin: h.begin,
      preview: h.preview,
      updateEl: (id, patch, mode = "commit") =>
        (mode === "commit" ? h.commit : h.preview)((d) => {
          const next = mapEl(id, (e) => ({ ...e, ...patch }) as DesignElement)(d);
          // שינוי גודל/מיקום/סיבוב שהלקוח/ה ביצע/ה — המדבקה מתאימה את עצמה אליו (במקום להחזיר לאורך הקודם)
          return GEOMETRY_KEYS.some((k) => k in patch) ? releaseLength(next) : next;
        }),
      addElement: (el) => {
        h.commit((d) => ({ ...d, elements: [...d.elements, el] }));
        setSelectedId(el.id);
        if (isDesktop === false) setMobileTab("edit");
      },
      select,
      remove: (id) => {
        h.commit((d) => {
          const next = { ...d, elements: d.elements.filter((e) => e.id !== id) };
          // מידות קבועות: אחרי מחיקה המלבן והמספרים מתעדכנים לפי מה שנשאר
          return d.sizeMode === "box" ? { ...next, lengthMm: 0 } : next;
        });
        setSelectedId(null);
      },
      duplicate: (id) => {
        const el = design.elements.find((e) => e.id === id);
        if (!el) return;
        const c = cloneElement(el, Math.min(design.widthMm, design.heightMm) * 0.06);
        h.commit((d) => {
          const i = d.elements.findIndex((e) => e.id === id);
          const els = [...d.elements];
          els.splice(i + 1, 0, c);
          return { ...d, elements: els };
        });
        setSelectedId(c.id);
      },
      reorder: (id, dir) =>
        h.commit((d) => {
          const els = [...d.elements];
          const i = els.findIndex((e) => e.id === id);
          const [el] = els.splice(i, 1);
          const to = dir === "top" ? els.length : dir === "bottom" ? 0 : dir === "up" ? Math.min(els.length, i + 1) : Math.max(0, i - 1);
          els.splice(to, 0, el);
          return { ...d, elements: els };
        }),
      align: (id, how) =>
        h.commit(
          mapEl(id, (el) => {
            const wb = worldBox(el, boxes[el.id] ?? estimateLocalBox(el));
            const W = design.widthMm;
            const H = design.heightMm;
            switch (how) {
              case "h-center":
                return { ...el, x: el.x + (W / 2 - (wb.minX + wb.maxX) / 2) };
              case "v-center":
                return { ...el, y: el.y + (H / 2 - (wb.minY + wb.maxY) / 2) };
              case "left":
                return { ...el, x: el.x - wb.minX };
              case "right":
                return { ...el, x: el.x + (W - wb.maxX) };
              case "top":
                return { ...el, y: el.y - wb.minY };
              case "bottom":
                return { ...el, y: el.y + (H - wb.maxY) };
            }
          })
        ),
      focusTextRef,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [design, selected, boxes, h.commit, h.begin, h.preview, select, isDesktop]
  );

  // ---- קיצורי מקלדת ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, select, [contenteditable=true]")) return;
      if (step !== "design") return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) h.redo();
        else h.undo();
      } else if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        h.redo();
      } else if (selected && mod && e.key.toLowerCase() === "d") {
        e.preventDefault();
        api.duplicate(selected.id);
      } else if (selected && (e.key === "Delete" || e.key === "Backspace")) {
        e.preventDefault();
        api.remove(selected.id);
      } else if (selected && e.key.startsWith("Arrow")) {
        e.preventDefault();
        const s = e.shiftKey ? 5 : 1;
        const dx = e.key === "ArrowLeft" ? -s : e.key === "ArrowRight" ? s : 0;
        const dy = e.key === "ArrowUp" ? -s : e.key === "ArrowDown" ? s : 0;
        api.updateEl(selected.id, { x: selected.x + dx, y: selected.y + dy });
      } else if (e.key === "Escape") {
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [api, selected, h, step]);

  const q = useMemo(() => quoteDesign(design, quantity, pricing), [design, quantity, pricing]);
  const checks = useMemo(() => preflight(design, boxes), [design, boxes]);

  // ---- מצב "לפי אורך": המדבקה עוטפת את העיצוב באורך קבוע ----
  const [pointerDown, setPointerDown] = useState(false);
  useEffect(() => {
    const down = () => setPointerDown(true);
    const up = () => setPointerDown(false);
    window.addEventListener("pointerdown", down, true);
    window.addEventListener("pointerup", up, true);
    window.addEventListener("pointercancel", up, true);
    return () => {
      window.removeEventListener("pointerdown", down, true);
      window.removeEventListener("pointerup", up, true);
      window.removeEventListener("pointercancel", up, true);
    };
  }, []);
  useEffect(() => {
    if (!loaded || step !== "design" || pointerDown) return;
    if (design.sizeMode === "sheet" || !design.elements.length || !boxesFresh(design, boxes)) return;
    const b = contentBounds(design, boxes);
    if (!b) return;
    // המלבן זז יחד עם העיצוב: מרכז התוכן נשאר באותו מקום על המשטח
    const half = (v: number, size: number) => Math.min(MAT_MM - size / 2, Math.max(size / 2, v));
    const oldCx = (design.matCx ?? MAT_MM / 2) - design.widthMm / 2 + (b.minX + b.maxX) / 2;
    const oldCy = (design.matCy ?? MAT_MM / 2) - design.heightMm / 2 + (b.minY + b.maxY) / 2;

    if ((design.sizeMode ?? "fit") === "box") {
      // מידות קבועות: רק אחרי הזזה/שינוי גודל ידני (lengthMm=0) — המלבן עוטף מחדש, והמספרים מתעדכנים
      if (design.lengthMm !== 0) return;
      const next = wrapArtboardToContent(design, boxes);
      h.preview({ ...next, lengthMm: Math.max(next.widthMm, next.heightMm), matCx: half(oldCx, next.widthMm), matCy: half(oldCy, next.heightMm) });
      return;
    }

    // לפי אורך: lengthMm=0 → האורך נגזר מהעיצוב עצמו (אחרי שינוי גודל ידני)
    const L = design.lengthMm || Math.round((Math.max(b.w, b.h) + 2) * 10) / 10;
    const next = fitToLength(design, boxes, L);
    const moved =
      Math.abs(next.widthMm - design.widthMm) > 0.15 ||
      Math.abs(next.heightMm - design.heightMm) > 0.15 ||
      next.elements.some((el, i) => Math.abs(el.x - design.elements[i].x) > 0.15 || Math.abs(el.y - design.elements[i].y) > 0.15 || elementSig(el) !== elementSig(design.elements[i]));
    if (moved || !design.lengthMm) h.preview({ ...next, sizeMode: "fit", lengthMm: L, matCx: half(oldCx, next.widthMm), matCy: half(oldCy, next.heightMm) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [design, boxes, pointerDown, loaded, step]);
  const blocked = blocksCheckout(checks);

  const addToCart = async () => {
    setAdding(true);
    try {
      const thumb = await renderDesignPng(design, 360);
      if (editingId && cart.get(editingId)) {
        cart.update(editingId, design, quantity, thumb);
        router.push("/cart");
      } else {
        cart.add(design, quantity, thumb, design.sourceProduct);
      }
    } finally {
      setAdding(false);
    }
  };

  const onEditText = (id: string) => {
    select(id);
    setTimeout(() => focusTextRef.current?.focus(), 30);
  };

  const recolorAll = (colorId: string) =>
    h.commit((d) => ({ ...d, materialId: getMaterial(d.materialId).colorIds.includes(colorId) ? d.materialId : (materialForColor(colorId)?.id ?? d.materialId), elements: d.elements.map((e) => ({ ...e, colorId })) }));

  const toolTabs: { id: ToolTab; label: string; icon: typeof Type }[] = [
    { id: "text", label: "טקסט", icon: Type },
    { id: "shapes", label: "צורות", icon: Shapes },
    { id: "upload", label: "העלאה", icon: Upload },
    { id: "layers", label: "שכבות", icon: Layers },
  ];

  const renderTool = (t: ToolTab) =>
    t === "text" ? <TextPanel api={api} /> : t === "shapes" ? <ShapesPanel api={api} /> : t === "upload" ? <UploadPanel api={api} /> : <LayersPanel api={api} />;

  const orderPanel = (
    <OrderPanel
      quantity={quantity}
      setQuantity={setQuantity}
      q={q}
      checks={checks}
      onAdd={addToCart}
      adding={adding}
      blocked={blocked}
      editing={!!editingId}
      onSelectElement={(id) => select(id)}
    />
  );

  const canvas = (
    <div className="relative flex h-full flex-col">
      <div className="flex-1 overflow-hidden">
        <DesignCanvas
          design={design}
          selectedId={selectedId}
          onSelect={select}
          onBegin={h.begin}
          onPreview={(fn) => h.preview((d) => releaseLength(fn(d)))}
          onMeasure={setBoxes}
          onEditText={onEditText}
          zoom={zoom}
          bg={canvasBg}
        />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-3 flex items-center justify-center gap-2 px-3">
        <div className="pointer-events-auto flex items-center gap-0.5 rounded-full border border-stone bg-ivory/95 p-1 shadow-sm backdrop-blur">
          <button type="button" className="grid h-8 w-8 place-items-center rounded-full hover:bg-sand" onClick={() => setZoom((z) => Math.max(0.4, z / 1.25))} aria-label="הקטנת תצוגה">
            <Minus className="h-4 w-4" />
          </button>
          <button type="button" className="h-8 min-w-12 rounded-full px-2 text-[12px] tabular-nums hover:bg-sand" onClick={() => setZoom(1)} title="כל המשטח">
            {Math.round(zoom * 100)}%
          </button>
          <button type="button" className="grid h-8 w-8 place-items-center rounded-full hover:bg-sand" onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z * 1.25))} aria-label="הגדלת תצוגה">
            <Plus className="h-4 w-4" />
          </button>
          <span className="mx-0.5 h-5 w-px bg-stone" />
          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded-full hover:bg-sand"
            onClick={() => setZoom(Math.max(1, Math.min(MAX_ZOOM, (0.7 * MAT_VIEW_MM) / Math.max(design.widthMm, design.heightMm))))}
            aria-label="התמקדות במדבקה"
            title="התמקדות במדבקה"
          >
            <Focus className="h-4 w-4" />
          </button>
          <button type="button" className="grid h-8 w-8 place-items-center rounded-full hover:bg-sand" onClick={() => setZoom(1)} aria-label="כל המשטח" title="כל המשטח (29×29 ס״מ)">
            <Maximize className="h-4 w-4" />
          </button>
        </div>
        <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-stone bg-ivory/95 p-1 shadow-sm backdrop-blur" role="radiogroup" aria-label="רקע תצוגה">
          {(
            [
              ["paper", "#ffffff", "רקע בהיר"],
              ["dark", "#3a2a21", "רקע כהה (לויניל לבן)"],
              ["checker", "repeating-conic-gradient(#efe8dc 0 25%, #fbf8f3 0 50%) 0 0/8px 8px", "רקע שקוף"],
            ] as const
          ).map(([id, bgc, label]) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={canvasBg === id}
              title={label}
              aria-label={label}
              onClick={() => setCanvasBg(id)}
              className={`h-7 w-7 rounded-full ring-1 ring-black/10 ${canvasBg === id ? "outline-2 outline-offset-2 outline-choco" : ""}`}
              style={{ background: bgc }}
            />
          ))}
        </div>
      </div>
    </div>
  );

  const header = (
    <div className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-stone/70 bg-ivory px-3 sm:px-5">
      <div className="flex min-w-0 items-center gap-2">
        <button type="button" onClick={h.undo} disabled={!h.canUndo || step !== "design"} className="grid h-9 w-9 place-items-center rounded-xl text-choco hover:bg-sand disabled:opacity-30" aria-label="ביטול (Ctrl+Z)" title="ביטול (Ctrl+Z)">
          <Undo2 className="h-[18px] w-[18px]" strokeWidth={1.6} />
        </button>
        <button type="button" onClick={h.redo} disabled={!h.canRedo || step !== "design"} className="grid h-9 w-9 place-items-center rounded-xl text-choco hover:bg-sand disabled:opacity-30" aria-label="חזרה (Ctrl+Y)" title="חזרה (Ctrl+Y)">
          <Redo2 className="h-[18px] w-[18px]" strokeWidth={1.6} />
        </button>
        <span className="ms-2 hidden min-w-0 truncate font-display text-lg text-choco md:block">{design.name}</span>
        {editingId && <span className="hidden rounded-full bg-olive-soft px-2.5 py-0.5 text-[11px] text-olive-dark sm:inline">עריכת פריט מהסל</span>}
      </div>
      <Segmented
        value={step}
        onChange={(s) => {
          setStep(s);
          setSelectedId(null);
        }}
        options={[
          { id: "design", label: <><PenTool className="h-4 w-4" /> <span className="hidden sm:inline">1 ·</span> עיצוב</> },
          { id: "mockup", label: <><ImageIcon className="h-4 w-4" /> <span className="hidden sm:inline">2 ·</span> הדמיה</> },
        ]}
      />
      <div className="flex items-center gap-2">
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-[11px] text-mocha">{quantity} יח׳</span>
          <span className="block font-display text-lg text-choco">{formatPrice(q.total)}</span>
        </span>
        <button
          type="button"
          onClick={addToCart}
          disabled={blocked || adding}
          className="hidden h-10 items-center gap-2 rounded-full bg-choco px-5 text-[14px] text-ivory transition hover:bg-ink disabled:opacity-40 sm:flex"
        >
          {editingId ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" strokeWidth={1.6} />}
          {editingId ? "עדכון" : "לסל"}
        </button>
      </div>
    </div>
  );

  if (isDesktop === null || !loaded) {
    return <div className="grid h-[calc(100dvh-64px)] place-items-center text-mocha">טוענים את הסטודיו…</div>;
  }

  return (
    <div className="flex h-[calc(100dvh-64px)] flex-col bg-cream">
      {header}
      {/* סטודיו ההדמיות נשאר טעון גם בשלב העיצוב — כדי שהחפץ, המיקום והתמונות לא יתאפסו במעבר */}
      {(step === "mockup" || mockupVisited) && (
        <div className={`min-h-0 flex-1 overflow-y-auto lg:overflow-hidden ${step === "mockup" ? "" : "hidden"}`}>
          <MockupStudio design={design} initialMockup={initialMockup} onRecolorAll={recolorAll} />
        </div>
      )}
      {step === "mockup" ? null : isDesktop ? (
        <div className="grid min-h-0 flex-1 grid-cols-[minmax(280px,320px)_minmax(0,1fr)_minmax(300px,340px)]">
          <aside className="flex min-h-0 flex-col border-l border-stone/70 bg-ivory">
            <nav className="grid shrink-0 grid-cols-4 border-b border-stone/70 p-1.5" aria-label="כלים">
              {toolTabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setToolTab(t.id)}
                  className={`flex flex-col items-center gap-1 rounded-xl py-2.5 text-[12px] transition ${toolTab === t.id ? "bg-cream text-choco" : "text-mocha hover:text-choco"}`}
                  aria-pressed={toolTab === t.id}
                >
                  <t.icon className="h-5 w-5" strokeWidth={1.4} />
                  {t.label}
                </button>
              ))}
            </nav>
            <div className="min-h-0 flex-1 overflow-y-auto">{renderTool(toolTab)}</div>
          </aside>
          <section className="min-h-0 min-w-0" aria-label="משטח העבודה">
            {canvas}
          </section>
          <aside className="min-h-0 overflow-y-auto border-r border-stone/70 bg-ivory">
            <StickerSize api={api} />
            {selected ? <Inspector api={api} /> : <StickerSettings api={api} />}
            <div className="border-t-4 border-cream">{orderPanel}</div>
          </aside>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <section className="h-[42dvh] shrink-0 border-b border-stone/70" aria-label="משטח העבודה">
            {canvas}
          </section>
          <nav className="no-scrollbar flex shrink-0 gap-1 overflow-x-auto border-b border-stone/70 bg-ivory px-2 py-1.5" aria-label="כלים">
            {[
              ...toolTabs,
              { id: "edit" as const, label: selected ? "עריכה" : "מדבקה", icon: selected ? SlidersHorizontal : Palette },
              { id: "order" as const, label: "הזמנה", icon: ShoppingBag },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setMobileTab(t.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] ${mobileTab === t.id ? "bg-choco text-ivory" : "text-cocoa"}`}
              >
                <t.icon className="h-4 w-4" strokeWidth={1.5} />
                {t.label}
              </button>
            ))}
          </nav>
          <div className="min-h-0 flex-1 overflow-y-auto bg-ivory">
            {mobileTab === "edit" ? (
              <>
                <StickerSize api={api} />
                {selected ? <Inspector api={api} /> : <StickerSettings api={api} />}
              </>
            ) : mobileTab === "order" ? orderPanel : renderTool(mobileTab)}
          </div>
        </div>
      )}
      {!isDesktop && (
        <div className="flex shrink-0 items-center gap-3 border-t border-stone bg-ivory/95 px-4 py-3 backdrop-blur">
          <div className="leading-tight">
            <p className="text-[11px] text-mocha">{quantity} יח׳ · לדוגמה</p>
            <p className="font-display text-xl text-choco">{formatPrice(q.total)}</p>
          </div>
          <button type="button" onClick={() => setStep(step === "design" ? "mockup" : "design")} className="mr-auto h-11 rounded-full border border-choco px-4 text-[14px] text-choco">
            {step === "design" ? "להדמיה" : "לעיצוב"}
          </button>
          <button type="button" onClick={addToCart} disabled={blocked || adding} className="flex h-11 items-center gap-2 rounded-full bg-choco px-5 text-[14px] text-ivory disabled:opacity-40">
            <ShoppingBag className="h-4 w-4" /> {editingId ? "עדכון" : "לסל"}
          </button>
        </div>
      )}
    </div>
  );
}
