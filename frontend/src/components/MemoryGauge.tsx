import type { AnalysisReport } from '../types';

interface Props {
  report: AnalysisReport;
}

function fmtBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)}MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${bytes}B`;
}

export function MemoryGauge({ report }: Props) {
  const memStats = report.snapshot?.nodes?.[0]?.memoryStats ?? {};
  const info = report.snapshot?.nodes?.[0]?.info ?? {};

  const usedMemory = parseFloat(memStats['total.allocated'] ?? info['used_memory'] ?? '0');
  const maxMemory = parseFloat(info['maxmemory'] ?? '0');
  const fragmentation = parseFloat(info['mem_fragmentation_ratio'] ?? '0');
  const peakMemory = parseFloat(info['used_memory_peak'] ?? '0');

  const ratio = maxMemory > 0 ? usedMemory / maxMemory : 0;
  const percentage = Math.min(ratio * 100, 100);

  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col rounded-lg border border-border bg-panel p-4">
      <h3 className="mb-3 text-center text-base font-semibold text-ink">Memory Usage</h3>
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="relative h-40 w-40">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="#334155" strokeWidth="8" />
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="#DC2626"
              strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-semibold text-white">{percentage.toFixed(0)}%</span>
            {maxMemory > 0 && (
              <span className="font-mono text-[11px] text-mute">
                {fmtBytes(usedMemory)} / {fmtBytes(maxMemory)}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="mt-3 space-y-1.5 border-t border-border pt-3">
        {fragmentation > 0 && (
          <div className="flex justify-between text-xs">
            <span className="text-mute">Fragmentation Ratio</span>
            <span className="font-mono text-ink">{fragmentation.toFixed(2)}</span>
          </div>
        )}
        {peakMemory > 0 && (
          <div className="flex justify-between text-xs">
            <span className="text-mute">Peak Memory</span>
            <span className="font-mono text-ink">{fmtBytes(peakMemory)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
