import type { AnalysisReport } from '../types';
import { Icon } from './Icon';

interface Props {
  report: AnalysisReport;
}

export function InstanceSummary({ report }: Props) {
  const node = report.snapshot?.nodes?.[0];
  const info = node?.info ?? {};
  const isHealthy = report.severity === 'low' && !node?.error;

  const rows = [
    { label: 'OS', value: info['os'] ?? 'N/A' },
    { label: 'Process ID', value: info['process_id'] ?? 'N/A' },
    { label: 'Role', value: node?.role ?? info['redis_mode'] ?? 'N/A' },
    { label: 'Arch', value: info['arch_bits'] ? `${info['arch_bits']}bit` : 'N/A' },
  ];

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-panel p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-ink">Instance Node</h3>
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-block h-2 w-2 rounded-full ${isHealthy ? 'bg-greenx animate-ping' : 'bg-redis'}`}
          />
          <span className={`font-mono text-[11px] uppercase tracking-widest ${isHealthy ? 'text-greenx' : 'text-redis'}`}>
            {isHealthy ? 'Healthy' : 'Warning'}
          </span>
        </div>
      </div>
      <div className="mt-2 space-y-2.5">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between border-b border-border/50 pb-2 last:border-0 last:pb-0">
            <span className="text-xs text-mute">{row.label}</span>
            <span className="font-mono text-xs text-ink">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
