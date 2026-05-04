import {useEffect, useState} from 'react';
import {DataTypeDistribution} from '../components/DataTypeDistribution';
import {Icon} from '../components/Icon';
import {MemorySummaryCards} from '../components/MemorySummaryCards';
import {MemoryTreemap} from '../components/MemoryTreemap';
import {runAnalysis} from '../lib/api';
import type {AnalysisReport, BigKey, ConnectionProfile} from '../types';

interface Props {
  connection: ConnectionProfile;
}

export function MemoryAnalysisPage({ connection }: Props) {
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState<'size' | 'length'>('size');
  const [page, setPage] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    runAnalysis(connection.id)
      .then((r) => { if (!cancelled) setReport(r); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : 'Analysis failed'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [connection.id]);

  const allBigKeys: BigKey[] = (report?.snapshot?.nodes ?? []).flatMap((n) => n.bigKeys ?? []);

  const filtered = filter.trim()
    ? allBigKeys.filter((k) => k.name.toLowerCase().includes(filter.toLowerCase()))
    : allBigKeys;

  const sorted = [...filtered].sort((a, b) => sortBy === 'size' ? b.size - a.size : b.length - a.length);
  const totalPages = Math.ceil(sorted.length / pageSize);
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);

  function fmtSize(bytes: number): string {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Icon name="analytics" className="text-4xl text-mute animate-pulse" />
          <p className="mt-2 text-sm text-mute">Loading memory analysis...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="rounded-lg border border-redis/30 bg-redis/10 px-6 py-4 text-sm text-redis">{error}</div>
      </div>
    );
  }

  const info = report?.snapshot?.nodes?.[0]?.info ?? {};
  const fragmentation = parseFloat(info['mem_fragmentation_ratio'] ?? '0');
  const policy = info['maxmemory_policy'] ?? 'N/A';
  const usedMem = parseFloat(info['used_memory'] ?? '0');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-ink">Memory Analysis</h1>
        <p className="mt-1 text-xs text-mute">
          Deep inspection of {(usedMem / (1024 * 1024)).toFixed(0)}MB total resident memory
        </p>
        <div className="mt-2 flex gap-2">
          {fragmentation > 0 && (
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] ${fragmentation < 1.5 ? 'bg-greenx/15 text-greenx' : 'bg-amberx/15 text-amberx'}`}>
              Fragmentation {fragmentation.toFixed(2)}x
            </span>
          )}
          <span className="rounded-full bg-panel2 px-2.5 py-0.5 text-[11px] text-mute">
            Policy: {policy}
          </span>
        </div>
      </div>

      {/* Row 1: Treemap + Data Type Distribution */}
      <div className="grid grid-cols-12 gap-3">
        <div className="col-span-12 lg:col-span-8">
          <MemoryTreemap bigKeys={allBigKeys} />
        </div>
        <div className="col-span-12 lg:col-span-4">
          <DataTypeDistribution bigKeys={allBigKeys} />
        </div>
      </div>

      {/* Row 2: Big Keys Table */}
      <div className="overflow-hidden rounded-lg border border-border bg-panel">
        <div className="flex items-center justify-between border-b border-border bg-panel2/50 px-4 py-2">
          <div className="flex items-center gap-2">
            <Icon name="warning" className="text-amberx text-[18px]" />
            <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-white">Big Keys Report</h3>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={filter}
              onChange={(e) => { setFilter(e.target.value); setPage(0); }}
              placeholder="Filter keys..."
              className="rounded border border-border bg-black/20 px-2.5 py-1 text-[11px] text-ink outline-none focus:border-cyanx w-36"
            />
            <button
              onClick={() => setSortBy(sortBy === 'size' ? 'length' : 'size')}
              className="rounded border border-border bg-panel2 px-2 py-1 text-[10px] font-bold uppercase text-mute hover:text-ink"
            >
              Sort by {sortBy === 'size' ? 'Elements' : 'Size'}
            </button>
          </div>
        </div>

        <table className="w-full text-left font-mono text-xs">
          <thead className="border-b border-border bg-panel2/30 text-mute">
            <tr>
              <th className="px-4 py-2 font-medium uppercase tracking-tight">Key Name</th>
              <th className="px-4 py-2 font-medium uppercase tracking-tight">Type</th>
              <th className="px-4 py-2 font-medium uppercase tracking-tight">Size</th>
              <th className="px-4 py-2 font-medium uppercase tracking-tight">Elements</th>
              <th className="px-4 py-2 font-medium uppercase tracking-tight">TTL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {paged.map((key) => (
              <tr key={key.name + key.type} className="transition-colors hover:bg-panel2/50">
                <td className="max-w-[200px] truncate px-4 py-2 text-ink">{key.name}</td>
                <td className="px-4 py-2">
                  <span className="rounded bg-panel2 px-1.5 py-0.5 text-[10px] uppercase text-mute">{key.type}</span>
                </td>
                <td className={`px-4 py-2 ${key.size > 1024 * 1024 ? 'text-redis font-bold' : 'text-ink'}`}>
                  {fmtSize(key.size)}
                </td>
                <td className="px-4 py-2 text-ink">{key.length.toLocaleString()}</td>
                <td className="px-4 py-2 text-mute">{key.ttl > 0 ? `${key.ttl}s` : 'no expire'}</td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-mute">No matching keys</td></tr>
            )}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border px-4 py-2">
            <span className="text-[10px] text-mute">Showing {page * pageSize + 1}-{Math.min((page + 1) * pageSize, sorted.length)} of {sorted.length}</span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="rounded border border-border px-2 py-0.5 text-[10px] text-mute hover:text-ink disabled:opacity-40"
              >
                Prev
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="rounded border border-border px-2 py-0.5 text-[10px] text-mute hover:text-ink disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Row 3: Summary Cards */}
      {report && <MemorySummaryCards report={report} bigKeys={allBigKeys} />}
    </div>
  );
}
