import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/button';
import { ArrowUp, Paperclip } from 'lucide-react';
import { Dropdown } from '@/components/ds';
import type { DropdownOption } from '@/components/ds';

type Props = {
  onSubmit: (prompt: string) => void;
  isLoading?: boolean;
  placeholder?: string;
};

const TRIGGER_CLASS = "flex items-center gap-1.5 h-[30px] px-2.5 rounded-[9px] text-[12px] font-medium text-fg-muted hover:text-foreground hover:bg-surface-hover transition-colors border-none bg-transparent cursor-pointer whitespace-nowrap";

function PastelLogoSmall() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" className="shrink-0">
      <rect width="20" height="20" rx="5" fill="#8B5CF6" />
      <path d="M6 15l4-9 4 9H6z" fill="white" opacity="0.92" />
      <circle cx="10" cy="16.5" r="1.5" fill="white" opacity="0.92" />
    </svg>
  );
}

function ClaudeLogo() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" className="shrink-0">
      <rect width="20" height="20" rx="5" fill="#CC7B3E" />
      <path d="M6 14l4-10 4 10H6z" fill="white" />
      <circle cx="10" cy="16" r="1.5" fill="white" />
    </svg>
  );
}

function GeminiLogo() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" className="shrink-0">
      <defs>
        <linearGradient id="gg" x1="0" y1="0" x2="20" y2="20">
          <stop offset="0%" stopColor="#4285F4" />
          <stop offset="50%" stopColor="#8AB4F8" />
          <stop offset="100%" stopColor="#34A853" />
        </linearGradient>
      </defs>
      <rect width="20" height="20" rx="5" fill="url(#gg)" />
      <path d="M10 3l1.8 4.2L16 9l-4.2 1.8L10 15l-1.8-4.2L4 9l4.2-1.8L10 3z" fill="white" />
    </svg>
  );
}

const MODEL_OPTIONS: DropdownOption<string>[] = [
  {
    value: 'Auto',
    label: (
      <div className="flex items-start gap-2.5 py-0.5">
        <PastelLogoSmall />
        <div>
          <div className="text-[13px] font-medium text-foreground">Auto</div>
          <div className="text-[11px] text-fg-faint leading-tight mt-0.5">Best model for your task</div>
        </div>
      </div>
    ),
  },
  { value: '', label: '', divider: true },
  {
    value: 'Claude Sonnet 4.6',
    label: (
      <div className="flex items-start gap-2.5 py-0.5">
        <ClaudeLogo />
        <div>
          <div className="text-[13px] font-medium text-foreground">Claude Sonnet 4.6</div>
          <div className="text-[11px] text-fg-faint leading-tight mt-0.5">Great for complex design tasks</div>
        </div>
      </div>
    ),
  },
  {
    value: 'Haiku 4.5',
    label: (
      <div className="flex items-start gap-2.5 py-0.5">
        <ClaudeLogo />
        <div>
          <div className="text-[13px] font-medium text-foreground">Haiku 4.5</div>
          <div className="text-[11px] text-fg-faint leading-tight mt-0.5">Fast and efficient for quick iterations</div>
        </div>
      </div>
    ),
  },
  {
    value: 'Gemini 3.1 Pro',
    label: (
      <div className="flex items-start gap-2.5 py-0.5">
        <GeminiLogo />
        <div>
          <div className="text-[13px] font-medium text-foreground">Gemini 3.1 Pro</div>
          <div className="text-[11px] text-fg-faint leading-tight mt-0.5">Best for multimodal understanding</div>
        </div>
      </div>
    ),
  },
  {
    value: 'Gemini 3.6 Flash',
    label: (
      <div className="flex items-start gap-2.5 py-0.5">
        <GeminiLogo />
        <div>
          <div className="text-[13px] font-medium text-foreground">Gemini 3.6 Flash</div>
          <div className="text-[11px] text-fg-faint leading-tight mt-0.5">Optimised for speed and quality</div>
        </div>
      </div>
    ),
  },
];

const MODEL_DISPLAY: Record<string, string> = {
  'Auto': 'Auto',
  'Claude Sonnet 4.6': 'Claude Sonnet 4.6',
  'Haiku 4.5': 'Haiku 4.5',
  'Gemini 3.1 Pro': 'Gemini 3.1 Pro',
  'Gemini 3.6 Flash': 'Gemini 3.6 Flash',
};

const MODE_OPTIONS: DropdownOption<string>[] = [
  { value: 'Build', label: 'Build' },
  { value: 'Plan', label: 'Plan' },
];

export function PromptInput({ onSubmit, isLoading, placeholder = 'What would you like to design?' }: Props) {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState<string>(MODEL_OPTIONS[0].value);
  const [mode, setMode] = useState<string>(MODE_OPTIONS[0].value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = prompt.trim();
    if (!trimmed || isLoading) return;
    onSubmit(trimmed);
    setPrompt('');
  }, [prompt, isLoading, onSubmit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="rounded-[16px] border border-border bg-background shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-shadow duration-200 focus-within:shadow-[0_4px_20px_rgba(0,0,0,0.1)] focus-within:border-[hsl(var(--brand)/0.3)]">
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={2}
          className="w-full resize-none bg-transparent text-[14px] text-foreground placeholder:text-fg-faint px-4 pt-4 pb-2 outline-none border-none leading-relaxed"
        />

        <div className="flex items-end justify-between pl-2.5 pr-3 pb-3">
          <div className="flex items-center gap-1.5">
            <button className="flex items-center gap-1.5 h-[30px] px-2.5 rounded-[9px] text-[12px] font-medium text-fg-muted hover:text-foreground hover:bg-surface-hover transition-colors border-none bg-transparent cursor-pointer">
              <Paperclip size={13} />
              Attach
            </button>

            <div className="w-px h-[18px] bg-border/60" />

            <Dropdown
              value={model}
              onChange={setModel}
              options={MODEL_OPTIONS}
              showChevron={false}
              menuAlign="left"
              triggerClassName={TRIGGER_CLASS}
              renderTrigger={() => <span>{MODEL_DISPLAY[model] || model}</span>}
            />

            <Dropdown
              value={mode}
              onChange={setMode}
              options={MODE_OPTIONS}
              showChevron={false}
              menuAlign="left"
              triggerClassName={TRIGGER_CLASS}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!prompt.trim() || isLoading}
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
}
