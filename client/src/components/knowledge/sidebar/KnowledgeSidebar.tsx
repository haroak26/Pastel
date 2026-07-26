import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import {
  ChevronRight, Folder, FolderOpen, FileText, Globe, Zap,
  Plus, MoreHorizontal, Pencil, Trash2, BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useKnowledge } from '../KnowledgeContext';
import type { KnowledgeItem, KnowledgeFolder, FolderTreeNode } from '../types';

function getTypeIcon(type: string) {
  if (type === 'web_scrape') return Globe;
  if (type === 'flow') return Zap;
  return FileText;
}

function getTypeColor(type: string) {
  if (type === 'web_scrape') return '#34D399';
  if (type === 'flow') return '#A78BFA';
  return '#4682B4';
}

interface FileItemProps {
  item: KnowledgeItem;
  depth: number;
  isActive: boolean;
}

function FileItem({ item, depth, isActive }: FileItemProps) {
  const [, navigate] = useLocation();
  const { deleteItems } = useKnowledge();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const Icon = getTypeIcon(item.type);
  const color = getTypeColor(item.type);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    if (menuOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  return (
    <div
      className={cn(
        'group relative flex items-center gap-1.5 py-[5px] pr-2 text-[13px] rounded-[6px] cursor-pointer transition-colors select-none',
        isActive
          ? 'bg-brand/10 text-foreground font-medium'
          : 'text-fg-muted hover:bg-[hsl(var(--surface-hover))] hover:text-foreground',
      )}
      style={{ paddingLeft: `${12 + depth * 16}px` }}
      onClick={() => navigate(`/home/knowledge/edit/${item.id}`)}
    >
      <Icon size={13} strokeWidth={1.5} style={{ color }} className="shrink-0" />
      <span className="flex-1 truncate">{item.label || item.fileName || 'Untitled'}</span>
      {item.status === 'draft' && (
        <span className="text-[10px] text-fg-subtle shrink-0 hidden group-hover:hidden">•</span>
      )}
      <div className="relative shrink-0">
        <button
          onClick={e => { e.stopPropagation(); setMenuOpen(v => !v); }}
          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[hsl(var(--surface-hover))] text-fg-subtle"
        >
          <MoreHorizontal size={12} strokeWidth={1.5} />
        </button>
        {menuOpen && (
          <div
            ref={menuRef}
            className="absolute right-0 top-full mt-1 w-[160px] bg-background border border-border/60 rounded-[8px] shadow-lg py-1 z-50"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => { navigate(`/home/knowledge/edit/${item.id}`); setMenuOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-[13px] hover:bg-[hsl(var(--surface-hover))]"
            >
              <Pencil size={12} strokeWidth={1.5} /> Open
            </button>
            <div className="border-t border-border/40 my-1" />
            <button
              onClick={() => { deleteItems([item.id]); setMenuOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-[13px] text-[hsl(var(--danger))] hover:bg-red-50"
            >
              <Trash2 size={12} strokeWidth={1.5} /> Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface FolderNodeProps {
  node: FolderTreeNode;
  depth: number;
  items: KnowledgeItem[];
  activePath: string;
}

function FolderNode({ node, depth, items, activePath }: FolderNodeProps) {
  const { navigateToNew, renameFolder, deleteFolder } = useKnowledge();
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(node.name);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const folderItems = items.filter(i => i.folderId === node.id);
  const hasContent = node.children.length > 0 || folderItems.length > 0;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    if (menuOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const handleSaveRename = () => {
    if (editName.trim() && editName !== node.name) renameFolder(node.id, editName.trim());
    setEditing(false);
  };

  return (
    <div>
      <div
        className={cn(
          'group flex items-center gap-1.5 py-[5px] pr-2 text-[13px] rounded-[6px] cursor-pointer transition-colors select-none',
          'text-fg-muted hover:bg-[hsl(var(--surface-hover))] hover:text-foreground',
        )}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={() => hasContent && setExpanded(v => !v)}
      >
        <button
          onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}
          className={cn('shrink-0 p-0.5', !hasContent && 'invisible')}
        >
          <ChevronRight
            size={12}
            strokeWidth={1.5}
            className={cn('transition-transform duration-150', expanded && 'rotate-90')}
          />
        </button>

        {expanded && hasContent
          ? <FolderOpen size={13} strokeWidth={1.5} className="shrink-0 text-brand/70" />
          : <Folder size={13} strokeWidth={1.5} className="shrink-0 text-fg-subtle" />
        }

        {editing ? (
          <input
            value={editName}
            onChange={e => setEditName(e.target.value)}
            onBlur={handleSaveRename}
            onKeyDown={e => { if (e.key === 'Enter') handleSaveRename(); if (e.key === 'Escape') setEditing(false); }}
            className="flex-1 bg-transparent outline-none border-b border-brand/50 text-[13px]"
            autoFocus
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span className="flex-1 truncate font-medium">{node.name}</span>
        )}

        {!editing && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 shrink-0">
            <button
              onClick={e => { e.stopPropagation(); navigateToNew('text', node.id); }}
              className="p-0.5 rounded hover:bg-[hsl(var(--surface-hover))] text-fg-subtle hover:text-foreground"
              title="New Article"
            >
              <Plus size={12} strokeWidth={1.5} />
            </button>
            <div className="relative">
              <button
                onClick={e => { e.stopPropagation(); setMenuOpen(v => !v); }}
                className="p-0.5 rounded hover:bg-[hsl(var(--surface-hover))] text-fg-subtle"
              >
                <MoreHorizontal size={12} strokeWidth={1.5} />
              </button>
              {menuOpen && (
                <div
                  ref={menuRef}
                  className="absolute right-0 top-full mt-1 w-[170px] bg-background border border-border/60 rounded-[8px] shadow-lg py-1 z-50"
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    onClick={() => { navigateToNew('text', node.id); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-[13px] hover:bg-[hsl(var(--surface-hover))]"
                  >
                    <Plus size={12} strokeWidth={1.5} /> New Article
                  </button>
                  <button
                    onClick={() => { setEditing(true); setEditName(node.name); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-[13px] hover:bg-[hsl(var(--surface-hover))]"
                  >
                    <Pencil size={12} strokeWidth={1.5} /> Rename
                  </button>
                  <div className="border-t border-border/40 my-1" />
                  <button
                    onClick={() => { deleteFolder(node.id); setMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-[13px] text-[hsl(var(--danger))] hover:bg-red-50"
                  >
                    <Trash2 size={12} strokeWidth={1.5} /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {expanded && (
        <div>
          {node.children.map(child => (
            <FolderNode key={child.id} node={child} depth={depth + 1} items={items} activePath={activePath} />
          ))}
          {folderItems.map(item => (
            <FileItem
              key={item.id}
              item={item}
              depth={depth + 1}
              isActive={activePath.includes(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function KnowledgeSidebar() {
  const [location] = useLocation();
  const [, navigate] = useLocation();
  const { tree, items, stats, navigateToNew, createFolder } = useKnowledge();
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const uncategorized = items.filter(i => !i.folderId);

  const isHome = !location.includes('/home/knowledge/edit/') && !location.includes('/home/knowledge/new');

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolder(newFolderName.trim());
      setNewFolderName('');
    }
    setCreatingFolder(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-3 pb-2">
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-0.5 pb-2">
        <button
          onClick={() => navigate('/home/knowledge')}
          className={cn(
            'w-full flex items-center gap-2 px-2.5 py-[5px] text-[13px] rounded-[10px] transition-colors border border-transparent',
            isHome
              ? 'bg-[hsl(var(--surface-active))] text-foreground font-medium border-border/60'
              : 'text-fg-muted hover:bg-[hsl(var(--surface-hover))] hover:text-foreground',
          )}
        >
          <BookOpen size={13} strokeWidth={1.5} />
          <span className="flex-1 text-left">All Pages</span>
          <span className="text-[11px] text-fg-subtle">{items.length}</span>
        </button>

        {tree.length > 0 && (
          <div className="pt-1 space-y-0.5">
            <div className="px-2.5 pb-1 flex items-center justify-between">
              <span className="text-[10px] font-semibold text-fg-subtle tracking-wide">Folders</span>
              <button
                onClick={() => setCreatingFolder(true)}
                className="p-0.5 rounded hover:bg-[hsl(var(--surface-hover))] text-fg-subtle opacity-0 hover:opacity-100 transition-opacity group"
                title="New Folder"
              >
                <Plus size={11} strokeWidth={1.5} />
              </button>
            </div>
            {tree.map(node => (
              <FolderNode key={node.id} node={node} depth={0} items={items} activePath={location} />
            ))}
          </div>
        )}

        {creatingFolder && (
          <div className="px-2 py-1">
            <input
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              onBlur={handleCreateFolder}
              onKeyDown={e => { if (e.key === 'Enter') handleCreateFolder(); if (e.key === 'Escape') setCreatingFolder(false); }}
              placeholder="Folder name..."
              className="w-full h-[26px] px-2 text-[12px] bg-[hsl(var(--surface-muted))] rounded border border-brand/40 outline-none"
              autoFocus
            />
          </div>
        )}

        {uncategorized.length > 0 && (
          <div className={cn('space-y-0.5', tree.length > 0 && 'pt-2')}>
            {tree.length === 0 && (
              <div className="px-2.5 pb-1">
                <span className="text-[10px] font-semibold text-fg-subtle tracking-wide">Pages</span>
              </div>
            )}
            {uncategorized.map(item => (
              <FileItem
                key={item.id}
                item={item}
                depth={0}
                isActive={location.includes(item.id)}
              />
            ))}
          </div>
        )}

        {items.length === 0 && (
          <div className="py-6 text-center">
            <BookOpen size={22} strokeWidth={1} className="text-fg-subtle mx-auto mb-2" />
            <p className="text-[12px] text-fg-muted">No knowledge yet</p>
          </div>
        )}
      </div>

      <div className="px-3 py-2.5 border-t border-border/60 space-y-1.5">
        <button
          onClick={() => navigateToNew('text')}
          className="w-full flex items-center gap-2 px-2 py-1.5 text-[12px] text-fg-muted hover:text-foreground hover:bg-[hsl(var(--surface-hover))] rounded-[6px] transition-colors"
        >
          <Plus size={12} strokeWidth={1.5} />
          New Article
        </button>
        {stats && (
          <div className="flex items-center justify-between text-[11px] text-fg-subtle px-1">
            <span>{stats.published} Published</span>
            <span>{stats.drafts} Drafts</span>
          </div>
        )}
      </div>
    </div>
  );
}
