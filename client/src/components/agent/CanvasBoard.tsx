import { useState, useRef, useEffect, useCallback } from "react";
import { Layout } from "lucide-react";
import { ScreenPanel } from "./ScreenPanel";
import { ScreenPreview } from "./ScreenPreview";

const CANVAS_W = 3200;
const CANVAS_H = 2600;

function defaultPosition(index: number) {
  return { x: 80 + (index % 3) * 560, y: 80 + Math.floor(index / 3) * 720 };
}

function clampPos(x: number, y: number) {
  return { x: Math.max(0, Math.min(CANVAS_W - 60, x)), y: Math.max(0, Math.min(CANVAS_H - 60, y)) };
}

interface CanvasBoardProps {
  projectId: string;
  runId: string;
  screens: string[];
  zoom: number;
  activeTool: string;
  selectedScreen: string | null;
  screenNames: Record<string, string>;
  onSelectScreen: (name: string) => void;
  onRenameScreen: (name: string, label: string) => void;
}

/**
 * The free-form editor canvas. Screens live on a large board and can be
 * grabbed (header bar, frame edge, or empty space inside the preview) and
 * dragged anywhere. Components inside a screen are individually selectable
 * via the injected editor inside the preview frame.
 */
export function CanvasBoard({
  projectId,
  runId,
  screens,
  zoom,
  activeTool,
  selectedScreen,
  screenNames,
  onSelectScreen,
  onRenameScreen,
}: CanvasBoardProps) {
  const storageKey = `canvas-layout-${projectId}`;
  const namesKey = `canvas-names-${projectId}`;

  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {};
  });

  const positionsRef = useRef(positions);
  positionsRef.current = positions;

  const [drag, setDrag] = useState<{
    name: string;
    sx: number;
    sy: number;
    base: { x: number; y: number };
    moved: boolean;
  } | null>(null);

  const iframeDragRef = useRef<{ name: string; base: { x: number; y: number }; startX: number; startY: number } | null>(null);
  const [pan, setPan] = useState<{ sx: number; sy: number; sl: number; st: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Normalize: every screen gets a default slot on first render
  useEffect(() => {
    setPositions((prev) => {
      let changed = false;
      const next = { ...prev };
      screens.forEach((name, i) => {
        if (!next[name]) {
          next[name] = defaultPosition(i);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [screens]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(positions));
    } catch {}
  }, [positions, storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(namesKey, JSON.stringify(screenNames));
    } catch {}
  }, [screenNames, namesKey]);

  const posFor = useCallback((name: string) => positionsRef.current[name], []);

  // Header / frame-edge drag
  useEffect(() => {
    if (!drag) return;
    const onMove = (e: PointerEvent) => {
      const dx = e.clientX - drag.sx;
      const dy = e.clientY - drag.sy;
      if (!drag.moved && Math.abs(dx) + Math.abs(dy) > 4) {
        setDrag((d) => (d ? { ...d, moved: true } : d));
      }
      if (Math.abs(dx) + Math.abs(dy) > 4) {
        const p = clampPos(drag.base.x + dx, drag.base.y + dy);
        setPositions((prev) => ({ ...prev, [drag.name]: p }));
      }
    };
    const onUp = () => setDrag(null);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [drag]);

  // Hand-tool pan
  useEffect(() => {
    if (!pan) return;
    const onMove = (e: PointerEvent) => {
      const sc = scrollRef.current;
      if (!sc) return;
      sc.scrollLeft = pan.sl - (e.clientX - pan.sx);
      sc.scrollTop = pan.st - (e.clientY - pan.sy);
    };
    const onUp = () => setPan(null);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [pan]);

  // Iframe background drag: once the pointer leaves the preview frame,
  // the parent keeps moving the screen, and auto-scrolls at the edges so
  // screens can be dragged anywhere on the large canvas.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const c = iframeDragRef.current;
      if (!c) return;
      console.log("[drag] parent move", e.clientX, e.clientY, "start", c.startX, c.startY, "base", c.base.x, c.base.y);
      const p = clampPos(c.base.x + (e.clientX - c.startX), c.base.y + (e.clientY - c.startY));
      setPositions((prev) => ({ ...prev, [c.name]: p }));
      const sc = scrollRef.current;
      if (!sc) return;
      const r = sc.getBoundingClientRect();
      const M = 48;
      const STEP = 24;
      let sx = 0;
      let sy = 0;
      if (e.clientX < r.left + M) sx = -STEP;
      else if (e.clientX > r.right - M) sx = STEP;
      if (e.clientY < r.top + M) sy = -STEP;
      else if (e.clientY > r.bottom - M) sy = STEP;
      if (sx || sy) {
        sc.scrollLeft += sx;
        sc.scrollTop += sy;
      }
    };
    const onUp = () => {
      iframeDragRef.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  const handleStartPointerDown = (e: React.PointerEvent, name: string) => {
    if (activeTool !== "select" || e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest("button, input, a, span")) return;
    const p = posFor(name) ?? defaultPosition(0);
    e.preventDefault();
    setDrag({ name, sx: e.clientX, sy: e.clientY, base: p, moved: false });
  };

  const handleIframeDrag = useCallback((name: string, dx: number, dy: number, px?: number, py?: number) => {
    if (!iframeDragRef.current || iframeDragRef.current.name !== name) {
      iframeDragRef.current = {
        name,
        base: positionsRef.current[name] ?? defaultPosition(0),
        startX: typeof px === "number" ? px : 0,
        startY: typeof py === "number" ? py : 0,
      };
    }
    console.log("[drag] iframe msg", name, dx, dy, px, py, iframeDragRef.current.base.x);
    const p = clampPos(iframeDragRef.current.base.x + dx, iframeDragRef.current.base.y + dy);
    setPositions((prev) => ({ ...prev, [name]: p }));
  }, []);

  const handleIframeDragEnd = useCallback(() => {
    iframeDragRef.current = null;
  }, []);

  return (
    <div
      ref={scrollRef}
      className={`absolute inset-0 overflow-auto ${
        activeTool === "hand" ? "cursor-grab active:cursor-grabbing" : "cursor-default"
      }`}
      onPointerDown={(e) => {
        if (activeTool !== "hand" || e.button !== 0) return;
        const sc = scrollRef.current;
        if (!sc) return;
        e.preventDefault();
        setPan({ sx: e.clientX, sy: e.clientY, sl: sc.scrollLeft, st: sc.scrollTop });
      }}
    >
      {screens.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center text-center max-w-xs">
            <div className="w-14 h-14 rounded-2xl bg-surface-muted flex items-center justify-center mb-3">
              <Layout size={22} strokeWidth={1.5} className="text-fg-muted" />
            </div>
            <h2 className="text-[14px] font-semibold text-foreground mb-1">Screens will appear here</h2>
            <p className="text-[12px] text-fg-muted leading-relaxed">
              As soon as the agent finishes a screen it lands on this canvas — drag it anywhere.
            </p>
          </div>
        </div>
      )}
      <div
        style={{
          width: CANVAS_W * (zoom / 100),
          height: CANVAS_H * (zoom / 100),
          position: "relative",
        }}
      >
        <div
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: "top left",
            width: CANVAS_W,
            height: CANVAS_H,
            position: "relative",
          }}
        >
          {/* Dot grid */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle, hsl(var(--fg-faint)) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />

          {/* Screens */}
          {screens.map((name, i) => {
            const pos = posFor(name) ?? defaultPosition(i);
            const isSel = selectedScreen === name;
            return (
              <div
                key={name}
                className="absolute"
                style={{ left: pos.x, top: pos.y, width: 480 }}
              >
                <ScreenPanel
                  screenName={screenNames[name] ?? name}
                  isSelected={isSel}
                  onSelect={() => onSelectScreen(name)}
                  onRename={(label) => onRenameScreen(name, label)}
                  onPointerDown={(e) => handleStartPointerDown(e, name)}
                >
                  <div className="w-full">
                    <ScreenPreview
                      runId={runId}
                      screen={name}
                      editMode={activeTool === "select"}
                      onScreenDrag={(dx, dy) => handleIframeDrag(name, dx, dy)}
                      onScreenDragEnd={handleIframeDragEnd}
                    />
                  </div>
                </ScreenPanel>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
