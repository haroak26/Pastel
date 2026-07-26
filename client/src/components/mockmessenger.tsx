import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { formatTime, dayBucketLabel, displayName } from "@/lib/date-utils";
import { ListSection } from "@/components/ds";

interface MockEmail {
  id: number;
  fromAddress: string;
  fromName: string | null;
  toAddress: string;
  subject: string;
  snippet: string | null;
  sentAt: string;
  isRead: boolean;
  isStarred: boolean;
  labels: string[];
}

const mockEmails: MockEmail[] = [
  { id: 1, fromAddress: "sarah@acme.com", fromName: "Sarah Chen", toAddress: "support@latte.app", subject: "Question about API rate limits", snippet: "Hey team, we're hitting rate limit errors on the v2 endpoint. Can you help?", sentAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), isRead: false, isStarred: true, labels: [] },
  { id: 2, fromAddress: "marcus@contoso.com", fromName: "Marcus Johnson", toAddress: "support@latte.app", subject: "Invoice for March 2025", snippet: "I haven't received the invoice for March yet. Could you resend it?", sentAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), isRead: false, isStarred: false, labels: [] },
  { id: 3, fromAddress: "elena@startup.io", fromName: "Elena Rodriguez", toAddress: "support@latte.app", subject: "Feature request: Bulk import", snippet: "We'd love to see a bulk CSV import for contacts. Any plans for this?", sentAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), isRead: false, isStarred: false, labels: [] },
  { id: 4, fromAddress: "david@techcorp.com", fromName: "David Kim", toAddress: "support@latte.app", subject: "Login issue after password reset", snippet: "I reset my password but now I can't log in at all. Getting an error on the login page.", sentAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), isRead: false, isStarred: false, labels: [] },
  { id: 5, fromAddress: "priya@designlab.co", fromName: "Priya Sharma", toAddress: "support@latte.app", subject: "Team member invitation not received", snippet: "I invited a new team member 2 hours ago but they haven't received the email.", sentAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), isRead: true, isStarred: false, labels: [] },
  { id: 6, fromAddress: "alex@greenfield.org", fromName: null, toAddress: "support@latte.app", subject: "Trial extension request", snippet: "We're still evaluating the platform. Could you extend our trial by 2 weeks?", sentAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), isRead: true, isStarred: false, labels: [] },
];

function ThreadRow({ email, isSelected, onClick }: { email: MockEmail; isSelected: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative flex flex-col gap-0 pl-4 pr-3 py-2 cursor-pointer transition-colors duration-100',
        'hover:bg-surface-active',
        isSelected && 'bg-surface-active',
      )}
    >
      <div className="flex items-center justify-between min-w-0">
        <span
          className={cn(
            'text-[13px] leading-tight truncate font-medium',
            isSelected || !email.isRead ? 'text-foreground' : 'text-fg-muted'
          )}
        >
          {email.subject}
        </span>
        <span className="text-[12px] text-fg-faint tabular-nums whitespace-nowrap shrink-0 ml-2">
          {formatTime(email.sentAt)}
        </span>
      </div>
      <div className="flex items-center justify-between min-w-0 mt-0.5">
        <div className="flex items-center gap-1 min-w-0 overflow-hidden">
          {email.snippet && (
            <span className={cn('text-[13px] truncate font-normal min-w-0', isSelected ? 'text-fg-muted' : 'text-fg-faint')}>
              {email.snippet}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          <span className={cn('text-[12px] font-normal whitespace-nowrap', isSelected ? 'text-fg-muted' : 'text-fg-faint')}>
            {displayName(email.fromName, email.fromAddress)}
          </span>
        </div>
      </div>
    </div>
  );
}

function MockMessengerDetail({ email }: { email: MockEmail }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 pt-3 pb-2 border-b border-border/40 shrink-0">
        <span className="text-[13px] font-semibold text-foreground truncate">{email.subject}</span>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3">
        <div className="flex justify-start">
          <div className="max-w-[80%] bg-surface-muted rounded-[14px] rounded-tl-[4px] px-3 py-1.5">
            <p className="text-[11px] font-semibold text-fg-muted mb-0.5">{email.fromName || email.fromAddress}</p>
            <p className="text-[13px] text-foreground leading-relaxed">{email.snippet || "No content available."}</p>
            <p className="text-[10px] text-fg-faint mt-1">{formatTime(email.sentAt)}</p>
          </div>
        </div>
        <div className="flex justify-end">
          <div className="max-w-[80%] bg-surface-muted rounded-[14px] rounded-tr-[4px] px-3 py-1.5">
            <p className="text-[11px] font-semibold text-fg-muted mb-0.5">You</p>
            <p className="text-[13px] text-foreground leading-relaxed">Thanks for reaching out! Let me look into this and get back to you shortly.</p>
            <p className="text-[10px] text-fg-faint mt-1">Just now</p>
          </div>
        </div>
      </div>
      <div className="shrink-0 border-t border-border/40 px-4 py-2.5">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-1.5">
          <span className="text-[12px] text-fg-faint flex-1">Reply...</span>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-fg-faint">⌘↵</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MockMessenger() {
  const [selectedId, setSelectedId] = useState<string>("1");

  const grouped = mockEmails.reduce((acc, email) => {
    const label = dayBucketLabel(email.sentAt);
    if (!acc.has(label)) acc.set(label, []);
    acc.get(label)!.push(email);
    return acc;
  }, new Map<string, MockEmail[]>());

  const selectedEmail = mockEmails.find(e => String(e.id) === selectedId) ?? mockEmails[0];

  return (
    <div className="flex-1 min-w-0 overflow-hidden flex flex-col pt-2.5">
      <div className="flex h-full min-h-0 flex-col bg-background">
        <div className="flex flex-1 min-h-0 md:overflow-hidden overflow-x-auto">
          <div className="w-[240px] bg-background md:border-r md:border-border/60 flex flex-col overflow-hidden shrink-0">
            <div className="flex items-center justify-between px-4 pt-1 pb-1.5 border-b border-border/40 shrink-0">
              <span className="text-[14px] font-medium text-foreground">Inbox</span>
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              {Array.from(grouped.entries()).map(([label, items]) => (
                <React.Fragment key={label}>
                  <ListSection label={label} />
                  {items.map(email => (
                    <ThreadRow key={email.id} email={email} isSelected={String(email.id) === selectedId} onClick={() => setSelectedId(String(email.id))} />
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
          <div className="flex-1 min-w-0 bg-background flex flex-col overflow-hidden md:border-t md:border-border/60">
            <MockMessengerDetail email={selectedEmail} />
          </div>
        </div>
      </div>
    </div>
  );
}
