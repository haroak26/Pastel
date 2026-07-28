import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, MousePointer2, Image, ZoomIn, ZoomOut, Download, Layout, Plus, ChevronLeft, Hand, Code2, Eye, PaintBucket, FileImage, Share2, ChevronDown, RotateCcw, Copy } from "lucide-react";
import { ComputerIcon, SmartPhone01Icon } from "hugeicons-react";
import { PromptInput } from "@/components/PromptInput";
import { CanvasPromptInput } from "@/components/CanvasPromptInput";
import { Dropdown } from "@/components/ds";
import { usePastelAgent } from "@/hooks/use-pastel-agent";

const MOCK_PROJECTS: Record<string, { name: string }> = {
  "a1b2c3d4-e5f6-7890-abcd-ef1234567890": { name: "Landing Page Redesign" },
  "b2c3d4e5-f6a7-8901-bcde-f12345678901": { name: "Dashboard UI Kit" },
  "c3d4e5f6-a7b8-9012-cdef-123456789012": { name: "Mobile App Mockups" },
};

const MOCK_SCREENS = [
  { id: "s1", label: "Homepage", icon: ComputerIcon },
  { id: "s2", label: "About", icon: ComputerIcon },
  { id: "s3", label: "Pricing", icon: ComputerIcon },
  { id: "s4", label: "Contact", icon: SmartPhone01Icon },
  { id: "s5", label: "Blog", icon: ComputerIcon },
];

const MOCK_COMPONENTS = [
  { id: "c1", label: "Button", icon: "box" },
  { id: "c2", label: "Card", icon: "box" },
  { id: "c3", label: "Navbar", icon: "box" },
  { id: "c4", label: "Input", icon: "box" },
  { id: "c5", label: "Modal", icon: "box" },
];

const MOCK_COLOURS = [
  { id: "col1", label: "Primary", hex: "#0B99FF" },
  { id: "col2", label: "Secondary", hex: "#7C3AED" },
  { id: "col3", label: "Accent", hex: "#F59E0B" },
  { id: "col4", label: "Background", hex: "#FFFFFF" },
  { id: "col5", label: "Text", hex: "#1A1A1A" },
];

const MOCK_UPLOADS = [
  { id: "u1", label: "logo.svg", type: "svg" },
  { id: "u2", label: "hero.jpg", type: "image" },
  { id: "u3", label: "icon-set.png", type: "image" },
  { id: "u4", label: "font.woff2", type: "font" },
  { id: "u5", label: "pattern.svg", type: "svg" },
];

const ALL_FONTS = [
  "Inter",
  "SF Pro",
  "Roboto",
  "Playfair Display",
  "JetBrains Mono",
  "DM Sans",
  "Space Grotesk",
];

function CanvasElement({ type, x, y, w, h, label }: { type: string; x: number; y: number; w: number; h: number; label: string }) {
  const base = "absolute rounded-[8px] border-2 border-transparent hover:border-brand/40 group cursor-default";
  if (type === "image") {
    return (
      <div className={`${base} bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200 flex items-center justify-center`} style={{ left: x, top: y, width: w, height: h }}>
        <Image size={20} className="text-blue-300" strokeWidth={1} />
        <div className="absolute bottom-1.5 left-2 text-[9px] text-fg-faint font-medium">{label}</div>
      </div>
    );
  }
  if (type === "text") {
    return (
      <div className={`${base} bg-transparent`} style={{ left: x, top: y, width: w, height: h }}>
        <div className="text-[12px] font-semibold text-foreground leading-tight pt-1">{label}</div>
        <div className="text-[9px] text-fg-muted mt-0.5 leading-relaxed">Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore.</div>
      </div>
    );
  }
  if (type === "rect") {
    return (
      <div className={`${base} bg-gradient-to-br from-violet-50 to-blue-50 border-violet-200 flex items-center justify-center`} style={{ left: x, top: y, width: w, height: h }}>
        <span className="text-[11px] font-medium text-violet-600">{label}</span>
      </div>
    );
  }
  if (type === "circle") {
    return (
      <div className={`${base} bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 rounded-full flex items-center justify-center`} style={{ left: x, top: y, width: w, height: h }}>
        <span className="text-[9px] font-medium text-amber-600">{label}</span>
      </div>
    );
  }
  if (type === "line") {
    return (
      <div className="absolute flex items-center" style={{ left: x, top: y, width: w, height: h }}>
        <div className="w-full h-[2px] bg-border rounded-full" />
      </div>
    );
  }
  return null;
}

export default function CanvasPage() {
  const [location, setLocation] = useLocation();
  const [activeTool, setActiveTool] = useState("select");
  const [zoom, setZoom] = useState(100);
  const [sidebarTab, setSidebarTab] = useState("screens");
  const [selectedPage, setSelectedPage] = useState("s1");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedFont, setSelectedFont] = useState<string | null>(null);
  const [fontRect, setFontRect] = useState<{ top: number; left: number } | null>(null);
  const [editingSize, setEditingSize] = useState<string | null>(null);
  const [editingRadius, setEditingRadius] = useState<string | null>(null);
  const [cornerRadiusValues, setCornerRadiusValues] = useState<Record<string, string>>({
    Small: "4",
    Medium: "8",
    Large: "12",
    "Extra Large": "20",
  });
  const [sizeValues, setSizeValues] = useState<Record<string, string>>({
    H1: "32px",
    H2: "24px",
    H3: "20px",
    Body: "14px",
    Small: "12px",
  });
  const [fontValues, setFontValues] = useState<Record<string, string>>({
    Heading: "Inter",
    Subheading: "SF Pro",
    Body: "Inter",
  });
  const [colourValues, setColourValues] = useState<Record<string, string>>({
    col1: "#0B99FF",
    col2: "#7C3AED",
    col3: "#F59E0B",
    col4: "#FFFFFF",
    col5: "#1A1A1A",
  });
  const [sliderHues, setSliderHues] = useState<Record<string, number>>({});
  const [screens, setScreens] = useState(MOCK_SCREENS);
  const [screenLabels, setScreenLabels] = useState<Record<string, string>>(
    Object.fromEntries(MOCK_SCREENS.map(s => [s.id, s.label]))
  );
  const [editingScreenName, setEditingScreenName] = useState<string | null>(null);
  const [screenModes, setScreenModes] = useState<Record<string, 'web' | 'mobile'>>({});
  const [screenToolbar, setScreenToolbar] = useState(false);
  const [activeBarBtn, setActiveBarBtn] = useState<string | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [showAgent, setShowAgent] = useState(false);
  const [previewMode, setPreviewMode] = useState<"code" | "preview">("preview");
  const [pendingPrompt, setPendingPrompt] = useState("");
  const [initialized, setInitialized] = useState(false);

  const {
    phases,
    isGenerating,
    code,
    error,
    cancel,
    reset,
    activePhase,
    currentPhaseIndex,
    phaseOrder,
    result,
    clarify,
    skipClarify,
    setAnswer,
    submitAnswers,
    questions,
    answers,
    awaitingAnswers,
  } = usePastelAgent();

  const projectId = location.startsWith("/canvas/") ? location.replace("/canvas/", "").split("/")[0] : null;
  const project = projectId ? MOCK_PROJECTS[projectId] : null;
  const isNewCanvas = projectId === "new";
  const hasActiveSession = !!code || isGenerating || awaitingAnswers || initialized;

  useEffect(() => {
    if (isNewCanvas) {
      const storedPrompt = sessionStorage.getItem("pastel-prompt");
      if (storedPrompt) {
        sessionStorage.removeItem("pastel-prompt");
        setShowAgent(true);
        setPendingPrompt(storedPrompt);
        setTimeout(() => clarify(storedPrompt), 200);
      }
    }
  }, [isNewCanvas]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setScreenToolbar(false);
        setActiveBarBtn(null);
      }
    };
    if (screenToolbar) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [screenToolbar]);

  const handlePrompt = useCallback(
    (prompt: string) => {
      if (!hasActiveSession) {
        setShowAgent(true);
        setPendingPrompt(prompt);
        setInitialized(true);
        clarify(prompt);
      } else {
        setShowAgent(true);
        setPendingPrompt(prompt);
        clarify(prompt);
      }
    },
    [clarify, hasActiveSession],
  );

  const handleSubmitAnswers = useCallback(() => {
    submitAnswers(pendingPrompt);
  }, [submitAnswers, pendingPrompt]);

  const handleSkipClarify = useCallback(() => {
    skipClarify(pendingPrompt);
  }, [skipClarify, pendingPrompt]);

  const handleReset = useCallback(() => {
    reset();
    setInitialized(false);
    setPendingPrompt("");
    setShowAgent(false);
  }, [reset]);

  const canvasElements =
    projectId === "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
      ? [
          { id: "nav", type: "rect", x: 40, y: 30, w: 560, h: 40, label: "Navigation" },
          { id: "hero-img", type: "image", x: 340, y: 100, w: 260, h: 200, label: "Hero Image" },
          { id: "hero-title", type: "text", x: 40, y: 110, w: 280, h: 80, label: "Build Beautiful Products" },
          { id: "hero-sub", type: "text", x: 40, y: 195, w: 280, h: 60, label: "A modern platform for design teams" },
          { id: "cta", type: "rect", x: 40, y: 270, w: 140, h: 36, label: "Get Started" },
          { id: "feature1", type: "rect", x: 40, y: 340, w: 170, h: 120, label: "Feature One" },
          { id: "feature2", type: "rect", x: 230, y: 340, w: 170, h: 120, label: "Feature Two" },
          { id: "feature3", type: "rect", x: 420, y: 340, w: 170, h: 120, label: "Feature Three" },
          { id: "line1", type: "line", x: 40, y: 500, w: 550, h: 2, label: "" },
          { id: "footer", type: "text", x: 40, y: 520, w: 560, h: 30, label: "© 2026 Pastel. All rights reserved." },
          { id: "circle1", type: "circle", x: 590, y: 140, w: 40, h: 40, label: "" },
          { id: "circle2", type: "circle", x: 590, y: 190, w: 40, h: 40, label: "" },
        ]
      : projectId === "b2c3d4e5-f6a7-8901-bcde-f12345678901"
        ? [
            { id: "sidebar", type: "rect", x: 10, y: 10, w: 160, h: 500, label: "Sidebar" },
            { id: "header", type: "rect", x: 180, y: 10, w: 460, h: 50, label: "Header" },
            { id: "card1", type: "rect", x: 180, y: 75, w: 145, h: 90, label: "Revenue" },
            { id: "card2", type: "rect", x: 335, y: 75, w: 145, h: 90, label: "Users" },
            { id: "card3", type: "rect", x: 490, y: 75, w: 145, h: 90, label: "Sales" },
            { id: "chart", type: "rect", x: 180, y: 180, w: 290, h: 200, label: "Chart Area" },
            { id: "table", type: "rect", x: 485, y: 180, w: 150, h: 200, label: "Activity" },
            { id: "footer", type: "rect", x: 180, y: 395, w: 455, h: 40, label: "Table Footer" },
          ]
        : projectId === "c3d4e5f6-a7b8-9012-cdef-123456789012"
          ? [
              { id: "status", type: "rect", x: 180, y: 30, w: 280, h: 30, label: "Status Bar" },
              { id: "logo", type: "image", x: 290, y: 85, w: 60, h: 60, label: "Logo" },
              { id: "title", type: "text", x: 180, y: 160, w: 280, h: 30, label: "Welcome Back" },
              { id: "email", type: "rect", x: 180, y: 200, w: 280, h: 36, label: "Email Input" },
              { id: "pass", type: "rect", x: 180, y: 245, w: 280, h: 36, label: "Password Input" },
              { id: "login", type: "rect", x: 180, y: 295, w: 280, h: 40, label: "Login Button" },
              { id: "divider", type: "line", x: 250, y: 355, w: 140, h: 2, label: "" },
              { id: "social", type: "rect", x: 220, y: 370, w: 200, h: 32, label: "Social Login" },
              { id: "signup", type: "text", x: 180, y: 420, w: 280, h: 20, label: "Don't have an account? Sign Up" },
            ]
          : [];

  const showCanvasPreview = !!code && !isGenerating;

  // ── FULL CANVAS TOOL LAYOUT ──
  return (
    <div className="h-dvh bg-background flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 flex">
        {/* Icon sidebar */}
        <motion.div
          className="w-[64px] shrink-0 border-r border-border flex flex-col bg-background items-center py-4 gap-1 relative z-10"
          initial={isNewCanvas ? { opacity: 0, x: -16 } : false}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <div className="text-brand mb-1">
            <svg viewBox="0 0 32 32" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect x="1.5" y="1.5" width="29" height="29" rx="8" fill="currentColor" />
              <path d="M10 22L16 9L22 22H10Z" fill="white" opacity="0.92" />
              <circle cx="16" cy="24" r="2.5" fill="white" opacity="0.92" />
            </svg>
          </div>
          <div className="w-[24px] h-px bg-border/50 my-1.5" />
          {[
            { id: "screens", icon: Layout, label: "Screens" },
            { id: "design", icon: PaintBucket, label: "Design" },
            { id: "assets", icon: Image, label: "Assets" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setSidebarTab(tab.id);
                if (sidebarCollapsed) setSidebarCollapsed(false);
              }}
              className={`flex flex-col items-center gap-0.5 w-full py-[10px] text-[11px] font-semibold border-none bg-transparent cursor-pointer transition-colors ${
                sidebarTab === tab.id ? "bg-brand/10 text-brand" : "text-fg-muted hover:text-foreground"
              }`}
            >
              <tab.icon size={18} strokeWidth={1.5} />
              {tab.label}
            </button>
          ))}
          <div className="w-[24px] h-px bg-border/50 my-1.5" />
          <button
            onClick={() => setShowAgent((v) => !v)}
            className={`flex flex-col items-center gap-0.5 w-full py-[10px] text-[11px] font-semibold border-none bg-transparent cursor-pointer transition-colors ${
              showAgent ? "bg-brand/10 text-brand" : "text-fg-muted hover:text-foreground"
            }`}
          >
            <Sparkles size={18} strokeWidth={1.5} />
            Agent
          </button>
        </motion.div>

        {/* Content panel (collapsible) */}
        <div
            className={`w-[220px] shrink-0 flex flex-col bg-background transition-all duration-200 shadow-[2px_0_12px_rgba(0,0,0,0.06)] ${
              sidebarCollapsed ? "w-0" : ""
            }`}
          >
            <div className="shrink-0 px-4 pt-4 pb-3 border-b border-border">
              <h2 className="text-[15px] font-semibold text-foreground">{project?.name ?? "Untitled"}</h2>
              <p className="text-[12px] text-fg-faint mt-1">
                {screens.length} screens · {MOCK_COMPONENTS.length + MOCK_COLOURS.length + MOCK_UPLOADS.length} assets
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-1.5 space-y-1">
              {sidebarTab === "screens" && (
                <>
                  {screens.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedPage(s.id)}
                      className="flex items-center gap-2 w-full h-[32px] px-2.5 rounded-[10px] text-left border-none bg-transparent cursor-pointer transition-colors text-fg-muted hover:text-foreground hover:bg-surface-hover"
                    >
                      <s.icon size={12} strokeWidth={1.5} className="shrink-0" />
                      <span className="text-[13px] font-medium truncate">{screenLabels[s.id] ?? s.label}</span>
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      const nextId = `s${screens.length + 1}`;
                      setScreens(prev => [...prev, { id: nextId, label: `Screen ${prev.length + 1}`, icon: ComputerIcon }]);
                      setScreenLabels(prev => ({ ...prev, [nextId]: `Screen ${screens.length + 1}` }));
                      setSelectedPage(nextId);
                    }}
                    className="flex items-center gap-2 w-full h-[32px] px-2.5 rounded-[10px] text-left border-none bg-transparent cursor-pointer text-fg-muted hover:text-foreground hover:bg-surface-hover transition-colors"
                  >
                    <Plus size={12} strokeWidth={1.5} />
                    <span className="text-[13px] font-medium">Add screen</span>
                  </button>
                </>
              )}

              {sidebarTab === "design" && (
                <>
                  <div className="px-2.5 pt-2 pb-2">
                    <span className="text-[13px] font-medium text-fg-muted">Fonts</span>
                  </div>
                  <div className="space-y-0.5 pb-2">
                    {[
                      { role: "Heading", font: "Inter" },
                      { role: "Subheading", font: "SF Pro" },
                      { role: "Body", font: "Inter" },
                    ].map((item) => (
                      <div key={item.role}>
                        <button
                          onClick={(e) => {
                            if (selectedFont === item.role) {
                              setSelectedFont(null);
                              setFontRect(null);
                            } else {
                              const r = e.currentTarget.getBoundingClientRect();
                              setFontRect({ top: r.top, left: r.left });
                              setSelectedFont(item.role);
                            }
                          }}
                          className="flex w-full items-center justify-between px-2.5 h-[32px] rounded-[10px] text-[13px] font-medium text-foreground hover:bg-surface-hover transition-colors border-none bg-transparent cursor-pointer text-left"
                        >
                          <span>{item.role}</span>
                          <span className="flex items-center gap-1 text-fg-faint">
                            {fontValues[item.role]}
                            <ChevronDown size={12} className={`transition-transform duration-200 ${selectedFont === item.role ? 'rotate-180' : ''}`} />
                          </span>
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="h-px bg-border -mx-2" />

                  <div className="px-2.5 pt-2 pb-2">
                    <span className="text-[13px] font-medium text-fg-muted">Font sizes</span>
                  </div>
                  <div className="space-y-0.5 pb-2">
                    {[
                      { label: "H1", size: "32px" },
                      { label: "H2", size: "24px" },
                      { label: "H3", size: "20px" },
                      { label: "Body", size: "14px" },
                      { label: "Small", size: "12px" },
                    ].map((s) => (
                      <div key={s.label}>
                        {editingSize === s.label ? (
                          <div className="flex w-full items-center justify-between px-2.5 h-[32px] rounded-[10px] text-[13px] font-medium text-foreground">
                            <span>{s.label}</span>
                            <div className="flex items-center gap-0.5">
                              <input
                                autoFocus
                                value={sizeValues[s.label].replace("px", "")}
                                onChange={(e) => setSizeValues(prev => ({ ...prev, [s.label]: e.target.value + "px" }))}
                                onBlur={() => setEditingSize(null)}
                                onKeyDown={(e) => { if (e.key === 'Enter') setEditingSize(null); }}
                                className="w-[40px] text-right text-[13px] font-medium text-foreground bg-transparent border-none outline-none"
                              />
                              <span className="text-fg-faint text-[13px]">px</span>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingSize(s.label)}
                            className="flex w-full items-center justify-between px-2.5 h-[32px] rounded-[10px] text-[13px] font-medium text-foreground hover:bg-surface-hover transition-colors border-none bg-transparent cursor-pointer text-left w-full"
                          >
                            <span>{s.label}</span>
                            <span className="text-fg-faint">{sizeValues[s.label]}</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="h-px bg-border -mx-2" />

                  <div className="px-2.5 pt-2 pb-2">
                    <span className="text-[13px] font-medium text-fg-muted">Colours</span>
                  </div>
                  <div className="space-y-0.5 pb-2">
                    {MOCK_COLOURS.map((col) => {
                      const hex = colourValues[col.id];
                      const r = parseInt(hex.slice(1, 3), 16) || 0;
                      const g = parseInt(hex.slice(3, 5), 16) || 0;
                      const b = parseInt(hex.slice(5, 7), 16) || 0;
                      return (
                        <div key={col.id}>
                          <button
                            onClick={() => setSelectedColor(selectedColor === col.id ? null : col.id)}
                            className="flex w-full items-center justify-between px-2.5 h-[32px] rounded-[10px] text-[13px] font-medium text-foreground hover:bg-surface-hover transition-colors border-none bg-transparent cursor-pointer text-left"
                          >
                            <span className="flex items-center gap-2.5">
                              <div
                                className="w-[16px] h-[16px] rounded-[4px] border border-border/60 shrink-0"
                                style={{ backgroundColor: hex }}
                              />
                              {col.label}
                            </span>
                            <span className="text-fg-faint">{hex}</span>
                          </button>
                          {selectedColor === col.id && (
                            <div className="px-3 pb-2 pt-1.5 space-y-2">
                              <div
                                className="w-full h-[64px] rounded-[8px]"
                                style={{
                                  background: `linear-gradient(135deg, ${hex} 0%, rgb(${Math.min(r + 100, 255)}, ${Math.min(g + 100, 255)}, ${Math.min(b + 100, 255)}) 100%)`,
                                }}
                              />
                              <input
                                type="range"
                                min="0"
                                max="360"
                                value={col.id in sliderHues ? sliderHues[col.id] : (() => {
                                  const rr = r / 255, gg = g / 255, bb = b / 255;
                                  const mx = Math.max(rr, gg, bb), mn = Math.min(rr, gg, bb);
                                  if (mx === mn) return 0;
                                  const d = mx - mn;
                                  let h = 0;
                                  if (mx === rr) h = ((gg - bb) / d + (gg < bb ? 6 : 0)) * 60;
                                  else if (mx === gg) h = ((bb - rr) / d + 2) * 60;
                                  else h = ((rr - gg) / d + 4) * 60;
                                  return Math.round(h);
                                })()}
                                onChange={(e) => {
                                  const h = parseInt(e.target.value);
                                  setSliderHues(prev => ({ ...prev, [col.id]: h }));
                                  const s = 80, l = 55;
                                  const c = (1 - Math.abs(2 * l / 100 - 1)) * s / 100;
                                  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
                                  const m = l / 100 - c / 2;
                                  let r1 = 0, g1 = 0, b1 = 0;
                                  if (h < 60) { r1 = c; g1 = x; }
                                  else if (h < 120) { r1 = x; g1 = c; }
                                  else if (h < 180) { g1 = c; b1 = x; }
                                  else if (h < 240) { g1 = x; b1 = c; }
                                  else if (h < 300) { r1 = x; b1 = c; }
                                  else { r1 = c; b1 = x; }
                                  const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, "0");
                                  setColourValues(prev => ({ ...prev, [col.id]: `#${toHex(r1)}${toHex(g1)}${toHex(b1)}` }));
                                }}
                                className="w-full h-[20px] rounded-[6px] appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[12px] [&::-webkit-slider-thumb]:h-[12px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[radial-gradient(circle_at_center,white_3px,#171717_3px)] [&::-moz-range-thumb]:w-[12px] [&::-moz-range-thumb]:h-[12px] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[radial-gradient(circle_at_center,white_3px,#171717_3px)]"
                                style={{
                                  background: "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
                                }}
                              />
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-fg-muted font-medium uppercase tracking-wider w-7">Hex</span>
                                <span className="text-fg-faint text-[12px] font-mono">#</span>
                                <input
                                  value={hex.slice(1)}
                                  onChange={(e) => {
                                    const newHex = `#${e.target.value}`;
                                    setColourValues(prev => ({ ...prev, [col.id]: newHex }));
                                    const rr = parseInt(newHex.slice(1, 3), 16) / 255 || 0;
                                    const gg = parseInt(newHex.slice(3, 5), 16) / 255 || 0;
                                    const bb = parseInt(newHex.slice(5, 7), 16) / 255 || 0;
                                    const mx = Math.max(rr, gg, bb), mn = Math.min(rr, gg, bb);
                                    let h = 0;
                                    if (mx !== mn) {
                                      const d = mx - mn;
                                      if (mx === rr) h = ((gg - bb) / d + (gg < bb ? 6 : 0)) * 60;
                                      else if (mx === gg) h = ((bb - rr) / d + 2) * 60;
                                      else h = ((rr - gg) / d + 4) * 60;
                                    }
                                    setSliderHues(prev => ({ ...prev, [col.id]: Math.round(h) }));
                                  }}
                                  className="flex-1 h-[28px] px-2 rounded-[6px] bg-surface-muted text-[12px] font-mono text-foreground border-none outline-none"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {selectedFont && fontRect && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => { setSelectedFont(null); setFontRect(null); }} />
                      <div
                        className="fixed z-50 bg-background border border-border rounded-[20px] p-1.5 shadow-lg min-w-[200px]"
                        style={{
                          top: fontRect.top + 32,
                          left: fontRect.left + 8,
                        }}
                      >
                        {ALL_FONTS.map((font) => (
                          <button
                            key={font}
                            onClick={() => { setFontValues(prev => ({ ...prev, [selectedFont]: font })); setSelectedFont(null); setFontRect(null); }}
                            className={`flex w-full items-center px-2.5 py-2 rounded-[14px] text-[13px] font-medium text-left transition-colors border-none bg-transparent cursor-pointer ${
                              fontValues[selectedFont] === font ? 'bg-surface-hover text-foreground' : 'text-foreground hover:text-foreground hover:bg-surface-hover'
                            }`}
                          >
                            {font}
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  <div className="h-px bg-border -mx-2" />

                  <div className="px-2.5 pt-2 pb-2">
                    <span className="text-[13px] font-medium text-fg-muted">Roundness</span>
                  </div>
                  <div className="space-y-0.5 pb-2">
                    {[
                      { label: "Small", key: "Small" },
                      { label: "Medium", key: "Medium" },
                      { label: "Large", key: "Large" },
                      { label: "Extra Large", key: "Extra Large" },
                    ].map((s) => {
                      const val = parseInt(cornerRadiusValues[s.key]) || 0;
                      const r = Math.min(val, 16);
                      return (
                        <div key={s.key}>
                          {editingRadius === s.key ? (
                            <div className="flex w-full items-center justify-between px-2.5 h-[32px] rounded-[10px] text-[13px] font-medium text-foreground">
                              <span className="flex items-center gap-2.5">
                                <svg width="16" height="16" viewBox="0 0 28 28" fill="none" className="shrink-0">
                                  <path
                                    d={`M 2 24 L 2 ${2 + r} Q 2 2 ${2 + r} 2 L 24 2`}
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    fill="none"
                                    strokeLinecap="round"
                                    className="text-fg-faint"
                                  />
                                </svg>
                                {s.label}
                              </span>
                              <div className="flex items-center gap-0.5">
                                <input
                                  autoFocus
                                  value={cornerRadiusValues[s.key]}
                                  onChange={(e) => setCornerRadiusValues(prev => ({ ...prev, [s.key]: e.target.value }))}
                                  onBlur={() => setEditingRadius(null)}
                                  onKeyDown={(e) => { if (e.key === 'Enter') setEditingRadius(null); }}
                                  className="w-[40px] text-right text-[13px] font-medium text-foreground bg-transparent border-none outline-none"
                                />
                                <span className="text-fg-faint text-[13px]">px</span>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setEditingRadius(s.key)}
                              className="flex w-full items-center justify-between px-2.5 h-[32px] rounded-[10px] text-[13px] font-medium text-foreground hover:bg-surface-hover transition-colors border-none bg-transparent cursor-pointer text-left w-full"
                            >
                              <span className="flex items-center gap-2.5">
                                <svg width="16" height="16" viewBox="0 0 28 28" fill="none" className="shrink-0">
                                  <path
                                    d={`M 2 24 L 2 ${2 + r} Q 2 2 ${2 + r} 2 L 24 2`}
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    fill="none"
                                    strokeLinecap="round"
                                    className="text-fg-faint"
                                  />
                                </svg>
                                {s.label}
                              </span>
                              <span className="text-fg-faint">{cornerRadiusValues[s.key]}px</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {sidebarTab === "assets" && (
                <>
                  <div className="px-2.5 pt-1 pb-1 flex items-center justify-between">
                    <span className="text-[13px] font-medium text-fg-muted">Components</span>
                    <button className="text-[11px] font-medium text-brand hover:text-brand/80 transition-colors border-none bg-transparent cursor-pointer">See all</button>
                  </div>
                  <div className="space-y-1.5 px-2.5">
                    {MOCK_COMPONENTS.slice(0, 4).map((c, i) => (
                      <div
                        key={c.id}
                        className="group rounded-[10px] border border-border bg-background hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all duration-150 cursor-pointer overflow-hidden"
                      >
                        <div className="aspect-[16/8] bg-surface-hover flex items-center justify-center">
                          <div className="w-5 h-5 rounded-[4px] border border-border/40 bg-background flex items-center justify-center">
                            <span className="text-[9px] font-bold text-fg-muted uppercase">{c.label.slice(0, 2)}</span>
                          </div>
                        </div>
                        <div className="h-px bg-border/60" />
                        <div className="px-2.5 py-1.5">
                          <p className="text-[12px] font-medium text-foreground truncate">{c.label}</p>
                          <p className="text-[10px] text-fg-faint mt-0.5">{["2 hours ago", "Yesterday", "3 days ago", "1 week ago"][i]}</p>
                        </div>
                      </div>
                    ))}
                    <button className="flex items-center gap-2 w-full h-[32px] px-2.5 rounded-[10px] text-left border-none bg-transparent cursor-pointer text-fg-muted hover:text-foreground hover:bg-surface-hover transition-colors">
                      <Plus size={12} strokeWidth={1.5} />
                      <span className="text-[13px] font-medium">Add component</span>
                    </button>
                  </div>

                  <div className="h-px bg-border my-3 -mx-2" />

                  <div className="px-2.5 pt-1 pb-1 flex items-center justify-between">
                    <span className="text-[13px] font-medium text-fg-muted">Uploads</span>
                    <button className="text-[11px] font-medium text-brand hover:text-brand/80 transition-colors border-none bg-transparent cursor-pointer">See all</button>
                  </div>
                  <div className="space-y-1.5 px-2.5">
                    {MOCK_UPLOADS.slice(0, 4).map((u, i) => (
                      <div
                        key={u.id}
                        className="group rounded-[10px] border border-border bg-background hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all duration-150 cursor-pointer overflow-hidden"
                      >
                        <div className="aspect-[16/8] bg-surface-hover flex items-center justify-center">
                          {u.type === "image" ? (
                            <Image size={16} strokeWidth={1.5} className="text-fg-muted" />
                          ) : (
                            <FileImage size={16} strokeWidth={1.5} className="text-fg-muted" />
                          )}
                        </div>
                        <div className="h-px bg-border/60" />
                        <div className="px-2.5 py-1.5">
                          <p className="text-[12px] font-medium text-foreground truncate">{u.label}</p>
                          <p className="text-[10px] text-fg-faint mt-0.5">{["2 hours ago", "Yesterday", "3 days ago", "1 week ago"][i]}</p>
                        </div>
                      </div>
                    ))}
                    <button className="flex items-center gap-2 w-full h-[32px] px-2.5 rounded-[10px] text-left border-none bg-transparent cursor-pointer text-fg-muted hover:text-foreground hover:bg-surface-hover transition-colors">
                      <Plus size={12} strokeWidth={1.5} />
                      <span className="text-[13px] font-medium">Upload asset</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            <div className="shrink-0 px-2 py-2 border-t border-border">
              <button
                onClick={() => setSidebarCollapsed(true)}
                className="flex items-center gap-2 w-full h-[32px] px-2.5 rounded-[10px] text-[12px] font-medium text-fg-muted hover:text-foreground hover:bg-surface-hover transition-colors border-none bg-transparent cursor-pointer"
              >
                <ChevronLeft size={13} strokeWidth={1.5} />
                Collapse
              </button>
            </div>
          </div>

        {/* Canvas */}
        <div className="flex-1 flex flex-col bg-[hsl(var(--surface-muted))] border-l border-border relative">
          {/* Floating toolbar */}
          <motion.div
            className="shrink-0 flex items-center justify-center pt-3 relative z-20"
            initial={isNewCanvas ? { opacity: 0, y: -12 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <div className="flex items-center gap-2 h-[40px] px-3 rounded-[12px] bg-background shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
              <div className="flex items-center gap-0.5">
                {[
                  { id: "select", icon: MousePointer2, label: "Select" },
                  { id: "hand", icon: Hand, label: "Hand" },
                ].map((t) => {
                  const Icon = t.icon;
                  return (
                    <div key={t.id} className="relative group">
                      <button
                        onClick={() => setActiveTool(t.id)}
                        className={`flex shrink-0 items-center justify-center min-w-[32px] w-[32px] h-[32px] p-0 rounded-[8px] transition-colors border-none cursor-pointer ${
                          activeTool === t.id ? "bg-brand text-white shadow-sm" : "text-fg-muted hover:bg-surface-hover hover:text-brand"
                        }`}
                      >
                        <Icon size={15} strokeWidth={1.5} />
                      </button>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2 py-1 rounded-[6px] bg-[#171717] text-white text-[11px] font-medium whitespace-nowrap shadow-[0_2px_8px_rgba(0,0,0,0.15)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">{t.label}</div>
                    </div>
                  );
                })}
              </div>
              <div className="w-px h-[18px] bg-border/60 shrink-0" />
              <div className="flex items-center gap-1">
                <div className="relative group">
                  <button
                    onClick={() => setZoom((z) => Math.max(25, z - 10))}
                    className="flex shrink-0 items-center justify-center w-[32px] h-[32px] p-0 rounded-[8px] text-fg-muted hover:bg-surface-hover hover:text-brand transition-colors border-none cursor-pointer"
                  >
                    <ZoomOut size={15} strokeWidth={1.5} />
                  </button>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2 py-1 rounded-[6px] bg-[#171717] text-white text-[11px] font-medium whitespace-nowrap shadow-[0_2px_8px_rgba(0,0,0,0.15)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Zoom Out</div>
                </div>
                <span className="text-[13px] text-fg-muted font-semibold tabular-nums w-[38px] text-center shrink-0">{zoom}%</span>
                <div className="relative group">
                  <button
                    onClick={() => setZoom((z) => Math.min(200, z + 10))}
                    className="flex shrink-0 items-center justify-center w-[32px] h-[32px] p-0 rounded-[8px] text-fg-muted hover:bg-surface-hover hover:text-brand transition-colors border-none cursor-pointer"
                  >
                    <ZoomIn size={15} strokeWidth={1.5} />
                  </button>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2 py-1 rounded-[6px] bg-[#171717] text-white text-[11px] font-medium whitespace-nowrap shadow-[0_2px_8px_rgba(0,0,0,0.15)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Zoom In</div>
                </div>
              </div>
              <div className="w-px h-[18px] bg-border/60 shrink-0" />
              {showCanvasPreview && (
                <div className="flex items-center gap-0.5">
                  <div className="relative group">
                    <button
                      onClick={() => setPreviewMode("preview")}
                      className={`flex shrink-0 items-center justify-center w-[32px] h-[32px] p-0 rounded-[8px] transition-colors border-none cursor-pointer ${
                        previewMode === "preview" ? "bg-brand text-white shadow-sm" : "text-fg-muted hover:bg-white/60"
                      }`}
                    >
                      <Eye size={14} strokeWidth={1.5} />
                    </button>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2 py-1 rounded-[6px] bg-[#171717] text-white text-[11px] font-medium whitespace-nowrap shadow-[0_2px_8px_rgba(0,0,0,0.15)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Preview</div>
                  </div>
                  <div className="relative group">
                    <button
                      onClick={() => setPreviewMode("code")}
                      className={`flex shrink-0 items-center justify-center w-[32px] h-[32px] p-0 rounded-[8px] transition-colors border-none cursor-pointer ${
                        previewMode === "code" ? "bg-brand text-white shadow-sm" : "text-fg-muted hover:bg-white/60"
                      }`}
                    >
                      <Code2 size={14} strokeWidth={1.5} />
                    </button>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2 py-1 rounded-[6px] bg-[#171717] text-white text-[11px] font-medium whitespace-nowrap shadow-[0_2px_8px_rgba(0,0,0,0.15)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Code</div>
                  </div>
                </div>
              )}
              <button className="flex shrink-0 items-center gap-1.5 px-3 h-[32px] rounded-[8px] text-[13px] font-semibold bg-brand text-white hover:bg-[hsl(var(--brand-hover))] transition-colors border-none cursor-pointer">
                Export
              </button>
            </div>
          </motion.div>

          {/* Canvas area */}
          <motion.div
            className="flex-1 flex flex-col relative overflow-auto"
            initial={isNewCanvas ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div
              className="absolute inset-0 opacity-[0.08] pointer-events-none"
              style={{
                backgroundImage: "radial-gradient(circle, hsl(var(--fg-faint)) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />

            <div className="flex-1 flex items-center justify-center">
              {awaitingAnswers && questions && questions.length > 0 && (
                <div className="flex flex-col items-center text-center max-w-xs">
                  <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center mb-4">
                    <Sparkles size={24} strokeWidth={1.5} className="text-brand" />
                  </div>
                  <h2 className="text-[15px] font-semibold text-foreground mb-1">A few questions</h2>
                  <p className="text-[12px] text-fg-muted leading-relaxed">Answer in the prompt box below — or skip to go straight to generation.</p>
                </div>
              )}

              {isGenerating && !code && (
                <div className="flex flex-col items-center text-center max-w-xs">
                  <div className="w-8 h-8 border-2 border-brand/30 border-t-brand rounded-full animate-spin mb-4" />
                  <h2 className="text-[15px] font-semibold text-foreground mb-1">
                    {activePhase === "concept" && "Creating vision..."}
                    {activePhase === "system" && "Crafting design system..."}
                    {activePhase === "compose" && "Composing layout..."}
                    {activePhase === "critique" && "Reviewing quality..."}
                    {activePhase === "polish" && "Polishing details..."}
                    {!activePhase && "Starting..."}
                  </h2>
                  <p className="text-[12px] text-fg-muted leading-relaxed">The Pastel Agent is designing your UI.</p>
                </div>
              )}

              {code && previewMode === "preview" && (
                <iframe srcDoc={code} className="w-full h-full border-0" title="Design Preview" sandbox="allow-scripts allow-same-origin" />
              )}

              {code && previewMode === "code" && (
                <div className="w-full h-full overflow-auto p-6">
                  <pre className="text-[12px] font-mono text-fg-muted leading-relaxed whitespace-pre-wrap bg-background rounded-xl border border-border p-6">{code}</pre>
                </div>
              )}

              {!hasActiveSession && (
                <div className="relative inline-flex">
                  <div className="relative" onClick={() => setScreenToolbar(true)}>
                    <div className="absolute left-[-44px] top-1/2 -translate-y-1/2">
                      <button className="w-[28px] h-[28px] rounded-full border border-border bg-background flex items-center justify-center text-fg-muted hover:text-brand hover:border-brand focus:text-brand focus:border-brand transition-colors cursor-pointer">
                        <Plus size={14} strokeWidth={1.5} />
                      </button>
                    </div>
                    <div className="absolute right-[-44px] top-1/2 -translate-y-1/2">
                      <button className="w-[28px] h-[28px] rounded-full border border-border bg-background flex items-center justify-center text-fg-muted hover:text-brand hover:border-brand focus:text-brand focus:border-brand transition-colors cursor-pointer">
                        <Plus size={14} strokeWidth={1.5} />
                      </button>
                    </div>
                    <div className="absolute bottom-[-44px] left-1/2 -translate-x-1/2">
                      <button className="w-[28px] h-[28px] rounded-full border border-border bg-background flex items-center justify-center text-fg-muted hover:text-brand hover:border-brand focus:text-brand focus:border-brand transition-colors cursor-pointer">
                        <Plus size={14} strokeWidth={1.5} />
                      </button>
                    </div>
                    {screenToolbar && (
                      <div ref={toolbarRef} className="absolute -top-12 right-0 flex items-center gap-2 z-30">
                        <div className="flex items-center gap-0.5 h-[36px] px-[5px] rounded-[10px] bg-background shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
                          <Dropdown
                            value={screenModes[selectedPage] ?? "web"}
                            onChange={(mode) => setScreenModes(prev => ({ ...prev, [selectedPage]: mode as 'web' | 'mobile' }))}
                            options={[
                              { value: "web", label: <div className="flex items-center gap-1.5"><ComputerIcon size={12} strokeWidth={1.5} />Web</div> },
                              { value: "mobile", label: <div className="flex items-center gap-1.5"><SmartPhone01Icon size={12} strokeWidth={1.5} />Mobile</div> },
                            ]}
                            menuAlign="center"
                            showChevron={false}
                            triggerClassName="!p-0 !border-none !bg-transparent"
                            className="[&>div:last-child]:!min-w-0"
                            renderTrigger={() => (
                              <button
                                onClick={() => setActiveBarBtn(activeBarBtn === "mobile" ? null : "mobile")}
                                className={`flex items-center justify-center w-[28px] h-[28px] p-0 rounded-[7px] transition-colors border-none cursor-pointer ${activeBarBtn === "mobile" ? "bg-brand text-white" : "text-fg-muted hover:bg-brand hover:text-white"}`}
                              >
                                <SmartPhone01Icon size={13} strokeWidth={1.5} />
                              </button>
                            )}
                          />
                          <div className="relative group">
                            <button
                              onClick={() => setActiveBarBtn(activeBarBtn === "duplicate" ? null : "duplicate")}
                              className={`flex items-center justify-center w-[28px] h-[28px] p-0 rounded-[7px] transition-colors border-none cursor-pointer ${activeBarBtn === "duplicate" ? "bg-brand text-white" : "text-fg-muted hover:bg-brand hover:text-white"}`}
                            >
                              <Copy size={13} strokeWidth={1.5} />
                            </button>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2 py-1 rounded-[6px] bg-[#171717] text-white text-[11px] font-medium whitespace-nowrap shadow-[0_2px_8px_rgba(0,0,0,0.15)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Duplicate Screen</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 h-[36px] px-[5px] rounded-[10px] bg-background shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
                          <div className="relative group">
                            <button
                              onClick={() => setActiveBarBtn(activeBarBtn === "share" ? null : "share")}
                              className={`flex items-center justify-center w-[28px] h-[28px] p-0 rounded-[7px] transition-colors border-none cursor-pointer ${activeBarBtn === "share" ? "bg-brand text-white" : "text-fg-muted hover:bg-brand hover:text-white"}`}
                            >
                              <Share2 size={13} strokeWidth={1.5} />
                            </button>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2 py-1 rounded-[6px] bg-[#171717] text-white text-[11px] font-medium whitespace-nowrap shadow-[0_2px_8px_rgba(0,0,0,0.15)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Share Screen</div>
                          </div>
                          <div className="relative group">
                            <button
                              onClick={() => setActiveBarBtn(activeBarBtn === "code" ? null : "code")}
                              className={`flex items-center justify-center w-[28px] h-[28px] p-0 rounded-[7px] transition-colors border-none cursor-pointer ${activeBarBtn === "code" ? "bg-brand text-white" : "text-fg-muted hover:bg-brand hover:text-white"}`}
                            >
                              <Code2 size={13} strokeWidth={1.5} />
                            </button>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2 py-1 rounded-[6px] bg-[#171717] text-white text-[11px] font-medium whitespace-nowrap shadow-[0_2px_8px_rgba(0,0,0,0.15)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">View Code</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 h-[36px] px-[5px] rounded-[10px] bg-background shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
                          <div className="relative group">
                            <button
                              onClick={() => setActiveBarBtn(activeBarBtn === "regenerate" ? null : "regenerate")}
                              className={`flex items-center justify-center w-[28px] h-[28px] p-0 rounded-[7px] transition-colors border-none cursor-pointer ${activeBarBtn === "regenerate" ? "bg-brand text-white" : "text-fg-muted hover:bg-brand hover:text-white"}`}
                            >
                              <RotateCcw size={13} strokeWidth={1.5} />
                            </button>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2 py-1 rounded-[6px] bg-[#171717] text-white text-[11px] font-medium whitespace-nowrap shadow-[0_2px_8px_rgba(0,0,0,0.15)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Regenerate</div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="absolute -top-7 left-0">
                      {editingScreenName === selectedPage ? (
                        <input
                          autoFocus
                          value={screenLabels[selectedPage] ?? ""}
                          onChange={(e) => setScreenLabels(prev => ({ ...prev, [selectedPage]: e.target.value }))}
                          onBlur={() => setEditingScreenName(null)}
                          onKeyDown={(e) => { if (e.key === 'Enter') setEditingScreenName(null); }}
                          className="text-left text-[12px] font-medium text-fg-muted bg-transparent border-none outline-none w-[120px]"
                        />
                      ) : (
                        <button
                          onClick={() => setEditingScreenName(selectedPage)}
                          className="text-left text-[12px] font-medium text-fg-muted hover:text-foreground transition-colors border-none bg-transparent cursor-pointer"
                        >
                          {screenLabels[selectedPage] ?? "Untitled"}
                        </button>
                      )}
                    </div>
                    <div
                      className="bg-white rounded-[6px] border border-border shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-shadow duration-200 focus:shadow-[0_4px_20px_rgba(0,0,0,0.1)] focus:border-[hsl(var(--brand)/0.3)] outline-none cursor-pointer"
                      tabIndex={-1}
                      style={{
                        width: 900,
                        height: 530,
                        transform: `scale(${zoom / 100})`,
                        transformOrigin: "center center",
                      }}
                    >
                      {canvasElements.map((el) => (
                        <CanvasElement key={el.id} {...(el as any)} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom section: agent status + prompt */}
            <AnimatePresence>
              {showAgent && (
                <motion.div
                  className="shrink-0 flex justify-center pb-3 px-4"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 24 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="max-w-[580px] w-full">
                    {(isGenerating || awaitingAnswers || code) && (
                      <div className="rounded-t-[20px] rounded-b-none border border-border bg-background shadow-[0_4px_16px_rgba(0,0,0,0.06)] border-b-0 mb-[-48px]">
                        <div className="p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-[12px] font-semibold text-foreground truncate">
                                {isGenerating
                                  ? (activePhase === "concept" ? "Creating vision..." :
                                     activePhase === "system" ? "Crafting design system..." :
                                     activePhase === "compose" ? "Composing layout..." :
                                     activePhase === "critique" ? "Reviewing quality..." :
                                     activePhase === "polish" ? "Polishing details..." :
                                     "Starting...")
                                  : code ? "Design ready" : ""}
                              </span>
                            </div>
                            {isGenerating ? (
                              <button
                                onClick={cancel}
                                className="shrink-0 text-[11px] font-medium text-fg-muted hover:text-foreground px-2.5 py-1 rounded-lg border border-border bg-transparent cursor-pointer transition-colors"
                              >
                                Cancel
                              </button>
                            ) : awaitingAnswers ? null : code ? (
                              <button
                                onClick={handleReset}
                                className="shrink-0 text-[11px] font-medium text-fg-muted hover:text-foreground px-2.5 py-1 rounded-lg border border-border bg-transparent cursor-pointer transition-colors"
                              >
                                Reset
                              </button>
                            ) : null}
                          </div>

                          <div className="flex items-center gap-1.5">
                            {phaseOrder.filter(p => p !== "done" && p !== "error").map((phase) => {
                              const state = phases[phase];
                              const isActive = state?.status === "running";
                              const isDone = state?.status === "done";
                              return (
                                <div
                                  key={phase}
                                  className={`flex-1 h-1.5 rounded-full transition-colors ${
                                    isActive ? "bg-brand" : isDone ? "bg-brand/40" : "bg-surface-muted"
                                  }`}
                                />
                              );
                            })}
                          </div>

                          {pendingPrompt && (
                            <p className="text-[11px] text-fg-faint truncate">{pendingPrompt}</p>
                          )}

                          {error && (
                            <p className="text-[11px] text-danger font-medium">{error}</p>
                          )}
                        </div>
                        <div className="h-12" />
                      </div>
                    )}

                    <AnimatePresence mode="wait">
                      {awaitingAnswers && questions && questions.length > 0 ? (
                        <motion.div
                          key="clarify"
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 12 }}
                          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        >
                          <CanvasPromptInput
                            questions={questions}
                            answers={answers}
                            onAnswerChange={setAnswer}
                            onSubmit={handleSubmitAnswers}
                            isLoading={isGenerating}
                          />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="prompt"
                          initial={false}
                          animate={{ opacity: 1 }}
                        >
                          <PromptInput
                            onSubmit={handlePrompt}
                            placeholder={code ? "Refine this design..." : "Describe what you want to build..."}
                            isLoading={isGenerating}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
