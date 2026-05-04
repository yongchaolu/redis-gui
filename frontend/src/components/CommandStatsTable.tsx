import type {AnalysisReport} from '../types';

export function CommandStatsTable({report}: {report: AnalysisReport}) {
  const stats = report.snapshot.nodes.flatMap((node) =>
    (node.commandStats ?? []).map((stat) => ({
      node: node.address,
      name: stat.name,
      calls: stat.calls,
      usecPerCall: stat.usecPerCall,
    }))
  ).sort((a, b) => b.usecPerCall - a.usecPerCall);

  if (stats.length === 0) {
    return (
      <div className="min-w-0 rounded-lg border border-border bg-panel p-3 sm:p-5">
        <h2 className="text-xl font-bold">命令统计</h2>
        <p className="mt-3 text-sm text-mute">本次采样暂无命令统计信息。</p>
      </div>
    );
  }

  return (
    <div className="min-w-0 rounded-lg border border-border bg-panel p-3 sm:p-5">
      <h2 className="text-xl font-bold">命令统计</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-border text-mute">
              <th className="pb-2 pr-4">节点</th>
              <th className="pb-2 pr-4">命令</th>
              <th className="pb-2 pr-4">调用次数</th>
              <th className="pb-2">平均耗时</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {stats.slice(0, 30).map((s, i) => (
              <tr key={i} className={s.usecPerCall > 10000 ? 'text-redis' : s.usecPerCall > 1000 ? 'text-amberx' : ''}>
                <td className="py-2 pr-4 text-mute">{s.node}</td>
                <td className="py-2 pr-4 font-mono">{s.name}</td>
                <td className="py-2 pr-4">{s.calls.toLocaleString()}</td>
                <td className="py-2">{(s.usecPerCall / 1000).toFixed(2)}ms</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
