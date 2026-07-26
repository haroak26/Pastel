import { useLocation } from 'wouter';
import { FileText, Globe, Zap, Star, MoreHorizontal, Trash2, Copy, CheckCircle2, Clock, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/button';
import { useKnowledge } from '../KnowledgeContext';
import type { KnowledgeItem, KnowledgeItemType, KnowledgeStatus } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { useState, useRef, useEffect } from 'react';

const typeIcons: Record<KnowledgeItemType, typeof FileText> = {
  text: FileText,
  flow: Zap,
  web_scrape: Globe,
};

const typeColors: Record<KnowledgeItemType, string> = {
  text: '#4682B4',
  flow: '#A78BFA',
  web_scrape: '#34D399',
};

const statusIcons: Record<KnowledgeStatus, typeof CheckCircle2> = {
  published: CheckCircle2,
  draft: Clock,
  archived: Archive,
};

const statusColors: Record<KnowledgeStatus, string> = {
  published: '#34D399',
  draft: '#F59E0B',
  archived: '#9CA3AF',
};

interface KnowledgeListViewProps {
  items: KnowledgeItem[];
  onOpenProperties: (item: KnowledgeItem) => void;
}

export function KnowledgeListView({ items, onOpenProperties }: KnowledgeListViewProps) {
  const [, navigate] = useLocation();
  const { toggleSelectItem, selectedItemIds, toggleFavorite, deleteItems, updateItemStatus, clearSelection, filterType } = useKnowledge();
  const [menuItem, setMenuItem] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuItem(null);
    };
    if (menuItem) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuItem]);

  return (
    <div className="flex-1 overflow-y-auto">
      {selectedItemIds.size > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 bg-brand/5 border-b border-border/60">
          <span className="text-[13px] text-fg-muted">{selectedItemIds.size} selected</span>
          <Button size="xs" design="ghost" onClick={clearSelection}>Deselect</Button>
          <Button size="xs" design="ghost" className="text-[hsl(var(--danger))]" onClick={() => deleteItems(Array.from(selectedItemIds))}>
            <Trash2 size={12} strokeWidth={1.5} /> Delete
          </Button>
        </div>
      )}

      <div className="px-4 py-2 space-y-0.5">
        {items.map(item => {
          const Icon = typeIcons[item.type];
          const color = typeColors[item.type];
          const StatusIcon = statusIcons[item.status as KnowledgeStatus] || statusIcons.draft;
          const statusColor = statusColors[item.status as KnowledgeStatus] || statusColors.draft;
          const isSelected = selectedItemIds.has(item.id);

          return (
            <div
              key={item.id}
              className={cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-[8px] cursor-pointer transition-colors',
                isSelected ? 'bg-brand/5' : 'hover:bg-[hsl(var(--surface-hover))]',
              )}
              onClick={() => navigate(`/home/knowledge/edit/${item.id}`)}
            >
              <div
                onClick={e => { e.stopPropagation(); toggleSelectItem(item.id); }}
                className={cn(
                  'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                  isSelected ? 'border-brand bg-brand' : 'border-fg-subtle hover:border-fg-muted',
                )}
              >
                {isSelected && <CheckCircle2 size={10} className="text-white" strokeWidth={3} />}
              </div>

              <Icon size={15} strokeWidth={1.5} style={{ color }} className="shrink-0" />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] text-foreground truncate font-medium">
                    {item.label || item.fileName || 'Untitled'}
                  </span>
                  <StatusIcon size={11} strokeWidth={2} style={{ color: statusColor }} className="shrink-0" />
                </div>
                {(item.sourceUrl || item.tags.length > 0) && (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {item.sourceUrl && (
                      <span className="text-[11px] text-fg-subtle truncate max-w-[200px]">{item.sourceUrl}</span>
                    )}
                    {item.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-[hsl(var(--surface-muted))] text-fg-subtle border border-border/40">
                        {tag}
                      </span>
                    ))}
                    {item.tags.length > 2 && (
                      <span className="text-[10px] text-fg-subtle">+{item.tags.length - 2}</span>
                    )}
                  </div>
                )}
              </div>

              <span className="text-[11px] text-fg-subtle shrink-0 hidden sm:block">
                {formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}
              </span>

              <button
                onClick={e => { e.stopPropagation(); toggleFavorite(item.id); }}
                className={cn('shrink-0 p-0.5', item.isFavorite ? 'text-yellow-500' : 'text-fg-subtle opacity-0 group-hover:opacity-100')}
              >
                <Star size={13} strokeWidth={1.5} fill={item.isFavorite ? 'currentColor' : 'none'} />
              </button>

              <div className="relative shrink-0">
                <button
                  onClick={e => { e.stopPropagation(); setMenuItem(menuItem === item.id ? null : item.id); }}
                  className="p-0.5 rounded hover:bg-[hsl(var(--surface-hover))] text-fg-subtle opacity-0 group-hover:opacity-100"
                >
                  <MoreHorizontal size={14} strokeWidth={1.5} />
                </button>
                {menuItem === item.id && (
                  <div ref={menuRef} className="absolute right-0 top-full mt-1 w-[170px] bg-background border border-border/60 rounded-[8px] shadow-lg py-1 z-50"
                    onClick={e => e.stopPropagation()}
                  >
                    <button onClick={() => { onOpenProperties(item); setMenuItem(null); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-[13px] hover:bg-[hsl(var(--surface-hover))]">
                      <Copy size={12} strokeWidth={1.5} /> Properties
                    </button>
                    <button onClick={() => { updateItemStatus(item.id, item.status === 'published' ? 'draft' : 'published'); setMenuItem(null); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-[13px] hover:bg-[hsl(var(--surface-hover))]">
                      <CheckCircle2 size={12} strokeWidth={1.5} /> Toggle Publish
                    </button>
                    <div className="border-t border-border/40 my-1" />
                    <button onClick={() => { deleteItems([item.id]); setMenuItem(null); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-[13px] text-[hsl(var(--danger))] hover:bg-red-50">
                      <Trash2 size={12} strokeWidth={1.5} /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
