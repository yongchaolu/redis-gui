import type { AnalysisReport } from '../types';

interface Props {
  report: AnalysisReport;
}

export function QPSChart({ report }: Props) {
  const metrics = report.metrics ?? {};
  const opsPerSec = parseInt(metrics['ops_per_sec'] ?? '0', 10);

  const gridCols = 6;
  const gridRows = 4;

  return (
    <div className="flex h-[300px] flex-col rounded-lg border border-border bg-panel p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-ink">Operations Per Second (QPS)</h3>
        <div className="flex gap-1.5">
          <span className="rounded bg-surfaceHigh px-2 py-0.5 text-[10px] font-bold text-white">LIVE</span>
          <span className="rounded px-2 py-0.5 text-[10px] font-bold text-mute">HISTORICAL</span>
        </div>
      </div>
      <div className="relative flex flex-1 items-end overflow-hidden rounded-b-md border-l border-b border-border">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
            gridTemplateRows: `repeat(${gridRows}, 1fr)`,
          }}
        >
          {Array.from({ length: gridCols * gridRows }).map((_, i) => (
            <div key={i} className="border-r border-t border-border" />
          ))}
        </div>
        <svg className="h-full w-full fill-none stroke-redis" viewBox="0 0 800 200" preserveAspectRatio="none">
          <defs>
            <linearGradient id="qps-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#DC2626" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#DC2626" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0 180 L50 160 L100 170 L150 120 L200 130 L250 80 L300 90 L350 40 L400 60 L450 70 L500 50 L550 90 L600 100 L650 40 L700 50 L750 30 L800 45"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d="M0 180 L50 160 L100 170 L150 120 L200 130 L250 80 L300 90 L350 40 L400 60 L450 70 L500 50 L550 90 L600 100 L650 40 L700 50 L750 30 L800 45 L800 200 L0 200 Z"
            fill="url(#qps-fill)"
            stroke="none"
          />
        </svg>
        <div className="absolute right-3 top-3 rounded bg-redis/20 px-2 py-1 text-[11px] font-bold text-redis">
          {opsPerSec.toLocaleString()} ops/s
        </div>
      </div>
    </div>
  );
}
