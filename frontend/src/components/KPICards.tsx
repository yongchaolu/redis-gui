import type { AnalysisReport } from '../types';
import { Icon } from './Icon';

interface Props {
  report: AnalysisReport;
}

interface KPICard {
  label: string;
  value: string;
  subtitle: string;
  icon: string;
  iconColor: string;
}

function fmtNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function KPICards({ report }: Props) {
  const nodes = report.snapshot?.nodes ?? [];
  const info = nodes[0]?.info ?? {};
  const metrics = report.metrics ?? {};

  const clients = parseInt(info['connected_clients'] ?? '0', 10);
  const hits = parseFloat(info['keyspace_hits'] ?? '0');
  const misses = parseFloat(info['keyspace_misses'] ?? '0');
  const hitRate = hits + misses > 0 ? (hits / (hits + misses) * 100) : 0;
  const totalCommands = parseInt(metrics['total_commands'] ?? '0', 10);

  const cards: KPICard[] = [
    {
      label: 'Clients',
      value: fmtNumber(clients),
      subtitle: 'Connected',
      icon: 'group',
      iconColor: 'text-cyanx',
    },
    {
      label: 'Hit Rate',
      value: `${hitRate.toFixed(1)}%`,
      subtitle: 'Keyspace Efficiency',
      icon: 'target',
      iconColor: 'text-redis',
    },
    {
      label: 'Total Commands',
      value: fmtNumber(totalCommands),
      subtitle: 'Since Uptime',
      icon: 'terminal',
      iconColor: 'text-cyanx',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {cards.map((card) => (
        <div key={card.label} className="flex flex-col justify-between rounded-lg border border-border bg-panel p-4">
          <div className="flex items-start justify-between">
            <span className="text-[11px] uppercase tracking-wider text-mute">{card.label}</span>
            <Icon name={card.icon} className={`${card.iconColor} text-[18px]`} />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-semibold text-white">{card.value}</div>
            <div className="mt-0.5 font-mono text-[11px] text-mute">{card.subtitle}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
