import { useState } from 'react';
import { ChevronRight, Folder, FolderOpen, Plus, MoreHorizontal, Pencil, Trash2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useKnowledge } from '../KnowledgeContext';
import type { FolderTreeNode as FolderTreeNodeType } from '../types';

function FolderNode({ node, depth }: { node: FolderTreeNodeType; depth: number }) {
  const { selectedFolderId, setSelectedFolderId, navigateToNew, renameFolder, deleteFolder, items } = useKnowledge();
  const [expanded, setExpanded] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(node.name);
  const [menuOpen, setMenuOpen] = useState(false);

  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedFolderId === node.id;

  const handleSaveRename = () => {
    if (editName.trim() && editName !== node.name) {
      renameFolder(node.id, editName.trim());
    }
    setEditing(false);
  };

  const itemCount = items.filter(i => i.folderId === node.id).length;

  return (
    <div>
      <div
        className={cn(
          'group flex items-center gap-1 px-2.5 py-1 text-[13px] rounded-[6px] cursor-pointer transition-colors',
          isSelected ? 'bg-[hsl(var(--surface-hover))] text-foreground font-medium' : 'text-fg-muted hover:bg-[hsl(var(--surface-hover))]',
        )}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={() => setSelectedFolderId(node.id)}
      >
        <button
          onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}
          className={cn('shrink-0', !hasChildren && 'invisible')}
        >
          <ChevronRight size={12} strokeWidth={1.5} className={cn('transition-transform', expanded && 'rotate-90')} />
        </button>

        {expanded && hasChildren ? (
          <FolderOpen size={14} strokeWidth={1.5} className="text-brand/70 shrink-0" />
        ) : (
          <Folder size={14} strokeWidth={1.5} className={cn('shrink-0', isSelected ? 'text-brand' : 'text-fg-subtle')} />
        )}

        {editing ? (
          <input
            value={editName}
            onChange={e => setEditName(e.target.value)}
            onBlur={handleSaveRename}
            onKeyDown={e => { if (e.key === 'Enter') handleSaveRename(); if (e.key === 'Escape') setEditing(false); }}
            className="flex-1 bg-transparent outline-none border-b border-brand/50 text-[13px] px-1"
            autoFocus
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span className="flex-1 truncate ml-1">{node.name}</span>
        )}

        {itemCount > 0 && !editing && (
          <span className="text-[11px] text-fg-subtle">{itemCount}</span>
        )}

        {!editing && (
          <div className="hidden group-hover:flex items-center gap-0.5 ml-1">
            <button
              onClick={e => { e.stopPropagation(); setMenuOpen(v => !v); }}
              className="p-0.5 rounded hover:bg-[hsl(var(--surface-hover))] text-fg-subtle"
            >
              <MoreHorizontal size={12} strokeWidth={1.5} />
            </button>
            {menuOpen && (
              <div className="absolute left-0 top-full mt-1 w-[160px] bg-background border border-border/60 rounded-[8px] shadow-lg py-1 z-50"
                onClick={e => e.stopPropagation()}
                onMouseLeave={() => setMenuOpen(false)}
              >
                <button onClick={() => { navigateToNew('text', node.id); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-[13px] hover:bg-[hsl(var(--surface-hover))]">
                  <FileText size={12} strokeWidth={1.5} /> New Article
                </button>
                <button onClick={() => { setEditing(true); setEditName(node.name); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-[13px] hover:bg-[hsl(var(--surface-hover))]">
                  <Pencil size={12} strokeWidth={1.5} /> Rename
                </button>
                <button onClick={() => { deleteFolder(node.id); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-[13px] text-[hsl(var(--danger))] hover:bg-red-50">
                  <Trash2 size={12} strokeWidth={1.5} /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {hasChildren && expanded && (
        <div>
          {node.children.map(child => (
            <FolderNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function FolderTree() {
  const { tree } = useKnowledge();

  return (
    <div>
      {tree.map(node => (
        <FolderNode key={node.id} node={node} depth={0} />
      ))}
    </div>
  );
}
