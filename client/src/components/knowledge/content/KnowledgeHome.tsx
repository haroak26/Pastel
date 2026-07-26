import { useLocation } from 'wouter';
import { useKnowledge } from '../KnowledgeContext';
import {
  FileText, Globe, Zap, Plus, Clock, Star, CheckCircle2, FolderOpen, BookOpen, Folder,
} from 'lucide-react';
import { Button } from '@/components/button';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { KnowledgeItem, KnowledgeItemType } from '../types';

function getTypeIcon(type: KnowledgeItemType) {
  if (type === 'web_scrape') return Globe;
  if (type === 'flow') return Zap;
  return FileText;
}

function getTypeColor(type: KnowledgeItemType) {
  if (type === 'web_scrape') return '#34D399';
  if (type === 'flow') return '#A78BFA';
  return '#4682B4';
}

function ArticleCard({ item }: { item: KnowledgeItem }) {
  const [, navigate] = useLocation();
  const Icon = getTypeIcon(item.type);
  const color = getTypeColor(item.type);

  return (
    <div
      onClick={() => navigate(`/home/knowledge/edit/${item.id}`)}
      className="group flex items-start gap-3 px-3 py-2.5 rounded-[12px] hover:bg-[hsl(var(--surface-active))] cursor-pointer transition-colors border border-transparent hover:border-black/[0.03]"
    >
      <div
        className="w-7 h-7 rounded-[9px] flex items-center justify-center shrink-0 mt-0.5 border border-border/40"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon size={15} strokeWidth={1.5} style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-foreground truncate">
            {item.label || item.fileName || 'Untitled'}
          </span>
          {item.status === 'published' && (
            <CheckCircle2 size={11} strokeWidth={2} className="text-emerald-500 shrink-0" />
          )}
          {item.isFavorite && (
            <Star size={11} strokeWidth={1.5} className="text-yellow-500 fill-yellow-500 shrink-0" />
          )}
        </div>
        {item.content && (
          <p className="text-[12px] text-fg-muted mt-0.5 line-clamp-1 leading-relaxed">
            {item.content.replace(/^#+\s+/gm, '').replace(/[*_`#\[\]]/g, '').slice(0, 120)}
          </p>
        )}
        <span className="text-[11px] text-fg-subtle mt-1 block">
          {formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}
        </span>
      </div>
    </div>
  );
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 sticky top-0 bg-background/95 backdrop-blur-sm z-10">
      <span className="text-[11px] font-semibold text-brand tracking-wide">{title}</span>
      <span className="text-[11px] text-brand bg-[hsl(var(--brand)/0.1)] px-1.5 py-0.5 rounded-full">{count}</span>
    </div>
  );
}

export function KnowledgeHome() {
  const { items, folders, stats, navigateToNew, searchQuery, filteredItems, createFolder } = useKnowledge();
  const [, navigate] = useLocation();

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-24 px-6">
        <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--surface-muted))] flex items-center justify-center mb-5">
          <BookOpen size={28} strokeWidth={1} className="text-fg-subtle" />
        </div>
        <h2 className="text-[18px] font-semibold text-foreground mb-2">Build your knowledge base</h2>
        <p className="text-[13px] text-fg-muted text-center max-w-[340px] mb-8 leading-relaxed">
          Create articles, import web pages, or design conversation flows to help your AI agent answer customer questions.
        </p>
        <div className="flex items-center gap-2.5">
          <Button onClick={() => navigateToNew('text')}>
            <FileText size={14} strokeWidth={1.75} />
            New Article
          </Button>
          <Button design="secondary" onClick={() => navigateToNew('web_scrape')}>
            <Globe size={14} strokeWidth={1.75} />
            Import from Web
          </Button>
        </div>
      </div>
    );
  }

  if (searchQuery.trim()) {
    return (
      <div className="flex-1 overflow-y-auto bg-background">
        <SectionHeader title={`results for "${searchQuery}"`} count={filteredItems.length} />
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <BookOpen size={28} strokeWidth={1} className="text-fg-subtle mb-3" />
            <p className="text-[14px] font-medium text-foreground mb-1">No results found</p>
            <p className="text-[12px] text-fg-muted">Try a different search term</p>
          </div>
        ) : (
          <div className="px-2 py-1">
            {filteredItems.map(item => <ArticleCard key={item.id} item={item} />)}
          </div>
        )}
      </div>
    );
  }

  const recentItems = [...items]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6);

  const favorites = items.filter(i => i.isFavorite);

  const folderGroups = folders.map(f => ({
    folder: f,
    items: items.filter(i => i.folderId === f.id),
  })).filter(g => g.items.length > 0);

  const uncategorized = items.filter(i => !i.folderId);

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      {stats && (
        <div className="px-4 pt-4 pb-3 border-b border-border/60">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-[15px] font-semibold text-foreground">Knowledge Base</h1>
            <Button size="sm" onClick={() => navigateToNew('text')}>
              <Plus size={14} strokeWidth={1.75} />
              New Article
            </Button>
          </div>
          <div className="flex items-center gap-4 mt-4">
            {[
              { label: 'Total', value: stats.totalItems, color: 'text-foreground' },
              { label: 'Published', value: stats.published, color: 'text-emerald-600' },
              { label: 'Drafts', value: stats.drafts, color: 'text-amber' },
              { label: 'Folders', value: stats.totalFolders, color: 'text-brand' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-1.5">
                <span className={cn('text-[16px] font-semibold tabular-nums', s.color)}>{s.value}</span>
                <span className="text-[12px] text-fg-muted">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {favorites.length > 0 && (
        <div className="mb-2">
          <SectionHeader title="Favorites" count={favorites.length} />
          <div className="px-2">
            {favorites.map(item => <ArticleCard key={item.id} item={item} />)}
          </div>
        </div>
      )}

      {recentItems.length > 0 && (
        <div className="mb-2">
          <SectionHeader title="Recent" count={recentItems.length} />
          <div className="px-2">
            {recentItems.map(item => <ArticleCard key={item.id} item={item} />)}
          </div>
        </div>
      )}

      {folderGroups.length > 0 && (
        <div className="mb-2">
          {folderGroups.map(({ folder, items: folderItems }) => (
            <div key={folder.id} className="mb-4">
              <div className="flex items-center gap-2 px-4 py-2 sticky top-0 bg-background/95 backdrop-blur-sm z-10">
                <Folder size={13} strokeWidth={1.5} className="text-brand/70 shrink-0" />
                <span className="text-[11px] font-semibold text-brand tracking-wide">{folder.name}</span>
                <span className="text-[11px] text-brand bg-[hsl(var(--brand)/0.1)] px-1.5 py-0.5 rounded-full">{folderItems.length}</span>
              </div>
              <div className="px-2">
                {folderItems.map(item => <ArticleCard key={item.id} item={item} />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {uncategorized.length > 0 && (
        <div className="mb-6">
          {folders.length > 0 && (
            <SectionHeader title="Uncategorized" count={uncategorized.length} />
          )}
          <div className="px-2">
            {uncategorized.map(item => <ArticleCard key={item.id} item={item} />)}
          </div>
        </div>
      )}

      <div className="h-8" />
    </div>
  );
}
