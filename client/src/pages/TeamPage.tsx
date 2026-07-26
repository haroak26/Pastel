import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Loader, Search, UserPlus, X, UserCog } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWorkspace } from '@/contexts/workspace-context';
import { Button, IconButton } from '@/components/button';
import { TextInput } from '@/components/text-input';
import { AppLayout } from '@/components/AppLayout';
import { FilterChip, ListSkeleton } from '@/components/ds';
import { PageContainer, SettingsSection, SettingsRow } from '@/components/settings-ui';
import { InviteModal } from '@/components/team/InviteModal';
import { MemberSlideout } from '@/components/team/MemberSlideout';

interface MemberSkill {
  skill: string;
  proficiency: number;
}

interface Member {
  id: string;
  email: string;
  role: string;
  status: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  department?: string | null;
  title?: string | null;
  skills: MemberSkill[];
  maxCapacity: number;
  timezone?: string | null;
  available: boolean;
  currentTicketCount: number;
  lastActiveAt?: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  editor: 'Editor',
  viewer: 'Viewer',
};

const ROLE_COLORS: Record<string, string> = {
  owner: 'bg-violet-50 text-violet-600',
  editor: 'bg-blue-50 text-blue-600',
  viewer: 'bg-surface-muted text-fg-muted',
};

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${ROLE_COLORS[role] ?? ROLE_COLORS.viewer}`}>
      {ROLE_LABELS[role] ?? role}
    </span>
  );
}

function PendingBadge() {
  return (
    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-muted text-amber">
      Pending
    </span>
  );
}

function MemberAvatar({ member, name }: { member: Member; name: string }) {
  return (
    <div className="relative shrink-0">
      {member.avatarUrl ? (
        <img src={member.avatarUrl} alt={name} className="w-8 h-8 rounded-full object-cover" />
      ) : (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand/20 to-brand/5 flex items-center justify-center">
          <span className="text-[11px] font-semibold text-brand">{name.charAt(0).toUpperCase()}</span>
        </div>
      )}
      <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background ${member.available ? 'bg-green-500' : 'bg-gray-300'}`} />
    </div>
  );
}

export function TeamPageContent() {
  const { activeWorkspace, activeWorkspaceId } = useWorkspace();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const { data: rawMembers, isLoading } = useQuery({
    queryKey: [`/api/workspaces/${activeWorkspaceId}/members`],
    queryFn: async () => {
      const res = await fetch(`/api/workspaces/${activeWorkspaceId}/members`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    enabled: !!activeWorkspaceId,
  });

  const { data: spacesData } = useQuery({
    queryKey: ['/api/spaces'],
    queryFn: async () => {
      const res = await fetch('/api/spaces', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const spaces = spacesData?.spaces ?? [];
  const members: Member[] = rawMembers ?? [];

  const filteredMembers = useMemo(() => {
    let items = members;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(m =>
        m.email.toLowerCase().includes(q) ||
        (m.displayName?.toLowerCase().includes(q)) ||
        (m.department?.toLowerCase().includes(q))
      );
    }
    if (roleFilter !== 'all') items = items.filter(m => m.role === roleFilter);
    return items;
  }, [members, searchQuery, roleFilter]);

  const removeMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const res = await fetch(`/api/workspaces/${activeWorkspaceId}/members/${memberId}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [`/api/workspaces/${activeWorkspaceId}/members`] });
      toast({ title: 'Member removed', variant: 'success' });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ memberId, available }: { memberId: string; available: boolean }) => {
      const res = await fetch(`/api/workspaces/${activeWorkspaceId}/members/${memberId}`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available }),
      });
      if (!res.ok) throw new Error('Failed');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [`/api/workspaces/${activeWorkspaceId}/members`] });
    },
  });

  const userRole = activeWorkspace?.role ?? 'viewer';
  const canManage = ['owner', 'editor'].includes(userRole);
  const onlineCount = members.filter(m => m.available).length;
  const pendingCount = members.filter(m => m.status === 'pending').length;

  const roleFilters = [
    { key: 'all', label: 'All' },
    { key: 'owner', label: 'Owners' },
    { key: 'editor', label: 'Editors' },
    { key: 'viewer', label: 'Viewers' },
  ];

  function handleRemove(id: string) {
    if (confirm('Remove this member from the workspace?')) removeMutation.mutate(id);
  }

  return (
    <PageContainer className="py-4">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-[17px] font-semibold text-foreground">Team Members</h1>
          <p className="text-[13px] text-muted-foreground mt-0.5">
            {members.length} {members.length === 1 ? 'member' : 'members'}
          </p>
        </div>
        {canManage && (
          <Button size="xs" onClick={() => setShowInvite(true)}>
            <UserPlus size={12} /> Invite member
          </Button>
        )}
      </div>

      {!activeWorkspaceId ? (
        <div className="flex h-40 items-center justify-center">
          <p className="text-[13px] text-fg-muted">Select a workspace to manage your team</p>
        </div>
      ) : isLoading ? (
        <ListSkeleton rows={6} />
      ) : (
        <SettingsSection
          title="Members"
          description={`${members.length} total, ${onlineCount} online, ${pendingCount} pending`}
        >
          <SettingsRow label="">
            <div className="flex items-center gap-2 w-full">
              <div className="flex gap-1 shrink-0">
                {roleFilters.map(filter => (
                  <FilterChip
                    key={filter.key}
                    active={roleFilter === filter.key}
                    onClick={() => setRoleFilter(filter.key)}
                  >
                    {filter.label}
                  </FilterChip>
                ))}
              </div>
              <div className="relative flex-1 min-w-[160px]">
                <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-faint" />
                <TextInput size="xs"
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-7 h-8 text-[12px]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 flex -translate-y-1/2 text-fg-muted hover:text-foreground"
                  >
                    <X size={11} />
                  </button>
                )}
              </div>
            </div>
          </SettingsRow>

          {filteredMembers.length === 0 ? (
            <div className="py-10 text-center">
              <Users size={24} className="text-fg-faint mx-auto mb-3" />
              <p className="text-[13px] font-medium text-foreground">
                {searchQuery || roleFilter !== 'all' ? 'No members match your filters' : 'No team members yet'}
              </p>
              <p className="text-[12px] text-fg-muted mt-1">
                {searchQuery || roleFilter !== 'all' ? 'Try a different search or role filter.' : 'Invite your first teammate to start routing work together.'}
              </p>
              {canManage && !searchQuery && roleFilter === 'all' && (
                <Button size="sm" className="mt-4" onClick={() => setShowInvite(true)}>
                  <UserPlus size={12} /> Invite member
                </Button>
              )}
            </div>
          ) : (
            filteredMembers.map(member => {
              const name = member.displayName || member.email.split('@')[0];
              const loadPct = member.maxCapacity > 0
                ? Math.round(((member.currentTicketCount ?? 0) / member.maxCapacity) * 100)
                : 0;

              return (
                <SettingsRow
                  key={member.id}
                  align="start"
                  label={
                    <div className="flex items-center gap-2.5 min-w-0">
                      <MemberAvatar member={member} name={name} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[13px] font-medium text-foreground truncate">{name}</span>
                          <RoleBadge role={member.role} />
                          {member.status === 'pending' && <PendingBadge />}
                        </div>
                        <p className="text-[11px] text-fg-muted truncate">{member.email}</p>
                        {(member.department || member.title) && (
                          <p className="text-[11px] text-fg-faint">
                            {member.department}{member.department && member.title ? ' · ' : ''}{member.title}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-fg-muted">Load:</span>
                            <div className="w-12 h-1 rounded-full bg-border-subtle overflow-hidden">
                              <div
                                className={`h-full rounded-full ${loadPct > 80 ? 'bg-red-500' : loadPct > 60 ? 'bg-amber' : 'bg-green-500'}`}
                                style={{ width: `${Math.min(loadPct, 100)}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-fg-muted">{member.currentTicketCount ?? 0}/{member.maxCapacity ?? 10}</span>
                          </div>
                          {member.timezone && (
                            <span className="text-[10px] text-fg-faint">{member.timezone}</span>
                          )}
                        </div>
                        {member.skills && member.skills.length > 0 && (
                          <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                            {member.skills.slice(0, 2).map(s => (
                              <span key={s.skill} className="text-[9px] px-1.5 py-0.5 rounded-full bg-brand/5 text-brand/80">
                                {s.skill}
                              </span>
                            ))}
                            {member.skills.length > 2 && (
                              <span className="text-[9px] text-fg-faint">+{member.skills.length - 2}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  }
                >
                  {canManage && (
                    <div className="flex items-center gap-1">
                      {member.status === 'active' && (
                        <button
                                          onClick={() => toggleMutation.mutate({ memberId: member.id, available: !member.available })}
                                          className={`px-2 py-1 rounded-[8px] text-[10px] font-medium transition-colors whitespace-nowrap ${
                            member.available ? 'bg-green-50 text-green-600' : 'bg-surface-hover text-fg-muted'
                          }`}
                        >
                          {member.available ? 'Online' : 'Away'}
                        </button>
                      )}
                      <IconButton icon={UserCog} size="xs" design="ghost" onClick={() => setEditingMember(member.id)} title="Edit member" />
                      {member.role !== 'owner' && (
                        <IconButton icon={X} size="xs" design="ghost" className="hover:text-destructive hover:bg-red-50" onClick={() => handleRemove(member.id)} title="Remove member" />
                      )}
                    </div>
                  )}
                </SettingsRow>
              );
            })
          )}
        </SettingsSection>
      )}

      {showInvite && (
        <InviteModal
          workspaceId={activeWorkspaceId!}
          spaces={spaces}
          onClose={() => setShowInvite(false)}
          onInvited={() => {
            qc.invalidateQueries({ queryKey: [`/api/workspaces/${activeWorkspaceId}/members`] });
            setShowInvite(false);
          }}
        />
      )}

      {editingMember && (
        <MemberSlideout
          workspaceId={activeWorkspaceId!}
          memberId={editingMember}
          spaces={spaces}
          onClose={() => setEditingMember(null)}
        />
      )}
    </PageContainer>
  );
}

export default function TeamPage() {
  return <TeamPageContent />;
}
