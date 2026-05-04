import type { BigKey } from '../types';

interface Props {
  bigKeys: BigKey[];
}

const TYPE_COLORS: Record<string, { bar: string; text: string }> = {
  string: { bar: 'bg-redis', text: 'text-redis' },
  hash: { bar: 'bg-cyanx', text: 'text-cyanx' },
  set: { bar: 'bg-amberx', text: 'text-amberx' },
  list: { bar: 'bg-greenx', text: 'text-greenx' },
  zset: { bar: 'bg-mute', text: 'text-mute' },
};

export function DataTypeDistribution({ bigKeys }: Props) {
  const typeMap = new Map<string, number>();
  for (const key of bigKeys) {
    typeMap.set(key.type, (typeMap.get(key.type) ?? 0) + key.size);
  }

  const totalSize = Array.from(typeMap.values()).reduce((sum, v) => sum + v, 0);
  const sorted = Array.from(typeMap.entries())
    .sort((a, b) => b[1] - a[1]);

  function fmtSize(bytes: number): string {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)}MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${bytes}B`;
  }

  if (sorted.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border border-border bg-panel text-sm text-mute">
        No data
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-panel p-4">
      <h3 className="mb-3 text-sm font-semibold text-ink">Data Type Distribution</h3>
      <div className="space-y-3">
        {sorted.map(([type, size]) => {
          const pct = totalSize > 0 ? (size / totalSize * 100) : 0;
          const colors = TYPE_COLORS[type] ?? { bar: 'bg-mute', text: 'text-mute' };
          return (
            <div key={type}>
              <div className="mb-1 flex items-center justify-between">
                <span className={`text-xs font-bold uppercase ${colors.text}`}>{type}</span>
                <span className="font-mono text-[11px] text-mute">{fmtSize(size)} ({pct.toFixed(0)}%)</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surfaceHigh">
                <div className={`h-full rounded-full ${colors.bar}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
