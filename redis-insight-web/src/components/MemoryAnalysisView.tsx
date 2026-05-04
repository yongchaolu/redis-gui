import React from 'react';
import { Card, Badge, cn } from '../lib/utils';
import { LayoutGrid, AlertCircle, Eye, Trash2, Search, Filter } from 'lucide-react';

const BIG_KEYS = [
  { name: 'sess:prod:u9921:active_tokens', type: 'HASH', size: '142.4 MB', elements: '1,240,591', ttl: '24h 12m', status: 'critical' },
  { name: 'cache:global:product_catalog_v2', type: 'STRING', size: '88.1 MB', elements: '1', ttl: 'Persistent', status: 'critical' },
  { name: 'idx:users:location_geo', type: 'ZSET', size: '32.4 MB', elements: '452,000', ttl: 'Persistent', status: 'warning' },
  { name: 'queue:ingest:events_buffer', type: 'LIST', size: '12.9 MB', elements: '88,102', ttl: '5m 30s', status: 'warning' },
];

export const MemoryAnalysisView = () => {
  return (
    <div className="space-y-6 animate-in slide-in-from-right-5 duration-500">
      {/* Header Info */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-h1 mb-1">Memory Analysis</h2>
          <p className="text-sm text-text-secondary">Deep inspection of 4.2GB total resident memory (RSS)</p>
        </div>
        <div className="flex gap-2">
          <Card className="py-2 px-4 flex items-center gap-4 bg-surface hover:bg-surface-hover transition-colors">
            <span className="text-[10px] font-mono text-text-secondary">FRAGMENTATION:</span>
            <span className="text-[10px] font-mono font-bold text-emerald-400">1.04x</span>
          </Card>
          <Card className="py-2 px-4 flex items-center gap-4 bg-surface hover:bg-surface-hover transition-colors">
            <span className="text-[10px] font-mono text-text-secondary">EVICTION:</span>
            <span className="text-[10px] font-mono font-bold text-white uppercase">allkeys-lru</span>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Treemap Visualization */}
        <Card className="col-span-12 lg:col-span-8 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-text-secondary">Prefix Allocation</h3>
            <Badge className="bg-obsidian border border-border">Logarithmic Scale</Badge>
          </div>
          <div className="grid grid-cols-6 grid-rows-3 gap-1 h-[320px] font-mono">
            <div className="col-span-3 row-span-2 bg-redis-red/20 border border-redis-red/40 hover:bg-redis-red/30 transition-all p-3 group relative cursor-pointer">
              <span className="text-white font-bold block text-sm">sess:*</span>
              <span className="text-[10px] text-white/50">1.8GB (42%)</span>
            </div>
            <div className="col-span-2 row-span-1 bg-blue-500/20 border border-blue-500/40 hover:bg-blue-500/30 transition-all p-3 cursor-pointer">
              <span className="text-white font-bold block text-sm">cache:prod:*</span>
              <span className="text-[10px] text-white/80">940MB</span>
            </div>
            <div className="col-span-1 row-span-2 bg-emerald-500/20 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all p-3 cursor-pointer">
              <span className="text-white font-bold block text-sm">user:*</span>
              <span className="text-[10px] text-white/80">412MB</span>
            </div>
            <div className="col-span-2 row-span-1 bg-surface-hover border border-border p-3 cursor-pointer">
              <span className="text-white font-bold block text-sm">idx:meta:*</span>
              <span className="text-[10px] text-white/80">210MB</span>
            </div>
            <div className="col-span-2 row-span-1 bg-surface-hover/50 border border-border p-3 cursor-pointer">
              <span className="text-white font-bold block text-sm">events:*</span>
              <span className="text-[10px] text-white/80">156MB</span>
            </div>
            <div className="col-span-4 flex items-center justify-center italic text-text-secondary text-[10px] bg-obsidian border border-border/50">
              Remaining 1,402 prefixes &lt; 1% each
            </div>
          </div>
        </Card>

        {/* Data Types */}
        <Card className="col-span-12 lg:col-span-4 flex flex-col">
          <h3 className="text-xs font-mono uppercase tracking-widest text-text-secondary mb-6">Type Distribution</h3>
          <div className="space-y-6 flex-grow">
            {[
              { type: 'STRING', size: '2.1GB', pct: 50, color: 'bg-redis-red' },
              { type: 'HASH', size: '1.2GB', pct: 28, color: 'bg-blue-500' },
              { type: 'SET', size: '450MB', pct: 11, color: 'bg-emerald-500' },
              { type: 'LIST', size: '320MB', pct: 8, color: 'bg-yellow-500' },
              { type: 'ZSET', size: '130MB', pct: 3, color: 'bg-text-secondary' },
            ].map(item => (
              <div key={item.type} className="space-y-2">
                <div className="flex justify-between font-mono text-[10px]">
                  <span className="text-white font-bold">{item.type}</span>
                  <span className="text-text-secondary">{item.size} ({item.pct}%)</span>
                </div>
                <div className="w-full bg-obsidian h-1.5 rounded-full">
                  <div className={cn("h-full rounded-full transition-all duration-1000", item.color)} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 pt-4 border-t border-border/30">
            <button className="w-full text-center font-mono text-blue-400 text-[10px] uppercase tracking-widest hover:text-white transition-colors">Download CSV Report</button>
          </div>
        </Card>
      </div>

      {/* Big Keys Report */}
      <Card className="p-0 overflow-hidden">
        <div className="p-4 bg-surface-hover/30 border-b border-border flex justify-between items-center">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-redis-red" />
            <h3 className="text-h2">Big Keys Report</h3>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input 
                className="bg-obsidian border border-border rounded px-3 py-1.5 pl-9 text-xs focus:ring-1 focus:ring-blue-500 outline-none w-48 placeholder-text-secondary"
                placeholder="Filter by pattern..."
              />
            </div>
            <button className="flex items-center gap-2 bg-surface hover:bg-surface-hover border border-border rounded px-3 py-1.5 text-[10px] font-mono transition-colors">
              <Filter className="w-3.5 h-3.5" />
              SORT BY SIZE
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-sm">
            <thead className="bg-obsidian text-text-secondary">
              <tr className="uppercase text-[10px] tracking-widest border-b border-border">
                <th className="p-4">Key Name</th>
                <th className="p-4">Type</th>
                <th className="p-4 text-right">Elements</th>
                <th className="p-4 text-right">Size</th>
                <th className="p-4 text-right text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {BIG_KEYS.map((key) => (
                <tr key={key.name} className="hover:bg-surface-hover/50 transition-colors group">
                  <td className="p-4 text-white font-medium">{key.name}</td>
                  <td className="p-4"><Badge className="bg-surface-hover text-white">{key.type}</Badge></td>
                  <td className="p-4 text-right text-text-secondary">{key.elements}</td>
                  <td className={cn("p-4 text-right font-bold",
                    key.status === 'critical' ? 'text-redis-red' : 'text-yellow-500'
                  )}>{key.size}</td>
                  <td className="p-4">
                    <div className="flex gap-2 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1 hover:text-white"><Eye className="w-3.5 h-3.5" /></button>
                      <button className="p-1 hover:text-redis-red"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
