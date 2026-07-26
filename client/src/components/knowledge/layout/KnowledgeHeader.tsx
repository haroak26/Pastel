import { useState, useRef, useEffect } from 'react';
import { Plus, FileText, Globe, Zap, X, Search } from 'lucide-react';
import { Button } from '@/components/button';
import { TextInput } from '@/components/text-input';
import { Dropdown } from '@/components/ds';
import { useKnowledge } from '../KnowledgeContext';

export function KnowledgeHeader() {
  const { navigateToNew, createFolder, searchQuery, setSearchQuery } = useKnowledge();
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  const newOptions = [
    { type: 'text' as const, label: 'Article', icon: FileText, color: '#4682B4', desc: 'Write a text article' },
    { type: 'flow' as const, label: 'Flow', icon: Zap, color: '#A78BFA', desc: 'Design a conversation flow' },
    { type: 'web_scrape' as const, label: 'Web Import', icon: Globe, color: '#34D399', desc: 'Import from a URL' },
  ];

  return (
    <div className="flex items-center h-[46px] px-3 border-b border-border/60 bg-background gap-2 shrink-0">

      <span className="text-[13px] font-medium text-foreground select-none">Knowledge</span>

      <div className="flex-1" />

      <div className="flex items-center gap-1">
        {searchOpen ? (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
            <Search size={13} className="text-fg-faint shrink-0" />
            <TextInput
              ref={searchRef}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search knowledge..."
              className="flex-1 min-w-0 h-7 text-[13px] px-0 border-0 bg-transparent focus:ring-0 w-[200px]"
              autoFocus
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="inline-flex items-center justify-center h-5 w-5 rounded text-fg-faint hover:text-foreground hover:bg-surface-hover transition-colors border-none bg-transparent cursor-pointer"><X size={12} /></button>
            )}
            <button onClick={() => { setSearchOpen(false); setSearchQuery(''); }} className="inline-flex items-center justify-center h-7 w-7 rounded-[8px] text-fg-muted hover:text-foreground hover:bg-surface-hover transition-colors border-none bg-transparent cursor-pointer"><X size={14} /></button>
          </div>
        ) : (
          <button onClick={() => setSearchOpen(true)} className="inline-flex items-center justify-center h-7 w-7 rounded-[8px] text-fg-muted hover:text-foreground hover:bg-surface-hover transition-colors border-none bg-transparent cursor-pointer">
            <Search size={14} />
          </button>
        )}

        <Dropdown
          value=""
          onChange={(v) => { if (v === 'folder') { createFolder('New Folder'); } else { navigateToNew(v as 'text' | 'flow' | 'web_scrape'); } }}
          options={[
            ...newOptions.map(o => ({ value: o.type, label: o.label })),
            { value: 'folder', label: 'New Folder' },
          ]}
          menuAlign="right"
          showChevron={false}
          portaled
          triggerClassName="!p-0 !border-none !bg-transparent"
          renderTrigger={(selected, open) => (
            <Button size="xs" onClick={() => {}}>
              <Plus size={14} strokeWidth={1.75} />
              Create
            </Button>
          )}
        />
      </div>
    </div>
  );
}
