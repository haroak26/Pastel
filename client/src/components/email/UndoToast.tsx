import { Button } from '@/components/button';
import { useState, useEffect, useRef } from 'react';

interface UndoToastProps {
  message: string;
  duration?: number;
  onUndo: () => void;
  onComplete: () => void;
}

export function UndoToast({ message, duration = 7000, onUndo, onComplete }: UndoToastProps) {
  const [progress, setProgress] = useState(100);
  const startRef = useRef(Date.now());
  const frameRef = useRef<number>();
  const completedRef = useRef(false);

  useEffect(() => {
    const animate = () => {
      const elapsed = Date.now() - startRef.current;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        if (!completedRef.current) {
          completedRef.current = true;
          onComplete();
        }
        return;
      }
      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [duration, onComplete]);

  const handleUndo = () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    onUndo();
  };

  return (
    <div className="fixed bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 z-[999] min-w-[320px] max-w-[480px]">
      <div className="relative bg-foreground text-background px-4 py-3 rounded-xl shadow-lg overflow-hidden">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium truncate">{message}</p>
          <div className="flex items-center gap-2 shrink-0">
            <Button design="ghost" size="xs" className="text-primary-foreground bg-primary/20 hover:bg-primary/30" onClick={handleUndo}>Undo</Button>
            <button
              onClick={onComplete}
              className="text-sm text-background/60 hover:text-background/80 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-background/10">
          <div
            className="h-full bg-primary transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
