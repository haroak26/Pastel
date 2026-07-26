export interface ThreadTimelineEmail {
  id: string;
  sender: string;
  senderEmail: string;
  toAddress: string;
  raw: { sentAt: string };
}

export interface ThreadTimelineEntry {
  email: ThreadTimelineEmail;
  direction: 'incoming' | 'outgoing';
  roleLabel: string;
  identityLabel: string;
}

function extractAddressList(toAddress: string): string[] {
  return toAddress
    .split(',')
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
}

function isOutgoingMessage(msg: ThreadTimelineEmail, mailboxAddress: string): boolean {
  const normalizedMailbox = mailboxAddress.trim().toLowerCase();
  return msg.senderEmail.trim().toLowerCase() === normalizedMailbox;
}

export function buildThreadTimeline(threadEmails: ThreadTimelineEmail[], mailboxAddress: string): ThreadTimelineEntry[] {
  const sorted = [...threadEmails].sort(
    (a, b) => new Date(a.raw.sentAt).getTime() - new Date(b.raw.sentAt).getTime(),
  );

  return sorted.map((msg) => {
    const outgoing = isOutgoingMessage(msg, mailboxAddress);
    const toList = extractAddressList(msg.toAddress);
    return {
      email: msg,
      direction: outgoing ? 'outgoing' : 'incoming',
      roleLabel: outgoing ? 'Outgoing' : 'Incoming',
      identityLabel: outgoing
        ? `From ${msg.senderEmail} to ${toList.join(', ') || 'recipient'}`
        : `From ${msg.senderEmail}`,
    };
  });
}
