import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Save, Eye, Edit3, Globe, MoreHorizontal, Copy, Bold, Italic, List, ListOrdered, Heading1, Heading2, Heading3, Quote, Code, Link } from 'lucide-react';
import { Button } from '@/components/button';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useKnowledge } from '../KnowledgeContext';
import { AppPage, PageHeader, ContentPanel } from '@/components/ds';
import type { KnowledgeStatus } from '../types';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface KnowledgeEditorProps {
  scopeId: string;
  onSave: () => void;
  onCancel: () => void;
  editId?: string;
  initialData?: {
    title?: string;
    content?: string;
    folderId?: string | null;
    tags?: string[];
    sourceUrl?: string;
    status?: string;
  };
}

const STATUS_CYCLE: KnowledgeStatus[] = ['draft', 'published', 'archived'];
const STATUS_COLORS: Record<KnowledgeStatus, string> = {
  published: '#34D399', draft: '#F59E0B', archived: '#9CA3AF',
};

export function KnowledgeEditor({ scopeId, onSave, onCancel, editId, initialData }: KnowledgeEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { folders, tags: allTags } = useKnowledge();
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [statusIdx, setStatusIdx] = useState(STATUS_CYCLE.indexOf((initialData?.status as KnowledgeStatus) || 'draft'));
  const [sourceUrl, setSourceUrl] = useState(initialData?.sourceUrl || '');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(initialData?.folderId || null);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialData?.tags || []);
  const [preview, setPreview] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const status = STATUS_CYCLE[statusIdx];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (menuRef.current && !menuRef.current.contains(target)) setShowMenu(false);
      if (!target.closest('.folder-picker')) setShowFolderPicker(false);
      if (!target.closest('.tag-picker')) setShowTagPicker(false);
    };
    if (showMenu || showFolderPicker || showTagPicker) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMenu, showFolderPicker, showTagPicker]);

  const insertMarkdown = (before: string, after = '') => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.substring(start, end);
    const insertion = before + selected + after;
    setContent(content.substring(0, start) + insertion + content.substring(end));
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 0);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const apiBase = `/api/workspaces/${scopeId}/knowledge`;
      const url = editId ? `${apiBase}/${editId}` : apiBase;
      const res = await fetch(url, {
        method: editId ? 'PUT' : 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'text',
          content,
          label: title.trim() || 'Untitled',
          sourceUrl: sourceUrl || undefined,
          folderId: selectedFolderId || undefined,
          tags: selectedTags,
          status,
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${scopeId}/knowledge`] });
      toast({ title: editId ? 'Saved' : 'Created', variant: 'success' });
      if (!editId) onSave();
    },
    onError: () => toast({ title: 'Failed to save', variant: 'destructive' }),
  });

  const renderedHtml = preview ? DOMPurify.sanitize(marked.parse(content) as string) : '';

  const toolbar = [
    { icon: Bold, action: () => insertMarkdown('**', '**'), label: 'Bold' },
    { icon: Italic, action: () => insertMarkdown('_', '_'), label: 'Italic' },
    { icon: Heading1, action: () => insertMarkdown('\n# ', '\n'), label: 'H1' },
    { icon: Heading2, action: () => insertMarkdown('\n## ', '\n'), label: 'H2' },
    { icon: Heading3, action: () => insertMarkdown('\n### ', '\n'), label: 'H3' },
    { icon: List, action: () => insertMarkdown('\n- '), label: 'Bullet list' },
    { icon: ListOrdered, action: () => insertMarkdown('\n1. '), label: 'Numbered list' },
    { icon: Quote, action: () => insertMarkdown('\n> '), label: 'Quote' },
    { icon: Code, action: () => insertMarkdown('`', '`'), label: 'Code' },
    { icon: Link, action: () => insertMarkdown('[', '](url)'), label: 'Link' },
  ];

  return (
    <AppPage>
      <ContentPanel
        header={
          <PageHeader
            title={title || 'Untitled'}
            leading={
              <Button design="ghost" size="sm" onClick={onCancel} className="shrink-0">
                <ArrowLeft size={14} strokeWidth={1.5} />
              </Button>
            }
            actions={
              <div className="flex items-center gap-1">
                <Button
                  size="xs"
                  design="ghost"
                  onClick={() => setStatusIdx(i => (i + 1) % 3)}
                  className="capitalize"
                  style={{ color: STATUS_COLORS[status] }}
                >
                  {status}
                </Button>
                <span className="text-[11px] text-fg-subtle hidden sm:inline mr-1">{editId ? 'Editing' : 'Creating'}</span>
                <Button
                  size="sm"
                  design={preview ? 'secondary' : 'ghost'}
                  onClick={() => setPreview(v => !v)}
                >
                  {preview ? <Edit3 size={13} strokeWidth={1.5} /> : <Eye size={13} strokeWidth={1.5} />}
                  {preview ? 'Edit' : 'Preview'}
                </Button>
                <Button size="xs" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Save size={13} strokeWidth={1.75} />
                  )}
                  {editId ? 'Save' : 'Create'}
                </Button>
                <div ref={menuRef} className="relative">
                  <Button design="ghost" size="sm" onClick={() => setShowMenu(v => !v)}>
                    <MoreHorizontal size={14} strokeWidth={1.5} />
                  </Button>
                  {showMenu && (
                    <div className="absolute right-0 top-full mt-1 w-[180px] bg-background border border-border/60 rounded-[8px] shadow-lg py-1 z-50">
                      <button onClick={() => { setShowUrlInput(v => !v); setShowMenu(false); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-[13px] hover:bg-[hsl(var(--surface-hover))]">
                        <Globe size={12} strokeWidth={1.5} /> {sourceUrl ? 'Edit source URL' : 'Add source URL'}
                      </button>
                      {editId && (
                        <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast({ title: 'Link copied' }); setShowMenu(false); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-[13px] hover:bg-[hsl(var(--surface-hover))]">
                          <Copy size={12} strokeWidth={1.5} /> Copy link
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            }
          />
        }
      >
        <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[720px] px-6 py-8">
          {/* Title */}
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Untitled"
            className="w-full text-[28px] font-semibold text-foreground bg-transparent outline-none placeholder:text-fg-subtle mb-4"
          />

          {/* Meta bar */}
          <div className="flex items-center gap-2 mb-6 text-[12px] text-fg-muted flex-wrap">
            {showUrlInput && (
              <input
                value={sourceUrl}
                onChange={e => setSourceUrl(e.target.value)}
                placeholder="https://..."
                className="text-[12px] px-2 py-1 bg-[hsl(var(--surface-muted))] rounded border border-border/60 outline-none w-[250px]"
                autoFocus
              />
            )}
            {sourceUrl && !showUrlInput && (
              <button onClick={() => setShowUrlInput(true)} className="flex items-center gap-1 text-brand hover:underline">
                <Globe size={11} strokeWidth={1.5} /> {sourceUrl}
              </button>
            )}

            <div className="relative folder-picker">
              <button
                onClick={() => setShowFolderPicker(v => !v)}
                className="px-2 py-0.5 rounded hover:bg-[hsl(var(--surface-hover))]"
              >
                {selectedFolderId ? folders.find(f => f.id === selectedFolderId)?.name || 'Folder' : 'No folder'}
              </button>
              {showFolderPicker && (
                <div className="absolute top-full left-0 mt-1 w-[180px] bg-background border border-border/60 rounded-[8px] shadow-lg py-1 z-50 max-h-[200px] overflow-y-auto">
                  <button onClick={() => { setSelectedFolderId(null); setShowFolderPicker(false); }} className="w-full text-left px-3 py-1.5 text-[13px] hover:bg-[hsl(var(--surface-hover))]">No folder</button>
                  {folders.map(f => (
                    <button key={f.id} onClick={() => { setSelectedFolderId(f.id); setShowFolderPicker(false); }} className="w-full text-left px-3 py-1.5 text-[13px] hover:bg-[hsl(var(--surface-hover))]">{f.name}</button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative tag-picker">
              <button
                onClick={() => setShowTagPicker(v => !v)}
                className="px-2 py-0.5 rounded hover:bg-[hsl(var(--surface-hover))]"
              >
                {selectedTags.length > 0 ? `${selectedTags.length} tag(s)` : 'Add tags'}
              </button>
              {showTagPicker && (
                <div className="absolute top-full left-0 mt-1 w-[200px] bg-background border border-border/60 rounded-[8px] shadow-lg py-1 z-50 max-h-[200px] overflow-y-auto">
                  {allTags.filter(t => !selectedTags.includes(t.name)).map(tag => (
                    <button key={tag.id} onClick={() => { setSelectedTags(prev => [...prev, tag.name]); }} className="w-full text-left px-3 py-1.5 text-[13px] hover:bg-[hsl(var(--surface-hover))]">+ {tag.name}</button>
                  ))}
                  {selectedTags.map(tag => (
                    <button key={tag} onClick={() => { setSelectedTags(prev => prev.filter(t => t !== tag)); }} className="w-full text-left px-3 py-1.5 text-[13px] text-[hsl(var(--danger))] hover:bg-red-50">− {tag}</button>
                  ))}
                  {allTags.length === 0 && selectedTags.length === 0 && <div className="px-3 py-1.5 text-[12px] text-fg-subtle">No tags</div>}
                </div>
              )}
              {selectedTags.map(tag => (
                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-[hsl(var(--surface-muted))] text-fg-subtle border border-border/40">{tag}</span>
              ))}
            </div>
          </div>

          {/* Toolbar */}
          {!preview && (
            <div className="flex items-center gap-0.5 mb-3 p-1 rounded-[8px] bg-[hsl(var(--surface-muted))] border border-border/40 w-fit">
              {toolbar.map(t => (
                <button
                  key={t.label}
                  onClick={t.action}
                  className="p-1.5 rounded hover:bg-[hsl(var(--surface-hover))] text-fg-muted hover:text-foreground transition-colors"
                  title={t.label}
                >
                  <t.icon size={14} strokeWidth={1.5} />
                </button>
              ))}
            </div>
          )}

          {/* Content area */}
          {preview ? (
            <div
              className="prose prose-sm max-w-none text-[14px] leading-relaxed min-h-[400px]"
              dangerouslySetInnerHTML={{ __html: renderedHtml }}
            />
          ) : (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Start writing in markdown..."
              className="w-full min-h-[400px] text-[14px] leading-relaxed bg-transparent outline-none resize-none placeholder:text-fg-subtle font-mono"
            />
          )}
        </div>
      </div>
      </ContentPanel>
    </AppPage>
  );
}
