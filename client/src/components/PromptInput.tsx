import { useState, useRef, useCallback, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/button';
import { ArrowUp, Plus, Sparkles, ChevronRight, Settings2, FolderOpen, Link, Box, ComponentIcon, X } from 'lucide-react';

type Attachment = {
  id: string;
  type: 'image' | 'file' | 'component' | 'asset';
  name: string;
};

type Props = {
  onSubmit: (prompt: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  systemError?: boolean;
  initialValue?: string;
  compact?: boolean;
  /** Rotating typewriter examples shown while the input is empty. */
  examples?: string[];
};

export type PromptInputHandle = {
  /** Set the prompt value from outside (e.g. clicking a suggested example). */
  setValue: (v: string) => void;
  /** Type a prompt into the box with the typewriter effect (clears the current example first). */
  typePrompt: (text: string) => void;
};

const MODELS = [
  { value: 'Auto', label: 'Auto', icon: <Sparkles size={16} className="text-foreground shrink-0" strokeWidth={1.5} />, desc: 'Best model for your task' },
  { value: 'Claude Sonnet 4.6', label: 'Claude Sonnet 4.6', icon: <img src="/claudelogo.svg" alt="" className="w-[18px] h-[18px] shrink-0" />, desc: 'Great for complex design tasks' },
  { value: 'Haiku 4.5', label: 'Haiku 4.5', icon: <img src="/claudelogo.svg" alt="" className="w-[18px] h-[18px] shrink-0" />, desc: 'Fast and efficient for quick iterations' },
  { value: 'Gemini 3.1 Pro', label: 'Gemini 3.1 Pro', icon: <img src="/geminilogo.webp" alt="" className="w-[18px] h-[18px] shrink-0" />, desc: 'Best for multimodal understanding' },
  { value: 'Gemini 3.6 Flash', label: 'Gemini 3.6 Flash', icon: <img src="/geminilogo.webp" alt="" className="w-[18px] h-[18px] shrink-0" />, desc: 'Optimised for speed and quality' },
];

const MODES: { value: string; desc: string }[] = [
  { value: 'Build', desc: 'Generate new designs from scratch' },
  { value: 'Plan', desc: 'Create structured design plans' },
];
const VARIATIONS = ['1 Variation', '2 Variations', '3 Variations', '5 Variations'] as const;
const AGENT_LEVELS: { value: string; desc: string }[] = [
  { value: 'Basic', desc: 'Simple single-step generation' },
  { value: 'Standard', desc: 'Multi-step with refinements' },
  { value: 'Advanced', desc: 'Full agent orchestration' },
];

const MODEL_META: Record<string, { label: string; icon: React.ReactNode }> = {
  'Auto': { label: 'Auto', icon: <Sparkles size={14} className="text-foreground shrink-0" strokeWidth={1.5} /> },
  'Claude Sonnet 4.6': { label: 'Claude Sonnet 4.6', icon: <img src="/claudelogo.svg" alt="" className="w-[16px] h-[16px] shrink-0" /> },
  'Haiku 4.5': { label: 'Haiku 4.5', icon: <img src="/claudelogo.svg" alt="" className="w-[16px] h-[16px] shrink-0" /> },
  'Gemini 3.1 Pro': { label: 'Gemini 3.1 Pro', icon: <img src="/geminilogo.webp" alt="" className="w-[16px] h-[16px] shrink-0" /> },
  'Gemini 3.6 Flash': { label: 'Gemini 3.6 Flash', icon: <img src="/geminilogo.webp" alt="" className="w-[16px] h-[16px] shrink-0" /> },
};

type PanelView = 'main' | 'model' | 'mode' | 'variations' | 'agent';

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[14px] text-[12px] font-medium text-foreground hover:text-foreground hover:bg-surface-hover transition-colors border-none bg-transparent cursor-pointer mb-1"
    >
      <ChevronRight size={13} className="rotate-180" />
      Back
    </button>
  );
}

function MenuRow({ label, current, onClick }: { label: string; current: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between px-2.5 py-2 rounded-[14px] text-[13px] font-medium text-foreground hover:text-foreground hover:bg-surface-hover transition-colors border-none bg-transparent cursor-pointer text-left"
    >
      <span>{label}</span>
      <span className="flex items-center gap-1.5 text-fg-faint">
        {current}
        <ChevronRight size={13} />
      </span>
    </button>
  );
}

export const PromptInput = forwardRef<PromptInputHandle, Props>(
  function PromptInput({ onSubmit, isLoading, placeholder = 'What would you like to design?', systemError, initialValue, compact = false, examples }, ref) {
  const [prompt, setPrompt] = useState(initialValue ?? '');
  const [model, setModel] = useState<string>(MODELS[0].value);
  const [mode, setMode] = useState<string>(MODES[0].value);
  const [variations, setVariations] = useState<string>(VARIATIONS[0]);
  const [agentLevel, setAgentLevel] = useState<string>(AGENT_LEVELS[0].value);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [panelView, setPanelView] = useState<PanelView>('main');
  const [attachOpen, setAttachOpen] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [exampleIndex, setExampleIndex] = useState(0);
  const [typed, setTyped] = useState(0);
  const [examplePhase, setExamplePhase] = useState<'type' | 'pause' | 'delete'>('type');
  const [typeTarget, setTypeTarget] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const customizeRef = useRef<HTMLDivElement>(null);
  const attachRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* Slow typewriter reveal for the rotating example placeholders. */
  useEffect(() => {
    if (systemError) return;
    let t: ReturnType<typeof setTimeout>;
    if (typeTarget) {
      /* Chip-triggered prompt: type the chip prompt right away (no wipe of the current example), faster and in the foreground color. */
      if (focused) {
        setTypeTarget(null);
        setTyped(0);
        setExamplePhase('type');
        return;
      }
      if (examplePhase === 'type') {
        if (typed < typeTarget.length) {
          t = setTimeout(() => setTyped((v) => v + 1), 12);
        } else {
          setPrompt(typeTarget);
          setTypeTarget(null);
          setTyped(0);
          setExamplePhase('type');
          textareaRef.current?.focus();
          return;
        }
      }
      return () => clearTimeout(t);
    }
    if (!examples?.length || prompt) return;
    const current = examples[exampleIndex % examples.length];
    if (focused) {
      /* Focused and empty: quickly wipe the example, then the placeholder takes over. */
      if (typed > 0) {
        if (examplePhase !== 'delete') setExamplePhase('delete');
        t = setTimeout(() => setTyped((v) => v - 1), 8);
      }
      return () => clearTimeout(t);
    }
    if (examplePhase === 'type') {
      if (typed < current.length) {
        t = setTimeout(() => setTyped((v) => v + 1), 42);
      } else {
        t = setTimeout(() => setExamplePhase('pause'), 2400);
      }
    } else if (examplePhase === 'pause') {
      t = setTimeout(() => setExamplePhase('delete'), 2400);
    } else {
      if (typed > 0) {
        t = setTimeout(() => setTyped((v) => v - 1), 16);
      } else {
        setExampleIndex((i) => (i + 1) % examples.length);
        setExamplePhase('type');
        return;
      }
    }
    return () => clearTimeout(t);
  }, [examplePhase, typed, exampleIndex, examples, prompt, focused, systemError, typeTarget]);

  /* Rough row count so the box grows to fit the typed/entered prompt instead of clipping it. */
  const visibleRows = useMemo(() => {
    const text = prompt || (typeTarget ?? '');
    if (!text) return 2;
    return Math.min(6, Math.max(2, Math.ceil(text.length / 58)));
  }, [prompt, typeTarget]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (customizeRef.current && !customizeRef.current.contains(e.target as Node)) {
        setCustomizeOpen(false);
        setPanelView('main');
      }
    };
    if (customizeOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [customizeOpen]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (attachRef.current && !attachRef.current.contains(e.target as Node)) {
        setAttachOpen(false);
      }
    };
    if (attachOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [attachOpen]);

  const handleSubmit = useCallback(() => {
    const trimmed = prompt.trim();
    if (!trimmed || isLoading) return;
    onSubmit(trimmed);
  }, [prompt, isLoading, onSubmit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  useImperativeHandle(ref, () => ({
    setValue: (v: string) => {
      setPrompt(v);
      setTyped(0);
      textareaRef.current?.focus();
    },
    typePrompt: (text: string) => {
      setPrompt('');
      setFocused(false);
      setTypeTarget(text);
      setExamplePhase('type');
      setTyped(0);
    },
  }));

  const addAttachment = useCallback((type: Attachment['type']) => {
    const names: Record<string, string> = {
      image: 'Attached image',
      file: 'Attached file',
      component: 'Attached component',
      asset: 'Attached asset',
    };
    const newAttachment: Attachment = {
      id: crypto.randomUUID?.() || Math.random().toString(36).slice(2, 11),
      type,
      name: names[type],
    };
    setAttachments(prev => [...prev, newAttachment]);
  }, []);

  const removeAttachment = useCallback((id: string) => {
    setAttachments(prev => {
      const removed = prev.find(a => a.id === id);
      return prev.filter(a => a.id !== id);
    });
  }, []);

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className={`rounded-[14px] sm:rounded-[20px] border transition-shadow duration-200 ${systemError ? 'border-border/40 bg-surface-muted/30' : 'border-border bg-background shadow-[0_4px_16px_rgba(0,0,0,0.06)] focus-within:shadow-[0_4px_20px_rgba(0,0,0,0.1)] focus-within:border-[hsl(var(--brand)/0.3)]'}`}>
        {systemError && (
          <div className="px-3 pt-3 pb-0 flex items-center gap-2">
            <span className="text-[12px] font-semibold text-danger">System error</span>
            <span className="text-[11px] text-fg-faint">Please try again later</span>
          </div>
        )}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={systemError ? '' : prompt}
            onChange={(e) => { if (!systemError) setPrompt(e.target.value); }}
            onKeyDown={systemError ? undefined : handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={systemError ? 'System error' : focused && typed === 0 ? 'Design anything...' : examples?.length ? '' : placeholder}
            rows={visibleRows}
            className="w-full resize-none bg-transparent text-[14px] outline-none border-none leading-relaxed placeholder:text-fg-faint pl-4 pr-3 sm:pl-4 sm:pr-3 pt-3 sm:pt-3 pb-0 sm:pb-1 text-foreground"
          />
          {!!examples?.length && !systemError && (
            <div
              aria-hidden
              className={`pointer-events-none absolute left-4 top-3 max-w-[calc(100%-28px)] text-left text-[14px] leading-relaxed transition-opacity duration-300 ${typeTarget ? '' : 'truncate'} ${prompt || (focused && typed === 0) ? 'opacity-0' : 'opacity-100'} ${typeTarget ? 'text-foreground' : 'text-fg-faint'}`}
            >
              {(typeTarget ?? examples[exampleIndex % examples.length]).slice(0, typed)}
            </div>
          )}
        </div>
        {attachments.length > 0 && (
          <div className="flex items-center gap-2 px-3 pb-2 flex-wrap">
            {attachments.map((att) => (
              <div key={att.id} className="relative group">
                {att.type === 'file' && (
                  <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-surface-muted border border-border">
                    <FolderOpen size={12} />
                    <span className="text-[11px] font-medium text-fg-muted max-w-[80px] truncate">{att.name}</span>
                  </div>
                )}
                {att.type === 'component' && (
                  <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-surface-muted border border-border">
                    <Box size={12} />
                    <span className="text-[11px] font-medium text-fg-muted max-w-[80px] truncate">{att.name}</span>
                  </div>
                )}
                {att.type === 'asset' && (
                  <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-surface-muted border border-border">
                    <ComponentIcon size={12} />
                    <span className="text-[11px] font-medium text-fg-muted max-w-[80px] truncate">{att.name}</span>
                  </div>
                )}
                <button
                  onClick={() => removeAttachment(att.id)}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-foreground/70 text-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border-none cursor-pointer hover:bg-foreground"
                >
                  <X size={8} strokeWidth={3} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className={`flex items-end ${compact ? 'justify-end' : 'justify-between'} px-3 pb-3`}>
          {!compact && (
          <div className="flex items-center gap-2">
            {/* Attach dropdown */}
            <div className="relative max-md:hidden" ref={attachRef}>
              <button
                onClick={() => { if (!systemError) setAttachOpen(!attachOpen); }}
                className="flex items-center gap-1.5 h-[32px] px-3 rounded-[10px] text-[13px] font-medium transition-colors border-none cursor-pointer text-foreground bg-surface-hover hover:bg-black/[0.06]"
              >
                <Plus size={16} className={`transition-transform duration-200 ${attachOpen ? 'rotate-45' : ''}`} />
              </button>
              {!systemError && attachOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setAttachOpen(false)} />
                  <div className="absolute left-0 bottom-full mb-1 z-20 min-w-[200px] bg-background border border-border rounded-[20px] p-1.5 shadow-lg">
                    <button onClick={() => { addAttachment('file'); setAttachOpen(false); }} className="flex w-full items-center gap-2.5 px-2.5 py-2 rounded-[14px] text-[13px] font-medium text-foreground hover:text-foreground hover:bg-surface-hover transition-colors border-none bg-transparent cursor-pointer text-left">
                      <FolderOpen size={15} className="text-foreground" /> File Library
                    </button>
                    <div className="h-px bg-border/60 mx-2 my-2" />
                    <button onClick={() => { setAttachOpen(false); }} className="flex w-full items-center gap-2.5 px-2.5 py-2 rounded-[14px] text-[13px] font-medium text-foreground hover:text-foreground hover:bg-surface-hover transition-colors border-none bg-transparent cursor-pointer text-left">
                      <Link size={15} className="text-foreground" /> Connect Project
                    </button>
                    <button onClick={() => { addAttachment('component'); setAttachOpen(false); }} className="flex w-full items-center gap-2.5 px-2.5 py-2 rounded-[14px] text-[13px] font-medium text-foreground hover:text-foreground hover:bg-surface-hover transition-colors border-none bg-transparent cursor-pointer text-left">
                      <Box size={15} className="text-foreground" /> Select Components
                    </button>
                    <button onClick={() => { addAttachment('asset'); setAttachOpen(false); }} className="flex w-full items-center gap-2.5 px-2.5 py-2 rounded-[14px] text-[13px] font-medium text-foreground hover:text-foreground hover:bg-surface-hover transition-colors border-none bg-transparent cursor-pointer text-left">
                      <ComponentIcon size={15} className="text-foreground" /> Select Assets
                    </button>
                  </div>
                </>
              )}
            </div>

            {!systemError && <div className="w-px h-4 bg-border/60 max-md:hidden" />}

            {/* Customize dropdown */}
            <div className="relative max-md:hidden" ref={customizeRef}>
              <button
                onClick={() => { if (!systemError) { setCustomizeOpen(!customizeOpen); setPanelView('main'); } }}
                className="flex items-center gap-1.5 h-[32px] px-3 rounded-[10px] text-[13px] font-medium transition-colors border-none cursor-pointer whitespace-nowrap text-foreground bg-surface-hover hover:bg-black/[0.06]"
              >
                <Settings2 size={14} />
                Customize
              </button>

              {!systemError && customizeOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => { setCustomizeOpen(false); setPanelView('main'); }} />
                  <div className="absolute left-0 bottom-full mb-1 z-20 min-w-[260px] bg-background border border-border rounded-[20px] p-1.5 shadow-lg">
                    {panelView === 'main' && (
                      <div>
                        <MenuRow label="Model" current={<span className="text-foreground flex items-center gap-1.5">{MODEL_META[model]?.icon}{MODEL_META[model]?.label}</span>} onClick={() => setPanelView('model')} />
                        <div className="h-px bg-border/60 mx-2 my-1" />
                        <MenuRow label="Mode" current={<>{mode}</>} onClick={() => setPanelView('mode')} />
                        <div className="h-px bg-border/60 mx-2 my-1" />
                        <MenuRow label="Variations" current={<>{variations}</>} onClick={() => setPanelView('variations')} />
                        <div className="h-px bg-border/60 mx-2 my-1" />
                        <MenuRow label="Agent Mode" current={<>{agentLevel}</>} onClick={() => setPanelView('agent')} />
                      </div>
                    )}

                    {panelView === 'model' && (
                      <div>
                        <BackButton onClick={() => setPanelView('main')} />
                        {MODELS.map((m, idx) => (
                          <div key={m.value}>
                            {idx === 1 && <div className="h-px bg-border/60 mx-2 my-3" />}
                            <button
                              onClick={() => { setModel(m.value); setPanelView('main'); }}
                              className={`flex w-full items-center gap-2.5 px-2.5 py-2 rounded-[14px] text-left transition-colors border-none bg-transparent cursor-pointer ${
                                m.value === model ? 'bg-surface-hover' : 'hover:bg-surface-hover'
                              }`}
                            >
                              {m.icon}
                              <div>
                                <div className="text-[13px] font-medium text-foreground">{m.label}</div>
                                <div className="text-[11px] text-fg-faint leading-tight mt-0.5">{m.desc}</div>
                              </div>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {panelView === 'mode' && (
                      <div>
                        <BackButton onClick={() => setPanelView('main')} />
                        {MODES.map((m) => (
                          <button
                            key={m.value}
                            onClick={() => { setMode(m.value); setPanelView('main'); }}
                            className={`flex w-full items-center gap-2.5 px-2.5 py-2 rounded-[14px] text-left transition-colors border-none bg-transparent cursor-pointer ${
                              m.value === mode ? 'bg-surface-hover' : 'hover:bg-surface-hover'
                            }`}
                          >
                            <div>
                              <div className="text-[13px] font-medium text-foreground">{m.value}</div>
                              <div className="text-[11px] text-fg-faint leading-tight mt-0.5">{m.desc}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {panelView === 'variations' && (
                      <div>
                        <BackButton onClick={() => setPanelView('main')} />
                        {VARIATIONS.map((v) => (
                          <button
                            key={v}
                            onClick={() => { setVariations(v); setPanelView('main'); }}
                            className={`flex w-full items-center px-2.5 py-2 rounded-[14px] text-[13px] font-medium text-left transition-colors border-none bg-transparent cursor-pointer ${
                              v === variations ? 'bg-surface-hover text-foreground' : 'text-foreground hover:text-foreground hover:bg-surface-hover'
                            }`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    )}

                    {panelView === 'agent' && (
                      <div>
                        <BackButton onClick={() => setPanelView('main')} />
                        {AGENT_LEVELS.map((lvl) => (
                          <button
                            key={lvl.value}
                            onClick={() => { setAgentLevel(lvl.value); setPanelView('main'); }}
                            className={`flex w-full items-center gap-2.5 px-2.5 py-2 rounded-[14px] text-left transition-colors border-none bg-transparent cursor-pointer ${
                              lvl.value === agentLevel ? 'bg-surface-hover' : 'hover:bg-surface-hover'
                            }`}
                          >
                            <div>
                              <div className="text-[13px] font-medium text-foreground">{lvl.value}</div>
                              <div className="text-[11px] text-fg-faint leading-tight mt-0.5">{lvl.desc}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!prompt.trim() || isLoading || systemError}
            isLoading={isLoading}
            size="sm"
            className="rounded-[10px]"
          >
            <ArrowUp size={15} strokeWidth={2.5} />
          </Button>
        </div>
      </div>
    </div>
  );
});
PromptInput.displayName = "PromptInput";
