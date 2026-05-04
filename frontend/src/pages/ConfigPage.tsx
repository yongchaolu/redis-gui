import {useCallback, useEffect, useMemo, useState} from 'react';
import {RefreshCcw, Loader2, AlertCircle} from 'lucide-react';
import {getConfig, getServerInfo} from '../lib/api';
import {ConfigSummaryCards} from '../components/ConfigSummaryCards';
import {CategoryNav} from '../components/CategoryNav';
import {ConfigTable} from '../components/ConfigTable';
import type {ConnectionProfile} from '../types';

interface Props {
  connection: ConnectionProfile;
}

const CATEGORY_RULES: Array<{match: (k: string) => boolean; category: string}> = [
  {match: (k) => /^(maxmemory|maxmemory-|hash|max-intset|list-max-|set-max-|zset-max-|hll|stream-node|maxstring)/.test(k), category: 'memory'},
  {match: (k) => /^(save|appendonly|appendfsync|appendfilename|appenddir|rdb|rdbcompression|rdbchecksum|aof|auto-aof|aof-use-rdb)/.test(k), category: 'persistence'},
  {match: (k) => /^(replica|replication|repl-|masterauth|masteruser|replicaof|slaveof|min-replicas|maxmemory-pct)/.test(k), category: 'replication'},
  {match: (k) => /^(maxclients|client-output|client-query|client-no|timeout|tcp-keepalive|tcp-backlog)/.test(k), category: 'clients'},
  {match: (k) => /^(requirepass|rename-command|acl-|protected-mode|bind|tls-|ssl)/.test(k), category: 'security'},
  {match: (k) => /^(hz|dynamic-hz|slowlog|latency|lfu|lru|activerehashing|io-threads)/.test(k), category: 'performance'},
];

function classifyConfig(key: string): string {
  for (const rule of CATEGORY_RULES) {
    if (rule.match(key)) return rule.category;
  }
  return 'server';
}

export function ConfigPage({connection}: Props) {
  const [config, setConfig] = useState<Record<string, string>>({});
  const [info, setInfo] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('server');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [cfg, inf] = await Promise.all([getConfig(connection.id), getServerInfo(connection.id)]);
      setConfig(cfg);
      setInfo(inf);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  }, [connection.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const {categories, categorized, counts} = useMemo(() => {
    const catMap: Record<string, Array<[string, string]>> = {};
    const entries = Object.entries(config).sort(([a], [b]) => a.localeCompare(b));
    for (const [key, value] of entries) {
      const cat = classifyConfig(key);
      if (!catMap[cat]) catMap[cat] = [];
      catMap[cat].push([key, value]);
    }
    const cats = Object.keys(catMap).sort((a, b) => {
      const order = ['server', 'memory', 'persistence', 'replication', 'clients', 'security', 'performance'];
      return order.indexOf(a) - order.indexOf(b);
    });
    const cnts: Record<string, number> = {};
    for (const c of cats) cnts[c] = catMap[c].length;
    return {categories: cats, categorized: catMap, counts: cnts};
  }, [config]);

  const activeParams = categorized[activeCategory] ?? [];

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center gap-2" style={{color: 'var(--color-text-secondary)'}}>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading configuration...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="rounded-lg px-6 py-4 text-center" style={{border: '1px solid rgba(220,38,38,0.3)', background: 'rgba(220,38,38,0.1)'}}>
          <AlertCircle className="w-8 h-8 mx-auto" style={{color: 'var(--color-redis-red)'}} />
          <p className="mt-2 text-sm" style={{color: 'var(--color-redis-red)'}}>{error}</p>
          <button onClick={loadData} className="mt-3 rounded-md px-3 py-1.5 text-xs text-white" style={{border: '1px solid var(--color-border)'}}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Configuration</h2>
          <p className="text-xs" style={{color: 'var(--color-text-secondary)'}}>
            {Object.keys(config).length} parameters &middot; {connection.addresses[0] ?? 'localhost'}
          </p>
        </div>
        <button onClick={loadData} className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-colors" style={{border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)'}}>
          <RefreshCcw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <ConfigSummaryCards info={info} />

      <div className="grid min-h-0 grid-cols-[180px_minmax(0,1fr)] gap-3">
        <div className="rounded-lg p-3" style={{background: 'var(--color-surface)', border: '1px solid var(--color-border)'}}>
          <h4 className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest" style={{color: 'var(--color-text-secondary)'}}>Categories</h4>
          <CategoryNav categories={categories} active={activeCategory} onSelect={setActiveCategory} counts={counts} />
        </div>
        <ConfigTable params={activeParams} category={activeCategory} />
      </div>
    </div>
  );
}
