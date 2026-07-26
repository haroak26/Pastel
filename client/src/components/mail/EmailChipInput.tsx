import { useState, useEffect, useRef, useMemo } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function EmailChipInput({
  value, onChange, contacts, placeholder, readOnly,
}: {
  value: string;
  onChange: (v: string) => void;
  contacts: string[];
  placeholder?: string;
  readOnly?: boolean;
}) {
  const emails = useMemo(() => value.split(',').map(s => s.trim()).filter(Boolean), [value]);
  const [inputValue, setInputValue] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = contacts.filter(c => c.toLowerCase().includes(inputValue.toLowerCase()) && !emails.includes(c));

  const addEmail = (email: string) => {
    if (readOnly) return;
    const trimmed = email.trim();
    if (trimmed && !emails.includes(trimmed)) onChange([...emails, trimmed].join(', '));
    setInputValue('');
    setDropdownOpen(false);
  };

  const removeEmail = (email: string) => {
    if (readOnly) return;
    onChange(emails.filter(e => e !== email).join(', '));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (readOnly) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered.length > 0) addEmail(filtered[0]);
      else if (inputValue.trim()) addEmail(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && emails.length > 0) {
      onChange(emails.slice(0, -1).join(', '));
    } else if (e.key === ',' && inputValue.trim()) {
      e.preventDefault();
      addEmail(inputValue);
    }
  };

  return (
    <div ref={ref} className="flex-1 min-w-0 relative">
      <div className="flex flex-wrap items-center gap-1">
        {emails.map(email => (
          <span key={email} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[13px] bg-brand/10 text-brand font-medium whitespace-nowrap max-w-full">
            <span className="truncate">{email}</span>
            {!readOnly && (
              <button onClick={() => removeEmail(email)} type="button"
                className="flex items-center justify-center border-none bg-transparent cursor-pointer p-0 text-brand/50 hover:text-brand shrink-0"
              >
                <X size={11} />
              </button>
            )}
          </span>
        ))}
        {!readOnly && (
          <input
            type="text"
            value={inputValue}
            onChange={e => { setInputValue(e.target.value); setDropdownOpen(true); }}
            onKeyDown={handleKeyDown}
            onFocus={() => setDropdownOpen(true)}
            placeholder={emails.length === 0 ? (placeholder || 'Add recipients...') : ''}
            className="flex-1 min-w-[80px] outline-none border-none bg-transparent text-[13px] text-foreground placeholder:text-fg-faint py-1"
          />
        )}
      </div>
      {dropdownOpen && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto">
          {filtered.map(c => (
            <button key={c} onClick={() => addEmail(c)} type="button"
              className="w-full text-left px-3 py-2 text-[13px] text-foreground hover:bg-surface-hover border-none bg-transparent cursor-pointer transition-colors"
            >
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
