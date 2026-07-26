import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatTime, displayName } from "@/lib/date-utils";

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
  { id: 7, fromAddress: "julia@quantum.dev", fromName: "Julia Anders", toAddress: "support@latte.app", subject: "Webhook configuration help", snippet: "I'm trying to set up a webhook for new tickets but the payload seems malformed.", sentAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), isRead: true, isStarred: true, labels: [] },
  { id: 8, fromAddress: "tom@brightside.me", fromName: "Tom Bradley", toAddress: "support@latte.app", subject: "SLA report for Q1", snippet: "Could you generate an SLA compliance report for Q1 2025? Our compliance team needs it.", sentAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), isRead: true, isStarred: false, labels: [] },
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

function MockEmailDetail({ email }: { email: MockEmail }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <div className="px-5 pt-5 pb-1">
          <h1 className="text-[20px] font-bold text-foreground tracking-[-0.3px] leading-snug">{email.subject}</h1>
        </div>
        <div className="px-5 py-4">
          <div className="flex items-start gap-3 mb-5">
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-[13px] font-semibold text-foreground leading-none">{email.fromName || email.fromAddress}</span>
                <span className="text-[11px] text-fg-faint ml-auto tabular-nums shrink-0">{formatTime(email.sentAt)}</span>
              </div>
              <p className="text-[11px] text-fg-muted mt-0.5 truncate">{email.fromAddress}</p>
            </div>
          </div>
          <div className="text-[13.5px] leading-[1.7] text-foreground">
            {email.snippet || "No content available."}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MockInbox() {
  const [selectedId, setSelectedId] = useState<string>("1");

  const selectedEmail = mockEmails.find(e => String(e.id) === selectedId) ?? mockEmails[0];

  return (
    <div className="flex-1 min-w-0 overflow-hidden flex flex-col pt-2.5">
      <div className="flex h-full min-h-0 flex-col bg-background">
        <div className="flex flex-1 min-h-0 md:overflow-hidden overflow-x-auto">
          <div className="w-[300px] shrink-0 bg-background md:border md:border-border/60 md:rounded-tl-[16px] md:border-r md:border-border/60 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 pt-1 pb-1.5 border-b border-border/40 shrink-0">
              <span className="text-[14px] font-medium text-foreground">Inbox</span>
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              {mockEmails.map(email => (
                <ThreadRow key={email.id} email={email} isSelected={String(email.id) === selectedId} onClick={() => setSelectedId(String(email.id))} />
              ))}
            </div>
          </div>
          <div className="flex-1 min-w-0 bg-background flex flex-col overflow-hidden md:border-t md:border-border/60">
            <MockEmailDetail email={selectedEmail} />
          </div>
        </div>
      </div>
    </div>
  );
}
