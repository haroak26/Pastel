import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Star } from 'lucide-react';
import { IconButton } from '@/components/button';
import DOMPurify from 'dompurify';
import { Button } from '@/components/button';
import { TextInput, Textarea } from "@/components/text-input";

interface Signature {
  id: string;
  name: string;
  body: string;
  isDefault: boolean;
}

interface EmailSignatureEditorProps {
  spaceId: string;
}

export function EmailSignatureEditor({ spaceId }: EmailSignatureEditorProps) {
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [body, setBody] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const fetchSignatures = () => {
    fetch(`/api/spaces/${spaceId}/signatures`)
      .then((r) => r.json())
      .then(setSignatures)
      .catch(() => {});
  };

  useEffect(() => { fetchSignatures(); }, [spaceId]);

  const resetForm = () => { setName(''); setBody(''); setIsDefault(false); setShowForm(false); setEditingId(null); };

  const handleSave = async () => {
    if (!name.trim() || !body.trim()) return;
    if (editingId) {
      await fetch(`/api/signatures/${editingId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim(), body: body.trim(), isDefault }) });
    } else {
      await fetch(`/api/spaces/${spaceId}/signatures`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim(), body: body.trim(), isDefault }) });
    }
    resetForm();
    fetchSignatures();
  };

  const handleEdit = (sig: Signature) => {
    setEditingId(sig.id);
    setName(sig.name);
    setBody(sig.body);
    setIsDefault(sig.isDefault);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/signatures/${id}`, { method: 'DELETE' });
    fetchSignatures();
  };

  const handleSetDefault = async (sig: Signature) => {
    await fetch(`/api/signatures/${sig.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isDefault: true }) });
    fetchSignatures();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Email Signatures</h3>
        {!showForm && (
          <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-1 text-xs text-primary hover:underline">
            <Plus className="w-3.5 h-3.5" /> Add signature
          </button>
        )}
      </div>

      {showForm && (
        <div className="p-3 border border-border rounded-lg bg-surface/30 space-y-3">
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Signature name..."
            variant="default"
            className="bg-surface"
          />
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="<!-- Paste your HTML signature here -->"
            variant="default"
            className="bg-surface font-mono"
          />
          <div className="text-xs text-muted-foreground">HTML signature. Preview:</div>
          <div className="p-3 border border-border rounded bg-background text-sm" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(body, { ALLOWED_TAGS: ['a', 'b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'span', 'div', 'img', 'table', 'tr', 'td', 'th'], ALLOWED_ATTR: ['href', 'src', 'alt', 'title'], ALLOW_DATA_ATTR: false, FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick'] }) }} />
          <div className="flex items-center gap-2">
            <input type="checkbox" id="sig-default" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="rounded border-border" />
            <label htmlFor="sig-default" className="text-xs text-foreground">Set as default</label>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" design="ghost" size="xs" onClick={resetForm}>Cancel</Button>
            <Button type="button" design="primary" size="xs" onClick={handleSave}>{editingId ? 'Update' : 'Save'}</Button>
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        {signatures.map((sig) => (
          <div key={sig.id} className="flex items-center gap-3 px-3 py-2 border border-border rounded-lg bg-surface/20">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">{sig.name}</span>
                {sig.isDefault && <Star className="w-3.5 h-3.5 text-amber fill-amber" />}
              </div>
              <div className="text-xs text-muted-foreground truncate mt-0.5" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(sig.body, { ALLOWED_TAGS: ['a', 'b', 'i', 'em', 'strong', 'p', 'br', 'span', 'div'], ALLOWED_ATTR: ['href'], ALLOW_DATA_ATTR: false, FORBID_ATTR: ['style', 'onerror', 'onload', 'onclick'] }) }} />
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {!sig.isDefault && (
                <IconButton icon={Star} size="xs" design="ghost" onClick={() => handleSetDefault(sig)} title="Set as default" />
              )}
              <IconButton icon={Pencil} size="xs" design="ghost" onClick={() => handleEdit(sig)} title="Edit" />
              <IconButton icon={Trash2} size="xs" design="ghost" onClick={() => handleDelete(sig.id)} title="Delete" className="hover:text-destructive" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
