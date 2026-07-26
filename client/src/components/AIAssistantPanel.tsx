import { useState, useRef, useEffect, useMemo } from "react";
import { ChevronRight, ChevronsRight, ArrowUp, Loader } from "lucide-react";
import { Button, IconButton } from "@/components/button";
import { useUser } from "@/hooks/use-user";
import DOMPurify from "dompurify";
import { marked } from "marked";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onUseDraft: (draft: string) => void;
  mode: "compose" | "reply";
  threadContext?: string;
  onOpenChange?: (open: boolean) => void;
  width?: string;
};

function useGreeting() {
  const { data: user } = useUser();
  const hour = new Date().getHours();
  const greeting = hour < 5 ? "Good evening" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const name = (user as any)?.displayName || user?.username || "";
  const firstName = name.split(/\s+/)[0] || "";
  return `${greeting}${firstName ? `, ${firstName}` : ""}`;
}

function MarkdownContent({ content }: { content: string }) {
  const html = useMemo(() => {
    return DOMPurify.sanitize(marked.parse(content, { breaks: true, gfm: true }) as string, {
      ALLOWED_TAGS: ['a', 'b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'span', 'div'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel'],
      ALLOW_DATA_ATTR: false,
      FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
    });
  }, [content]);
  return (
    <div
      className="text-[14px] leading-relaxed text-foreground [&>p]:mb-3 [&>p:last-child]:mb-0 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-3 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:mb-3 [&>li]:mb-1 [&>strong]:font-semibold [&>a]:text-brand [&>a]:underline"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/~~(.+?)~~/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .trim();
}

function stripSubjectLine(text: string): string {
  return text.replace(/^(Subject|Re|Fwd?):\s?.+$/im, "").trim();
}

function cleanDraft(draft: string, mode: "compose" | "reply"): string {
  let cleaned = draft;
  if (mode === "reply") {
    cleaned = stripSubjectLine(cleaned);
  }
  cleaned = stripMarkdown(cleaned);
  return cleaned;
}

const THOUGHT_STEPS = [
  "Analyzing your request...",
  "Reviewing context...",
  "Drafting response...",
];

export function AIAssistantPanel({ open, onClose, onUseDraft, mode, threadContext, width = "500px" }: Props) {
  const greeting = useGreeting();
  const feedRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingSteps, setThinkingSteps] = useState<string[]>([]);
  const [draftResult, setDraftResult] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setMessages([]);
      setDraftResult(null);
      setInput("");
      setThinkingSteps([]);
    }
  }, [open]);

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [messages, thinkingSteps]);

  const runThoughtProcess = async () => {
    setThinkingSteps([]);
    for (const step of THOUGHT_STEPS) {
      await new Promise((r) => setTimeout(r, 500));
      setThinkingSteps((prev) => [...prev, step]);
    }
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: trimmed };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setIsLoading(true);
    runThoughtProcess();
    try {
      const res = await fetch("/api/ai/draft", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: trimmed, threadContext, mode }),
      });
      if (!res.ok) throw new Error("AI generation failed");
      const data = await res.json();
      const draft = data.draft ?? "";
      setThinkingSteps((prev) => [...prev, "Response ready"]);
      await new Promise((r) => setTimeout(r, 300));
      setMessages((p) => [...p, { id: crypto.randomUUID(), role: "assistant", content: draft }]);
      setDraftResult(draft);
    } catch {
      setMessages((p) => [...p, { id: crypto.randomUUID(), role: "assistant", content: "I couldn't generate a draft right now. Try again." }]);
    } finally {
      setIsLoading(false);
      setThinkingSteps([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleUseDraft = () => {
    if (draftResult) {
      onUseDraft(cleanDraft(draftResult, mode));
      onClose();
    }
  };

  const showWelcome = messages.length === 0 && !isLoading;
  const CloseIcon = ChevronsRight;

  return (
    <div
      className="fixed right-0 top-0 bottom-0 z-50 bg-background flex flex-col md:border-l md:border-border"
      style={{ width: '100%', maxWidth: `min(100%, ${width})`, transform: open ? "translateX(0)" : "translateX(100%)", transition: "transform 0.25s ease" }}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 pt-3 pb-3 shrink-0">
        <div className="flex items-center gap-0.5">
          <button
            onClick={onClose}
            title="Close"
            className="inline-flex items-center justify-center h-8 w-8 rounded-[10px] text-fg-muted hover:text-foreground hover:bg-surface-hover transition-colors bg-none border-none cursor-pointer"
          >
            <ChevronsRight size={18} strokeWidth={1.75} />
          </button>
        </div>
        {draftResult && (
          <Button size="xs" onClick={handleUseDraft}>
            Apply draft
          </Button>
        )}
      </div>

      {/* ── Messages ── */}
      <div
        ref={feedRef}
        className={`flex-1 min-h-0 overflow-y-auto px-5 py-3 space-y-5 flex flex-col transition-opacity duration-300 ${showWelcome ? '' : ''} ${
          showWelcome ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      >
        <div className="space-y-5">
          {messages.map((msg) => (
            <div key={msg.id} style={{ animation: "msgFadeIn 0.25s ease-out both" }}>
              {msg.role === "user" ? (
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl bg-foreground text-background px-4 py-2.5 text-[14px] leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </div>
                </div>
              ) : (
                <div className="pl-0.5">
                  <MarkdownContent content={msg.content} />
                </div>
              )}
            </div>
          ))}

          {/* Thought process */}
          {thinkingSteps.length > 0 && (
            <div className="flex flex-col gap-2.5 pl-0.5">
              {thinkingSteps.map((step, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 text-[13px] text-fg-muted"
                  style={{
                    animation: "thoughtFadeIn 0.3s ease-out both",
                    animationDelay: `${i * 0.12}s`,
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-foreground/20 shrink-0" />
                  {step}
                </div>
              ))}
              {thinkingSteps.length === THOUGHT_STEPS.length && thinkingSteps[thinkingSteps.length - 1] !== "Response ready" && (
                <div className="flex items-center gap-2.5 text-[13px] text-fg-muted">
                  <Loader size={10} className="animate-spin shrink-0" />
                  Finalizing...
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Welcome (above composer) ── */}
      {showWelcome && (
        <div className="px-5 pb-4 shrink-0">
          <p className="text-[17px] font-semibold text-foreground leading-tight tracking-[-0.01em]">{greeting}</p>
          <p className="text-[13.5px] text-fg-muted leading-snug mt-1">
            {mode === "reply"
              ? "What would you like your reply to say?"
              : "Describe the email you want to write."}
          </p>
        </div>
      )}

      {/* ── Input / Composer ── */}
      <div className="px-4 shrink-0">
        <div className="rounded-3xl border border-[hsl(var(--border-subtle))]" style={{ background: 'hsl(var(--surface-active))' }}>
          <div className="px-4 pt-3 pb-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What can I do for you?"
              rows={1}
              disabled={isLoading}
              className="w-full text-[13px] placeholder:text-fg-muted bg-transparent resize-none min-h-[36px] outline-none border-0 shadow-none ring-0 focus:ring-0 focus:border-0 focus-visible:ring-0 leading-relaxed text-foreground"
              style={{ outline: 'none', boxShadow: 'none' }}
            />
          </div>
          <div className="flex items-center justify-end pr-2.5 pb-2">
            <IconButton
              icon={ArrowUp}
              size="xs"
              design="ghost"
              onClick={handleSend}
              title="Send"
              className="!bg-background !text-foreground !border !border-border/60"
            />
          </div>
        </div>
        <p className="text-[11px] text-fg-faint text-center mt-2 pb-6">AI can make mistakes.</p>
      </div>

      <style>{`
        @keyframes thoughtFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes msgFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
