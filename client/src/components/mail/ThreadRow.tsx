import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { compactSenderName } from '@/lib/date-utils';
import type { ApiEmail, DisplayEmail } from '@/lib/email-types';
import { TagChip, type TagPickerTag } from '@/components/ds';

export function ThreadRow({ thread, isSelected, onClick, onStar, allTags = [] }: {
  thread: { threadId: string; messages: ApiEmail[]; adapted: DisplayEmail };
  isSelected: boolean;
  onClick: (emailId: string) => void;
  onStar?: () => void;
  allTags?: TagPickerTag[];
}) {
  const latest = thread.adapted;
  const msgCount = thread.messages.length;
  const latestRaw = thread.messages[thread.messages.length - 1];
  const latestLabels = latestRaw?.labels ?? [];
  const threadTags = allTags.filter(t => latestLabels.includes(t.id));
  const isDraft = latestRaw?.mailbox === 'draft';

  return (
    <div
      onClick={() => onClick(String(latest.id))}
      className={cn(
        'group relative flex flex-col gap-0 pl-4 pr-3 py-2 cursor-pointer',
        'transition-colors duration-100',
        'hover:bg-surface-active',
        isSelected && 'bg-surface-active',
      )}
    >
      <span
        className={cn(
          'absolute left-4 top-1/2 -translate-y-1/2 w-[7px] h-[7px] rounded-full transition-all',
          latest.unread ? 'bg-brand' : 'bg-transparent'
        )}
      />
      {/* Level 1: subject + time */}
      <div className="flex items-center justify-between min-w-0">
        <span
          className={cn(
            'text-[13px] leading-tight truncate font-medium',
            isSelected || latest.unread ? 'text-foreground' : 'text-fg-muted'
          )}
        >
          {latest.subject}
          {msgCount > 1 && (
            <span className="ml-1 text-[10px] font-medium text-fg-faint tabular-nums align-middle">
              {msgCount}
            </span>
          )}
        </span>
        <span className="text-[12px] text-fg-faint tabular-nums whitespace-nowrap shrink-0 ml-2">
          {latest.time}
        </span>
      </div>

      {/* Level 2: preview + sender + tags */}
      <div className="flex items-center justify-between min-w-0 mt-0.5">
        <div className="flex items-center gap-1 min-w-0 overflow-hidden">
          {isDraft && (
            <span className="text-[9px] font-semibold uppercase tracking-wider text-amber bg-amber-muted px-1 py-0.5 rounded shrink-0">
              Draft
            </span>
          )}
          {latest.preview && (
            <span className={cn(
              'text-[13px] truncate font-normal min-w-0',
              isSelected ? 'text-fg-muted' : 'text-fg-faint'
            )}>
              {latest.preview}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          <span className={cn(
            'text-[12px] font-normal whitespace-nowrap',
            isSelected ? 'text-fg-muted' : 'text-fg-faint'
          )}>
            {compactSenderName(latest.sender)}
          </span>
        </div>
      </div>
    </div>
  );
}
