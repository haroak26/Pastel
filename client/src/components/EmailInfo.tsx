import { useState, useEffect } from 'react';
import { Mail, Calendar, Tag, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DisplayEmail } from '@/lib/email-types';

interface EmailInfoProps {
  email: DisplayEmail | null;
  onClose?: () => void;
  className?: string;
}

export function EmailInfo({ email, onClose, className }: EmailInfoProps) {
  if (!email) return null;

  return (
    <div className={cn('w-[220px] shrink-0 border-l border-border/60 bg-background flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-10 border-b border-border/40 shrink-0">
        <span className="text-[11px] font-semibold text-fg-muted uppercase tracking-wider">Details</span>
        {onClose && (
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center h-6 w-6 rounded-md text-fg-muted hover:text-foreground hover:bg-surface-hover transition-colors border-none bg-transparent cursor-pointer"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* From */}
        <Section icon={Mail} label="From">
          <p className="text-[12.5px] text-foreground font-medium leading-snug">{email.sender}</p>
          <p className="text-[11px] text-fg-muted">{email.senderEmail}</p>
        </Section>

        {/* To */}
        <Section icon={Mail} label="To">
          <p className="text-[12px] text-foreground break-all">{email.toAddress}</p>
        </Section>

        {/* Date */}
        <Section icon={Calendar} label="Date">
          <p className="text-[12px] text-foreground">{email.fullDate}</p>
        </Section>

        {/* Subject */}
        <Section icon={FileText} label="Subject">
          <p className="text-[12px] text-foreground leading-snug">{email.subject}</p>
        </Section>

        {/* Tags */}
        <Section icon={Tag} label="Tags">
          {email.raw.labels.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {email.raw.labels.map((tag, i) => (
                <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface-hover text-fg-muted">
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-fg-faint italic">No tags</p>
          )}
        </Section>

        {/* Notes */}
        <Section icon={FileText} label="Notes" className="border-b-0">
          <NotesField emailId={email.id} />
        </Section>
      </div>
    </div>
  );
}

function Section({ icon: Icon, label, children, className }: {
  icon: any;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('px-4 py-3 border-b border-border/40 space-y-1', className)}>
      <div className="flex items-center gap-1.5">
        <Icon size={11} className="text-fg-muted shrink-0" />
        <span className="text-[10px] font-semibold text-fg-muted uppercase tracking-wider">{label}</span>
      </div>
      {children}
    </div>
  );
}

function NotesField({ emailId }: { emailId: string }) {
  const storageKey = `email-note-${emailId}`;
  const [note, setNote] = useState(() => localStorage.getItem(storageKey) ?? '');

  useEffect(() => {
    if (note) {
      localStorage.setItem(storageKey, note);
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [note, storageKey]);

  return (
    <textarea
      value={note}
      onChange={(e) => setNote(e.target.value)}
      placeholder="Add notes about this email\u2026"
      rows={4}
      className="w-full text-[12px] text-foreground placeholder:text-fg-faint bg-surface-muted rounded-lg px-2.5 py-2 resize-none outline-none border-0 ring-0 focus:ring-0 leading-relaxed"
    />
  );
}
