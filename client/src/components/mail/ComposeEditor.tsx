import { useRef, useState } from 'react';
import { Paperclip, AlertCircle, X, Trash2, FileText, Signature, Zap } from 'lucide-react';
import { Button, IconButton } from '@/components/button';
import { EmailChipInput } from './EmailChipInput';
import { RichTextEditor } from '@/components/email/RichTextEditor';
import { CannedResponsePicker } from '@/components/email/CannedResponsePicker';
import { EmailSignatureEditor } from '@/components/email/EmailSignatureEditor';
import { TextInput } from "@/components/text-input";

export function ComposeEditor({
  to, setTo, cc, setCc, bcc, setBcc,
  showCc, setShowCc, showBcc, setShowBcc,
  subject, setSubject, body, setBody,
  attachments, setAttachments,
  onSend, onDiscard, sending, error,
  replyMode, forwardMode, contacts,
  spaceId, workspaceId,
}: {
  to: string; setTo: (v: string) => void;
  cc: string; setCc: (v: string) => void;
  bcc: string; setBcc: (v: string) => void;
  showCc: boolean; setShowCc: (v: boolean) => void;
  showBcc: boolean; setShowBcc: (v: boolean) => void;
  subject: string; setSubject: (v: string) => void;
  body: string; setBody: (v: string) => void;
  attachments: { name: string; size: number; data: string }[];
  setAttachments: (f: { name: string; size: number; data: string }[]) => void;
  onSend: () => void; onDiscard: () => void;
  sending: boolean; error: string;
  replyMode?: boolean; forwardMode?: boolean;
  contacts: string[];
  spaceId?: string;
  workspaceId?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCannedPicker, setShowCannedPicker] = useState(false);
  const [showSignatureEditor, setShowSignatureEditor] = useState(false);
  const fieldLabelClass = "text-[13px] text-foreground font-medium shrink-0 select-none";
  const showSubject = !replyMode;

  const handleAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    Promise.all(files.map(f => new Promise<{ name: string; size: number; data: string }>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ name: f.name, size: f.size, data: reader.result as string });
      reader.onerror = reject;
      reader.readAsDataURL(f);
    }))).then(results => setAttachments([...attachments, ...results]));
    e.target.value = '';
  };

  const handleCannedSelect = (response: { body: string; subject?: string }) => {
    setBody(response.body);
    if (response.subject && !subject) setSubject(response.subject);
  };

  return (
    <div className="flex flex-col flex-1 bg-background" style={{ minHeight: replyMode ? 200 : 540 }}>
      <input ref={fileInputRef} type="file" multiple onChange={handleAttach} className="hidden" />
      <div className="shrink-0 border-b border-border/40">
        <div className="flex items-center gap-2 px-4 py-2.5">
          <span className={fieldLabelClass}>To</span>
          <EmailChipInput value={to} onChange={setTo} contacts={contacts} placeholder="Recipient email" readOnly={replyMode && !forwardMode} />
          {!replyMode && (
            <div className="flex gap-1.5 shrink-0">
              {!showCc && <button onClick={() => setShowCc(true)} className="text-[13px] text-foreground bg-none border-none cursor-pointer px-1.5 py-0.5 rounded-md hover:bg-surface-hover">Cc</button>}
              {!showBcc && <button onClick={() => setShowBcc(true)} className="text-[13px] text-foreground bg-none border-none cursor-pointer px-1.5 py-0.5 rounded-md hover:bg-surface-hover">Bcc</button>}
            </div>
          )}
        </div>
      </div>
      {showCc && (
        <div className="shrink-0 border-b border-border/40">
          <div className="flex items-center gap-2 px-4 py-2.5">
            <span className={fieldLabelClass}>Cc</span>
            <EmailChipInput value={cc} onChange={setCc} contacts={contacts} placeholder="Cc recipient" />
            <button onClick={() => setShowCc(false)} className="flex items-center justify-center border-none bg-none cursor-pointer p-0.5 rounded text-fg-muted hover:text-foreground shrink-0"><X size={13} /></button>
          </div>
        </div>
      )}
      {showBcc && (
        <div className="shrink-0 border-b border-border/40">
          <div className="flex items-center gap-2 px-4 py-2.5">
            <span className={fieldLabelClass}>Bcc</span>
            <EmailChipInput value={bcc} onChange={setBcc} contacts={contacts} placeholder="Bcc recipient" />
            <button onClick={() => setShowBcc(false)} className="flex items-center justify-center border-none bg-none cursor-pointer p-0.5 rounded text-fg-muted hover:text-foreground shrink-0"><X size={13} /></button>
          </div>
        </div>
      )}
      {showSubject && (
        <div className="shrink-0 border-b border-border/40">
          <div className="flex items-center px-4 py-2.5">
            <TextInput
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Subject"
              variant="default"
              size="sm"
              className="border-0 rounded-none px-0 py-0"
            />
          </div>
        </div>
      )}
      <div className="flex-1 min-h-0 flex flex-col">
        <RichTextEditor value={body} onChange={setBody} placeholder="Write your message..." minHeight={120} />
      </div>
      {attachments.length > 0 && (
        <div className="flex gap-2 flex-wrap px-4 py-2 border-t border-border/40">
          {attachments.map((f, i) => (
            <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-border/60 bg-surface-muted text-[13px] text-foreground">
              <Paperclip size={11} /><span className="max-w-[100px] truncate">{f.name}</span>
              <span>({Math.round(f.size / 1024)}KB)</span>
              <button onClick={() => setAttachments(attachments.filter((_, j) => j !== i))} className="border-none bg-none cursor-pointer text-foreground hover:text-foreground p-0 flex"><X size={11} /></button>
            </div>
          ))}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-1.5 px-4 py-2 border-t border-border/40 bg-danger-muted/30">
          <AlertCircle size={11} className="text-danger shrink-0" />
          <span className="text-[13px] text-danger font-medium">{error}</span>
        </div>
      )}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/40">
        <Button size="xs" onClick={onSend} disabled={!to.trim() || !body.trim() || sending} isLoading={sending} className="px-3">Send</Button>
        <div className="flex items-center gap-1">
          {workspaceId && !replyMode && (
            <IconButton icon={Zap} size="xs" design="ghost" onClick={() => setShowCannedPicker(true)} title="Canned response" />
          )}
          {spaceId && (
            <IconButton icon={Signature} size="xs" design="ghost" onClick={() => setShowSignatureEditor(!showSignatureEditor)} title="Signature" />
          )}
          <IconButton icon={Paperclip} size="xs" design="ghost" onClick={() => fileInputRef.current?.click()} title="Attach file" />
          <IconButton icon={Trash2} size="xs" design="ghost" onClick={onDiscard} title="Discard" className="hover:text-destructive" />
        </div>
      </div>
      {showCannedPicker && workspaceId && (
        <CannedResponsePicker
          workspaceId={workspaceId}
          onSelect={handleCannedSelect}
          onClose={() => setShowCannedPicker(false)}
        />
      )}
      {showSignatureEditor && spaceId && (
        <div className="border-t border-border/40 p-3 max-h-48 overflow-y-auto">
          <EmailSignatureEditor spaceId={spaceId} />
        </div>
      )}
    </div>
  );
}
