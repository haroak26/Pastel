import { useQuery } from '@tanstack/react-query';
import { useWorkspace } from '@/contexts/workspace-context';
import { KnowledgeEditor } from '@/components/knowledge/editor/KnowledgeEditor';
import { KnowledgeFlowDesigner } from '@/components/knowledge/editor/KnowledgeFlowDesigner';
import { WebFetch } from '@/components/knowledge/editor/WebFetch';

export function EditorContent() {
  const { activeWorkspaceId } = useWorkspace();
  const scopeId = activeWorkspaceId!;
  const params = new URLSearchParams(window.location.search);
  const type = (params.get('type') as 'text' | 'flow' | 'web_scrape') || 'text';
  const folderId = params.get('folderId');

  const pathParts = window.location.pathname.split('/');
  const editId = pathParts[pathParts.length - 1] !== 'new' ? pathParts[pathParts.length - 1] : undefined;

  const { data: itemData, isLoading } = useQuery({
    queryKey: [`/api/workspaces/${scopeId}/knowledge/${editId}`],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${scopeId}/knowledge/${editId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    enabled: !!editId && !!scopeId,
  });

  const itemType = editId ? (itemData?.type || type) : type;

  const handleSave = () => {
    window.location.href = '/home/knowledge';
  };

  const handleCancel = () => {
    window.history.back();
  };

  const wrap = (children: React.ReactNode) => (
    <div className="ml-0 mt-3 flex flex-1 min-h-0">
      <div className="flex-1 min-w-0 bg-background md:border md:border-border/60 md:rounded-tl-[16px] flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );

  if (editId && isLoading) {
    return wrap(
      <div className="flex items-center justify-center h-full">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-fg-muted border-t-transparent" />
      </div>
    );
  }

  const initialData = editId && itemData ? {
    title: itemData.label || itemData.fileName || '',
    content: itemData.content || '',
    folderId: itemData.folderId,
    tags: itemData.tags || [],
    sourceUrl: itemData.sourceUrl,
    status: itemData.status || 'draft',
  } : folderId ? { folderId } : undefined;

  if (itemType === 'flow') {
    return wrap(
      <KnowledgeFlowDesigner
        scopeId={scopeId}
        onSave={handleSave}
        onCancel={handleCancel}
        editId={editId}
        initialData={initialData ? {
          title: initialData.title,
          steps: initialData.content ? JSON.parse(initialData.content).steps : undefined,
          folderId: initialData.folderId,
        } : undefined}
      />
    );
  }

  if (itemType === 'web_scrape') {
    return wrap(
      <WebFetch
        scopeId={scopeId}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <KnowledgeEditor
      scopeId={scopeId}
      onSave={handleSave}
      onCancel={handleCancel}
      editId={editId}
      initialData={initialData}
    />
  );
}

export default function KnowledgeEditorPage() {
  return <EditorContent />;
}
