import { useState } from 'react';
import { useLocation } from 'wouter';
import { Sparkles, MousePointer2, Square, Circle, Type, Image, Minus, ZoomIn, ZoomOut, Download, FileImage, FileText, Layout, Plus, Monitor, Smartphone, Tablet, Share2, PaintBucket, Box, Upload, ChevronLeft, Hand } from 'lucide-react';
import { PromptInput } from '@/components/PromptInput';

const MOCK_PROJECTS: Record<string, { name: string }> = {
  '1': { name: 'Landing Page Redesign' },
  '2': { name: 'Dashboard UI Kit' },
  '3': { name: 'Mobile App Mockups' },
};

const MOCK_SCREENS = [
  { id: 's1', label: 'Homepage', icon: Monitor },
  { id: 's2', label: 'About', icon: Monitor },
  { id: 's3', label: 'Pricing', icon: Monitor },
  { id: 's4', label: 'Contact', icon: Smartphone },
  { id: 's5', label: 'Blog', icon: Monitor },
];

const MOCK_COMPONENTS = [
  { id: 'c1', label: 'Button', icon: 'box' },
  { id: 'c2', label: 'Card', icon: 'box' },
  { id: 'c3', label: 'Navbar', icon: 'box' },
  { id: 'c4', label: 'Input', icon: 'box' },
  { id: 'c5', label: 'Modal', icon: 'box' },
];

const MOCK_COLOURS = [
  { id: 'col1', label: 'Primary', hex: '#0B99FF' },
  { id: 'col2', label: 'Secondary', hex: '#7C3AED' },
  { id: 'col3', label: 'Accent', hex: '#F59E0B' },
  { id: 'col4', label: 'Background', hex: '#FFFFFF' },
  { id: 'col5', label: 'Text', hex: '#1A1A1A' },
];

const MOCK_UPLOADS = [
  { id: 'u1', label: 'logo.svg', type: 'svg' },
  { id: 'u2', label: 'hero.jpg', type: 'image' },
  { id: 'u3', label: 'icon-set.png', type: 'image' },
  { id: 'u4', label: 'font.woff2', type: 'font' },
  { id: 'u5', label: 'pattern.svg', type: 'svg' },
];

function CanvasElement({ type, x, y, w, h, label }: { type: string; x: number; y: number; w: number; h: number; label: string }) {
  const base = 'absolute rounded-[8px] border-2 border-transparent hover:border-brand/40 group cursor-default';
  if (type === 'image') {
    return (
      <div className={`${base} bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200 flex items-center justify-center`} style={{ left: x, top: y, width: w, height: h }}>
        <Image size={20} className="text-blue-300" strokeWidth={1} />
        <div className="absolute bottom-1.5 left-2 text-[9px] text-fg-faint font-medium">{label}</div>
      </div>
    );
  }
  if (type === 'text') {
    return (
      <div className={`${base} bg-transparent`} style={{ left: x, top: y, width: w, height: h }}>
        <div className="text-[12px] font-semibold text-foreground leading-tight pt-1">{label}</div>
        <div className="text-[9px] text-fg-muted mt-0.5 leading-relaxed">Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore.</div>
      </div>
    );
  }
  if (type === 'rect') {
    return (
      <div className={`${base} bg-gradient-to-br from-violet-50 to-blue-50 border-violet-200 flex items-center justify-center`} style={{ left: x, top: y, width: w, height: h }}>
        <span className="text-[11px] font-medium text-violet-600">{label}</span>
      </div>
    );
  }
  if (type === 'circle') {
    return (
      <div className={`${base} bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 rounded-full flex items-center justify-center`} style={{ left: x, top: y, width: w, height: h }}>
        <span className="text-[9px] font-medium text-amber-600">{label}</span>
      </div>
    );
  }
  if (type === 'line') {
    return (
      <div className="absolute flex items-center" style={{ left: x, top: y, width: w, height: h }}>
        <div className="w-full h-[2px] bg-border rounded-full" />
      </div>
    );
  }
  return null;
}

export default function CanvasPage() {
  const [location] = useLocation();
  const [activeTool, setActiveTool] = useState('select');
  const [zoom, setZoom] = useState(100);
  const [sidebarTab, setSidebarTab] = useState('pages');
  const [selectedPage, setSelectedPage] = useState('s1');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);

  const projectId = location.startsWith('/canvas/') ? location.replace('/canvas/', '').split('/')[0] : null;
  const project = projectId ? MOCK_PROJECTS[projectId] : null;

  const handlePrompt = (prompt: string) => {
    console.log('Prompt:', prompt);
  };

  const canvasElements = projectId === '1' ? [
    { id: 'nav', type: 'rect', x: 40, y: 30, w: 560, h: 40, label: 'Navigation' },
    { id: 'hero-img', type: 'image', x: 340, y: 100, w: 260, h: 200, label: 'Hero Image' },
    { id: 'hero-title', type: 'text', x: 40, y: 110, w: 280, h: 80, label: 'Build Beautiful Products' },
    { id: 'hero-sub', type: 'text', x: 40, y: 195, w: 280, h: 60, label: 'A modern platform for design teams' },
    { id: 'cta', type: 'rect', x: 40, y: 270, w: 140, h: 36, label: 'Get Started' },
    { id: 'feature1', type: 'rect', x: 40, y: 340, w: 170, h: 120, label: 'Feature One' },
    { id: 'feature2', type: 'rect', x: 230, y: 340, w: 170, h: 120, label: 'Feature Two' },
    { id: 'feature3', type: 'rect', x: 420, y: 340, w: 170, h: 120, label: 'Feature Three' },
    { id: 'line1', type: 'line', x: 40, y: 500, w: 550, h: 2, label: '' },
    { id: 'footer', type: 'text', x: 40, y: 520, w: 560, h: 30, label: '© 2026 Pastel. All rights reserved.' },
    { id: 'circle1', type: 'circle', x: 590, y: 140, w: 40, h: 40, label: '' },
    { id: 'circle2', type: 'circle', x: 590, y: 190, w: 40, h: 40, label: '' },
  ] : projectId === '2' ? [
    { id: 'sidebar', type: 'rect', x: 10, y: 10, w: 160, h: 500, label: 'Sidebar' },
    { id: 'header', type: 'rect', x: 180, y: 10, w: 460, h: 50, label: 'Header' },
    { id: 'card1', type: 'rect', x: 180, y: 75, w: 145, h: 90, label: 'Revenue' },
    { id: 'card2', type: 'rect', x: 335, y: 75, w: 145, h: 90, label: 'Users' },
    { id: 'card3', type: 'rect', x: 490, y: 75, w: 145, h: 90, label: 'Sales' },
    { id: 'chart', type: 'rect', x: 180, y: 180, w: 290, h: 200, label: 'Chart Area' },
    { id: 'table', type: 'rect', x: 485, y: 180, w: 150, h: 200, label: 'Activity' },
    { id: 'footer', type: 'rect', x: 180, y: 395, w: 455, h: 40, label: 'Table Footer' },
  ] : projectId === '3' ? [
    { id: 'status', type: 'rect', x: 180, y: 30, w: 280, h: 30, label: 'Status Bar' },
    { id: 'logo', type: 'image', x: 290, y: 85, w: 60, h: 60, label: 'Logo' },
    { id: 'title', type: 'text', x: 180, y: 160, w: 280, h: 30, label: 'Welcome Back' },
    { id: 'email', type: 'rect', x: 180, y: 200, w: 280, h: 36, label: 'Email Input' },
    { id: 'pass', type: 'rect', x: 180, y: 245, w: 280, h: 36, label: 'Password Input' },
    { id: 'login', type: 'rect', x: 180, y: 295, w: 280, h: 40, label: 'Login Button' },
    { id: 'divider', type: 'line', x: 250, y: 355, w: 140, h: 2, label: '' },
    { id: 'social', type: 'rect', x: 220, y: 370, w: 200, h: 32, label: 'Social Login' },
    { id: 'signup', type: 'text', x: 180, y: 420, w: 280, h: 20, label: "Don't have an account? Sign Up" },
  ] : [];

  return (
    <div className="h-dvh bg-background flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 flex">
        {/* Icon sidebar (always visible) */}
        <div className="w-[72px] shrink-0 border-r border-border flex flex-col bg-background items-center py-4 gap-1 relative z-10">
          <div className="text-brand mb-1">
            <svg viewBox="0 0 32 32" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect x="1.5" y="1.5" width="29" height="29" rx="8" fill="currentColor" />
              <path d="M10 22L16 9L22 22H10Z" fill="white" opacity="0.92" />
              <circle cx="16" cy="24" r="2.5" fill="white" opacity="0.92" />
            </svg>
          </div>
          <div className="w-[24px] h-px bg-border/50 my-1.5" />
          {[
            { id: 'pages', icon: Layout, label: 'Pages' },
            { id: 'design', icon: PaintBucket, label: 'Design' },
            { id: 'assets', icon: Image, label: 'Assets' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setSidebarTab(tab.id);
                if (sidebarCollapsed) setSidebarCollapsed(false);
              }}
              className={`flex flex-col items-center gap-0.5 w-full py-[14px] text-[11px] font-semibold border-none bg-transparent cursor-pointer transition-colors ${
                sidebarTab === tab.id ? 'bg-brand/10 text-brand' : 'text-fg-muted hover:text-foreground'
              }`}
            >
              <tab.icon size={20} strokeWidth={1.5} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content panel (collapsible) */}
        <div className={`w-[220px] shrink-0 border-r border-border flex flex-col bg-background transition-all duration-200 overflow-hidden ${
          sidebarCollapsed ? 'w-0 border-r-0' : ''
        }`}>
          <div className="shrink-0 px-4 pt-4 pb-3 border-b border-border">
            <h2 className="text-[15px] font-bold text-foreground">{project?.name ?? 'Untitled'}</h2>
            <p className="text-[12px] text-fg-faint mt-1">{MOCK_SCREENS.length} pages · {MOCK_COMPONENTS.length + MOCK_COLOURS.length + MOCK_UPLOADS.length} assets</p>
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
            {sidebarTab === 'pages' && (
              <>
                {MOCK_SCREENS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedPage(s.id)}
                    className={`flex items-center w-full h-[30px] px-2 rounded-[8px] text-left border-none bg-transparent cursor-pointer transition-colors ${
                      selectedPage === s.id ? 'bg-brand text-white' : 'text-fg-muted hover:text-foreground hover:bg-surface-hover'
                    }`}
                  >
                    <span className="text-[13px] font-medium truncate">{s.label}</span>
                  </button>
                ))}
                <button className="flex items-center gap-2 w-full h-[30px] px-2 rounded-[8px] text-left border-none bg-transparent cursor-pointer text-fg-muted hover:text-foreground hover:bg-surface-hover transition-colors">
                  <Plus size={12} strokeWidth={1.5} />
                  <span className="text-[13px] font-medium">Add page</span>
                </button>
              </>
            )}

            {sidebarTab === 'design' && (
              <>
                <div className="px-2 pt-2 pb-1">
                  <span className="text-[13px] font-medium text-fg-muted">Fonts</span>
                </div>
                <div className="space-y-0.5">
                  {[
                    { role: 'Heading', font: 'Inter' },
                    { role: 'Subheading', font: 'SF Pro' },
                    { role: 'Body', font: 'Inter' },
                  ].map(item => (
                    <button key={item.role} className="flex items-center justify-between w-full h-[30px] px-2 rounded-[8px] border-none bg-transparent cursor-pointer text-fg-muted hover:text-foreground hover:bg-surface-hover transition-colors text-[13px]">
                      <span>{item.role}</span>
                      <span className="text-[13px] text-foreground font-medium">{item.font}</span>
                    </button>
                  ))}
                </div>

                <div className="h-px bg-border my-3" />

                <div className="px-2 pb-1">
                  <span className="text-[13px] font-medium text-fg-muted">Font sizes</span>
                </div>
                <div className="space-y-0.5">
                  {[
                    { label: 'H1', size: '32px' },
                    { label: 'H2', size: '24px' },
                    { label: 'H3', size: '20px' },
                    { label: 'Body', size: '14px' },
                    { label: 'Small', size: '12px' },
                  ].map(s => (
                    <div key={s.label} className="flex items-center justify-between w-full h-[30px] px-2 rounded-[8px]">
                      <span className="text-[13px] font-medium text-foreground">{s.label}</span>
                      <span className="text-[11px] text-fg-muted font-mono">{s.size}</span>
                    </div>
                  ))}
                </div>

                <div className="h-px bg-border my-3" />

                <div className="px-2 pb-1">
                  <span className="text-[13px] font-medium text-fg-muted">Colours</span>
                </div>
                <div className="space-y-0.5">
                  {MOCK_COLOURS.map(col => (
                    <div key={col.id}>
                      <button
                        onClick={() => setSelectedColor(selectedColor === col.id ? null : col.id)}
                        className="flex items-center gap-2 w-full h-[30px] px-2 rounded-[8px] border-none bg-transparent cursor-pointer group hover:bg-surface-hover transition-colors"
                      >
                        <div className="w-[16px] h-[16px] rounded-[4px] border border-border/60 shrink-0 group-hover:scale-110 transition-transform" style={{ backgroundColor: col.hex }} />
                        <span className="text-[13px] font-medium text-foreground flex-1 text-left">{col.label}</span>
                        <span className="text-[11px] text-fg-muted font-mono">{col.hex}</span>
                      </button>
                      {selectedColor === col.id && (
                        <div className="px-3 pb-2 pt-1.5 space-y-2">
                          <div className="w-full h-[48px] rounded-[8px] border border-border/60" style={{ backgroundColor: col.hex }} />
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-fg-muted font-medium uppercase tracking-wider w-10">Hex</span>
                            <div className="flex-1 h-[28px] px-2 rounded-[6px] bg-surface-muted border border-border/60 flex items-center text-[12px] font-mono text-foreground">{col.hex}</div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {['#0B99FF', '#7C3AED', '#F59E0B', '#10B981', '#EF4444', '#FFFFFF', '#1A1A1A', '#6B7280'].map(c => (
                              <button
                                key={c}
                                onClick={() => {}}
                                className={`w-[22px] h-[22px] rounded-[5px] border transition-colors cursor-pointer ${c === col.hex ? 'border-foreground scale-110' : 'border-border/60 hover:scale-110'}`}
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="h-px bg-border my-3" />

                <div className="px-2 pb-1">
                  <span className="text-[13px] font-medium text-fg-muted">Roundness</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1">
                  {[0, 4, 8, 12, 16].map(r => (
                    <button key={r} className="flex flex-col items-center gap-0.5 border-none bg-transparent cursor-pointer group flex-1">
                      <div className="w-full h-[24px] border border-border/60 bg-surface-muted group-hover:border-brand/40 transition-colors" style={{ borderRadius: r }} />
                      <span className="text-[11px] text-fg-muted font-medium">{r}px</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {sidebarTab === 'assets' && (
              <>
                <div className="px-2 pt-2 pb-1">
                  <span className="text-[13px] font-medium text-fg-muted">Components</span>
                </div>
                <div className="space-y-0.5">
                  {MOCK_COMPONENTS.map((c) => (
                    <button key={c.id} className="flex items-center gap-2 w-full h-[30px] px-2 rounded-[8px] text-left border-none bg-transparent cursor-pointer text-fg-muted hover:text-foreground hover:bg-surface-hover transition-colors">
                      <div className="w-[12px] h-[12px] rounded-[3px] border border-border shrink-0" />
                      <span className="text-[13px] font-medium truncate">{c.label}</span>
                    </button>
                  ))}
                  <button className="flex items-center gap-2 w-full h-[30px] px-2 rounded-[8px] text-left border-none bg-transparent cursor-pointer text-fg-muted hover:text-foreground hover:bg-surface-hover transition-colors">
                    <Plus size={12} strokeWidth={1.5} />
                    <span className="text-[13px] font-medium">Add component</span>
                  </button>
                </div>

                <div className="h-px bg-border my-3" />

                <div className="px-2 pb-1">
                  <span className="text-[13px] font-medium text-fg-muted">Uploads</span>
                </div>
                <div className="space-y-0.5">
                  {MOCK_UPLOADS.map((u) => (
                    <button key={u.id} className="flex items-center gap-2 w-full h-[30px] px-2 rounded-[8px] text-left border-none bg-transparent cursor-pointer text-fg-muted hover:text-foreground hover:bg-surface-hover transition-colors">
                      {u.type === 'image' ? <Image size={12} strokeWidth={1.5} className="shrink-0" />
                        : <FileImage size={12} strokeWidth={1.5} className="shrink-0" />
                      }
                      <span className="text-[13px] font-medium truncate">{u.label}</span>
                    </button>
                  ))}
                  <button className="flex items-center gap-2 w-full h-[30px] px-2 rounded-[8px] text-left border-none bg-transparent cursor-pointer text-fg-muted hover:text-foreground hover:bg-surface-hover transition-colors">
                    <Plus size={12} strokeWidth={1.5} />
                    <span className="text-[13px] font-medium">Upload asset</span>
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="shrink-0 px-2 py-2 border-t border-border">
            <button onClick={() => setSidebarCollapsed(true)} className="flex items-center gap-2 w-full h-[30px] px-2 rounded-[8px] text-[12px] font-medium text-fg-muted hover:text-foreground hover:bg-surface-hover transition-colors border-none bg-transparent cursor-pointer">
              <ChevronLeft size={13} strokeWidth={1.5} />
              Collapse
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 flex flex-col bg-[hsl(var(--surface-muted))] relative">
          {/* Floating toolbar at top */}
          <div className="shrink-0 flex items-center justify-center pt-3 relative z-20">
            <div className="flex items-center gap-2 h-[40px] px-[6px] rounded-[12px] bg-background shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
              <div className="flex items-center gap-0.5">
                {[
                  { id: 'select', icon: MousePointer2 },
                  { id: 'hand', icon: Hand },
                  { id: 'image', icon: Image },
                ].map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTool(t.id)}
                      className={`flex shrink-0 items-center justify-center w-[32px] h-[32px] p-0 rounded-[8px] transition-colors border-none cursor-pointer ${
                        activeTool === t.id ? 'bg-brand text-white shadow-sm' : 'text-fg-muted hover:bg-white/60 hover:text-brand'
                      }`}
                    >
                      <Icon size={15} strokeWidth={1.5} />
                    </button>
                  );
                })}
              </div>
              <div className="w-px h-[18px] bg-border/60 shrink-0" />
              <div className="flex items-center gap-1">
                <button onClick={() => setZoom(z => Math.max(25, z - 10))} className="flex shrink-0 items-center justify-center w-[32px] h-[32px] p-0 rounded-[8px] text-fg-muted hover:bg-white/60 hover:text-brand transition-colors border-none cursor-pointer">
                  <ZoomOut size={15} strokeWidth={1.5} />
                </button>
                <span className="text-[13px] text-fg-muted font-semibold tabular-nums w-[38px] text-center shrink-0">{zoom}%</span>
                <button onClick={() => setZoom(z => Math.min(200, z + 10))} className="flex shrink-0 items-center justify-center w-[32px] h-[32px] p-0 rounded-[8px] text-fg-muted hover:bg-white/60 hover:text-brand transition-colors border-none cursor-pointer">
                  <ZoomIn size={15} strokeWidth={1.5} />
                </button>
              </div>
              <div className="w-px h-[18px] bg-border/60 shrink-0" />
              <button className="flex shrink-0 items-center gap-1.5 px-3 h-[32px] rounded-[8px] text-[13px] font-semibold bg-brand text-white hover:bg-[hsl(var(--brand-hover))] transition-colors border-none cursor-pointer">
                <Download size={15} strokeWidth={1.5} />
                Export
              </button>
              <button className="flex shrink-0 items-center justify-center w-[32px] h-[32px] p-0 rounded-[8px] transition-colors border-none cursor-pointer text-fg-muted hover:bg-white/60 hover:text-brand">
                <Share2 size={15} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* Canvas area */}
          <div className="flex-1 flex items-center justify-center relative overflow-auto">
            <div
              className="absolute inset-0 opacity-[0.08]"
              style={{
                backgroundImage: 'radial-gradient(circle, hsl(var(--fg-faint)) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />

            {canvasElements.length > 0 ? (
              <div
                className="relative bg-white rounded-[12px] shadow-[0_2px_20px_rgba(0,0,0,0.08)]"
                style={{
                  width: 640,
                  height: 580,
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'center center',
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-[22px] bg-surface-muted rounded-t-[12px] border-b border-border flex items-center px-3 gap-1.5">
                  <span className="w-[6px] h-[6px] rounded-full bg-red-400" />
                  <span className="w-[6px] h-[6px] rounded-full bg-amber-400" />
                  <span className="w-[6px] h-[6px] rounded-full bg-emerald-400" />
                  <span className="text-[8px] text-fg-faint font-medium ml-2">Design — {project?.name ?? 'Canvas'}</span>
                </div>
                <div className="absolute top-[22px] left-0 right-0 bottom-0 p-0">
                  {canvasElements.map(el => (
                    <CanvasElement key={el.id} {...el as any} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="relative flex flex-col items-center text-center max-w-xs">
                <h2 className="text-[15px] font-semibold text-foreground mb-1">Canvas is empty</h2>
                <p className="text-[12px] text-fg-muted leading-relaxed">
                  Describe what you want to build in the prompt below.
                </p>
              </div>
            )}
          </div>

          {/* Floating prompt box at bottom */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 max-w-[580px] w-full px-4">
            <PromptInput onSubmit={handlePrompt} />
          </div>
        </div>
      </div>
    </div>
  );
}
