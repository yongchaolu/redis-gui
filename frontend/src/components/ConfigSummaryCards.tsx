import {Icon} from './Icon';

interface Props {
  info: Record<string, string>;
}

interface CardDef {
  icon: string;
  label: string;
  value: string;
  sub: string;
  color: string;
}

export function ConfigSummaryCards({info}: Props) {
  const cards: CardDef[] = [
    {
      icon: 'memory',
      label: 'Memory',
      value: info['used_memory_human'] ?? '-',
      sub: `Peak: ${info['used_memory_peak_human'] ?? '-'}`,
      color: 'text-redis',
    },
    {
      icon: 'group',
      label: 'Clients',
      value: info['connected_clients'] ?? '-',
      sub: `Max: ${info['maxclients'] ?? '-'}`,
      color: 'text-cyanx',
    },
    {
      icon: 'speed',
      label: 'CPU',
      value: `${(parseFloat(info['used_cpu_sys'] ?? '0') + parseFloat(info['used_cpu_user'] ?? '0')).toFixed(2)}s`,
      sub: `Sys: ${info['used_cpu_sys'] ?? '-'} / User: ${info['used_cpu_user'] ?? '-'}`,
      color: 'text-greenx',
    },
    {
      icon: 'favorite',
      label: 'Health',
      value: info['redis_version'] ?? '-',
      sub: `Uptime: ${formatUptime(parseInt(info['uptime_in_seconds'] ?? '0', 10))}`,
      color: 'text-amberx',
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="rounded-lg border border-border bg-panel p-4">
          <div className="mb-2 flex items-center gap-2">
            <Icon name={c.icon} className={`text-[18px] ${c.color}`} />
            <span className="text-xs font-medium uppercase tracking-wide text-mute">{c.label}</span>
          </div>
          <div className="font-mono text-lg font-bold text-ink">{c.value}</div>
          <div className="mt-1 text-[11px] text-mute">{c.sub}</div>
        </div>
      ))}
    </div>
  );
}

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`;
}
