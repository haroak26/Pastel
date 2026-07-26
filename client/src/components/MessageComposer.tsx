import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Mail, Lock, Sparkles } from 'lucide-react';
import { Button, IconButton } from '@/components/button';
import { Dropdown } from '@/components/ds';
import { cn } from '@/lib/utils';

export interface MessageComposerHandle {
  setMessage: (content: string) => void;
}

interface MessageComposerProps {
  onSend: (content: string, type: 'reply' | 'internal_note') => void;
  isPending: boolean;
  userName?: string;
  isAiOpen?: boolean;
  onAiClick?: () => void;
  className?: string;
}

export const MessageComposer = forwardRef<MessageComposerHandle, MessageComposerProps>(
  function MessageComposer({ onSend, isPending, isAiOpen, onAiClick, className }, ref) {
  const [tab, setTab] = useState<'reply' | 'internal_note'>('reply');
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => ({
    setMessage,
  }));

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [message]);

  const handleSend = () => {
    const content = message.trim();
    if (!content) return;
    onSend(content, tab);
    setMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSend();
    }
  };

  return (
    <div className={cn("rounded-3xl border border-[hsl(var(--border-subtle))]", className)} style={{ background: 'hsl(var(--surface-active))' }}>
      <div className="px-4 pt-3">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tab === 'reply' ? "Write a reply to the customer\u2026" : "Add an internal note (not visible to customer)\u2026"}
          className="w-full text-[13px] text-black placeholder:text-fg-muted bg-transparent resize-none min-h-[44px] outline-none border-0 shadow-none ring-0 focus:ring-0 focus:border-0 focus-visible:ring-0 leading-relaxed"
          style={{ outline: 'none', boxShadow: 'none' }}
        />
      </div>

      <div className="flex items-center justify-between pl-2.5 pr-2.5 pb-2.5 pt-1.5">
        <div className="flex items-center gap-1">
          {onAiClick && (
            <IconButton
              icon={Sparkles}
              size="xs"
              design="ghost"
              onClick={onAiClick}
              title="AI draft"
              className="!bg-background !text-foreground !border !border-border/60"
            />
          )}
          <Dropdown
            value={tab}
            onChange={(val) => setTab(val as 'reply' | 'internal_note')}
            options={[
              { value: 'reply', label: <div className="flex items-center gap-2"><Mail size={12} />Reply</div> },
              { value: 'internal_note', label: <div className="flex items-center gap-2"><Lock size={12} />Internal</div> },
            ]}
            menuAlign="center"
            menuSide="top"
            triggerClassName="inline-flex items-center justify-between gap-2 cursor-pointer text-[12px] h-7 px-2 rounded-[10px] bg-background border border-border/60 hover:border-border transition-colors min-w-[90px]"
          />
        </div>

        <Button
          onClick={handleSend}
          disabled={!message.trim() || isPending}
          size="xs"
          isLoading={isPending}
        >
          Reply
        </Button>
      </div>
    </div>
  );
});
