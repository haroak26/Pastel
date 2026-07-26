export type KnowledgeItemType = 'text' | 'flow' | 'web_scrape';
export type KnowledgeStatus = 'draft' | 'published' | 'archived';
export type FilterType = 'all' | KnowledgeItemType;

export interface KnowledgeItem {
  id: string;
  type: KnowledgeItemType;
  content: string;
  fileName: string | null;
  label: string | null;
  sourceUrl: string | null;
  isFavorite: boolean;
  folderId: string | null;
  tags: string[];
  isProductContext: boolean;
  status: KnowledgeStatus;
  actions: KnowledgeAction[];
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
}

export interface KnowledgeFolder {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  itemCount?: number;
}

export interface FolderTreeNode extends KnowledgeFolder {
  children: FolderTreeNode[];
}

export interface KnowledgeTag {
  id: string;
  name: string;
  folderId: string | null;
}

export interface KnowledgeVersion {
  id: string;
  version: number;
  content: string;
  label: string | null;
  createdAt: string;
  createdBy: string | null;
}

export interface ActionStep {
  title: string;
  description?: string;
}

export interface KnowledgeAction {
  title: string;
  steps: ActionStep[];
}

export type FlowStepType = 'trigger' | 'condition' | 'action' | 'response' | 'delay';

export interface FlowStep {
  id: string;
  type: FlowStepType;
  title: string;
  description?: string;
  config?: Record<string, string>;
}

export interface FlowData {
  steps: FlowStep[];
}

export interface ExtractedPageResult {
  url: string;
  title: string;
  articleTitle: string;
  articleContent: string;
  summary: string;
  tags: string[];
  knowledgeId: string;
  error?: string;
}

export interface KnowledgeStats {
  totalItems: number;
  totalFolders: number;
  totalTags: number;
  favorites: number;
  published: number;
  drafts: number;
  archived: number;
}

export const ITEM_TYPE_CONFIG: Record<KnowledgeItemType, { label: string; color: string; icon: string }> = {
  text: { label: 'Article', color: '#4682B4', icon: 'FileText' },
  flow: { label: 'Flow', color: '#A78BFA', icon: 'Zap' },
  web_scrape: { label: 'Web Fetch', color: '#34D399', icon: 'Globe' },
};

export const FLOW_STEP_CONFIG: Record<FlowStepType, { label: string; color: string }> = {
  trigger: { label: 'Trigger', color: '#4682B4' },
  condition: { label: 'Condition', color: '#F59E0B' },
  action: { label: 'Action', color: '#34D399' },
  response: { label: 'Response', color: '#6366F1' },
  delay: { label: 'Delay', color: '#9CA3AF' },
};
