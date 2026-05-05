import {useMemo, useState} from 'react';
import {SlidersHorizontal, Search, Copy, Check} from 'lucide-react';

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
    <div className="rounded-lg" style={{background: 'var(--color-surface)', border: '1px solid var(--color-border)'}}>
      <div className="flex items-center gap-3 px-4 py-2.5" style={{borderBottom: '1px solid var(--color-border)'}}>
        <SlidersHorizontal className="w-4 h-4" style={{color: 'var(--color-text-secondary)'}} />
        <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-white">{category}</h3>
        <span className="font-mono text-[10px]" style={{color: 'var(--color-text-secondary)'}}>{filtered.length} 个参数</span>
        <div className="ml-auto flex items-center gap-2 rounded-md px-2 py-1" style={{border: '1px solid var(--color-border)', background: 'var(--color-obsidian)'}}>
          <Search className="w-3.5 h-3.5" style={{color: 'var(--color-text-secondary)'}} />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="过滤参数..."
            className="w-40 bg-transparent text-xs text-white outline-none"
            style={{color: 'var(--color-text-secondary)'}}
          />
        </div>
      </div>
      <div className="max-h-[400px] overflow-y-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead className="sticky top-0" style={{borderBottom: '1px solid var(--color-border)', background: 'rgba(45,55,72,0.5)', color: 'var(--color-text-secondary)'}}>
            <tr>
              <th className="px-4 py-2 font-medium uppercase tracking-tight">参数</th>
              <th className="px-4 py-2 font-medium uppercase tracking-tight">值</th>
              <th className="w-20 px-4 py-2 font-medium uppercase tracking-tight text-right">操作</th>
            </tr>
          </thead>
          <tbody>
            {paged.map(([key, value]) => (
              <tr key={key} className="transition-colors" style={{borderBottom: '1px solid rgba(51,65,85,0.3)'}}>
                <td className="px-4 py-2 text-white">{key}</td>
                <td className="max-w-[300px] truncate px-4 py-2">
                  <span className="rounded px-1.5 py-0.5 text-[11px] text-blue-400" style={{background: 'var(--color-border)'}}>{value}</span>
                </td>
                <td className="px-4 py-2 text-right">
                  <button
                    onClick={() => handleCopy(key, value)}
                    className="rounded p-1 transition-colors hover:text-white"
                    style={{color: 'var(--color-text-secondary)'}}
                    title="复制 CONFIG SET 命令"
                  >
                    {copied === key ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-6 text-center" style={{color: 'var(--color-text-secondary)'}}>无匹配参数</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-2" style={{borderTop: '1px solid var(--color-border)'}}>
          <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="rounded px-2 py-1 text-[11px] transition-colors hover:text-white disabled:opacity-30" style={{color: 'var(--color-text-secondary)'}}>上一页</button>
          <span className="font-mono text-[10px]" style={{color: 'var(--color-text-secondary)'}}>{page + 1} / {totalPages}</span>
          <button disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} className="rounded px-2 py-1 text-[11px] transition-colors hover:text-white disabled:opacity-30" style={{color: 'var(--color-text-secondary)'}}>下一页</button>
        </div>
      )}
    </div>
  );
}
