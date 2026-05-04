import {HardDrive, Users, Cpu, Heart} from 'lucide-react';

interface Props {
  info: Record<string, string>;
}

const ICONS = [HardDrive, Users, Cpu, Heart];
const COLORS = ['text-red-400', 'text-blue-400', 'text-green-400', 'text-yellow-400'];

export function ConfigSummaryCards({info}: Props) {
  const cards = [
    {label: 'Memory', value: info['used_memory_human'] ?? '-', sub: `Peak: ${info['used_memory_peak_human'] ?? '-'}`},
    {label: 'Clients', value: info['connected_clients'] ?? '-', sub: `Max: ${info['maxclients'] ?? '-'}`},
    {label: 'CPU', value: `${(parseFloat(info['used_cpu_sys'] ?? '0') + parseFloat(info['used_cpu_user'] ?? '0')).toFixed(2)}s`, sub: `Sys: ${info['used_cpu_sys'] ?? '-'} / User: ${info['used_cpu_user'] ?? '-'}`},
    {label: 'Health', value: info['redis_version'] ?? '-', sub: `Uptime: ${formatUptime(parseInt(info['uptime_in_seconds'] ?? '0', 10))}`},
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {cards.map((c, i) => {
        const Icon = ICONS[i];
        return (
          <div key={c.label} className="rounded-lg p-4" style={{background: 'var(--color-surface)', border: '1px solid var(--color-border)'}}>
            <div className="mb-2 flex items-center gap-2">
              <Icon className={`w-4 h-4 ${COLORS[i]}`} />
              <span className="text-xs font-medium uppercase tracking-wide" style={{color: 'var(--color-text-secondary)'}}>{c.label}</span>
            </div>
            <div className="font-mono text-lg font-bold text-white">{c.value}</div>
            <div className="mt-1 text-[11px]" style={{color: 'var(--color-text-secondary)'}}>{c.sub}</div>
          </div>
        );
      })}
    </div>
  );
}

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`;
}
