import React, { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { InboxIcon, Check, Plus, Loader } from 'lucide-react';
import { cn } from '@/lib/utils';
import { dayBucketLabel } from '@/lib/date-utils';
import type { ApiEmail, DisplayEmail } from '@/lib/email-types';
import { useSpace } from '@/contexts/space-context';
import { Button } from '@/components/button';
import { EmptyState, ListSection, ListSkeleton, type TagPickerTag } from '@/components/ds';
import { ThreadRow } from './ThreadRow';

export function SpaceMailboxList({
  selectedId, setSelectedId,
  threads, isLoading, allTags,
}: {
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  threads: { threadId: string; messages: ApiEmail[]; adapted: DisplayEmail }[];
  isLoading: boolean;
  allTags?: TagPickerTag[];
}) {
  const [, navigate] = useLocation();
  const { activeSpaceId, spaceList } = useSpace();
  const queryClient = useQueryClient();

  const handleStar = async (e: DisplayEmail) => {
    await fetch(`/api/emails/${e.raw.id}`, {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isStarred: !e.raw.isStarred }),
    });
    queryClient.invalidateQueries({ queryKey: ['/api/spaces', activeSpaceId, 'threads'] });
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {spaceList.length === 0 ? (
          <EmptyState icon={InboxIcon} title="No spaces yet" description="Create your first mailbox to start sending and receiving email."
            iconColor="#4682B4" iconBg="hsl(207 44% 54% / 0.08)"
            actions={<Button size="xs" onClick={() => navigate('/home/configure/settings')}><Plus size={12} /> Create space</Button>}
          />
        ) : isLoading ? (
          <ListSkeleton rows={8} />
        ) : threads.length === 0 ? (
          <EmptyState icon={Check} title="All caught up" description="No emails match this filter"
            iconColor="#1F9D69" iconBg="hsl(152 60% 40% / 0.1)"
          />
        ) : (
          <div className="divide-y divide-border/40">
            {threads.map((t) => (
              <ThreadRow key={t.threadId} thread={t} allTags={allTags}
                isSelected={selectedId === String(t.messages[t.messages.length - 1].id)}
                onClick={(emailId) => { setSelectedId(selectedId === emailId ? null : emailId); }}
                onStar={() => handleStar(t.adapted)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
