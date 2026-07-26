import { Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PipelineStep {
  id: string;
  label: string;
}

interface PipelineProgressProps {
  steps: PipelineStep[];
  currentStep: string;
  className?: string;
}

export function PipelineProgress({ steps, currentStep, className }: PipelineProgressProps) {
  const currentIdx = steps.findIndex(s => s.id === currentStep);
  const isComplete = currentStep === 'done';

  return (
    <div className={cn('space-y-3', className)}>
      {steps.map((step, i) => {
        const isActive = step.id === currentStep;
        const isPast = i < currentIdx || isComplete;

        return (
          <div key={step.id} className="flex items-center gap-3">
            <div className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center shrink-0',
              isActive ? 'bg-brand/20' : isPast ? 'bg-[hsl(152 60% 40%)]/20' : 'bg-[hsl(var(--surface-hover))]',
            )}>
              {isActive ? (
                <Loader2 size={12} className="animate-spin text-brand" />
              ) : isPast ? (
                <CheckCircle2 size={12} className="text-[hsl(152 60% 40%)]" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-fg-subtle" />
              )}
            </div>
            <p className={cn(
              'text-[13px]',
              isActive ? 'text-foreground font-medium' : isPast ? 'text-fg-muted' : 'text-fg-subtle',
            )}>{step.label}</p>
          </div>
        );
      })}
    </div>
  );
}
