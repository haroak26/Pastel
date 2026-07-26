import { useState, useRef, useCallback, useEffect } from 'react';
import { Bold, Italic, List, Heading, Quote, Link } from 'lucide-react';
import { IconButton } from '@/components/button';
import { Textarea } from "@/components/text-input";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export function RichTextEditor({ value, onChange, placeholder = "Write your message...", minHeight = 200 }: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = useCallback(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.max(ta.scrollHeight, minHeight) + 'px';
    }
  }, [minHeight]);

  useEffect(() => {
    autoResize();
  }, [value, autoResize]);

  const insertMarkdown = useCallback((prefix: string, suffix = '') => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.substring(start, end);
    const newText = value.substring(0, start) + prefix + selected + suffix + value.substring(end);
    onChange(newText);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 0);
  }, [value, onChange]);

  const toolbarItems = [
    { icon: Bold, label: 'Bold', action: () => insertMarkdown('**', '**') },
    { icon: Italic, label: 'Italic', action: () => insertMarkdown('_', '_') },
    { icon: Heading, label: 'Heading', action: () => insertMarkdown('### ', '') },
    { icon: List, label: 'List', action: () => insertMarkdown('- ', '') },
    { icon: Quote, label: 'Quote', action: () => insertMarkdown('> ', '') },
    { icon: Link, label: 'Link', action: () => insertMarkdown('[', '](url)') },
  ];

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-background">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        variant="ghost"
        className="px-3 py-2.5 leading-relaxed resize-none flex-1 min-h-0"
        style={{ minHeight }}
      />
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-t border-border/40 bg-surface/30 shrink-0">
        {toolbarItems.map((item) => (
          <IconButton key={item.label} icon={item.icon} size="xs" design="ghost" onClick={item.action} type="button" title={item.label} />
        ))}
        <div className="ml-auto text-[11px] text-muted-foreground">Markdown supported</div>
      </div>
    </div>
  );
}
