import { useMemo } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { ArrowLeft, FileText } from "lucide-react";
import type { DocItem } from "@/hooks/use-pastel-agent";

marked.setOptions({ gfm: true, breaks: false });

interface DocReaderProps {
  doc: DocItem;
  onBack: () => void;
}

/** Renders an agent-generated markdown document as a readable page in the canvas. */
export function DocReader({ doc, onBack }: DocReaderProps) {
  const html = useMemo(() => {
    try {
      const raw = marked.parse(doc.content, { async: false }) as string;
      return DOMPurify.sanitize(raw);
    } catch {
      return "";
    }
  }, [doc.content]);

  return (
    <div className="absolute inset-0 overflow-auto bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-[760px] mx-auto px-8 h-[52px] flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 h-[28px] px-2.5 rounded-[8px] text-[12px] font-medium text-fg-muted hover:text-foreground hover:bg-surface-hover transition-colors border-none bg-transparent cursor-pointer"
          >
            <ArrowLeft size={13} strokeWidth={1.5} />
            Screens
          </button>
          <div className="w-px h-[16px] bg-border" />
          <div className="flex items-center gap-2 min-w-0">
            <FileText size={13} strokeWidth={1.5} className="text-brand shrink-0" />
            <span className="text-[13px] font-semibold text-foreground truncate">{doc.title}</span>
            <span className="text-[11px] text-fg-faint font-mono truncate hidden sm:inline">{doc.path}</span>
          </div>
        </div>
      </div>
      <div className="max-w-[760px] mx-auto px-8 py-10 pb-24">
        {html ? (
          <article
            className="prose prose-sm max-w-none pastel-doc"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <pre className="text-[12px] font-mono text-fg-muted whitespace-pre-wrap leading-relaxed">{doc.content}</pre>
        )}
      </div>
    </div>
  );
}
