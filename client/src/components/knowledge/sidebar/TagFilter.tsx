import { cn } from '@/lib/utils';
import { useKnowledge } from '../KnowledgeContext';

export function TagFilter() {
  const { tags, items, searchQuery, setSearchQuery } = useKnowledge();

  const handleTagClick = (tagName: string) => {
    setSearchQuery(searchQuery === tagName ? '' : tagName);
  };

  const tagCounts = tags.map(tag => ({
    ...tag,
    count: items.filter(item => item.tags.includes(tag.name)).length,
  })).filter(t => t.count > 0);

  if (tagCounts.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 px-2.5">
      {tagCounts.map(tag => (
        <button
          key={tag.id}
          onClick={() => handleTagClick(tag.name)}
          className={cn(
            'text-[11px] px-2 py-0.5 rounded-full border transition-colors',
            searchQuery === tag.name
              ? 'bg-brand/10 border-brand/30 text-brand'
              : 'bg-[hsl(var(--surface-muted))] border-border/40 text-fg-muted hover:bg-[hsl(var(--surface-hover))]',
          )}
        >
          {tag.name}
        </button>
      ))}
    </div>
  );
}
