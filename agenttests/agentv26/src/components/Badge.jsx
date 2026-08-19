import React from 'react';
import { Award, Sparkles, Check, Clock, AlertCircle } from 'lucide-react';

export default function Badge({
  label = '',
  tone = 'secondary'
}) {
  const normalizedTone = String(tone).toLowerCase();

  const getToneStyle = () => {
    switch (normalizedTone) {
      case 'primary':
      case 'accent':
        return 'bg-[var(--primary)] text-[var(--primary-foreground)] border-transparent';
      case 'success':
      case 'active':
        return 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20';
      case 'warning':
      case 'pending':
        return 'bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/25';
      case 'destructive':
      case 'danger':
      case 'error':
        return 'bg-[var(--destructive)]/10 text-[var(--destructive)] border-[var(--destructive)]/20';
      case 'superhost':
      case 'featured':
        return 'bg-[var(--card)] text-[var(--foreground)] border-[var(--border)] shadow-[0_1px_2px_rgba(0,0,0,0.06)]';
      case 'muted':
        return 'bg-[var(--muted)] text-[var(--muted-foreground)] border-transparent';
      case 'outline':
        return 'bg-transparent text-[var(--foreground)] border-[var(--border)]';
      case 'secondary':
      default:
        return 'bg-[var(--secondary)] text-[var(--secondary-foreground)] border-[var(--border)]';
    }
  };

  const renderIcon = () => {
    switch (normalizedTone) {
      case 'superhost':
      case 'featured':
        return <Award className="w-3 h-3 text-[var(--primary)] shrink-0" aria-hidden="true" />;
      case 'active':
      case 'success':
        return <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] shrink-0" aria-hidden="true" />;
      case 'pending':
      case 'warning':
        return <span className="w-1.5 h-1.5 rounded-full bg-[var(--warning)] shrink-0" aria-hidden="true" />;
      case 'destructive':
        return <AlertCircle className="w-3 h-3 shrink-0" aria-hidden="true" />;
      default:
        return null;
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium tracking-tight rounded-[var(--radius-full)] border transition-colors select-none ${getToneStyle()}`}
    >
      {renderIcon()}
      <span>{label}</span>
    </span>
  );
}