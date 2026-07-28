import { useState } from 'react';
import { useUser } from '@/hooks/use-user';
import { PromptInput } from '@/components/PromptInput';
import { Plus, ArrowRight } from 'lucide-react';
import { useLocation } from 'wouter';

const RECENT_PROJECTS = [
  { id: '1', name: 'Landing Page Redesign', updated: '2 hours ago' },
  { id: '2', name: 'Dashboard UI Kit', updated: '1 day ago' },
  { id: '3', name: 'Mobile App Mockups', updated: '3 days ago' },
];

export default function HomePage() {
  const { data: user } = useUser();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);

  const handlePrompt = async (prompt: string) => {
    setLoading(true);
    sessionStorage.setItem('pastel-prompt', prompt);
    setLocation('/canvas/new');
  };

  const firstName = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      <div className="flex-1 flex flex-col items-center pt-12 sm:pt-36 pb-8 sm:pb-12 px-4 sm:px-6 max-w-4xl mx-auto w-full">
        {/* Welcome */}
        <div className="text-center mb-3 sm:mb-6 pt-3 sm:pt-6">
          <h1 className="text-[22px] sm:text-[30px] font-semibold text-foreground tracking-tight">
            What's the vision, {firstName}?
          </h1>
        </div>

        {/* Prompt Box */}
        <PromptInput onSubmit={handlePrompt} isLoading={loading} />

        {/* Recent Projects */}
        <div className="w-full max-w-3xl mx-auto mt-8 sm:mt-36">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[18px] font-semibold text-foreground">Recent</h2>
            <button
              onClick={() => setLocation('/home/projects')}
              className="flex items-center gap-1 text-[13px] font-medium text-fg-muted hover:text-foreground transition-colors border-none bg-transparent cursor-pointer"
            >
              View all <ArrowRight size={13} />
            </button>
          </div>

          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 -mx-4 sm:-mx-0 px-4 sm:px-0">
            {RECENT_PROJECTS.map((project) => (
              <div
                key={project.id}
                onClick={() => setLocation(`/canvas/${project.id}`)}
                className="group flex-shrink-0 w-[200px] rounded-[12px] border border-border bg-background hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all duration-150 cursor-pointer overflow-hidden"
              >
                <div className="aspect-[16/10] bg-surface-hover flex items-center justify-center">
                  <span className="text-[11px] text-fg-muted font-medium">No Preview</span>
                </div>
                <div className="h-px bg-border/60" />
                <div className="px-3 py-2">
                  <p className="text-[13px] font-medium text-foreground truncate">{project.name}</p>
                  <p className="text-[11px] text-fg-faint mt-0.5">{project.updated}</p>
                </div>
              </div>
            ))}
            <div
              onClick={() => setLocation('/canvas/new')}
              className="flex-shrink-0 w-[200px] rounded-[12px] border border-dashed border-border bg-background hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all duration-150 cursor-pointer flex flex-col items-center justify-center gap-2 min-h-[160px]"
            >
              <Plus size={22} className="text-fg-faint" strokeWidth={1.5} />
              <span className="text-[13px] font-medium text-fg-muted">New project</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
