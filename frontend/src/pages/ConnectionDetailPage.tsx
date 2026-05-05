import {useCallback, useEffect, useRef, useState} from 'react';
import {AreaChart, Area, ResponsiveContainer, CartesianGrid, Tooltip, PieChart, Pie, Cell} from 'recharts';
import {Users, Database, Zap, Save} from 'lucide-react';
import {Card, Badge} from '../lib/utils';
import {analyze, runAnalysis, getRealtimeOPS} from '../lib/api';
import {ClusterTopology} from '../components/ClusterTopology';
import {RiskQueue} from '../components/RiskQueue';
import {useToast} from '../components/Toast';
import type {ConnectionProfile, AnalysisReport} from '../types';

interface Props {
  connection: ConnectionProfile;
  connections: ConnectionProfile[];
  onBack: () => void;
  onSelectConnection: (id: string) => void;
  onDelete: (id: string) => void;
  onReportLoaded?: (report: AnalysisReport) => void;
  refreshKey?: number;
}

export function ConnectionDetailPage({connection, onReportLoaded, refreshKey}: Props) {
  const {showToast} = useToast();
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [qpsHistory, setQpsHistory] = useState<number[]>([]);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await analyze(connection.id);
      setReport(result);
      onReportLoaded?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '分析失败');
    } finally {
      setLoading(false);
    }
  }, [connection.id, onReportLoaded]);

  const handleSaveReport = useCallback(async () => {
    setSaving(true);
    try {
      await runAnalysis(connection.id);
      showToast('Report saved to history', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  }, [connection.id, showToast]);

  useEffect(() => {
    loadReport();
  }, [loadReport, refreshKey]);

  // QPS polling — collect real data every 2 seconds
  useEffect(() => {
    let active = true;
    const poll = async () => {
      try {
        const ops = await getRealtimeOPS(connection.id);
        if (active) {
          setQpsHistory((prev) => {
            const next = [...prev, ops];
            return next.length > 20 ? next.slice(next.length - 20) : next;
          });
        }
      } catch {
        // ignore polling errors
      }
    };
    poll();
    const id = setInterval(poll, 2000);
    return () => { active = false; clearInterval(id); };
  }, [connection.id]);

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="animate-pulse font-mono text-sm" style={{color: 'var(--color-text-secondary)'}}>
          Analyzing {connection.name}...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="rounded-lg px-6 py-4 text-center" style={{border: '1px solid rgba(220,38,38,0.3)', background: 'rgba(220,38,38,0.1)'}}>
          <p className="text-sm" style={{color: 'var(--color-redis-red)'}}>{error}</p>
          <button onClick={loadReport} className="mt-3 rounded-md px-3 py-1.5 text-xs" style={{border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)'}}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!report) return null;

  const node = report.snapshot?.nodes?.[0];
  const info = node?.info ?? {};
  const memStats = node?.memoryStats ?? {};
  const commandStats = node?.commandStats ?? [];

  const connectedClients = info['connected_clients'] ?? '-';
  const keyspaceHits = parseInt(info['keyspace_hits'] ?? '0', 10);
  const keyspaceMisses = parseInt(info['keyspace_misses'] ?? '0', 10);
  const hitRate = keyspaceHits + keyspaceMisses > 0
    ? ((keyspaceHits / (keyspaceHits + keyspaceMisses)) * 100).toFixed(1) + '%'
    : '-';
  const totalCommands = info['total_commands_processed'] ?? '-';
  const usedMemoryHuman = info['used_memory_human'] ?? '-';
  const usedMemoryPeak = info['used_memory_peak_human'] ?? '-';
  const memFragRatio = memStats['mem_fragmentation_ratio'] ?? info['mem_fragmentation_ratio'] ?? '-';

  const qpsData = qpsHistory.length > 0
    ? qpsHistory.map((qps, i) => ({time: i, qps}))
    : [{time: 0, qps: parseInt(report.metrics?.['instantaneous_ops_per_sec'] ?? info['instantaneous_ops_per_sec'] ?? '0', 10)}];

  const usedMemory = parseInt(info['used_memory'] ?? '0', 10);
  const maxMemory = parseInt(info['maxmemory'] ?? '0', 10);
  const memPercent = maxMemory > 0 ? Math.round((usedMemory / maxMemory) * 100) : 0;

  const totalCalls = commandStats.reduce((sum, s) => sum + s.calls, 0);

  return (
    <div className="space-y-6">
      {/* Top Section */}
      <div className="flex justify-end">
        <button onClick={handleSaveReport} disabled={saving} className="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs text-white transition hover:brightness-110 disabled:opacity-50" style={{background: 'var(--color-redis-red)'}}>
          <Save className="w-3.5 h-3.5" />
          {saving ? 'Saving...' : 'Save Report'}
        </button>
      </div>
      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-12 lg:col-span-4" style={{borderLeft: '4px solid #10b981'}}>
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-semibold text-white">Instance Node</h3>
            <div className="flex items-center gap-2 text-emerald-400">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              <span className="text-[10px] font-mono tracking-widest font-bold">HEALTHY</span>
            </div>
          </div>
          <div className="space-y-3 font-mono text-sm">
            {[
              {label: 'OS', value: info['os'] ?? '-'},
              {label: 'Process ID', value: info['process_id'] ?? '-'},
              {label: 'Role', value: info['role'] ?? '-'},
              {label: 'Arch', value: info['arch'] ?? info['gcc_version'] ?? '-'},
            ].map((item) => (
              <div key={item.label} className="flex justify-between pb-1" style={{borderBottom: '1px solid rgba(51,65,85,0.5)'}}>
                <span style={{color: 'var(--color-text-secondary)'}}>{item.label}</span>
                <span className="text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>

        <div className="col-span-12 lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-[10px] uppercase tracking-widest" style={{color: 'var(--color-text-secondary)'}}>Clients</span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <div className="mt-4">
              <div className="text-3xl font-mono font-bold">{connectedClients}</div>
              <div className="text-[10px] font-mono text-emerald-400">Connected</div>
            </div>
          </Card>
          <Card className="flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-[10px] uppercase tracking-widest" style={{color: 'var(--color-text-secondary)'}}>Hit Rate</span>
              <Database className="w-4 h-4" style={{color: 'var(--color-redis-red)'}} />
            </div>
            <div className="mt-4">
              <div className="text-3xl font-mono font-bold">{hitRate}</div>
              <div className="text-[10px] font-mono" style={{color: 'var(--color-text-secondary)'}}>Keyspace Efficiency</div>
            </div>
          </Card>
          <Card className="flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-[10px] uppercase tracking-widest" style={{color: 'var(--color-text-secondary)'}}>Total Commands</span>
              <Zap className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="mt-4">
              <div className="text-3xl font-mono font-bold">{formatNumber(totalCommands)}</div>
              <div className="text-[10px] font-mono" style={{color: 'var(--color-text-secondary)'}}>Since Uptime</div>
            </div>
          </Card>
        </div>
      </div>

      {/* Main Analysis Section */}
      <div className="grid grid-cols-12 gap-4">
        <Card className="col-span-12 lg:col-span-8 h-[350px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-semibold text-white">Operations Per Second (QPS)</h3>
            <div className="flex gap-2">
              <Badge className="border" style={{background: 'rgba(220,38,38,0.2)', color: 'var(--color-redis-red)', borderColor: 'rgba(220,38,38,0.4)'}}>Live</Badge>
              <Badge style={{background: 'var(--color-border)', color: 'var(--color-text-secondary)'}}>Historical</Badge>
            </div>
          </div>
          <div className="flex-grow w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={qpsData}>
                <defs>
                  <linearGradient id="colorQps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                <Tooltip contentStyle={{backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '4px'}} itemStyle={{color: '#fff'}} />
                <Area type="monotone" dataKey="qps" stroke="#dc2626" fillOpacity={1} fill="url(#colorQps)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="col-span-12 lg:col-span-4 flex flex-col items-center">
          <h3 className="text-sm font-semibold text-white mb-8">Memory Usage</h3>
          <div className="relative w-48 h-48 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[{value: memPercent || 1}, {value: 100 - (memPercent || 1)}]}
                  cx="50%" cy="50%" innerRadius={60} outerRadius={80}
                  startAngle={180} endAngle={-180} dataKey="value" stroke="none"
                >
                  <Cell fill="#dc2626" />
                  <Cell fill="#334155" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold">{memPercent || '-'}%</span>
              <span className="text-[10px] font-mono uppercase" style={{color: 'var(--color-text-secondary)'}}>
                {usedMemoryHuman} {maxMemory > 0 ? `/ ${formatBytes(maxMemory)}` : ''}
              </span>
            </div>
          </div>
          <div className="w-full space-y-3 pt-4" style={{borderTop: '1px solid rgba(51,65,85,0.5)'}}>
            <div className="flex justify-between items-center text-sm">
              <span style={{color: 'var(--color-text-secondary)'}}>Fragmentation Ratio</span>
              <span className="font-mono text-white">{memFragRatio}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span style={{color: 'var(--color-text-secondary)'}}>Peak Memory</span>
              <span className="font-mono text-white">{usedMemoryPeak}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Commands Table */}
      {commandStats.length > 0 && (
        <Card className="overflow-hidden p-0">
          <div className="px-6 py-3 flex justify-between items-center" style={{borderBottom: '1px solid var(--color-border)', background: 'rgba(45,55,72,0.5)'}}>
            <h3 className="text-sm font-mono font-bold uppercase tracking-widest">Frequent Commands</h3>
            <span className="text-[10px] font-mono" style={{color: 'var(--color-text-secondary)'}}>Since Uptime</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-sm">
              <thead>
                <tr style={{background: 'rgba(15,23,42,0.5)', color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)'}}>
                  <th className="px-6 py-4 font-medium uppercase tracking-tighter">Command</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-tighter">Calls</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-tighter text-right">Total Time (us)</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-tighter text-right">Usage %</th>
                </tr>
              </thead>
              <tbody>
                {[...commandStats].sort((a, b) => b.calls - a.calls).slice(0, 10).map((cmd) => {
                  const usage = totalCalls > 0 ? Math.round((cmd.calls / totalCalls) * 100) : 0;
                  return (
                    <tr key={cmd.name} className="transition-colors" style={{borderBottom: '1px solid rgba(51,65,85,0.3)'}}>
                      <td className="px-6 py-4 font-bold text-white">{cmd.name}</td>
                      <td className="px-6 py-4 text-slate-300">{cmd.calls.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right text-slate-300">{cmd.usec.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 justify-end">
                          <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{background: 'var(--color-border)'}}>
                            <div className="bg-blue-500 h-full" style={{width: `${usage}%`}} />
                          </div>
                          <span className="text-[10px] w-8" style={{color: 'var(--color-text-secondary)'}}>{usage}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {report.snapshot?.cluster && (
        <ClusterTopology cluster={report.snapshot.cluster} nodes={report.snapshot.nodes} />
      )}

      {report.findings && report.findings.length > 0 && (
        <RiskQueue findings={report.findings} />
      )}
    </div>
  );
}

function formatNumber(val: string): string {
  const n = parseInt(val, 10);
  if (isNaN(n)) return val;
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function formatBytes(bytes: number): string {
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + ' GB';
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
  return (bytes / 1024).toFixed(0) + ' KB';
}
