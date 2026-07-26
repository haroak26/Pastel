import { useState, useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { IconButton } from '@/components/button';
import { ComposeEditor } from './ComposeEditor';
import { UndoToast } from '@/components/email/UndoToast';

type DraftStatus = 'idle' | 'saving' | 'saved' | 'error';

export function ComposeWindow({ spaceId, workspaceId, spaceName, onClose, contacts }: {
  spaceId: string;
  workspaceId?: string;
  spaceName?: string;
  onClose: () => void;
  contacts: string[];
}) {
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<{ name: string; size: number; data: string }[]>([]);
  const [sending, setSending] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [showUndo, setShowUndo] = useState(false);
  const draftRef = useRef(draftId);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // ── Undo Send Flow ──────────────────────────────────────────────────

  const composeStateRef = useRef({ to: '', subject: '', body: '', cc: '', bcc: '' });

  const handleSend = async () => {
    if (!to.trim() || !body.trim() || sending) return;
    setSending(true); setError('');
    composeStateRef.current = { to, subject, body, cc, bcc };
    try {
      // Save current state as draft first
      if (draftRef.current) {
        await fetch(`/api/drafts/${draftRef.current}`, {
          method: 'PUT', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to, subject, body, cc }),
        });
      } else {
        const res = await fetch(`/api/spaces/${spaceId}/draft`, {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to, subject, body, cc, bcc }),
        });
        if (res.ok) {
          const draft = await res.json();
          draftRef.current = draft.id;
          setDraftId(draft.id);
        }
      }
      setShowUndo(true);
    } catch {
      // Fallback: send immediately
      try {
        const res = await fetch(`/api/spaces/${spaceId}/compose`, {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: to.trim(), subject: subject.trim() || '(no subject)', body,
            cc: cc || undefined, bcc: bcc || undefined,
          }),
        });
        if (!res.ok) throw new Error('Send failed');
        queryClient.invalidateQueries({ queryKey: ['/api/spaces', spaceId, 'threads'] });
        onClose();
      } catch (e: any) {
        setError(e.message ?? 'Failed to send');
        setSending(false);
      }
    }
  };

  const handleUndo = async () => {
    if (draftRef.current) {
      try {
        await fetch(`/api/drafts/${draftRef.current}`, { method: 'DELETE', credentials: 'include' });
      } catch { /* ignore */ }
      draftRef.current = null;
      setDraftId(null);
    }
    setShowUndo(false);
    setSending(false);
  };

  const handleUndoComplete = async () => {
    if (!draftRef.current) return;
    try {
      const state = composeStateRef.current;
      const res = await fetch(`/api/drafts/${draftRef.current}/send`, {
        method: 'PUT', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cc: state.cc || undefined, bcc: state.bcc || undefined }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message ?? 'Send failed');
      }
      draftRef.current = null;
      setDraftId(null);
      queryClient.invalidateQueries({ queryKey: ['/api/spaces', spaceId, 'threads'] });
      onClose();
    } catch (e: any) {
      setError(e.message ?? 'Failed to send');
      setSending(false);
      setShowUndo(false);
    }
  };

  const handleDiscard = async () => {
    const hasContent = to.trim() || subject.trim() || body.trim();
    if (hasContent) {
      try {
        const res = await fetch(`/api/spaces/${spaceId}/draft`, {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to, subject, body, cc, bcc }),
        });
        if (res.ok) draftRef.current = (await res.json()).id;
      } catch {}
    }
    onClose();
  };

  return (
    <>
      {showUndo && (
        <UndoToast
          message="Sending..."
          onUndo={handleUndo}
          onComplete={handleUndoComplete}
        />
      )}
      <div className="fixed inset-0 z-[300] flex flex-col bg-background sm:inset-auto sm:right-7 sm:bottom-7 sm:w-[580px] sm:rounded-[18px] sm:border sm:border-border/80 overflow-hidden">
        {/* Mobile header close button */}
        <div className="sm:hidden flex items-center justify-between px-4 py-2.5 border-b border-border/40 shrink-0">
          <span className="text-[15px] font-semibold text-foreground">New Message</span>
          <IconButton icon={X} size="sm" design="ghost" onClick={handleDiscard} aria-label="Close" />
        </div>
        <div className="flex-1 min-h-0 flex flex-col">
          <ComposeEditor
            to={to} setTo={setTo} cc={cc} setCc={setCc} bcc={bcc} setBcc={setBcc}
            showCc={showCc} setShowCc={setShowCc} showBcc={showBcc} setShowBcc={setShowBcc}
            subject={subject} setSubject={setSubject} body={body} setBody={setBody}
            attachments={attachments} setAttachments={setAttachments}
            onSend={handleSend} onDiscard={handleDiscard} sending={sending || showUndo} error={error} contacts={contacts}
            spaceId={spaceId} workspaceId={workspaceId}
          />
        </div>
      </div>
    </>
  );
}
