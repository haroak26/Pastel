import { useState } from 'react';
import { useLocation } from 'wouter';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/button';

const PROJECTS = [
  { id: '1', name: 'Landing Page Redesign', updated: '2 hours ago' },
  { id: '2', name: 'Dashboard UI Kit', updated: '1 day ago' },
  { id: '3', name: 'Mobile App Mockups', updated: '3 days ago' },
  { id: '4', name: 'E-commerce Storefront', updated: '5 days ago' },
  { id: '5', name: 'Blog Layout', updated: '1 week ago' },
  { id: '6', name: 'Portfolio Site', updated: '2 weeks ago' },
];

export default function ProjectsPage() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState('');

  const filtered = PROJECTS.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      <div className="flex-1 px-8 py-6 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[22px] font-semibold text-foreground tracking-tight">Projects</h1>
          <Button size="sm" onClick={() => setLocation('/home/design')}>
            <Plus size={15} />
            New project
          </Button>
        </div>

        <div className="relative mb-6">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-faint" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full h-[36px] pl-9 pr-3 rounded-[10px] text-[14px] text-foreground placeholder:text-fg-faint bg-surface-hover border-none outline-none"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          {filtered.map((project) => (
            <div
              key={project.id}
              onClick={() => {}}
              className="group rounded-[12px] border border-border bg-background hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all duration-150 cursor-pointer overflow-hidden"
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
        </div>
      </div>
    </div>
  );
}
