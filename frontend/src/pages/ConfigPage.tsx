import {useCallback, useEffect, useMemo, useState} from 'react';
import {getConfig, getServerInfo} from '../lib/api';
import {ConfigSummaryCards} from '../components/ConfigSummaryCards';
import {CategoryNav} from '../components/CategoryNav';
import {ConfigTable} from '../components/ConfigTable';
import {Icon} from '../components/Icon';
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
      const [cfg, inf] = await Promise.all([
        getConfig(connection.id),
        getServerInfo(connection.id),
      ]);
      setConfig(cfg);
      setInfo(inf);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  }, [connection.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
        <div className="flex items-center gap-2 text-mute">
          <Icon name="hourglass_empty" className="animate-spin text-[20px]" />
          <span className="text-sm">Loading configuration...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="rounded-lg border border-redis/30 bg-redis/10 px-6 py-4 text-center">
          <Icon name="error" className="text-3xl text-redis" />
          <p className="mt-2 text-sm text-redis">{error}</p>
          <button
            onClick={loadData}
            className="mt-3 rounded-md border border-border px-3 py-1.5 text-xs text-ink hover:bg-panel2"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink">Configuration</h2>
          <p className="text-xs text-mute">
            {Object.keys(config).length} parameters &middot; {connection.addresses[0] ?? 'localhost'}
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-mute transition-colors hover:bg-panel2 hover:text-ink"
        >
          <Icon name="refresh" className="text-[14px]" />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <ConfigSummaryCards info={info} />

      {/* Main: Category Nav + Config Table */}
      <div className="grid min-h-0 grid-cols-[180px_minmax(0,1fr)] gap-3">
        <div className="rounded-lg border border-border bg-panel p-3">
          <h4 className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-mute">Categories</h4>
          <CategoryNav
            categories={categories}
            active={activeCategory}
            onSelect={setActiveCategory}
            counts={counts}
          />
        </div>
        <ConfigTable params={activeParams} category={activeCategory} />
      </div>
    </div>
  );
}
