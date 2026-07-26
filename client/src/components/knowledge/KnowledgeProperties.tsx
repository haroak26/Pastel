import { useState } from 'react';
import { X, Folder, Tag, Globe, Clock, Pencil, Trash2, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, IconButton } from '@/components/button';
import { useKnowledge } from './KnowledgeContext';
import type { KnowledgeItem } from './types';

interface KnowledgePropertiesProps {
  item: KnowledgeItem | null;
  onClose: () => void;
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' at ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function KnowledgeProperties({ item, onClose }: KnowledgePropertiesProps) {
  const { folders, tags, toggleFavorite } = useKnowledge();

  if (!item) return null;

  const folderName = folders.find(f => f.id === item.folderId)?.name ?? 'no folder';
  const itemTags = item.tags ?? [];

  return (
    <div className="flex flex-col h-full border-l border-border/60 bg-background">
      <div className="flex items-center justify-between h-[42px] px-4 border-b border-border/60">
        <span className="text-[12px] font-semibold tracking-wide text-fg-subtle">properties</span>
        <IconButton icon={X} size="xs" design="ghost" onClick={onClose} />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-4 pb-3 border-b border-border/60">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[13px] font-semibold text-foreground flex-1 truncate">
              {item.label || item.fileName || 'Untitled'}
            </span>
            <IconButton icon={Star} size="xs" design="ghost" onClick={() => toggleFavorite(item.id)} />
          </div>
          <div className="flex items-center gap-1.5">
            <span className={cn(
              'inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-[4px]',
              item.status === 'published' && 'bg-emerald-50 text-emerald-700',
              item.status === 'draft' && 'bg-amber-muted text-amber',
              item.status === 'archived' && 'bg-gray-100 text-gray-600',
            )}>
              {item.status === 'published' && 'published'}
              {item.status === 'draft' && 'draft'}
              {item.status === 'archived' && 'archived'}
            </span>
            <span className="text-[11px] text-fg-faint capitalize">
              {item.type === 'web_scrape' ? 'web scrape' : item.type === 'flow' ? 'flow' : 'article'}
            </span>
          </div>
        </div>

        <div className="px-4">
          <PropertyRow icon={<Folder size={13} strokeWidth={1.5} />} label="folder" value={folderName} />
          <PropertyRow icon={<Tag size={13} strokeWidth={1.5} />} label="tags" value={itemTags.length > 0 ? itemTags.join(', ') : 'none'} />

          {item.sourceUrl && (
            <PropertyRow icon={<Globe size={13} strokeWidth={1.5} />} label="Source" value={item.sourceUrl} />
          )}

          <PropertyRow icon={<Clock size={13} strokeWidth={1.5} />} label="Created" value={formatTime(item.createdAt)} />
          <PropertyRow icon={<Clock size={13} strokeWidth={1.5} />} label="Updated" value={formatTime(item.updatedAt)} />
        </div>
      </div>
    </div>
  );
}

function PropertyRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 py-2.5 border-b border-border/40">
      <span className="text-fg-subtle shrink-0">{icon}</span>
      <span className="text-[12px] text-fg-faint w-16 shrink-0">{label}</span>
      <span className="text-[12px] text-foreground truncate">{value}</span>
    </div>
  );
}

export default KnowledgeProperties;