import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useWorkspace } from '@/contexts/workspace-context';
import { useToast } from '@/hooks/use-toast';
import type { KnowledgeItem, KnowledgeFolder, KnowledgeTag, KnowledgeItemType, FolderTreeNode, KnowledgeStats } from './types';

interface KnowledgeContextType {
  scopeId: string;
  folders: KnowledgeFolder[];
  items: KnowledgeItem[];
  tags: KnowledgeTag[];
  stats: KnowledgeStats | null;
  selectedFolderId: string | null;
  setSelectedFolderId: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterType: FilterType;
  setFilterType: (t: FilterType) => void;
  selectedItemIds: Set<string>;
  toggleSelectItem: (id: string) => void;
  clearSelection: () => void;
  filteredItems: KnowledgeItem[];
  tree: FolderTreeNode[];
  navigateToNew: (type: KnowledgeItemType, folderId?: string | null) => void;
  createFolder: (name: string, parentId?: string | null) => void;
  renameFolder: (folderId: string, name: string) => void;
  deleteFolder: (folderId: string) => void;
  moveItem: (itemId: string, targetFolderId: string | null) => void;
  deleteItems: (itemIds: string[]) => void;
  toggleFavorite: (itemId: string) => void;
  updateItemStatus: (itemId: string, status: string) => void;
  isLoading: boolean;
}

type FilterType = 'all' | KnowledgeItemType;

const KnowledgeContext = createContext<KnowledgeContextType | null>(null);

export function KnowledgeProvider({ children }: { children: React.ReactNode }) {
  const { activeWorkspaceId } = useWorkspace();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const scopeId = activeWorkspaceId!;

  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

  const apiBase = `/api/workspaces/${scopeId}/knowledge`;
  const folderApiBase = `/api/workspaces/${scopeId}/folders`;
  const tagsApiBase = `/api/workspaces/${scopeId}/tags`;

  const { data: knowledgeData, isLoading } = useQuery<{ knowledge: KnowledgeItem[] }>({
    queryKey: [apiBase, 'all'],
    queryFn: async () => {
      const res = await fetch(apiBase, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch knowledge items');
      return res.json();
    },
    enabled: !!scopeId,
  });

  const { data: foldersData } = useQuery<{ folders: KnowledgeFolder[] }>({
    queryKey: [folderApiBase],
    queryFn: async () => {
      const res = await fetch(folderApiBase, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch folders');
      return res.json();
    },
    enabled: !!scopeId,
  });

  const { data: tagsData } = useQuery<{ tags: KnowledgeTag[] }>({
    queryKey: [tagsApiBase],
    queryFn: async () => {
      const res = await fetch(tagsApiBase, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch tags');
      return res.json();
    },
    enabled: !!scopeId,
  });

  const { data: statsData } = useQuery<{ stats: KnowledgeStats }>({
    queryKey: [apiBase, 'stats'],
    queryFn: async () => {
      const res = await fetch(`${apiBase}/stats`, { credentials: 'include' });
      if (!res.ok) return { stats: null };
      return res.json();
    },
    enabled: !!scopeId,
  });

  const folders = foldersData?.folders ?? [];
  const items = knowledgeData?.knowledge ?? [];
  const tags = tagsData?.tags ?? [];
  const stats = statsData?.stats ?? null;

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [apiBase] });
    queryClient.invalidateQueries({ queryKey: [folderApiBase] });
    queryClient.invalidateQueries({ queryKey: [tagsApiBase] });
  }, [queryClient, apiBase, folderApiBase, tagsApiBase]);

  const createFolderMutation = useMutation({
    mutationFn: async ({ name, parentId }: { name: string; parentId?: string | null }) => {
      const res = await fetch(folderApiBase, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, parentId: parentId || undefined }),
      });
      if (!res.ok) throw new Error('Failed to create folder');
      return res.json();
    },
    onSuccess: () => { invalidateAll(); toast({ title: 'Folder created' }); },
    onError: () => toast({ title: 'Failed to create folder', variant: 'destructive' }),
  });

  const renameFolderMutation = useMutation({
    mutationFn: async ({ folderId, name }: { folderId: string; name: string }) => {
      const res = await fetch(`${folderApiBase}/${folderId}`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error('Failed to rename folder');
      return res.json();
    },
    onSuccess: () => { invalidateAll(); toast({ title: 'Folder renamed' }); },
    onError: () => toast({ title: 'Failed to rename folder', variant: 'destructive' }),
  });

  const deleteFolderMutation = useMutation({
    mutationFn: async (folderId: string) => {
      const res = await fetch(`${folderApiBase}/${folderId}`, {
        method: 'DELETE', credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to delete folder');
      return res.json();
    },
    onSuccess: () => { invalidateAll(); toast({ title: 'Folder deleted' }); },
    onError: () => toast({ title: 'Failed to delete folder', variant: 'destructive' }),
  });

  const moveItemMutation = useMutation({
    mutationFn: async ({ itemId, targetFolderId }: { itemId: string; targetFolderId: string | null }) => {
      const res = await fetch(`${apiBase}/${itemId}`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId: targetFolderId || undefined }),
      });
      if (!res.ok) throw new Error('Failed to move item');
      return res.json();
    },
    onSuccess: () => { invalidateAll(); toast({ title: 'Item moved' }); },
    onError: () => toast({ title: 'Failed to move item', variant: 'destructive' }),
  });

  const deleteItemsMutation = useMutation({
    mutationFn: async (itemIds: string[]) => {
      const res = await fetch(`${apiBase}/batch/delete`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: itemIds }),
      });
      if (!res.ok) throw new Error('Failed to delete items');
      return res.json();
    },
    onSuccess: (_, ids) => { invalidateAll(); setSelectedItemIds(new Set()); toast({ title: `${ids.length} item(s) deleted` }); },
    onError: () => toast({ title: 'Failed to delete items', variant: 'destructive' }),
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const res = await fetch(`${apiBase}/${itemId}/toggle-favorite`, {
        method: 'POST', credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to toggle favorite');
      return res.json();
    },
    onSuccess: () => invalidateAll(),
    onError: () => toast({ title: 'Failed to update favorite', variant: 'destructive' }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ itemId, status }: { itemId: string; status: string }) => {
      const res = await fetch(`${apiBase}/${itemId}`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      return res.json();
    },
    onSuccess: () => invalidateAll(),
    onError: () => toast({ title: 'Failed to update status', variant: 'destructive' }),
  });

  const buildTree = useCallback((folders: KnowledgeFolder[], parentId: string | null): FolderTreeNode[] => {
    return folders
      .filter(f => f.parentId === parentId)
      .map(f => {
        const itemCount = items.filter(i => i.folderId === f.id).length;
        return { ...f, itemCount, children: buildTree(folders, f.id) };
      });
  }, [items]);

  const tree = useMemo(() => buildTree(folders, null), [folders, buildTree]);

  const filteredItems = useMemo(() => {
    let result = items;
    if (selectedFolderId !== null) {
      result = result.filter(item => item.folderId === selectedFolderId);
    }
    if (filterType !== 'all') {
      result = result.filter(item => item.type === filterType);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item =>
        (item.label || item.fileName || '').toLowerCase().includes(q) ||
        (item.content || '').toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [items, selectedFolderId, filterType, searchQuery]);

  const navigateToNew = useCallback((type: KnowledgeItemType, folderId?: string | null) => {
    const fid = folderId ?? selectedFolderId;
    const params = new URLSearchParams();
    if (type !== 'text') params.set('type', type);
    if (fid) params.set('folderId', fid);
    navigate(`/home/knowledge/new${params.toString() ? `?${params}` : ''}`);
  }, [selectedFolderId, navigate]);

  const clearSelection = useCallback(() => setSelectedItemIds(new Set()), []);

  const toggleSelectItem = useCallback((id: string) => {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const contextValue: KnowledgeContextType = {
    scopeId,
    folders,
    items,
    tags,
    stats,
    selectedFolderId,
    setSelectedFolderId,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    selectedItemIds,
    toggleSelectItem,
    clearSelection,
    filteredItems,
    tree,
    navigateToNew,
    createFolder: (name, parentId) => createFolderMutation.mutate({ name, parentId }),
    renameFolder: (folderId, name) => renameFolderMutation.mutate({ folderId, name }),
    deleteFolder: (folderId) => deleteFolderMutation.mutate(folderId),
    moveItem: (itemId, targetFolderId) => moveItemMutation.mutate({ itemId, targetFolderId }),
    deleteItems: (itemIds) => deleteItemsMutation.mutate(itemIds),
    toggleFavorite: (itemId) => toggleFavoriteMutation.mutate(itemId),
    updateItemStatus: (itemId, status) => updateStatusMutation.mutate({ itemId, status }),
    isLoading,
  };

  return (
    <KnowledgeContext.Provider value={contextValue}>
      {children}
    </KnowledgeContext.Provider>
  );
}

export function useKnowledge() {
  const ctx = useContext(KnowledgeContext);
  if (!ctx) throw new Error('useKnowledge must be used within KnowledgeProvider');
  return ctx;
}
