import type { AnalysisReport, CommandStat } from '../types';

interface Props {
  report: AnalysisReport;
}

export function FrequentCommandsTable({ report }: Props) {
  const nodes = report.snapshot?.nodes ?? [];
  const allStats: CommandStat[] = [];
  for (const node of nodes) {
    if (node.commandStats) {
      allStats.push(...node.commandStats);
    }
  }

  const aggregated = new Map<string, { calls: number; usec: number; usecPerCall: number }>();
  for (const stat of allStats) {
    const existing = aggregated.get(stat.name);
    if (existing) {
      existing.calls += stat.calls;
      existing.usec += stat.usec;
      existing.usecPerCall = Math.max(existing.usecPerCall, stat.usecPerCall);
    } else {
      aggregated.set(stat.name, { calls: stat.calls, usec: stat.usec, usecPerCall: stat.usecPerCall });
    }
  }

  const sorted = Array.from(aggregated.entries())
    .sort((a, b) => b[1].calls - a[1].calls)
    .slice(0, 20);

  const totalCalls = sorted.reduce((sum, [, v]) => sum + v.calls, 0);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-panel">
      <div className="flex items-center justify-between border-b border-border bg-panel2/50 px-4 py-2">
        <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-white">Frequent Commands</h3>
        <span className="font-mono text-[10px] text-mute">Total</span>
      </div>
      <table className="w-full text-left font-mono text-xs">
        <thead className="border-b border-border bg-panel2/30 text-mute">
          <tr>
            <th className="px-4 py-2 font-medium uppercase tracking-tight">Command</th>
            <th className="px-4 py-2 font-medium uppercase tracking-tight">Calls</th>
            <th className="px-4 py-2 font-medium uppercase tracking-tight">Avg Time (us)</th>
            <th className="px-4 py-2 font-medium uppercase tracking-tight">Usage %</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {sorted.map(([name, stat]) => {
            const pct = totalCalls > 0 ? (stat.calls / totalCalls * 100) : 0;
            return (
              <tr key={name} className="transition-colors hover:bg-panel2/50">
                <td className="px-4 py-2 font-bold text-white">{name}</td>
                <td className="px-4 py-2 text-ink">{stat.calls.toLocaleString()}</td>
                <td className="px-4 py-2 text-ink">{stat.usecPerCall.toFixed(2)}</td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surfaceHigh">
                      <div className="h-full rounded-full bg-cyanx" style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                    <span className="shrink-0 text-[10px] text-mute">{pct.toFixed(0)}%</span>
                  </div>
                </td>
              </tr>
            );
          })}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-mute">No command stats available</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
