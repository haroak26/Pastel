import { Save, Check, AlertCircle } from 'lucide-react';

type DraftStatus = 'saving' | 'saved' | 'idle' | 'error';

interface DraftIndicatorProps {
  status: DraftStatus;
}

export function DraftIndicator({ status }: DraftIndicatorProps) {
  if (status === 'idle') return null;

  const config = {
    saving: { icon: Save, text: 'Saving draft...', className: 'text-muted-foreground' },
    saved: { icon: Check, text: 'Draft saved', className: 'text-green-500' },
    error: { icon: AlertCircle, text: 'Failed to save draft', className: 'text-destructive' },
  };

  const { icon: Icon, text, className } = config[status];

  return (
    <div className={`flex items-center gap-1.5 text-[11px] ${className} transition-opacity`}>
      <Icon className="w-3 h-3" />
      <span>{text}</span>
    </div>
  );
}
