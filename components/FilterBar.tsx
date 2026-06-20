'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';

interface FilterField {
  key: string;
  placeholder: string;
  type?: 'text' | 'date' | 'select';
  options?: { value: string; label: string }[];
}

interface FilterBarProps {
  fields: FilterField[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onSearch: () => void;
  onReset: () => void;
}

export default function FilterBar({ fields, values, onChange, onSearch, onReset }: FilterBarProps) {
  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') onSearch();
  }

  return (
    <div className="flex flex-wrap items-end gap-3 mb-5 p-4 bg-card rounded-lg border border-border">
      {fields.map(f => (
        <div key={f.key} className="flex-1 min-w-36">
          {f.type === 'select' ? (
            <select
              value={values[f.key] || ''}
              onChange={e => onChange(f.key, e.target.value)}
              className="h-9 w-full text-sm rounded-md border border-input bg-background px-3 py-1 shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">{f.placeholder}</option>
              {f.options?.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          ) : (
            <Input
              type={f.type || 'text'}
              placeholder={f.placeholder}
              value={values[f.key] || ''}
              onChange={e => onChange(f.key, e.target.value)}
              onKeyDown={handleKey}
              className="h-9 text-sm"
            />
          )}
        </div>
      ))}
      <Button onClick={onSearch} size="sm" className="gap-2 h-9">
        <Search size={14} />
        Qidirish
      </Button>
      <Button onClick={onReset} size="sm" variant="outline" className="gap-2 h-9">
        <X size={14} />
        Tozalash
      </Button>
    </div>
  );
}
