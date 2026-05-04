import type { BigKey, AnalysisReport } from '../types';
import { Icon } from './Icon';

interface Props {
  report: AnalysisReport;
  bigKeys: BigKey[];
}

export function MemorySummaryCards({ report, bigKeys }: Props) {
  const info = report.snapshot?.nodes?.[0]?.info ?? {};
  const fragmentation = parseFloat(info['mem_fragmentation_ratio'] ?? '1');
  const efficiency = Math.max(0, Math.min(100, (1 - Math.abs(fragmentation - 1)) * 100));

  const withTTL = bigKeys.filter((k) => k.ttl > 0).length;
  const expiryCoverage = bigKeys.length > 0 ? (withTTL / bigKeys.length * 100) : 0;

  const totalSize = bigKeys.reduce((sum, k) => sum + k.size, 0);
  const avgSize = bigKeys.length > 0 ? totalSize / bigKeys.length : 0;

  function fmtSize(bytes: number): string {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${bytes} B`;
  }

  const cards = [
    {
      label: 'Memory Efficiency',
      value: `${efficiency.toFixed(1)}%`,
      icon: 'speed',
      iconBg: 'bg-redis/15',
      iconColor: 'text-redis',
    },
    {
      label: 'Expiry Coverage',
      value: `${expiryCoverage.toFixed(1)}%`,
      icon: 'timer',
      iconBg: 'bg-cyanx/15',
      iconColor: 'text-cyanx',
    },
    {
      label: 'Avg Key Size',
      value: fmtSize(avgSize),
      icon: 'data_usage',
      iconBg: 'bg-amberx/15',
      iconColor: 'text-amberx',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {cards.map((card) => (
        <div key={card.label} className="flex items-center gap-3 rounded-lg border border-border bg-panel p-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${card.iconBg}`}>
            <Icon name={card.icon} className={`${card.iconColor} text-[20px]`} />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-mute">{card.label}</div>
            <div className="mt-0.5 text-lg font-semibold text-white">{card.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
