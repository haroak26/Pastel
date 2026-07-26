import { useState } from 'react';
import { Button } from '@/components/button';
import { statusColors, statusLabels } from './Badge';

interface TicketActivity {
  id: string; ticketId: string; userId?: string | null; type: string;
  content: string; authorName?: string | null; authorEmail?: string | null;
  isInternal: boolean; emailMessageId?: string | null;
  metadata?: Record<string, unknown>; createdAt: string;
}

function formatRelative(s: string) {
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  const diff = Date.now() - d.getTime();
  if (diff < 0) return 'just now';
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d_ = Math.floor(h / 24);
  if (d_ < 30) return `${d_}d ago`;
  return new Date(s).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
}

export function ActivityItem({ activity, collapsed, onExpand, onCollapse, onEdit, onDelete, confidenceThreshold }: {
  activity: TicketActivity; collapsed: boolean;
  onExpand: () => void; onCollapse: () => void;
  onEdit?: (id: string, content: string) => void;
  onDelete?: (id: string) => void;
  confidenceThreshold: number;
}) {
  const { type, content, authorName, authorEmail, createdAt, id } = activity;
  const agentNameFromMeta = activity.metadata?.agentName as string | undefined;
  const displayName = authorName || (type === 'reply' && agentNameFromMeta ? agentNameFromMeta : null) || authorEmail || 'Unknown';
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState(content);
  const time = <span className="text-[12px] text-fg-faint tabular-nums shrink-0">{formatRelative(createdAt)}</span>;
  const dot = <div className="w-[10px] h-[10px] rounded-full bg-border shrink-0" />;

  const handleEdit = () => { setEditing(true); setEditDraft(content); };
  const handleDelete = () => { if (onDelete && window.confirm('Delete this note?')) onDelete(id); };
  const handleSaveEdit = () => { if (editDraft.trim() && onEdit) onEdit(id, editDraft.trim()); setEditing(false); };

  if (type === 'status_change' || type === 'assignment' || type === 'system') {
    const toStatus = activity.metadata?.toStatus as string | undefined;
    const statusColor = toStatus ? (statusColors as any)[toStatus] : undefined;
    const statusLabel = toStatus ? (statusLabels as any)[toStatus] : undefined;
    let actionText = '';
    let valueLabel: React.ReactNode = null;
    let isUnassign = false;
    if (type === 'status_change') {
      actionText = 'changed status to';
      if (statusLabel && statusColor) valueLabel = <span className="font-medium" style={{ color: statusColor }}>{statusLabel}</span>;
    } else if (type === 'assignment') {
      const assignedToId = activity.metadata?.assignedToId as string | null | undefined;
      const assignedToName = activity.metadata?.assignedToName as string | undefined;
      isUnassign = !assignedToId;
      actionText = isUnassign ? 'got unassigned' : 'assigned';
      valueLabel = assignedToName ? <span className="font-medium text-foreground">{assignedToName}</span> : null;
    }
    return (
      <div className="flex items-center gap-3 py-2.5 group">
        <div className="shrink-0">{dot}</div>
        <div className="flex-1 min-w-0 text-[13px]">
          <div className="flex items-center gap-1.5 flex-wrap text-fg-muted">
            {valueLabel ? (isUnassign ? <>{valueLabel} <span>{actionText}</span></> : <><span className="font-medium text-foreground">{displayName}</span> <span>{actionText}</span> {valueLabel}</>) : <span className="text-foreground">{content}</span>}
          </div>
          {time}
        </div>
      </div>
    );
  }

  const isReply = type === 'reply' || type === 'internal_note';
  const isInternal = type === 'internal_note';
  const agentId = activity.metadata?.agentId as string | undefined;
  const agentConfidence = activity.metadata?.confidence as number | undefined;
  const isAgentReply = type === 'reply' && !!agentId;
  const confidencePct = isAgentReply && agentConfidence != null ? Math.round(agentConfidence * 100) : null;
  const badgeLabel = type === 'internal_note' ? 'Internal note' : type === 'email' ? 'Email' : isAgentReply ? 'AI Reply' : 'Reply';
  const badgeColor = type === 'email' ? { color: 'hsl(var(--brand))', bg: 'hsl(var(--brand-muted))' } : type === 'internal_note' ? { color: 'hsl(var(--amber))', bg: 'hsl(var(--amber-muted))' } : isAgentReply ? { color: '#8b5cf6', bg: '#8b5cf610' } : { color: 'hsl(var(--success))', bg: 'hsl(var(--success-muted))' };
  const [showFull, setShowFull] = useState(false);
  const isLong = content.length > 300;

  return (
    <div className={`py-3 group ${isInternal ? 'rounded-lg px-3 -mx-3' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">{dot}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[13px] font-semibold text-foreground truncate">{isAgentReply ? `Replied by ${displayName}` : displayName}</span>
            <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: badgeColor.bg, color: badgeColor.color }}>{badgeLabel}</span>
            {isAgentReply && confidencePct != null && (
              <span className={`text-[11px] font-semibold ${confidencePct >= 90 ? 'text-green-600' : confidencePct >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>{confidencePct}%</span>
            )}
            <div className="flex-1" />
            {time}
          </div>
          {editing ? (
            <div className="space-y-2">
              <textarea value={editDraft} onChange={e => setEditDraft(e.target.value)} className="w-full text-[13px] p-2 border rounded" rows={3} />
              <div className="flex gap-1.5">
                <Button design="primary" size="xs" onClick={handleSaveEdit}>Save</Button>
                <Button design="outline" size="xs" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="text-[13px] leading-relaxed text-foreground whitespace-pre-wrap break-words">
              {isLong && !showFull ? (
                <>{content.slice(0, 300)}... <button onClick={() => setShowFull(true)} className="text-brand hover:underline text-[12px] font-medium">Show more</button></>
              ) : (
                <>{content}{isLong && <button onClick={() => setShowFull(false)} className="text-brand hover:underline text-[12px] font-medium ml-1">Show less</button>}</>
              )}
            </div>
          )}
          {onEdit && !editing && (
            <div className="flex gap-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {type === 'internal_note' && <button onClick={handleEdit} className="text-[11px] text-fg-muted hover:text-foreground">Edit</button>}
              {type === 'internal_note' && <button onClick={handleDelete} className="text-[11px] text-fg-muted hover:text-red-500">Delete</button>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
