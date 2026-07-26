import { CheckCircle2, Clock, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { KnowledgeStatus } from '../types';

interface StatusBadgeProps {
  status: KnowledgeStatus;
  className?: string;
}

const config: Record<KnowledgeStatus, { icon: typeof CheckCircle2; color: string; bg: string }> = {
  published: { icon: CheckCircle2, color: 'text-[#34D399]', bg: 'bg-[#34D399]/10' },
  draft: { icon: Clock, color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/10' },
  archived: { icon: Archive, color: 'text-[#9CA3AF]', bg: 'bg-[#9CA3AF]/10' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const cfg = config[status];
  const Icon = cfg.icon;

  return (
    <span className={cn('inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full', cfg.color, cfg.bg, className)}>
      <Icon size={10} strokeWidth={2} />
      {status}
    </span>
  );
}
