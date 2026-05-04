import {useMemo, useState} from 'react';
import {Icon} from './Icon';

interface Props {
  params: Array<[string, string]>;
  category: string;
}

const PAGE_SIZE = 20;

export function ConfigTable({params, category}: Props) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [copied, setCopied] = useState('');

  const filtered = useMemo(() => {
    if (!search) return params;
    const q = search.toLowerCase();
    return params.filter(([k, v]) => k.toLowerCase().includes(q) || v.toLowerCase().includes(q));
  }, [params, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function handleCopy(key: string, value: string) {
    navigator.clipboard.writeText(`CONFIG SET ${key} ${value}`).catch(() => {});
    setCopied(key);
    setTimeout(() => setCopied(''), 1500);
  }

  return (
    <div className="rounded-lg border border-border bg-panel">
      <div className="flex items-center gap-3 border-b border-border px-4 py-2.5">
        <Icon name="tune" className="text-[16px] text-mute" />
        <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-white">
          {category}
        </h3>
        <span className="font-mono text-[10px] text-mute">{filtered.length} params</span>
        <div className="ml-auto flex items-center gap-2 rounded-md border border-border bg-coal px-2 py-1">
          <Icon name="search" className="text-[14px] text-mute" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Filter parameters..."
            className="w-40 bg-transparent text-xs text-ink outline-none placeholder:text-mute"
          />
        </div>
      </div>
      <div className="max-h-[400px] overflow-y-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead className="sticky top-0 border-b border-border bg-panel2/50 text-mute">
            <tr>
              <th className="px-4 py-2 font-medium uppercase tracking-tight">Parameter</th>
              <th className="px-4 py-2 font-medium uppercase tracking-tight">Value</th>
              <th className="w-20 px-4 py-2 font-medium uppercase tracking-tight text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {paged.map(([key, value]) => (
              <tr key={key} className="hover:bg-panel2/30">
                <td className="px-4 py-2 text-ink">{key}</td>
                <td className="max-w-[300px] truncate px-4 py-2">
                  <span className="rounded bg-surfaceHigh px-1.5 py-0.5 text-[11px] text-cyanx">{value}</span>
                </td>
                <td className="px-4 py-2 text-right">
                  <button
                    onClick={() => handleCopy(key, value)}
                    className="rounded p-1 text-mute transition-colors hover:bg-panel2 hover:text-ink"
                    title="Copy CONFIG SET command"
                  >
                    <Icon name={copied === key ? 'check' : 'content_copy'} className="text-[14px]" />
                  </button>
                </td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-mute">No matching parameters</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border px-4 py-2">
          <button
            disabled={page === 0}
            onClick={() => setPage((p) => p - 1)}
            className="rounded px-2 py-1 text-[11px] text-mute transition-colors hover:bg-panel2 hover:text-ink disabled:opacity-30"
          >
            Previous
          </button>
          <span className="font-mono text-[10px] text-mute">
            {page + 1} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
            className="rounded px-2 py-1 text-[11px] text-mute transition-colors hover:bg-panel2 hover:text-ink disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
