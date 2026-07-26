import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ListChecks, Plus, X, Trash2, AlertCircle, ArrowUp, ArrowDown, Dot,
  Bug, Lightbulb, MessageSquare, HelpCircle, Sparkles, Search, GripVertical,
  Calendar, User as UserIcon, ChevronDown, MoreHorizontal, SlidersHorizontal,
  Tags, Clock, ChevronsUpDown,
} from 'lucide-react';
import { DndContext, DragOverlay, useDraggable, useDroppable, PointerSensor, KeyboardSensor, useSensor, useSensors, rectIntersection, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { AppPage, ContentPanel, EmptyState, StatusBadge, Dropdown, OptionsSelector, PageHeader } from '@/components/ds';
import { Button, IconButton } from '@/components/button';
import { TextInput, Textarea } from '@/components/text-input';

type Assignee = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
};

type Task = {
  id: string;
  userId: string;
  ticketId: string | null;
  masterTag: string;
  name: string;
  description: string | null;
  status: string;
  priority: string;
  rank: number;
  assigneeId: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
};

const COLUMNS = ['pending', 'reviewing', 'planned', 'in_progress', 'completed'] as const;

const COLUMN_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: '#6b7280' },
  reviewing: { label: 'Reviewing', color: '#f59e0b' },
  planned: { label: 'Planned', color: '#8b5cf6' },
  in_progress: { label: 'In Progress', color: '#4682B4' },
  completed: { label: 'Completed', color: '#10b981' },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string; icon: typeof ArrowUp }> = {
  urgent: { label: 'Urgent', color: '#ef4444', icon: AlertCircle },
  high: { label: 'High', color: '#f59e0b', icon: ArrowUp },
  medium: { label: 'Medium', color: '#4682B4', icon: Dot },
  low: { label: 'Low', color: '#9ca3af', icon: ArrowDown },
};

const TAG_CONFIG: Record<string, { label: string; color: string; icon: typeof Bug }> = {
  bug: { label: 'Bug', color: '#ef4444', icon: Bug },
  feature: { label: 'Feature', color: '#8b5cf6', icon: Lightbulb },
  improvement: { label: 'Improvement', color: '#06b6d4', icon: Sparkles },
  task: { label: 'Task', color: '#6b7280', icon: MessageSquare },
  question: { label: 'Question', color: '#f59e0b', icon: HelpCircle },
};

const PRIORITY_OPTIONS = ['all', 'urgent', 'high', 'medium', 'low'] as const;
const TAG_OPTIONS = ['all', ...Object.keys(TAG_CONFIG)] as const;
const DUE_OPTIONS = ['all', 'overdue', 'today', 'this_week', 'none'] as const;
const SORT_OPTIONS = [
  { value: 'manual', label: 'Manual' },
  { value: 'due', label: 'Due date' },
  { value: 'priority', label: 'Priority' },
  { value: 'created', label: 'Newest' },
] as const;

const PRIORITY_RANK: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfD = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.floor((startOfToday - startOfD) / 86400000);
  if (diffDays <= 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatDueDate(dateStr: string): { text: string; tone: 'overdue' | 'today' | 'soon' | 'muted' } {
  const d = new Date(dateStr);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfD = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.floor((startOfD - startOfToday) / 86400000);
  if (diffDays < 0) return { text: `${Math.abs(diffDays)}d overdue`, tone: 'overdue' };
  if (diffDays === 0) return { text: 'Today', tone: 'today' };
  if (diffDays === 1) return { text: 'Tomorrow', tone: 'soon' };
  if (diffDays < 7) return { text: `In ${diffDays}d`, tone: 'soon' };
  return { text: d.toLocaleDateString([], { month: 'short', day: 'numeric' }), tone: 'muted' };
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const DUE_TONE_CLASS: Record<string, string> = {
  overdue: 'text-danger',
  today: 'text-warning',
  soon: 'text-fg-muted',
  muted: 'text-fg-faint',
};

function Avatar({ assignee, size = 18 }: { assignee: Assignee | null; size?: number }) {
  if (!assignee) {
    return (
      <div
        className="flex items-center justify-center rounded-full border border-dashed border-border-strong text-fg-faint shrink-0"
        style={{ width: size, height: size }}
        title="Unassigned"
      >
        <UserIcon size={size * 0.5} />
      </div>
    );
  }
  if (assignee.avatarUrl) {
    return (
      <img
        src={assignee.avatarUrl}
        alt={assignee.name}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
        title={assignee.name}
      />
    );
  }
  return (
    <div
      className="flex items-center justify-center rounded-full bg-surface-hover text-fg-muted font-semibold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      title={assignee.name}
    >
      {getInitials(assignee.name)}
    </div>
  );
}

function DraggableTaskCard({ task, assignee }: { task: Task; assignee: Assignee | null }) {
  const { attributes, listeners, setNodeRef, transform, isDragging: isDraggingSelf } = useDraggable({
    id: task.id,
    data: { task },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDraggingSelf ? 50 : undefined,
    opacity: isDraggingSelf ? 0 : undefined,
  } : undefined;

  const priority = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.medium;
  const tag = TAG_CONFIG[task.masterTag] ?? TAG_CONFIG.task;
  const PriorityIcon = priority.icon;
  const TagIcon = tag.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group/card relative cursor-grab active:cursor-grabbing touch-none border-b border-border-subtle last:border-b-0 px-3 py-2.5 transition-colors hover:bg-surface-hover/50"
    >
      <div className="flex items-start gap-2">
        <TagIcon size={11} strokeWidth={2.25} className="mt-0.5 shrink-0" style={{ color: tag.color }} />
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] font-medium leading-snug text-foreground line-clamp-2">{task.name}</p>
          {task.description && (
            <p className="mt-0.5 truncate text-[11.5px] leading-snug text-fg-muted">{task.description}</p>
          )}
          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
            <span
              className="inline-flex items-center gap-0.5 rounded-[4px] px-1 py-px text-[9.5px] font-semibold uppercase tracking-wide"
              style={{ background: `${priority.color}14`, color: priority.color }}
            >
              <PriorityIcon size={8} strokeWidth={2.5} />
              {priority.label}
            </span>
            {task.dueDate && (
              <span className={cn('inline-flex items-center gap-0.5 text-[10px] font-medium tabular-nums', DUE_TONE_CLASS[formatDueDate(task.dueDate).tone])}>
                <Calendar size={9} strokeWidth={2} />
                {formatDueDate(task.dueDate).text}
              </span>
            )}
            <span className="ml-auto">
              <Avatar assignee={assignee} size={16} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DroppableColumn({ status, tasks, assigneeMap, onAdd, onDelete }: {
  status: string;
  tasks: Task[];
  assigneeMap: Record<string, Assignee>;
  onAdd: () => void;
  onDelete: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const config = COLUMN_CONFIG[status] ?? COLUMN_CONFIG.pending;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex h-full min-w-0 flex-1 flex-col border-r border-border-subtle last:border-r-0 transition-colors',
        isOver && 'bg-surface-hover/30',
      )}
    >
      <div className="sticky top-0 z-10 flex items-center justify-between bg-background/95 backdrop-blur px-3 py-2 border-b border-border-subtle">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: config.color }} />
          <span className="text-[12px] font-semibold text-foreground truncate">{config.label}</span>
          <span className="text-[11px] font-medium tabular-nums text-fg-faint shrink-0">{tasks.length}</span>
        </div>
        <IconButton
          icon={Plus}
          size="xs"
          design="ghost"
          onClick={onAdd}
          className="!h-5 !w-5 !rounded-[6px] text-fg-faint hover:text-foreground"
        />
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto">
        {tasks.length === 0 && (
          <div className="flex flex-1 items-center justify-center px-3 py-8">
            <p className="text-center text-[11px] text-fg-faint">Drop tasks here</p>
          </div>
        )}
        {tasks.map(task => (
          <div key={task.id} className="group/row relative">
            <DraggableTaskCard task={task} assignee={task.assigneeId ? assigneeMap[task.assigneeId] ?? null : null} />
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
              className="absolute right-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-[5px] text-fg-faint opacity-0 transition-all hover:bg-danger/5 hover:text-danger group-hover/row:opacity-100 bg-transparent border-none cursor-pointer"
            >
              <Trash2 size={11} />
            </button>
          </div>
        ))}
        <div className="h-2 shrink-0" />
      </div>
    </div>
  );
}

function DragOverlayCard({ task, assignee }: { task: Task; assignee: Assignee | null }) {
  const priority = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.medium;
  const tag = TAG_CONFIG[task.masterTag] ?? TAG_CONFIG.task;
  const TagIcon = tag.icon;
  const PriorityIcon = priority.icon;

  return (
    <div className="w-full border-b border-border-subtle bg-background px-3 py-2.5 shadow-lg ring-1 ring-brand/10">
      <div className="flex items-start gap-2">
        <TagIcon size={11} strokeWidth={2.25} className="mt-0.5 shrink-0" style={{ color: tag.color }} />
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] font-medium leading-snug text-foreground line-clamp-2">{task.name}</p>
          {task.description && (
            <p className="mt-0.5 truncate text-[11.5px] leading-snug text-fg-muted">{task.description}</p>
          )}
          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
            <span
              className="inline-flex items-center gap-0.5 rounded-[4px] px-1 py-px text-[9.5px] font-semibold uppercase tracking-wide"
              style={{ background: `${priority.color}14`, color: priority.color }}
            >
              <PriorityIcon size={8} strokeWidth={2.5} />
              {priority.label}
            </span>
            {task.dueDate && (
              <span className={cn('inline-flex items-center gap-0.5 text-[10px] font-medium tabular-nums', DUE_TONE_CLASS[formatDueDate(task.dueDate).tone])}>
                <Calendar size={9} strokeWidth={2} />
                {formatDueDate(task.dueDate).text}
              </span>
            )}
            <span className="ml-auto">
              <Avatar assignee={assignee} size={16} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}


function NewTaskForm({ onClose, onCreated, defaultStatus, assignees }: {
  onClose: () => void;
  onCreated: () => void;
  defaultStatus?: string;
  assignees: Assignee[];
}) {
  const [form, setForm] = useState<{
    name: string;
    description: string;
    masterTag: string;
    priority: string;
    status: string;
    assigneeId: string;
    dueDate: string;
  }>({
    name: '',
    description: '',
    masterTag: 'task',
    priority: 'medium',
    status: defaultStatus ?? 'pending',
    assigneeId: '',
    dueDate: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError('Name is required'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          masterTag: form.masterTag,
          priority: form.priority,
          status: form.status,
          assigneeId: form.assigneeId || null,
          dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
        }),
      });
      if (!res.ok) { setError('Failed to create task'); return; }
      onCreated();
      onClose();
    } catch {
      setError('Failed to create task');
    } finally {
      setSaving(false);
    }
  };

  const assigneeOptions = [
    { value: '', label: 'Unassigned' },
    ...assignees.map(a => ({ value: a.id, label: a.name })),
  ];

  return (
    <div className="space-y-4 p-5">
      <TextInput
        ref={inputRef}
        placeholder="Task name"
        value={form.name}
        onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
        size="md"
        className="text-[14px]"
      />
      <Textarea
        placeholder="Add a description…"
        value={form.description}
        onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
        rows={3}
      />

      <div className="space-y-2.5">
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-fg-faint">Tag</label>
          <OptionsSelector
            options={Object.entries(TAG_CONFIG).map(([key, cfg]) => ({ value: key, label: cfg.label }))}
            value={form.masterTag}
            onChange={v => setForm(prev => ({ ...prev, masterTag: v }))}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-fg-faint">Priority</label>
          <OptionsSelector
            options={Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => ({ value: key, label: cfg.label }))}
            value={form.priority}
            onChange={v => setForm(prev => ({ ...prev, priority: v }))}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-fg-faint">Status</label>
          <OptionsSelector
            options={COLUMNS.map(s => ({ value: s, label: COLUMN_CONFIG[s].label }))}
            value={form.status}
            onChange={v => setForm(prev => ({ ...prev, status: v }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-fg-faint">Assignee</label>
            <Dropdown
              value={form.assigneeId}
              onChange={v => setForm(prev => ({ ...prev, assigneeId: v }))}
              options={assigneeOptions}
              placeholder="Unassigned"
              searchable
              searchPlaceholder="Search people…"
              showChevron
              menuAlign="left"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-fg-faint">Due date</label>
            <TextInput
              type="date"
              value={form.dueDate}
              onChange={e => setForm(prev => ({ ...prev, dueDate: e.target.value }))}
              size="md"
              className="text-[13px]"
            />
          </div>
        </div>
      </div>

      {error && <p className="text-[12px] text-danger">{error}</p>}
      <div className="flex items-center justify-end gap-2 pt-1">
        <Button design="ghost" size="sm" onClick={onClose}>Cancel</Button>
        <Button design="primary" size="sm" onClick={handleSubmit} isLoading={saving} icon={Plus}>
          Create task
        </Button>
      </div>
    </div>
  );
}

const MOCK_TASKS: Task[] = import.meta.env.DEV ? [
  { id: 'mock-1', userId: '', ticketId: null, masterTag: 'bug', name: 'Login page broken on Safari', description: 'Users report the login button does nothing on Safari 17', status: 'in_progress', priority: 'urgent', rank: 2000, assigneeId: null, dueDate: new Date(Date.now() + 86400000).toISOString(), createdAt: new Date(Date.now() - 3600000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'mock-2', userId: '', ticketId: null, masterTag: 'feature', name: 'Dark mode toggle', description: 'Add a theme toggle to the settings panel', status: 'planned', priority: 'medium', rank: 1000, assigneeId: null, dueDate: null, createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'mock-3', userId: '', ticketId: null, masterTag: 'improvement', name: 'Optimize image loading', description: 'Implement lazy loading for gallery images', status: 'reviewing', priority: 'high', rank: 1500, assigneeId: null, dueDate: new Date(Date.now() + 432000000).toISOString(), createdAt: new Date(Date.now() - 172800000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'mock-4', userId: '', ticketId: null, masterTag: 'task', name: 'Update dependencies', description: 'Bump all npm packages to latest semver', status: 'pending', priority: 'low', rank: 500, assigneeId: null, dueDate: null, createdAt: new Date(Date.now() - 259200000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'mock-5', userId: '', ticketId: null, masterTag: 'question', name: 'API rate limit docs unclear', description: 'Customers asking about the 429 response — needs better docs', status: 'pending', priority: 'medium', rank: 1000, assigneeId: null, dueDate: new Date(Date.now() - 86400000).toISOString(), createdAt: new Date(Date.now() - 345600000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'mock-6', userId: '', ticketId: null, masterTag: 'bug', name: 'Notifications not sending', description: 'Push notifications fail silently on Android', status: 'in_progress', priority: 'urgent', rank: 3000, assigneeId: null, dueDate: new Date(Date.now() + 7200000).toISOString(), createdAt: new Date(Date.now() - 7200000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'mock-7', userId: '', ticketId: null, masterTag: 'feature', name: 'Export to CSV', description: 'Allow users to export their data as CSV files', status: 'planned', priority: 'low', rank: 500, assigneeId: null, dueDate: null, createdAt: new Date(Date.now() - 432000000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'mock-8', userId: '', ticketId: null, masterTag: 'improvement', name: 'Reduce bundle size', description: 'Code-split route components to reduce initial JS payload', status: 'reviewing', priority: 'medium', rank: 2000, assigneeId: null, dueDate: null, createdAt: new Date(Date.now() - 216000000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'mock-9', userId: '', ticketId: null, masterTag: 'task', name: 'Write integration tests for checkout', description: 'Cover the full purchase flow with Playwright', status: 'pending', priority: 'high', rank: 2500, assigneeId: null, dueDate: new Date(Date.now() + 604800000).toISOString(), createdAt: new Date(Date.now() - 604800000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'mock-10', userId: '', ticketId: null, masterTag: 'bug', name: 'Search returns 500 on special chars', description: 'Querying with & or % crashes the search endpoint', status: 'completed', priority: 'high', rank: 1000, assigneeId: null, dueDate: null, createdAt: new Date(Date.now() - 1209600000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'mock-11', userId: '', ticketId: null, masterTag: 'feature', name: 'Multi-workspace support', description: 'Allow users to belong to multiple workspaces', status: 'completed', priority: 'medium', rank: 2000, assigneeId: null, dueDate: null, createdAt: new Date(Date.now() - 1814400000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'mock-12', userId: '', ticketId: null, masterTag: 'improvement', name: 'Keyboard shortcuts cheat sheet', description: 'Add a ? shortcut to show all available keyboard shortcuts', status: 'completed', priority: 'low', rank: 500, assigneeId: null, dueDate: null, createdAt: new Date(Date.now() - 2419200000).toISOString(), updatedAt: new Date().toISOString() },
] : [];

export default function Tasks() {
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');
  const [dueFilter, setDueFilter] = useState<string>('all');
  const [sort, setSort] = useState<string>('manual');
  const [activeDragTask, setActiveDragTask] = useState<Task | null>(null);
  const [creatingOpen, setCreatingOpen] = useState(false);
  const [creatingColumn, setCreatingColumn] = useState<string | null>(null);
  const [searchVisible, setSearchVisible] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const { data, isLoading } = useQuery<{ tasks: Task[]; total: number }>({
    queryKey: ['/api/tasks'],
    queryFn: async () => {
      const res = await fetch('/api/tasks?limit=200', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch tasks');
      return res.json();
    },
    retry: false,
  });

  const { data: assigneesData } = useQuery<{ assignees: Assignee[] }>({
    queryKey: ['/api/tasks/assignees'],
    queryFn: async () => {
      const res = await fetch('/api/tasks/assignees', { credentials: 'include' });
      if (!res.ok) return { assignees: [] };
      return res.json();
    },
    retry: false,
  });

  const assigneeMap = useMemo(() => {
    const map: Record<string, Assignee> = {};
    for (const a of assigneesData?.assignees ?? []) map[a.id] = a;
    return map;
  }, [assigneesData]);

  const tasks = useMemo(() => {
    const apiTasks = data?.tasks ?? [];
    return apiTasks.length > 0 ? apiTasks : MOCK_TASKS;
  }, [data]);

  const grouped = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const col of COLUMNS) map[col] = [];

    let filtered = tasks;
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(t => t.name.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q));
    }
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(t => t.priority === priorityFilter);
    }
    if (tagFilter !== 'all') {
      filtered = filtered.filter(t => t.masterTag === tagFilter);
    }
    if (dueFilter !== 'all') {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      filtered = filtered.filter(t => {
        if (!t.dueDate) return dueFilter === 'none';
        const startOfD = new Date(t.dueDate).getTime();
        const diffDays = Math.floor((startOfD - startOfToday) / 86400000);
        if (dueFilter === 'overdue') return diffDays < 0;
        if (dueFilter === 'today') return diffDays === 0;
        if (dueFilter === 'this_week') return diffDays >= 0 && diffDays <= 7;
        return false;
      });
    }

    for (const task of filtered) {
      const status = COLUMNS.includes(task.status as any) ? task.status : 'pending';
      map[status].push(task);
    }

    for (const col of COLUMNS) {
      if (sort === 'due') {
        map[col].sort((a, b) => {
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });
      } else if (sort === 'priority') {
        map[col].sort((a, b) => (PRIORITY_RANK[a.priority] ?? 99) - (PRIORITY_RANK[b.priority] ?? 99));
      } else if (sort === 'created') {
        map[col].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } else {
        map[col].sort((a, b) => a.rank - b.rank || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    }

    return map;
  }, [tasks, search, priorityFilter, tagFilter, dueFilter, sort]);

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
  }, [queryClient]);

  const totalCount = tasks.length;
  const openCount = useMemo(() => tasks.filter(t => t.status !== 'completed').length, [tasks]);
  const dueThisWeek = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return tasks.filter(t => {
      if (!t.dueDate) return false;
      const diffDays = Math.floor((new Date(t.dueDate).getTime() - startOfToday) / 86400000);
      return diffDays >= 0 && diffDays <= 7;
    }).length;
  }, [tasks]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const task = event.active.data.current?.task as Task | undefined;
    if (task) setActiveDragTask(task);
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveDragTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = String(active.id);
    const targetStatus = String(over.id);

    if (!COLUMNS.includes(targetStatus as any)) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    if (task.status === targetStatus) return;

    const targetTasks = grouped[targetStatus] ?? [];
    const newRank = targetTasks.length > 0
      ? targetTasks[targetTasks.length - 1].rank + 1000
      : 1000;

    const isMock = taskId.startsWith('mock-');

    const reorderPayload: { id: string; status: string; rank: number }[] = [
      { id: taskId, status: targetStatus, rank: newRank },
    ];
    const oldColTasks = grouped[task.status] ?? [];
    oldColTasks.filter(t => t.id !== taskId).forEach((t, i) => {
      reorderPayload.push({ id: t.id, status: t.status, rank: (i + 1) * 1000 });
    });

    const snapshot = data;
    queryClient.setQueryData<{ tasks: Task[]; total: number }>(['/api/tasks'], (prev) => {
      if (!prev) return prev;
      const rankMap = new Map(reorderPayload.map(r => [r.id, r]));
      return {
        ...prev,
        tasks: prev.tasks.map(t => {
          const r = rankMap.get(t.id);
          if (r) return { ...t, status: r.status, rank: r.rank };
          return t;
        }),
      };
    });

    if (isMock) return;

    try {
      await fetch('/api/tasks/reorder', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: reorderPayload }),
      });
      refetch();
    } catch {
      if (snapshot) queryClient.setQueryData(['/api/tasks'], snapshot);
    }
  }, [tasks, grouped, refetch, data, queryClient]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE', credentials: 'include' });
      refetch();
    } catch {}
  }, [refetch]);

  const subtitle = useMemo(() => {
    const parts: string[] = [];
    parts.push(`${openCount} open`);
    if (dueThisWeek > 0) parts.push(`${dueThisWeek} due this week`);
    return parts.join(' · ');
  }, [openCount, dueThisWeek]);

  const tagOptions = [
    { value: 'all', label: 'All tags' },
    ...Object.entries(TAG_CONFIG).map(([key, cfg]) => ({ value: key, label: cfg.label })),
  ];
  const dueOptions = [
    { value: 'all', label: 'Any due date' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'today', label: 'Due today' },
    { value: 'this_week', label: 'Due this week' },
    { value: 'none', label: 'No due date' },
  ];

  return (
    <AppPage>
      <ContentPanel
        header={
          <PageHeader
            title=""
            className="[&_.lds-app-topbar-row]:min-h-[32px] [&_.lds-app-topbar-row]:h-auto [&_.lds-app-topbar-row]:px-4 [&_.lds-app-topbar-row]:py-1 [&_.lds-app-title]:text-[14px]"
            leading={
              <div ref={searchRef} className="flex items-center flex-1 min-w-0">
                {searchVisible ? (
                  <div className="flex items-center gap-2 flex-1 min-w-0 animate-in fade-in slide-in-from-right-2 duration-200">
                    <Search size={13} className="text-fg-faint shrink-0" />
                    <TextInput
                      placeholder="Search tasks..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="flex-1 min-w-0 h-7 text-[13px] px-0 border-0 bg-transparent focus:ring-0"
                      autoFocus
                    />
                    {search && (
                      <button onClick={() => setSearch('')} className="inline-flex items-center justify-center h-5 w-5 rounded text-fg-faint hover:text-foreground hover:bg-surface-hover transition-colors border-none bg-transparent cursor-pointer"><X size={12} /></button>
                    )}
                  </div>
                ) : (
                  <span className="text-[14px] font-medium text-foreground animate-in fade-in duration-200">Tasks</span>
                )}
              </div>
            }
            actions={
              <div className="flex items-center gap-0.5 shrink-0">
                <button onClick={() => setSearchVisible(!searchVisible)} className="inline-flex items-center justify-center h-7 w-7 rounded-[8px] text-fg-muted hover:text-foreground hover:bg-surface-hover transition-colors border-none bg-transparent cursor-pointer">
                  {searchVisible ? <X size={14} /> : <Search size={14} />}
                </button>
                <Dropdown
                  value={tagFilter}
                  onChange={setTagFilter}
                  options={tagOptions}
                  menuAlign="right"
                  showChevron={false}
                  triggerClassName="!p-0 !border-none !bg-transparent"
                  renderTrigger={(selected, open) => (
                    <button className={cn('inline-flex items-center justify-center h-7 w-7 rounded-[8px] transition-colors border-none bg-transparent cursor-pointer', open ? 'bg-surface-hover text-foreground' : 'text-fg-muted hover:text-foreground hover:bg-surface-hover')}>
                      <Tags size={14} />
                    </button>
                  )}
                />
                <Dropdown
                  value={dueFilter}
                  onChange={setDueFilter}
                  options={dueOptions}
                  menuAlign="right"
                  showChevron={false}
                  triggerClassName="!p-0 !border-none !bg-transparent"
                  renderTrigger={(selected, open) => (
                    <button className={cn('inline-flex items-center justify-center h-7 w-7 rounded-[8px] transition-colors border-none bg-transparent cursor-pointer', open ? 'bg-surface-hover text-foreground' : 'text-fg-muted hover:text-foreground hover:bg-surface-hover')}>
                      <Calendar size={14} />
                    </button>
                  )}
                />
                <div ref={sortRef} className="relative">
                  <button onClick={() => setSortOpen(!sortOpen)} className={cn('inline-flex items-center justify-center h-7 w-7 rounded-[8px] transition-colors border-none bg-transparent cursor-pointer', sortOpen ? 'bg-surface-hover text-foreground' : 'text-fg-muted hover:text-foreground hover:bg-surface-hover')}>
                    <Clock size={14} />
                  </button>
                  {sortOpen && (
                    <div className="absolute right-0 top-full mt-1 z-50 min-w-[160px] bg-background border border-border/60 rounded-[12px] p-1.5 shadow-lg">
                      {SORT_OPTIONS.map(opt => (
                        <button key={opt.value} onClick={() => { setSort(opt.value); setSortOpen(false); }} className={cn('flex w-full items-center gap-2 px-2.5 py-1.5 rounded-[8px] text-left text-[13px] font-medium transition-colors border-none bg-transparent cursor-pointer', sort === opt.value ? 'bg-surface-hover text-foreground' : 'text-fg-muted hover:text-foreground hover:bg-surface-hover')}>
                          <ChevronsUpDown size={13} /> {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  design="primary"
                  size="sm"
                  icon={Plus}
                  onClick={() => { setCreatingColumn(null); setCreatingOpen(true); }}
                >
                  <span className="hidden sm:inline">New task</span>
                </Button>
              </div>
            }
          />
        }
      >
        {totalCount === 0 && !isLoading ? (
          <div className="flex h-full items-start justify-center pt-16">
            <EmptyState
              icon={ListChecks}
              iconColor="#4682B4"
              title="No tasks yet"
              description="Create your first task to get started."
              actions={
                <Button design="primary" size="sm" icon={Plus} onClick={() => { setCreatingColumn('pending'); setCreatingOpen(true); }}>
                  Create task
                </Button>
              }
            />
          </div>
        ) : (
          <div className="flex h-full flex-col">
            <div className="shrink-0 h-9 bg-border/5 border-b border-border/40" />
            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={rectIntersection}>
              <div className="flex flex-1 overflow-x-auto overflow-y-hidden min-h-0">
                {COLUMNS.map(status => (
                  <DroppableColumn
                    key={status}
                    status={status}
                    tasks={grouped[status] ?? []}
                    assigneeMap={assigneeMap}
                    onAdd={() => { setCreatingColumn(status); setCreatingOpen(true); }}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
              <DragOverlay dropAnimation={null}>
                {activeDragTask ? (
                  <div style={{ width: 220 }}>
                    <DragOverlayCard
                      task={activeDragTask}
                      assignee={activeDragTask.assigneeId ? assigneeMap[activeDragTask.assigneeId] ?? null : null}
                    />
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        )}

        {creatingOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-end">
            <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setCreatingOpen(false)} />
            <div className="relative mt-0 h-full w-full max-w-[420px] bg-background border-l border-border shadow-xl overflow-y-auto animate-[slideInRight_0.18s_ease-out]">
              <div className="sticky top-0 z-10 flex items-center justify-between bg-background/95 backdrop-blur px-5 h-14 border-b border-border">
                <h3 className="text-[14px] font-semibold text-foreground">New task</h3>
                <IconButton
                  icon={X}
                  size="xs"
                  design="ghost"
                  onClick={() => setCreatingOpen(false)}
                  className="!h-7 !w-7"
                />
              </div>
              <NewTaskForm
                onClose={() => setCreatingOpen(false)}
                onCreated={refetch}
                defaultStatus={creatingColumn ?? undefined}
                assignees={assigneesData?.assignees ?? []}
              />
            </div>
          </div>
        )}
      </ContentPanel>
    </AppPage>
  );
}
