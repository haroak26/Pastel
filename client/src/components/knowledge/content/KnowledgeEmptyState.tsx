import { BookOpen, FileText, Globe, Zap } from 'lucide-react';
import { Button } from '@/components/button';
import { useKnowledge } from '../KnowledgeContext';

interface KnowledgeEmptyStateProps {
  hasSearch?: boolean;
}

export function KnowledgeEmptyState({ hasSearch }: KnowledgeEmptyStateProps) {
  const { navigateToNew } = useKnowledge();

  if (hasSearch) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-16 px-4">
        <BookOpen size={32} strokeWidth={1} className="text-fg-subtle mb-3" />
        <h3 className="text-[15px] font-medium text-foreground mb-1">no results found</h3>
        <p className="text-[13px] text-fg-muted">try a different search term</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center flex-1 py-16 px-4">
      <div className="w-12 h-12 rounded-xl bg-[hsl(var(--surface-muted))] flex items-center justify-center mb-4">
        <BookOpen size={24} strokeWidth={1} className="text-fg-subtle" />
      </div>
      <h3 className="text-[15px] font-medium text-foreground mb-1">no knowledge yet</h3>
      <p className="text-[13px] text-fg-muted text-center max-w-[300px] mb-6">
        Create your first article or fetch documentation from the web
      </p>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={() => navigateToNew('text')}>
          <FileText size={14} strokeWidth={1.75} /> New Article
        </Button>
        <Button size="sm" design="secondary" onClick={() => navigateToNew('web_scrape')}>
          <Globe size={14} strokeWidth={1.75} /> Web Fetch
        </Button>
      </div>
    </div>
  );
}
