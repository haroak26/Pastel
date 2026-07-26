import { useEffect, useState, useRef } from 'react';
import { AlertTriangle, User } from 'lucide-react';

interface CollisionBannerProps {
  ticketId: string;
  currentUserId: string;
}

export function CollisionBanner({ ticketId, currentUserId }: CollisionBannerProps) {
  const [viewers, setViewers] = useState<string[]>([]);
  const heartbeatRef = useRef<ReturnType<typeof setInterval>>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchViewers = async () => {
      try {
        const res = await fetch(`/api/tickets/${ticketId}/collision`);
        const data = await res.json();
        setViewers(data.viewers?.filter((v: string) => v !== currentUserId) ?? []);
      } catch { /* ignore */ }
      setLoading(false);
    };

    const sendHeartbeat = async () => {
      try {
        await fetch(`/api/tickets/${ticketId}/collision/heartbeat`, { method: 'POST' });
      } catch { /* ignore */ }
    };

    fetchViewers();
    sendHeartbeat();
    heartbeatRef.current = setInterval(sendHeartbeat, 15000);

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [ticketId, currentUserId]);

  if (loading || viewers.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-2 mb-3 bg-amber-muted border border-amber-border rounded-lg">
      <AlertTriangle className="w-4 h-4 text-amber shrink-0" />
      <p className="text-xs text-amber">
        <User className="w-3 h-3 inline mr-1" />
        {viewers.join(', ')} {viewers.length === 1 ? 'is' : 'are'} currently viewing this ticket
      </p>
    </div>
  );
}
