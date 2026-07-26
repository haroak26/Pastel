import type { TicketPriority, TicketStatus } from '@shared/schema';

const priorityColors: Record<string, string> = {
  low: 'bg-blue-100 text-blue-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

export function PriorityBadge({ priority }: { priority: string }) {
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[12px] font-medium ${priorityColors[priority] || priorityColors.medium}`}>{priority}</span>;
}

export const statusColors: Record<string, string> = {
  open: '#6b7280',
  in_progress: '#3b82f6',
  resolved: '#22c55e',
  closed: '#6b7280',
};

export const statusLabels: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  const color = statusColors[status] || '#6b7280';
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[12px] font-medium" style={{ backgroundColor: `${color}15`, color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      {statusLabels[status] || status}
    </span>
  );
}
