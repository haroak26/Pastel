import { useState, useEffect } from 'react';
import { Search, FileText } from 'lucide-react';
import { TextInput } from "@/components/text-input";

interface CannedResponse {
  id: string;
  name: string;
  subject?: string | null;
  body: string;
  shortcut?: string | null;
  category?: string | null;
}

interface CannedResponsePickerProps {
  workspaceId: string;
  onSelect: (response: { body: string; subject?: string }) => void;
  onClose: () => void;
}

export function CannedResponsePicker({ workspaceId, onSelect, onClose }: CannedResponsePickerProps) {
  const [responses, setResponses] = useState<CannedResponse[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/workspaces/${workspaceId}/canned-responses`)
      .then((r) => r.json())
      .then(setResponses)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [workspaceId]);

  const filtered = responses.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    (r.shortcut && r.shortcut.toLowerCase().includes(search.toLowerCase()))
  );

  const categories = [...new Set(filtered.map((r) => r.category).filter(Boolean))] as string[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={onClose}>
      <div className="w-full max-w-lg bg-background border border-border rounded-xl shadow-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="p-3 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <TextInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search responses..."
              variant="ghost"
              className="flex-1"
              autoFocus
            />
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">No canned responses found</p>
          )}

          {categories.map((cat) => (
            <div key={cat}>
              <div className="px-2 py-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{cat}</div>
              {filtered.filter((r) => r.category === cat).map((r) => (
                <button
                  key={r.id}
                  onClick={() => { onSelect({ body: r.body, subject: r.subject ?? undefined }); onClose(); }}
                  className="w-full flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-hover transition-colors text-left"
                >
                  <FileText className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{r.name}</div>
                    {r.shortcut && <span className="text-[11px] text-muted-foreground">/{r.shortcut}</span>}
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{r.body.slice(0, 100)}</p>
                  </div>
                </button>
              ))}
            </div>
          ))}

          {filtered.filter((r) => !r.category).map((r) => (
            <button
              key={r.id}
              onClick={() => { onSelect({ body: r.body, subject: r.subject ?? undefined }); onClose(); }}
              className="w-full flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-hover transition-colors text-left"
            >
              <FileText className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-medium text-foreground truncate">{r.name}</div>
                {r.shortcut && <span className="text-[11px] text-muted-foreground">/{r.shortcut}</span>}
                <p className="text-xs text-muted-foreground truncate mt-0.5">{r.body.slice(0, 100)}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
