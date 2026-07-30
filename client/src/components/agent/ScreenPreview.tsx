import { useEffect, useRef, useState } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface ScreenPreviewProps {
  runId: string;
  screen: string;
}

/**
 * Renders a verified screen build served by the server sandbox.
 * The preview document posts lifecycle messages (mounted / error / blank)
 * so a failure can never be a silently white canvas.
 *
 * The iframe auto-sizes to match its content height via a postMessage
 * from inside the iframe — no same-origin access needed.
 */
export function ScreenPreview({ runId, screen }: ScreenPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [nonce, setNonce] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [contentHeight, setContentHeight] = useState<number | null>(null);

  useEffect(() => {
    setLoaded(false);
    setRuntimeError(null);
    setContentHeight(null);
  }, [runId, screen, nonce]);

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (!iframeRef.current || e.source !== iframeRef.current.contentWindow) return;
      const data = e.data;
      if (!data || typeof data !== "object") return;
      if (data.type === "pastel:mounted") setLoaded(true);
      if (data.type === "pastel:height" && typeof data.height === "number" && data.height > 50) {
        setContentHeight(data.height);
      }
      if (data.type === "pastel:error") setRuntimeError(data.message || "Runtime error");
      if (data.type === "pastel:blank") setRuntimeError("The screen rendered empty — the build may be incomplete.");
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // Fallback: if the iframe loads but never posts "mounted" (e.g. older build),
  // trust onload after a grace period.
  useEffect(() => {
    if (loaded) return;
    const t = setTimeout(() => {
      setLoaded(true);
    }, 12000);
    return () => clearTimeout(t);
  }, [loaded, nonce]);

  const src = `/api/pastel-agent/runs/${runId}/preview/${encodeURIComponent(screen)}?n=${nonce}`;

  return (
    <div className="relative w-full bg-white" style={{ minHeight: contentHeight || 400 }}>
      {!loaded && !runtimeError && (
        <div className="absolute inset-0 z-10 bg-white">
          <div className="absolute inset-0 animate-pulse bg-[linear-gradient(180deg,#fafafa_0%,#f4f4f4_100%)]" />
          <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
            <div className="h-4 w-28 rounded bg-black/[0.06] animate-pulse" />
            <div className="flex gap-2">
              <div className="h-4 w-14 rounded bg-black/[0.05] animate-pulse" />
              <div className="h-4 w-14 rounded bg-black/[0.05] animate-pulse" />
              <div className="h-4 w-14 rounded bg-black/[0.05] animate-pulse" />
            </div>
          </div>
          <div className="absolute top-28 left-6 h-9 w-[420px] max-w-[60%] rounded bg-black/[0.06] animate-pulse" />
          <div className="absolute top-44 left-6 h-3 w-[300px] max-w-[50%] rounded bg-black/[0.04] animate-pulse" />
          <div className="absolute top-[52px] left-6 mt-40 h-8 w-24 rounded-[10px] bg-black/[0.07] animate-pulse" />
        </div>
      )}

      {runtimeError && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white">
          <div className="flex flex-col items-center text-center max-w-sm px-6">
            <div className="w-14 h-14 rounded-2xl bg-danger/10 flex items-center justify-center mb-4">
              <AlertTriangle size={22} strokeWidth={1.5} className="text-danger" />
            </div>
            <h3 className="text-[14px] font-semibold text-foreground mb-1">
              {screen} hit a runtime issue
            </h3>
            <p className="text-[12px] text-fg-muted leading-relaxed mb-1">
              This screen was verified at build time but failed while rendering just now.
            </p>
            <p className="text-[11px] text-fg-faint font-mono bg-surface-muted px-3 py-2 rounded-lg w-full truncate mb-4">
              {runtimeError}
            </p>
            <button
              onClick={() => setNonce((n) => n + 1)}
              className="flex items-center gap-1.5 h-8 px-3.5 rounded-xl border border-border text-[12px] font-medium text-foreground hover:bg-surface-hover transition-colors bg-transparent cursor-pointer"
            >
              <RotateCcw size={12} strokeWidth={1.5} />
              Reload screen
            </button>
          </div>
        </div>
      )}

      <iframe
        ref={iframeRef}
        key={`${runId}:${screen}:${nonce}`}
        src={src}
        onLoad={() => {
          setTimeout(() => setLoaded((v) => v || true), 2500);
        }}
        className="w-full border-0"
        style={{ height: contentHeight || 400, minHeight: 400 }}
        title={`${screen} preview`}
        sandbox="allow-scripts"
      />
    </div>
  );
}
