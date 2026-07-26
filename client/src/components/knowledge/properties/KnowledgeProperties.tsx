import { X, FileText, Globe, Zap, Star, Folder, Tag, Calendar, ExternalLink, Clock, History } from 'lucide-react';
import { Button } from '@/components/button';
import { useKnowledge } from '../KnowledgeContext';
import type { KnowledgeItem, KnowledgeItemType } from '../types';
import { format } from 'date-fns';

const typeIcons: Record<KnowledgeItemType, typeof FileText> = {
  text: FileText,
  flow: Zap,
  web_scrape: Globe,
};

interface KnowledgePropertiesProps {
  item: KnowledgeItem;
  onClose: () => void;
}

export function KnowledgeProperties({ item, onClose }: KnowledgePropertiesProps) {
  const { folders, toggleFavorite, updateItemStatus } = useKnowledge();
  const folder = folders.find(f => f.id === item.folderId);
  const Icon = typeIcons[item.type] || FileText;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 h-[46px] border-b border-border/60">
        <span className="text-[12px] font-medium text-fg-muted tracking-wide">properties</span>
        <Button design="ghost" size="sm" onClick={onClose}>
          <X size={14} strokeWidth={1.5} />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* type & status */}
        <div className="flex items-center gap-2.5">
          <Icon size={16} strokeWidth={1.5} className="text-fg-muted" />
          <span className="text-[13px] text-foreground font-medium capitalize">{item.type === 'web_scrape' ? 'web fetch' : item.type}</span>
          <div className={`text-[11px] px-2 py-0.5 rounded-full border ${
            item.status === 'published' ? 'border-[#34D399]/30 text-[#34D399] bg-[#34D399]/10' :
            item.status === 'draft' ? 'border-[#F59E0B]/30 text-[#F59E0B] bg-[#F59E0B]/10' :
            'border-[#9CA3AF]/30 text-[#9CA3AF] bg-[#9CA3AF]/10'
          }`}>
            {item.status}
          </div>
        </div>

        {/* favorite */}
        <button
          onClick={() => toggleFavorite(item.id)}
          className="flex items-center gap-2 text-[13px] text-fg-muted hover:text-foreground transition-colors w-full"
        >
          <Star size={13} strokeWidth={1.5} fill={item.isFavorite ? 'currentColor' : 'none'} className={item.isFavorite ? 'text-yellow-500' : ''} />
          {item.isFavorite ? 'favorited' : 'add to favorites'}
        </button>

        <div className="border-t border-border/40" />

        {/* folder */}
        <div>
          <div className="flex items-center gap-1.5 text-[11px] text-fg-subtle mb-1">
            <Folder size={11} strokeWidth={1.5} /> folder
          </div>
          <p className="text-[13px] text-foreground">{folder?.name || 'none'}</p>
        </div>

        {/* Tags */}
        {item.tags.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 text-[11px] text-fg-subtle mb-1.5">
              <Tag size={11} strokeWidth={1.5} /> tags
            </div>
            <div className="flex flex-wrap gap-1">
              {item.tags.map(tag => (
                <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full bg-[hsl(var(--surface-muted))] text-fg-muted border border-border/40">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Source URL */}
        {item.sourceUrl && (
          <div>
            <div className="flex items-center gap-1.5 text-[11px] text-fg-subtle mb-1">
              <ExternalLink size={11} strokeWidth={1.5} /> Source
            </div>
            <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[13px] text-brand hover:underline break-all">
              {item.sourceUrl}
            </a>
          </div>
        )}

        <div className="border-t border-border/40" />

        {/* Dates */}
        <div>
          <div className="flex items-center gap-1.5 text-[11px] text-fg-subtle mb-1">
            <Calendar size={11} strokeWidth={1.5} /> Created
          </div>
          <p className="text-[13px] text-foreground">{format(new Date(item.createdAt), 'MMM d, yyyy h:mm a')}</p>
        </div>

        <div>
          <div className="flex items-center gap-1.5 text-[11px] text-fg-subtle mb-1">
            <Clock size={11} strokeWidth={1.5} /> Updated
          </div>
          <p className="text-[13px] text-foreground">{format(new Date(item.updatedAt), 'MMM d, yyyy h:mm a')}</p>
        </div>

        {/* Status actions */}
        <div className="border-t border-border/40 pt-3 space-y-1">
          <button
            onClick={() => updateItemStatus(item.id, 'published')}
            className="w-full text-left text-[13px] px-2 py-1.5 rounded hover:bg-[hsl(var(--surface-hover))] text-fg-muted"
          >
            Set as Published
          </button>
          <button
            onClick={() => updateItemStatus(item.id, 'draft')}
            className="w-full text-left text-[13px] px-2 py-1.5 rounded hover:bg-[hsl(var(--surface-hover))] text-fg-muted"
          >
            Set as Draft
          </button>
          <button
            onClick={() => updateItemStatus(item.id, 'archived')}
            className="w-full text-left text-[13px] px-2 py-1.5 rounded hover:bg-[hsl(var(--surface-hover))] text-fg-muted"
          >
            Archive
          </button>
        </div>
      </div>
    </div>
  );
}
