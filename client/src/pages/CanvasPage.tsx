import { useState, useEffect, useCallback, useRef, useMemo, useLayoutEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, MousePointer2, Image, ZoomIn, ZoomOut, Layout, Plus, Hand, Code2, Eye, PaintBucket, FileImage, Share2, ChevronDown, RotateCcw, Copy, Search, Users, Info, MoreHorizontal, FileText, Loader2, AlertTriangle } from "lucide-react";
import { ComputerIcon, SmartPhone01Icon } from "hugeicons-react";
import { PromptInput } from "@/components/PromptInput";
import { CanvasPromptInput } from "@/components/CanvasPromptInput";
import { CanvasDropdown } from "@/components/CanvasDropdown";
import { usePastelAgent } from "@/hooks/use-pastel-agent";
import { AgentRunCard } from "@/components/agent/AgentRunCard";
import { ScreenPreview } from "@/components/agent/ScreenPreview";
import { ScreenPanel } from "@/components/agent/ScreenPanel";
import { DocsPanel } from "@/components/agent/DocsPanel";
import { DocReader } from "@/components/agent/DocReader";
import { FilesPanel } from "@/components/agent/FilesPanel";

const ALL_FONTS = [
  "Inter",
  "SF Pro",
  "Roboto",
  "Playfair Display",
  "JetBrains Mono",
  "DM Sans",
  "Space Grotesk",
];

const DEFAULT_FONT_VALUES: Record<string, string> = {
  Heading: "Inter",
  Subheading: "SF Pro",
  Body: "Inter",
};

const DEFAULT_SIZE_VALUES: Record<string, string> = {
  H1: "32px",
  H2: "24px",
  H3: "20px",
  Body: "14px",
  Small: "12px",
};

const DEFAULT_COLOUR_VALUES: Record<string, string> = {
  Primary: "#0B99FF",
  Secondary: "#7C3AED",
  Accent: "#F59E0B",
  Background: "#FFFFFF",
  Text: "#1A1A1A",
};

const DEFAULT_RADIUS_VALUES: Record<string, string> = {
  Small: "4",
  Medium: "8",
  Large: "12",
  "Extra Large": "20",
};

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
  return null;
}

export default function CanvasPage() {
  const [location, setLocation] = useLocation();
  const [activeTool, setActiveTool] = useState("select");
  const [zoom, setZoom] = useState(100);
  const [sidebarTab, setSidebarTab] = useState("screens");
  const [selectedScreen, setSelectedScreen] = useState<string | null>(null);
  const [activeDocPath, setActiveDocPath] = useState<string | null>(null);
  const [activeFilePath, setActiveFilePath] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const [editingSize, setEditingSize] = useState<string | null>(null);
  const [editingRadius, setEditingRadius] = useState<string | null>(null);
  const [cornerRadiusValues, setCornerRadiusValues] = useState<Record<string, string>>(DEFAULT_RADIUS_VALUES);
  const [sizeValues, setSizeValues] = useState<Record<string, string>>(DEFAULT_SIZE_VALUES);
  const [fontValues, setFontValues] = useState<Record<string, string>>(DEFAULT_FONT_VALUES);
  const [colourValues, setColourValues] = useState<Record<string, string>>(DEFAULT_COLOUR_VALUES);
  const [sliderHues, setSliderHues] = useState<Record<string, number>>({});
  const [mockScreens, setMockScreens] = useState<{ id: string; label: string; icon: React.ElementType }[]>([]);
  const [selectedMockScreen, setSelectedMockScreen] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("Untitled");
  const [editingProjectName, setEditingProjectName] = useState(false);
  const prevProjectName = useRef(projectName);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitedUsers, setInvitedUsers] = useState<{ name: string; email: string; status: "pending" | "accepted" | "declined" }[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  const iconHeaderRef = useRef<HTMLDivElement>(null);
  const sidebarHeaderRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (iconHeaderRef.current && sidebarHeaderRef.current) {
      iconHeaderRef.current.style.height = `${sidebarHeaderRef.current.offsetHeight}px`;
    }
  }, []);

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAgent, setShowAgent] = useState(false);
  const [previewMode, setPreviewMode] = useState<"code" | "preview">("preview");
  const [initialized, setInitialized] = useState(false);

  const projectId = location.startsWith("/canvas/") ? location.replace("/canvas/", "").split("/")[0] : null;
  const isNewCanvas = projectId === "new";
  const agentProjectId = projectId && !isNewCanvas ? projectId : null;

  const agent = usePastelAgent(agentProjectId);
  const {
    phases,
    status,
    isGenerating,
    error,
    phaseOrder,
    phaseLabels,
    docs,
    files,
    screens: agentScreens,
    brandKit,
    title: agentTitle,
    activity,
    failedScreens,
    originalPrompt,
    runId,
    questions,
    answers,
    awaitingAnswers,
    pendingPrompt,
    isClarifying,
    clarify,
    setAnswer,
    submitAnswers,
    skipClarify,
    reset,
  } = agent;

  const hasSession = status !== "idle" || awaitingAnswers;

  // Screens to display in the sidebar: live spec'd screens during a run,
  // verified screens once done, mock screens when there's no session.
  const specScreens = useMemo(
    () =>
      docs
        .filter((d) => d.kind === "screen-spec")
        .map((d) => d.path.replace(/^docs\/screens\//, "").replace(/\.md$/, "")),
    [docs],
  );

  const displayScreens = useMemo(() => {
    if (status === "done" && agentScreens.length > 0) {
      return agentScreens.map((name) => ({ name, ready: true, failed: failedScreens.includes(name) }));
    }
    if (hasSession && specScreens.length > 0) {
      return specScreens.map((name) => ({
        name,
        ready: status === "done" && agentScreens.includes(name),
        failed: failedScreens.includes(name),
      }));
    }
    return [];
  }, [status, agentScreens, specScreens, failedScreens, hasSession]);

  const componentFiles = useMemo(
    () => Object.keys(files).filter((p) => /^src\/components\/[^/]+\.jsx$/.test(p)),
    [files],
  );

  const activeDoc = useMemo(
    () => docs.find((d) => d.path === activeDocPath) ?? null,
    [docs, activeDocPath],
  );

  const activeFile = activeFilePath ? files[activeFilePath] ?? null : null;

  // ── Effects ──

  // Project name (API projects only, not mocks)
  const { data: apiProject } = useQuery({
    queryKey: ["/api/projects", projectId],
    queryFn: async () => {
      if (!projectId || isNewCanvas) return null;
      const res = await fetch(`/api/projects`, { credentials: "include" });
      if (!res.ok) return null;
      const projects: Array<{ id: string; name: string }> = await res.json();
      return projects.find((p) => p.id === projectId) || null;
    },
    enabled: !!projectId && !isNewCanvas,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (apiProject) setProjectName(apiProject.name);
  }, [apiProject, projectId]);

  // Agent-generated title wins once it lands
  useEffect(() => {
    if (agentTitle && !editingProjectName) setProjectName(agentTitle);
  }, [agentTitle, editingProjectName]);

  // Prompt handoff from the home page
  useEffect(() => {
    const storedPrompt = sessionStorage.getItem("pastel-prompt");
    if (storedPrompt && !hasSession && !initialized) {
      sessionStorage.removeItem("pastel-prompt");
      setShowAgent(true);
      setInitialized(true);
      setTimeout(() => clarify(storedPrompt), 200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Brand kit → design tab
  useEffect(() => {
    if (brandKit) {
      setColourValues(brandKit.colors);
      setFontValues(brandKit.fonts);
      setSizeValues(brandKit.sizes);
      const radius: Record<string, string> = {};
      for (const [k, v] of Object.entries(brandKit.radius)) {
        radius[k] = String(v).replace(/px$/, "");
      }
      setCornerRadiusValues(radius);
    }
  }, [brandKit]);

  // Auto-select the first screen when the run completes
  useEffect(() => {
    if (status === "done" && agentScreens.length > 0 && !selectedScreen) {
      setSelectedScreen(agentScreens[0]);
    }
  }, [status, agentScreens, selectedScreen]);

  useEffect(() => {
    if (showSearch) searchRef.current?.focus();
  }, [showSearch]);

  // ── Handlers ──

  const handlePrompt = useCallback(
    async (prompt: string) => {
      if (isNewCanvas) {
        setIsCreating(true);
        try {
          const res = await fetch("/api/projects", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: prompt.length > 200 ? prompt.slice(0, 197) + "..." : prompt,
              description: prompt,
            }),
          });
          if (res.ok) {
            const project = await res.json();
            sessionStorage.setItem("pastel-prompt", prompt);
            setLocation(`/canvas/${project.id}`);
            return;
          }
        } catch {}
        setIsCreating(false);
      }

      setShowAgent(true);
      setInitialized(true);
      setActiveDocPath(null);
      clarify(prompt);
    },
    [clarify, isNewCanvas, setLocation],
  );

  const handleReset = useCallback(() => {
    reset();
    setInitialized(false);
    setSelectedScreen(null);
    setActiveDocPath(null);
    setActiveFilePath(null);
    setIsCreating(false);
  }, [reset]);

  const openDoc = useCallback((path: string) => {
    setActiveDocPath(path);
  }, []);

  const closeDoc = useCallback(() => {
    setActiveDocPath(null);
  }, []);

  const selectScreen = useCallback((name: string, ready: boolean) => {
    if (!ready) return;
    setSelectedScreen(name);
    setActiveDocPath(null);
    setPreviewMode("preview");
  }, []);

  const showPreviewToggle = hasSession && (displayScreens.length > 0 || Object.keys(files).length > 0);

  // ── Render ──
  return (
    <div className="h-dvh bg-background flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 flex">
        {/* Icon sidebar */}
        <motion.div
          className="w-[64px] shrink-0 border-r border-border flex flex-col bg-background items-center gap-0.5 relative z-10"
          initial={isNewCanvas ? { opacity: 0, x: -16 } : false}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <div ref={iconHeaderRef} className="shrink-0 border-b border-border flex items-center justify-center w-full">
            <span className="text-brand leading-none">
              <svg viewBox="0 0 32 32" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <rect x="1.5" y="1.5" width="29" height="29" rx="8" fill="currentColor" />
                <path d="M10 22L16 9L22 22H10Z" fill="white" opacity="0.92" />
                <circle cx="16" cy="24" r="2.5" fill="white" opacity="0.92" />
              </svg>
            </span>
          </div>
          <div className="h-[6px]" />
          {[
            { id: "screens", icon: Layout, label: "Screens" },
            { id: "design", icon: PaintBucket, label: "Design" },
            { id: "docs", icon: FileText, label: "Docs", badge: docs.length },
            { id: "assets", icon: Image, label: "Assets" },
            { id: "collab", icon: Users, label: "Collab" },
            { id: "info", icon: Info, label: "Info" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSidebarTab(tab.id)}
              className={`relative flex flex-col items-center gap-0.5 w-full py-[7px] text-[9px] font-semibold border-none bg-transparent cursor-pointer transition-colors ${
                sidebarTab === tab.id ? "bg-brand/10 text-brand" : "text-foreground"
              }`}
            >
              <tab.icon size={14} strokeWidth={1.5} />
              {tab.label}
              {tab.id === "docs" && isGenerating && (
                <span className="absolute top-[4px] right-[14px] w-[6px] h-[6px] rounded-full bg-brand animate-pulse" />
              )}
            </button>
          ))}
          <div className="w-full h-px bg-border my-1.5" />
          <button
            onClick={() => setShowAgent((v) => !v)}
            className={`flex flex-col items-center gap-0.5 w-full py-[7px] text-[9px] font-semibold border-none bg-transparent cursor-pointer transition-colors ${
              showAgent ? "bg-brand/10 text-brand" : "text-foreground"
            }`}
          >
            <Sparkles size={14} strokeWidth={1.5} />
            Agent
          </button>
        </motion.div>

        {/* Content panel */}
        <div className="w-[200px] shrink-0 flex flex-col bg-background shadow-[2px_0_12px_rgba(0,0,0,0.06)]">
          <div ref={sidebarHeaderRef} className="shrink-0 px-3 pt-3 pb-2 border-b border-border">
            <div className="h-[18px] flex items-center">
              {editingProjectName ? (
                <input
                  autoFocus
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  onBlur={() => { if (!projectName.trim()) setProjectName(prevProjectName.current); setEditingProjectName(false); }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (!projectName.trim()) setProjectName(prevProjectName.current);
                      setEditingProjectName(false);
                    }
                  }}
                  className="text-[13px] font-semibold text-foreground bg-transparent border-none outline-none w-full p-0 m-0"
                />
              ) : (
                <span
                  onClick={() => { prevProjectName.current = projectName; setEditingProjectName(true); }}
                  className="text-[13px] font-semibold text-foreground cursor-pointer hover:text-brand transition-colors w-full truncate"
                >
                  {projectName}
                </span>
              )}
            </div>
            <p className="text-[11px] text-fg-faint mt-0.5">
              {hasSession
                ? `${displayScreens.length} screens · ${docs.length} docs`
                : `${mockScreens.length} screens`}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto overflow-x-hidden px-1.5 py-1 space-y-1">
            {sidebarTab === "screens" && (
              <>
                <div className="px-2.5 pr-0 pt-1 pb-1 flex items-center justify-between">
                  <AnimatePresence mode="wait">
                    {showSearch ? (
                      <motion.div
                        key="search"
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.15 }}
                        className="flex items-center gap-1.5 overflow-hidden"
                      >
                        <Search size={13} strokeWidth={1.5} className="text-fg-muted shrink-0" />
                        <input
                          ref={searchRef}
                          autoFocus
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Escape") { setShowSearch(false); setSearchQuery(""); } }}
                          placeholder="Search screens..."
                          className="w-[140px] text-[11px] font-medium text-foreground bg-transparent border-none outline-none placeholder:text-fg-faint"
                        />
                      </motion.div>
                    ) : (
                      <motion.span
                        key="label"
                        initial={false}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-[11.5px] font-semibold text-foreground"
                      >
                        Screens
                      </motion.span>
                    )}
                  </AnimatePresence>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setShowSearch((prev) => { if (prev) setSearchQuery(""); return !prev; })}
                      className="flex items-center justify-center w-[28px] h-[28px] rounded-[6px] text-foreground hover:bg-surface-hover transition-colors border-none bg-transparent cursor-pointer"
                    >
                      <Search size={13} strokeWidth={1.5} />
                    </button>

                  </div>
                </div>

                {/* Real agent screens */}
                {hasSession &&
                  displayScreens
                    .filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((s, i) => (
                      <motion.button
                        key={s.name}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: i * 0.04 }}
                        onClick={() => selectScreen(s.name, s.ready)}
                        disabled={!s.ready}
                        className={`flex items-center gap-2 w-full h-[28px] px-2.5 rounded-[10px] text-left transition-colors text-foreground box-border border-2 ${
                          selectedScreen === s.name && !activeDocPath
                            ? "bg-surface-hover font-semibold border-transparent"
                            : "bg-transparent border-transparent font-[450]"
                        } ${s.ready ? "cursor-pointer hover:bg-surface-hover" : "cursor-default opacity-70"}`}
                      >
                        {s.ready ? (
                          <Layout size={12} strokeWidth={1.5} className="shrink-0" />
                        ) : s.failed ? (
                          <AlertTriangle size={12} strokeWidth={1.5} className="shrink-0 text-warning" />
                        ) : (
                          <Loader2 size={12} className="shrink-0 animate-spin text-fg-faint" />
                        )}
                        <span className="text-[11px] truncate">{s.name}</span>
                        {s.failed && <span className="ml-auto text-[9px] text-warning font-medium">warn</span>}
                      </motion.button>
                    ))}

                {hasSession && displayScreens.length === 0 && (
                  <div className="px-2.5 py-4 text-center">
                    <Loader2 size={14} className="animate-spin text-fg-faint mx-auto mb-1.5" />
                    <p className="text-[11px] text-fg-muted leading-relaxed">
                      The agent is planning the screens — they'll appear here.
                    </p>
                  </div>
                )}

                {!hasSession && (
                  <div className="px-2.5 py-4 text-center">
                    <p className="text-[11px] text-fg-muted leading-relaxed">
                      No screens yet — describe what you want to build above.
                    </p>
                  </div>
                )}
              </>
            )}

            {sidebarTab === "design" && (
              <>
                <div className="px-2.5 pt-1.5 pb-1">
                  <span className="text-[11.5px] font-semibold text-foreground">Fonts</span>
                </div>
                <div className="space-y-0.5 pb-1.5">
                  {Object.entries(fontValues).map(([role]) => (
                    <div key={role}>
                      <CanvasDropdown
                        value={fontValues[role]}
                        onChange={(font) => setFontValues((prev) => ({ ...prev, [role]: font }))}
                        options={[...new Set([...Object.values(fontValues), ...ALL_FONTS])].map((f) => ({ value: f, label: f }))}
                        align="center"
                      >
                        <button className="flex w-full items-center justify-between px-2.5 h-[28px] rounded-[10px] text-[11px] font-[450] text-foreground hover:bg-surface-hover transition-colors border-none bg-transparent cursor-pointer text-left">
                          <span className="capitalize">{role}</span>
                          <span className="flex items-center gap-1 text-fg-faint">
                            {fontValues[role]}
                            <ChevronDown size={12} />
                          </span>
                        </button>
                      </CanvasDropdown>
                    </div>
                  ))}
                </div>

                <div className="h-px bg-border -mx-2" />

                <div className="px-2.5 pt-1.5 pb-1">
                  <span className="text-[11.5px] font-semibold text-foreground">Font sizes</span>
                </div>
                <div className="space-y-0.5 pb-1.5">
                  {Object.entries(sizeValues).map(([label, val]) => (
                    <div key={label}>
                      {editingSize === label ? (
                        <div className="flex w-full items-center justify-between px-2.5 h-[28px] rounded-[10px] text-[11px] font-[450] text-foreground">
                          <span className="capitalize">{label}</span>
                          <div className="flex items-center gap-0.5">
                            <input
                              autoFocus
                              value={String(val).replace("px", "")}
                              onChange={(e) => setSizeValues((prev) => ({ ...prev, [label]: e.target.value + "px" }))}
                              onBlur={() => setEditingSize(null)}
                              onKeyDown={(e) => { if (e.key === "Enter") setEditingSize(null); }}
                              className="w-[40px] text-right text-[11px] font-[450] text-foreground bg-transparent border-none outline-none"
                            />
                            <span className="text-fg-faint text-[11px]">px</span>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingSize(label)}
                          className="flex w-full items-center justify-between px-2.5 h-[28px] rounded-[10px] text-[11px] font-[450] text-foreground hover:bg-surface-hover transition-colors border-none bg-transparent cursor-pointer text-left"
                        >
                          <span className="capitalize">{label}</span>
                          <span className="text-fg-faint">{val}</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="h-px bg-border -mx-2" />

                <div className="px-2.5 pt-1.5 pb-1">
                  <span className="text-[11.5px] font-semibold text-foreground">Colours</span>
                </div>
                <div className="space-y-0.5 pb-1.5">
                  {Object.entries(colourValues).map(([id, hex]) => {
                    const safeHex = /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : "#888888";
                    const r = parseInt(safeHex.slice(1, 3), 16) || 0;
                    const g = parseInt(safeHex.slice(3, 5), 16) || 0;
                    const b = parseInt(safeHex.slice(5, 7), 16) || 0;
                    return (
                      <div key={id}>
                        <button
                          onClick={() => setSelectedColor(selectedColor === id ? null : id)}
                          className="flex w-full items-center justify-between px-2.5 h-[28px] rounded-[10px] text-[11px] font-[450] text-foreground hover:bg-surface-hover transition-colors border-none bg-transparent cursor-pointer text-left"
                        >
                          <span className="flex items-center gap-2.5">
                            <div
                              className="w-[16px] h-[16px] rounded-[4px] border border-border/60 shrink-0"
                              style={{ backgroundColor: safeHex }}
                            />
                            <span className="capitalize">{id}</span>
                          </span>
                          <span className="text-fg-faint">{hex}</span>
                        </button>
                        {selectedColor === id && (
                          <div className="px-3 pb-2 pt-1.5 space-y-2">
                            <div
                              className="w-full h-[64px] rounded-[8px]"
                              style={{
                                background: `linear-gradient(135deg, ${safeHex} 0%, rgb(${Math.min(r + 100, 255)}, ${Math.min(g + 100, 255)}, ${Math.min(b + 100, 255)}) 100%)`,
                              }}
                            />
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-fg-muted font-medium uppercase tracking-wider w-7">Hex</span>
                              <span className="text-fg-faint text-[12px] font-mono">#</span>
                              <input
                                value={safeHex.slice(1)}
                                onChange={(e) => {
                                  setColourValues((prev) => ({ ...prev, [id]: `#${e.target.value}` }));
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

                <div className="h-px bg-border -mx-2" />

                <div className="px-2.5 pt-1.5 pb-1">
                  <span className="text-[11.5px] font-semibold text-foreground">Roundness</span>
                </div>
                <div className="space-y-0.5 pb-1.5">
                  {Object.entries(cornerRadiusValues).map(([label, rawVal]) => {
                    const val = parseInt(rawVal) || 0;
                    const r = Math.min(val, 16);
                    return (
                      <div key={label}>
                        {editingRadius === label ? (
                          <div className="flex w-full items-center justify-between px-2.5 h-[28px] rounded-[10px] text-[11px] font-[450] text-foreground">
                            <span className="flex items-center gap-2.5 capitalize">
                              <svg width="14" height="14" viewBox="0 0 28 28" fill="none" className="shrink-0">
                                <path d={`M 2 24 L 2 ${2 + r} Q 2 2 ${2 + r} 2 L 24 2`} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" className="text-foreground" />
                              </svg>
                              {label}
                            </span>
                            <div className="flex items-center gap-0.5">
                              <input
                                autoFocus
                                value={rawVal}
                                onChange={(e) => setCornerRadiusValues((prev) => ({ ...prev, [label]: e.target.value }))}
                                onBlur={() => setEditingRadius(null)}
                                onKeyDown={(e) => { if (e.key === "Enter") setEditingRadius(null); }}
                                className="w-[40px] text-right text-[11px] font-[450] text-foreground bg-transparent border-none outline-none"
                              />
                              <span className="text-fg-faint text-[11px]">px</span>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingRadius(label)}
                            className="flex w-full items-center justify-between px-2.5 h-[28px] rounded-[10px] text-[11px] font-[450] text-foreground hover:bg-surface-hover transition-colors border-none bg-transparent cursor-pointer text-left"
                          >
                            <span className="flex items-center gap-2.5 capitalize">
                              <svg width="14" height="14" viewBox="0 0 28 28" fill="none" className="shrink-0">
                                <path d={`M 2 24 L 2 ${2 + r} Q 2 2 ${2 + r} 2 L 24 2`} stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" className="text-foreground" />
                              </svg>
                              {label}
                            </span>
                            <span className="text-fg-faint">{rawVal}px</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {sidebarTab === "docs" && (
              <DocsPanel
                docs={docs}
                isRunning={isGenerating}
                activeDocPath={activeDocPath}
                onOpenDoc={openDoc}
              />
            )}

            {sidebarTab === "assets" && (
              <>
                <div className="px-2.5 pt-1.5 pb-1 flex items-center justify-between">
                  <span className="text-[11.5px] font-semibold text-foreground">Components</span>
                </div>
                <div className="space-y-1.5 px-2.5">
                    {(componentFiles.length > 0
                      ? componentFiles.map((p) => ({ id: p, label: p.split("/").pop()!.replace(/\.jsx$/, "") }))
                      : []
                    ).slice(0, 6).map((c, i) => (
                    <div
                      key={c.id}
                      className="group rounded-[10px] border border-border bg-background hover:shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-all duration-150 cursor-pointer overflow-hidden"
                      onClick={() => {
                        if (files[c.id]) {
                          setActiveFilePath(c.id);
                          setPreviewMode("code");
                          setActiveDocPath(null);
                        }
                      }}
                    >
                      <div className="aspect-[16/8] bg-surface-hover flex items-center justify-center">
                        <div className="w-5 h-5 rounded-[4px] border border-border/40 bg-background flex items-center justify-center">
                          <span className="text-[9px] font-bold text-fg-muted uppercase">{c.label.slice(0, 2)}</span>
                        </div>
                      </div>
                      <div className="h-px bg-border/60" />
                      <div className="px-2.5 py-1.5">
                        <p className="text-[12px] font-[450] text-foreground truncate">{c.label}</p>
                        <p className="text-[10px] text-fg-faint mt-0.5">{files[c.id] ? "Generated component" : ["2 hours ago", "Yesterday", "3 days ago", "1 week ago"][i % 4]}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="h-px bg-border -mx-2" />

                <div className="px-2.5 pt-1.5 pb-1 flex items-center justify-between">
                  <span className="text-[11.5px] font-semibold text-foreground">Uploads</span>
                </div>
                <div className="space-y-1.5 px-2.5">
                  {([]
                  ).slice(0, 4).map((u: any, i: number) => (
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
                        <p className="text-[12px] font-[450] text-foreground truncate">{u.label}</p>
                        <p className="text-[10px] text-fg-faint mt-0.5">{["2 hours ago", "Yesterday", "3 days ago", "1 week ago"][i % 4]}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {sidebarTab === "collab" && (
              <>
                <div className="px-2.5 pt-1.5 pb-2">
                  <span className="text-[11.5px] font-semibold text-foreground">Invite</span>
                </div>
                <div className="px-2.5 pb-2">
                  <div className="flex items-center gap-1">
                    <input
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && inviteEmail.trim()) {
                          setInvitedUsers((prev) => [...prev, { name: inviteEmail.trim(), email: inviteEmail.trim(), status: "pending" }]);
                          setInviteEmail("");
                        }
                      }}
                      placeholder="Email or name..."
                      className="flex-1 h-[28px] px-2 rounded-[6px] bg-surface-muted text-[12px] text-foreground border-none outline-none placeholder:text-fg-faint"
                    />
                    <button
                      onClick={() => {
                        if (inviteEmail.trim()) {
                          setInvitedUsers((prev) => [...prev, { name: inviteEmail.trim(), email: inviteEmail.trim(), status: "pending" }]);
                          setInviteEmail("");
                        }
                      }}
                      className="flex items-center justify-center w-[28px] h-[28px] rounded-[6px] text-fg-muted hover:text-brand hover:bg-surface-hover transition-colors border-none bg-transparent cursor-pointer shrink-0"
                    >
                      <Plus size={14} strokeWidth={2} />
                    </button>
                  </div>
                </div>
                <div className="px-2.5 pt-1 pb-1">
                  <span className="text-[11.5px] font-semibold text-foreground">People</span>
                </div>
                <div className="space-y-0.5">
                  {invitedUsers.length === 0 && (
                    <p className="text-[11px] text-fg-faint py-2 text-center">No team members yet</p>
                  )}
                  {invitedUsers.map((user, i) => (
                    <div key={i} className="flex items-center gap-2 px-2.5 h-[32px] rounded-[8px]">
                      <div className="w-[20px] h-[20px] rounded-full bg-surface-hover flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-semibold text-fg-muted">
                          {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-foreground truncate">{user.name}</p>
                      </div>
                      <div className={`text-[10px] font-medium shrink-0 ${
                        user.status === "accepted" ? "text-brand" : user.status === "declined" ? "text-danger" : "text-fg-muted"
                      }`}>
                        {user.status === "accepted" ? "Active" : user.status === "declined" ? "Declined" : "Pending"}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {sidebarTab === "info" && (
              <>
                <div className="px-2.5 pt-1.5 pb-2 flex items-center justify-between">
                  <span className="text-[11.5px] font-semibold text-foreground">Project Info</span>
                  <CanvasDropdown
                    value=""
                    onChange={(action) => {
                      if (action === "rename") setEditingProjectName(true);
                    }}
                    options={[
                      { value: "rename", label: "Rename project" },
                      { value: "delete", label: "Delete project", variant: "danger" },
                    ]}
                    align="right"
                  >
                    <button className="flex items-center justify-center w-[22px] h-[22px] rounded-[4px] text-foreground hover:bg-surface-hover transition-colors border-none bg-transparent cursor-pointer">
                      <MoreHorizontal size={13} strokeWidth={1.5} />
                    </button>
                  </CanvasDropdown>
                </div>
                <div className="px-2.5 pb-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-fg-muted">Name</span>
                    <span className="text-[10px] text-foreground font-medium truncate max-w-[120px]">{projectName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-fg-muted">Screens</span>
                    <span className="text-[10px] text-foreground">{hasSession ? displayScreens.length : mockScreens.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-fg-muted">Documents</span>
                    <span className="text-[10px] text-foreground">{docs.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-fg-muted">Source files</span>
                    <span className="text-[10px] text-foreground">{Object.keys(files).length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-fg-muted">Fonts</span>
                    <span className="text-[10px] text-foreground">{Object.keys(fontValues).length}</span>
                  </div>
                </div>
                {originalPrompt && (
                  <>
                    <div className="w-full h-px bg-border/50" />
                    <div className="px-2.5 pt-2 pb-1">
                      <span className="text-[11.5px] font-semibold text-foreground">Original Prompt</span>
                      <p className="text-[10px] text-fg-muted leading-relaxed mt-1 line-clamp-6">{originalPrompt}</p>
                    </div>
                  </>
                )}
              </>
            )}
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
            <div className="flex items-center gap-1.5 h-[36px] px-2 rounded-[10px] bg-background shadow-[0_1px_3px_rgba(0,0,0,0.1)] border border-border/50">
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
                        className={`flex shrink-0 items-center justify-center min-w-[28px] w-[28px] h-[28px] p-0 rounded-[7px] transition-colors border-none cursor-pointer ${
                          activeTool === t.id ? "bg-brand text-white" : "text-fg-muted hover:bg-surface-hover hover:text-foreground"
                        }`}
                      >
                        <Icon size={14} strokeWidth={1.5} />
                      </button>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2 py-1 rounded-[6px] bg-[#171717] text-white text-[11px] font-medium whitespace-nowrap shadow-[0_2px_8px_rgba(0,0,0,0.15)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">{t.label}</div>
                    </div>
                  );
                })}
              </div>
              <div className="w-px h-[14px] bg-border/50 shrink-0" />
              <div className="flex items-center gap-0.5">
                <div className="relative group">
                  <button
                    onClick={() => setZoom((z) => Math.max(25, z - 10))}
                    className="flex shrink-0 items-center justify-center w-[28px] h-[28px] p-0 rounded-[7px] text-fg-muted hover:bg-surface-hover hover:text-foreground transition-colors border-none cursor-pointer"
                  >
                    <ZoomOut size={14} strokeWidth={1.5} />
                  </button>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2 py-1 rounded-[6px] bg-[#171717] text-white text-[11px] font-medium whitespace-nowrap shadow-[0_2px_8px_rgba(0,0,0,0.15)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Zoom Out</div>
                </div>
                <span className="text-[11px] text-fg-muted font-medium tabular-nums w-[32px] text-center shrink-0">{zoom}%</span>
                <div className="relative group">
                  <button
                    onClick={() => setZoom((z) => Math.min(200, z + 10))}
                    className="flex shrink-0 items-center justify-center w-[28px] h-[28px] p-0 rounded-[7px] text-fg-muted hover:bg-surface-hover hover:text-foreground transition-colors border-none cursor-pointer"
                  >
                    <ZoomIn size={14} strokeWidth={1.5} />
                  </button>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2 py-1 rounded-[6px] bg-[#171717] text-white text-[11px] font-medium whitespace-nowrap shadow-[0_2px_8px_rgba(0,0,0,0.15)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Zoom In</div>
                </div>
              </div>
              {showPreviewToggle && (
                <>
                  <div className="w-px h-[14px] bg-border/50 shrink-0" />
                  <div className="flex items-center gap-0.5">
                    <div className="relative group">
                      <button
                        onClick={() => setPreviewMode("preview")}
                        className={`flex shrink-0 items-center justify-center w-[28px] h-[28px] p-0 rounded-[7px] transition-colors border-none cursor-pointer ${
                          previewMode === "preview" ? "bg-brand text-white" : "text-fg-muted hover:bg-surface-hover hover:text-foreground"
                        }`}
                      >
                        <Eye size={14} strokeWidth={1.5} />
                      </button>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2 py-1 rounded-[6px] bg-[#171717] text-white text-[11px] font-medium whitespace-nowrap shadow-[0_2px_8px_rgba(0,0,0,0.15)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Preview</div>
                    </div>
                    <div className="relative group">
                      <button
                        onClick={() => {
                          setPreviewMode("code");
                          setActiveDocPath(null);
                          if (!activeFilePath) {
                            const first = Object.keys(files).sort()[0];
                            if (first) setActiveFilePath(first);
                          }
                        }}
                        className={`flex shrink-0 items-center justify-center w-[28px] h-[28px] p-0 rounded-[7px] transition-colors border-none cursor-pointer ${
                          previewMode === "code" ? "bg-brand text-white" : "text-fg-muted hover:bg-surface-hover hover:text-foreground"
                        }`}
                      >
                        <Code2 size={14} strokeWidth={1.5} />
                      </button>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2 py-1 rounded-[6px] bg-[#171717] text-white text-[11px] font-medium whitespace-nowrap shadow-[0_2px_8px_rgba(0,0,0,0.15)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Code</div>
                    </div>
                  </div>
                </>
              )}
              <div className="w-px h-[14px] bg-border/50 shrink-0" />
              <button className="flex shrink-0 items-center gap-1.5 px-2.5 h-[28px] rounded-[7px] text-[12px] font-semibold bg-brand text-white hover:bg-[hsl(var(--brand-hover))] transition-colors border-none cursor-pointer">
                Export
              </button>
            </div>
          </motion.div>

          {/* Canvas area */}
          <motion.div
            className="flex-1 flex flex-col relative overflow-hidden"
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

            <div className="flex-1 relative">
              {/* Doc reader (opens on top of everything) */}
              {activeDoc && (
                <DocReader doc={activeDoc} onBack={closeDoc} />
              )}

              {/* Code view */}
              {!activeDoc && previewMode === "code" && hasSession && (
                <div className="absolute inset-0 flex bg-background">
                  <div className="w-[220px] shrink-0 border-r border-border overflow-y-auto px-1.5 py-2">
                    <FilesPanel files={files} activeFile={activeFilePath} onSelectFile={setActiveFilePath} />
                  </div>
                  <div className="flex-1 overflow-auto">
                    {activeFile ? (
                      <div className="min-h-full">
                        <div className="sticky top-0 bg-background/95 backdrop-blur border-b border-border px-4 h-[36px] flex items-center">
                          <span className="text-[11px] font-mono text-fg-muted">{activeFile.path}</span>
                        </div>
                        <pre className="text-[12px] font-mono text-foreground/80 leading-relaxed whitespace-pre-wrap p-4">{activeFile.content}</pre>
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-[12px] text-fg-muted">Select a file to view its source</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Verified screen preview */}
              {!activeDoc && previewMode === "preview" && status === "done" && selectedScreen && runId && (
                <div className="absolute inset-0 flex flex-col items-center p-6 overflow-y-auto">
                  <div className="w-full max-w-[1400px]">
                    <ScreenPanel screenName={selectedScreen || ""}>
                      <div className="w-full"
                           style={{ transform: `scale(${zoom / 100})`, transformOrigin: "center top" }}>
                        <ScreenPreview runId={runId} screen={selectedScreen} />
                      </div>
                    </ScreenPanel>
                  </div>
                </div>
              )}

              {/* Working state */}
              {!activeDoc && previewMode === "preview" && isGenerating && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex flex-col items-center text-center max-w-xs">
                  <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center mb-4">
                    <Sparkles size={24} strokeWidth={1.5} className="text-brand" />
                  </div>
                  <h2 className="text-[15px] font-semibold text-foreground mb-1">
                    {phases.brief.status === "running" && "Reading your brief…"}
                    {phases.plan.status === "running" && "Designing every detail…"}
                    {phases.build.status === "running" && "Coding the app…"}
                    {phases.verify.status === "running" && "Verifying in the sandbox…"}
                    {phases.present.status === "running" && "Finishing up…"}
                    {!phases.brief.status.match(/running|done/) && "Starting the agent…"}
                  </h2>
                  <p className="text-[12px] text-fg-muted leading-relaxed">
                    {docs.length > 0
                      ? `${docs.length} document${docs.length === 1 ? "" : "s"} written · ${Object.keys(files).length} files built`
                      : "The agent is working. Everything is saved as it happens — you can safely leave this page."}
                  </p>
                  </div>
                </div>
              )}

              {/* Clarify hint */}
              {!activeDoc && awaitingAnswers && questions && questions.length > 0 && !isGenerating && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex flex-col items-center text-center max-w-xs">
                    <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center mb-4">
                      <Sparkles size={24} strokeWidth={1.5} className="text-brand" />
                    </div>
                    <h2 className="text-[15px] font-semibold text-foreground mb-1">A few questions</h2>
                    <p className="text-[12px] text-fg-muted leading-relaxed">Answer in the prompt box below — or skip to go straight to generation.</p>
                  </div>
                </div>
              )}

              {/* Error state */}
              {!activeDoc && status === "error" && !isGenerating && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex flex-col items-center text-center max-w-md">
                    <div className="w-16 h-16 rounded-2xl bg-danger/10 flex items-center justify-center mb-4">
                      <AlertTriangle size={24} strokeWidth={1.5} className="text-danger" />
                    </div>
                    <h2 className="text-[15px] font-semibold text-foreground mb-1">Couldn't generate your design</h2>
                    <p className="text-[12px] text-fg-muted leading-relaxed mb-1">
                      The design agent encountered an error. Your project is safe — try again.
                    </p>
                    <p className="text-[11px] text-fg-faint leading-relaxed mb-5 font-mono bg-surface-muted px-3 py-2 rounded-lg w-full truncate">{error}</p>
                    <button
                      onClick={handleReset}
                      className="h-9 px-4 rounded-xl border border-border text-[13px] font-medium text-foreground hover:bg-surface-hover transition-colors bg-transparent cursor-pointer"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              )}

              {/* Empty canvas (no session) */}
              {!hasSession && (
                <div className="absolute inset-0 flex items-center justify-center overflow-auto">
                  <div
                    className="relative"
                    style={{ transform: `scale(${zoom / 100})`, transformOrigin: "center center" }}
                  >
                    <div className="bg-white rounded-[6px] border border-border/60 shadow-[0_1px_6px_rgba(0,0,0,0.06)]" style={{ width: 900, height: 530 }}>
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          <Layout size={32} strokeWidth={1} className="text-fg-faint mx-auto mb-2" />
                          <p className="text-[13px] text-fg-muted font-medium">Empty canvas</p>
                          <p className="text-[11px] text-fg-faint mt-1">Describe what you want to build below</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Done but no screen selected */}
              {!activeDoc && previewMode === "preview" && status === "done" && !selectedScreen && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex flex-col items-center text-center max-w-xs">
                    <div className="w-16 h-16 rounded-2xl bg-surface-muted flex items-center justify-center mb-4">
                      <Layout size={24} strokeWidth={1.5} className="text-fg-muted" />
                    </div>
                    <h2 className="text-[15px] font-semibold text-foreground mb-1">Select a screen</h2>
                    <p className="text-[12px] text-fg-muted leading-relaxed">Pick a screen from the sidebar to view it.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom section: agent status + prompt */}
            <AnimatePresence>
              {showAgent && (
                <motion.div
                  className="shrink-0 flex justify-center pb-3 px-4 relative z-20"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 24 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="max-w-[580px] w-full">
                    {hasSession && (
                      <AgentRunCard
                        status={status}
                        phases={phases}
                        phaseOrder={phaseOrder}
                        phaseLabels={phaseLabels}
                        activity={activity}
                        prompt={originalPrompt || pendingPrompt}
                        error={error}
                        screensCount={agentScreens.length}
                        docsCount={docs.length}
                        failedScreens={failedScreens}
                        onReset={handleReset}
                      />
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
                            onSubmit={submitAnswers}
                            onSkip={skipClarify}
                            isLoading={isGenerating || isClarifying}
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
                            placeholder={status === "done" ? "Start a new design..." : "Describe what you want to build..."}
                            isLoading={isGenerating || isCreating || isClarifying}
                            systemError={status === "error"}
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
