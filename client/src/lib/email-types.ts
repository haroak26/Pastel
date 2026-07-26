import { displayName, formatTime, formatFullDate } from './date-utils';

export interface ApiEmail {
  id: number;
  spaceId: string;
  messageId: string;
  fromAddress: string;
  fromName: string | null;
  toAddress: string;
  subject: string;
  bodyHtml: string | null;
  bodyText: string | null;
  snippet: string | null;
  isRead: boolean;
  isStarred: boolean;
  inReplyTo: string | null;
  threadId: string | null;
  sentAt: string;
  labels: string[];
  mailbox: 'inbox' | 'sent' | 'draft' | 'trash';
}

export type DisplayEmail = ReturnType<typeof adaptEmail>;

export function adaptEmail(e: ApiEmail) {
  return {
    id: String(e.id),
    sender: displayName(e.fromName, e.fromAddress),
    senderEmail: e.fromAddress,
    toAddress: e.toAddress,
    subject: e.subject || '(no subject)',
    preview: e.snippet ?? '',
    bodyText: e.bodyText ?? '',
    bodyHtml: e.bodyHtml,
    time: formatTime(e.sentAt),
    fullDate: formatFullDate(e.sentAt),
    unread: !e.isRead,
    starred: e.isStarred,
    threadId: e.threadId,
    raw: e,
  };
}
