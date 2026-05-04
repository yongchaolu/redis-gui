import {useCallback, useEffect, useMemo, useState} from 'react';
import {Search, Filter, Eye, Trash2, AlertCircle} from 'lucide-react';
import {Card, Badge, cn} from '../lib/utils';
import {runAnalysis} from '../lib/api';
import type {ConnectionProfile, AnalysisReport} from '../types';

interface Props {
  connection: ConnectionProfile;
}

export function MemoryAnalysisPage({connection}: Props) {
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sortBySize, setSortBySize] = useState(true);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await runAnalysis(connection.id);
      setReport(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析失败');
    } finally {
      setLoading(false);
    }
  }, [connection.id]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="animate-pulse font-mono text-sm" style={{color: 'var(--color-text-secondary)'}}>Analyzing memory...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="rounded-lg px-6 py-4 text-center" style={{border: '1px solid rgba(220,38,38,0.3)', background: 'rgba(220,38,38,0.1)'}}>
          <p className="text-sm" style={{color: 'var(--color-redis-red)'}}>{error}</p>
          <button onClick={loadReport} className="mt-3 rounded-md px-3 py-1.5 text-xs" style={{border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)'}}>Retry</button>
        </div>
      </div>
    );
  }

  if (!report) return null;

  const allBigKeys = report.snapshot?.nodes?.flatMap((n) => n.bigKeys ?? []) ?? [];
  const info = report.snapshot?.nodes?.[0]?.info ?? {};
  const memStats = report.snapshot?.nodes?.[0]?.memoryStats ?? {};
  const fragRatio = memStats['mem_fragmentation_ratio'] ?? info['mem_fragmentation_ratio'] ?? '-';
  const maxmemoryPolicy = report.metrics?.['maxmemory_policy'] ?? '-';
  const usedMemoryHuman = info['used_memory_human'] ?? '-';

  const filteredKeys = useMemo(() => {
    let keys = allBigKeys;
    if (search) {
      const q = search.toLowerCase();
      keys = keys.filter((k) => k.name.toLowerCase().includes(q) || k.type.toLowerCase().includes(q));
    }
    return [...keys].sort((a, b) => sortBySize ? b.size - a.size : b.length - a.length);
  }, [allBigKeys, search, sortBySize]);

  const typeDistribution = useMemo(() => {
    const map: Record<string, number> = {};
    for (const k of allBigKeys) map[k.type] = (map[k.type] ?? 0) + k.size;
    const total = Object.values(map).reduce((s, v) => s + v, 0) || 1;
    const colors: Record<string, string> = {string: '#dc2626', hash: '#3b82f6', set: '#10b981', list: '#eab308', zset: '#94a3b8'};
    return Object.entries(map).sort(([, a], [, b]) => b - a).map(([type, size]) => ({
      type: type.toUpperCase(), size, pct: Math.round((size / total) * 100), color: colors[type] ?? '#94a3b8',
    }));
  }, [allBigKeys]);

  const treemapData = useMemo(() => {
    const prefixMap: Record<string, number> = {};
    for (const k of allBigKeys) {
      const prefix = k.name.split(':')[0] || 'other';
      prefixMap[prefix] = (prefixMap[prefix] ?? 0) + k.size;
    }
    return Object.entries(prefixMap).sort(([, a], [, b]) => b - a).slice(0, 6).map(([prefix, size]) => ({prefix, size}));
  }, [allBigKeys]);

  const totalTreemapSize = treemapData.reduce((s, d) => s + d.size, 0) || 1;
  const treemapColors = ['rgba(220,38,38,0.2)', 'rgba(59,130,246,0.2)', 'rgba(16,185,129,0.2)', 'rgba(245,158,11,0.2)', 'rgba(148,163,184,0.2)', 'rgba(139,92,246,0.2)'];
  const treemapBorders = ['rgba(220,38,38,0.4)', 'rgba(59,130,246,0.4)', 'rgba(16,185,129,0.4)', 'rgba(245,158,11,0.4)', 'rgba(148,163,184,0.4)', 'rgba(139,92,246,0.4)'];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Memory Analysis</h2>
          <p className="text-sm" style={{color: 'var(--color-text-secondary)'}}>Deep inspection of {usedMemoryHuman} total resident memory</p>
        </div>
        <div className="flex gap-2">
          <Card className="py-2 px-4 flex items-center gap-4" style={{background: 'var(--color-surface)'}}>
            <span className="text-[10px] font-mono" style={{color: 'var(--color-text-secondary)'}}>FRAGMENTATION:</span>
            <span className="text-[10px] font-mono font-bold text-emerald-400">{fragRatio}x</span>
          </Card>
          <Card className="py-2 px-4 flex items-center gap-4" style={{background: 'var(--color-surface)'}}>
            <span className="text-[10px] font-mono" style={{color: 'var(--color-text-secondary)'}}>EVICTION:</span>
            <span className="text-[10px] font-mono font-bold text-white uppercase">{maxmemoryPolicy}</span>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-12 lg:col-span-8 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-mono uppercase tracking-widest" style={{color: 'var(--color-text-secondary)'}}>Prefix Allocation</h3>
            <Badge style={{background: 'var(--color-obsidian)', border: '1px solid var(--color-border)'}}>Logarithmic Scale</Badge>
          </div>
          {treemapData.length > 0 ? (
            <div className="grid grid-cols-6 grid-rows-3 gap-1 h-[320px] font-mono">
              {treemapData.map((item, i) => {
                const pct = item.size / totalTreemapSize;
                const colSpan = i === 0 ? 'col-span-3' : i === 1 ? 'col-span-2' : i === 2 ? 'col-span-1' : 'col-span-2';
                const rowSpan = i === 0 ? 'row-span-2' : i === 2 ? 'row-span-2' : 'row-span-1';
                return (
                  <div key={item.prefix} className={cn(colSpan, rowSpan, "border hover:brightness-125 transition-all p-3 cursor-pointer rounded")} style={{background: treemapColors[i], borderColor: treemapBorders[i]}}>
                    <span className="text-white font-bold block text-sm">{item.prefix}:*</span>
                    <span className="text-[10px] text-white/50">{formatBytes(item.size)} ({Math.round(pct * 100)}%)</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[320px] font-mono text-sm" style={{color: 'var(--color-text-secondary)'}}>No big keys data available</div>
          )}
        </Card>

        <Card className="col-span-12 lg:col-span-4 flex flex-col">
          <h3 className="text-xs font-mono uppercase tracking-widest mb-6" style={{color: 'var(--color-text-secondary)'}}>Type Distribution</h3>
          {typeDistribution.length > 0 ? (
            <div className="space-y-6 flex-grow">
              {typeDistribution.map((item) => (
                <div key={item.type} className="space-y-2">
                  <div className="flex justify-between font-mono text-[10px]">
                    <span className="text-white font-bold">{item.type}</span>
                    <span style={{color: 'var(--color-text-secondary)'}}>{formatBytes(item.size)} ({item.pct}%)</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full" style={{background: 'var(--color-obsidian)'}}>
                    <div className="h-full rounded-full transition-all duration-1000" style={{width: `${item.pct}%`, background: item.color}} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-grow flex items-center justify-center font-mono text-sm" style={{color: 'var(--color-text-secondary)'}}>No data</div>
          )}
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 flex justify-between items-center" style={{borderBottom: '1px solid var(--color-border)', background: 'rgba(45,55,72,0.3)'}}>
          <div className="flex items-center gap-3">
            <AlertCircle className="w-4 h-4" style={{color: 'var(--color-redis-red)'}} />
            <h3 className="text-sm font-semibold text-white">Big Keys Report</h3>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{color: 'var(--color-text-secondary)'}} />
              <input className="rounded px-3 py-1.5 pl-9 text-xs outline-none w-48" style={{background: 'var(--color-obsidian)', border: '1px solid var(--color-border)'}} placeholder="Filter by pattern..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <button onClick={() => setSortBySize(!sortBySize)} className="flex items-center gap-2 rounded px-3 py-1.5 text-[10px] font-mono transition-colors" style={{background: 'var(--color-surface)', border: '1px solid var(--color-border)'}}>
              <Filter className="w-3.5 h-3.5" /> SORT BY {sortBySize ? 'SIZE' : 'LENGTH'}
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-sm">
            <thead style={{background: 'var(--color-obsidian)', color: 'var(--color-text-secondary)'}}>
              <tr className="uppercase text-[10px] tracking-widest" style={{borderBottom: '1px solid var(--color-border)'}}>
                <th className="p-4">Key Name</th>
                <th className="p-4">Type</th>
                <th className="p-4 text-right">Elements</th>
                <th className="p-4 text-right">Size</th>
                <th className="p-4 text-right">TTL</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredKeys.slice(0, 50).map((key, idx) => (
                <tr key={idx} className="group transition-colors" style={{borderBottom: '1px solid rgba(51,65,85,0.3)'}}>
                  <td className="p-4 text-white font-medium">{key.name}</td>
                  <td className="p-4"><Badge style={{background: 'var(--color-surface-hover)', color: 'white'}}>{key.type}</Badge></td>
                  <td className="p-4 text-right" style={{color: 'var(--color-text-secondary)'}}>{key.length.toLocaleString()}</td>
                  <td className={cn("p-4 text-right font-bold", key.size > 10 * 1024 * 1024 ? 'text-red-500' : 'text-yellow-500')}>{formatBytes(key.size)}</td>
                  <td className="p-4 text-right font-mono" style={{color: 'var(--color-text-secondary)'}}>{key.ttl > 0 ? formatTTL(key.ttl) : 'Persistent'}</td>
                  <td className="p-4">
                    <div className="flex gap-2 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1 hover:text-white" style={{color: 'var(--color-text-secondary)'}}><Eye className="w-3.5 h-3.5" /></button>
                      <button className="p-1 hover:text-red-500" style={{color: 'var(--color-text-secondary)'}}><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredKeys.length === 0 && (
                <tr><td colSpan={6} className="p-6 text-center" style={{color: 'var(--color-text-secondary)'}}>No big keys found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + ' GB';
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
  if (bytes >= 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return bytes + ' B';
}

function formatTTL(seconds: number): string {
  if (seconds >= 86400) return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`;
  if (seconds >= 3600) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  if (seconds >= 60) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${seconds}s`;
}
