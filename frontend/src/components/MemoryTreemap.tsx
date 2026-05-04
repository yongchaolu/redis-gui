import type { BigKey } from '../types';

interface Props {
  bigKeys: BigKey[];
}

interface PrefixGroup {
  prefix: string;
  totalSize: number;
  count: number;
  pct: number;
}

const COLORS = [
  'bg-redis/20 border-redis/40',
  'bg-cyanx/15 border-cyanx/30',
  'bg-amberx/15 border-amberx/30',
  'bg-greenx/15 border-greenx/30',
  'bg-panel2 border-border',
  'bg-surfaceHigh/30 border-surfaceHigh/50',
];

export function MemoryTreemap({ bigKeys }: Props) {
  if (bigKeys.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-lg border border-border bg-panel text-sm text-mute">
        No big keys data available
      </div>
    );
  }

  const groups = new Map<string, { totalSize: number; count: number }>();
  for (const key of bigKeys) {
    const prefix = key.name.includes(':') ? key.name.split(':')[0] + ':*' : 'other';
    const existing = groups.get(prefix);
    if (existing) {
      existing.totalSize += key.size;
      existing.count += 1;
    } else {
      groups.set(prefix, { totalSize: key.size, count: 1 });
    }
  }

  const totalSize = Array.from(groups.values()).reduce((sum, g) => sum + g.totalSize, 0);
  const sorted: PrefixGroup[] = Array.from(groups.entries())
    .map(([prefix, g]) => ({ prefix, ...g, pct: totalSize > 0 ? (g.totalSize / totalSize * 100) : 0 }))
    .sort((a, b) => b.totalSize - a.totalSize)
    .slice(0, 6);

  if (sorted.length === 0) return null;

  function fmtSize(bytes: number): string {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)}MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${bytes}B`;
  }

  return (
    <div className="rounded-lg border border-border bg-panel p-4">
      <h3 className="mb-3 text-sm font-semibold text-ink">Memory by Key Prefix</h3>
      <div className="grid h-[260px] grid-cols-6 grid-rows-3 gap-1">
        {sorted.map((group, i) => {
          let colSpan = 2;
          let rowSpan = 1;
          if (i === 0) { colSpan = 3; rowSpan = 2; }
          else if (i === 1) { colSpan = 2; rowSpan = 1; }
          else if (i === 2) { colSpan = 1; rowSpan = 2; }
          else { colSpan = 1; rowSpan = 1; }

          return (
            <div
              key={group.prefix}
              className={`group relative flex flex-col justify-between overflow-hidden rounded border p-2 transition-colors hover:brightness-125 ${COLORS[i % COLORS.length]}`}
              style={{ gridColumn: `span ${colSpan}`, gridRow: `span ${rowSpan}` }}
            >
              <div className="truncate text-[11px] font-mono font-bold text-ink">{group.prefix}</div>
              <div className="text-[10px] text-mute">{fmtSize(group.totalSize)} ({group.pct.toFixed(0)}%)</div>
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                <span className="text-[11px] text-ink">{group.count} keys</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
