import { useQuery } from '@tanstack/react-query';
import { Mail, Loader } from 'lucide-react';
import { ListSkeleton } from '@/components/ds';

interface Reply { id: string; fromAddress: string; fromName?: string | null; toAddress: string; subject?: string; snippet?: string; sentAt: string }

function avatarInitials(name: string, email: string) {
  const n = name || email.split('@')[0] || '';
  return n.split(/\s+/).filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
}

function avatarColor(email: string) {
  const colors = ['#3b5bdb', '#0ea5e9', '#059669', '#d97706', '#7c3aed', '#dc2626', '#0891b2'];
  return colors[(email.charCodeAt(0) + email.charCodeAt(email.length - 1)) % colors.length];
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfD = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.floor((startOfToday - startOfD) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function AgentReplies({ agentId }: { agentId: string }) {
  const { data, isLoading } = useQuery<{ replies: Reply[] }>({
    queryKey: ['/api/agents', agentId, 'replies'],
    queryFn: async () => { const r = await fetch(`/api/agents/${agentId}/replies`, { credentials: 'include' }); if (!r.ok) throw new Error('Failed'); return r.json(); },
  });
  const replies = data?.replies ?? [];

  return (
    <div>
      <div className="flex items-center gap-2 mb-3"><Mail size={15} className="text-fg-muted" /><h2 className="text-[14px] font-semibold text-foreground">Recent Replies</h2></div>
      <p className="text-[12px] leading-snug text-muted-foreground mb-4">Emails the agent has sent in response to incoming messages.</p>
      {isLoading ? (
        <ListSkeleton rows={4} />
      ) : replies.length === 0 ? (
        <div className="py-8 text-center border border-dashed border-border/60 rounded-xl"><Mail size={20} className="text-border mx-auto mb-2" /><p className="text-[12px] text-muted-foreground">No replies yet.</p></div>
      ) : (
        <div className="divide-y divide-border/60 border border-border/60 rounded-xl overflow-hidden">
          {replies.map((reply) => {
            const fromName = reply.fromName || reply.fromAddress.split('@')[0] || 'Unknown';
            const initials = avatarInitials(fromName, reply.fromAddress);
            const color = avatarColor(reply.fromAddress);
            const snippet = reply.snippet || '';
            return (
              <div key={reply.id} className="flex items-start gap-3 px-4 py-3 hover:bg-surface-hover transition-colors">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: color }}>
                  <span className="text-[11px] font-bold text-white leading-none">{initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium text-foreground truncate">{reply.subject || '(no subject)'}</span>
                    <span className="ml-auto text-[11px] text-fg-faint shrink-0 whitespace-nowrap">{formatTime(reply.sentAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[12px] text-fg-muted shrink-0">To: {reply.toAddress}</span>
                    {snippet && <span className="text-[12px] text-fg-faint truncate">– {snippet.slice(0, 80)}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
