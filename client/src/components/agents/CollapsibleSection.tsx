import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

export function CollapsibleSection({ title, description, defaultOpen = false, children }: { title: React.ReactNode; description?: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="w-full border border-border/60 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-3 min-h-12 py-3 px-4 text-left bg-none border-none cursor-pointer group hover:bg-surface-hover transition-colors"
      >
        <div className="min-w-0 flex-1">
          <h2 className="text-[14px] font-semibold text-foreground leading-snug">{title}</h2>
          {description && <p className="mt-0.5 text-[12px] text-fg-muted leading-snug">{description}</p>}
        </div>
        <ChevronRight size={15} strokeWidth={1.5} className={`text-fg-faint shrink-0 transition-transform duration-200 group-hover:text-fg-muted ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && <div className="px-4 pb-4 border-t border-border/60 pt-3">{children}</div>}
    </section>
  );
}
