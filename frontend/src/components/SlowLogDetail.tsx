import type {AnalysisReport} from '../types';

export function SlowLogDetail({report}: {report: AnalysisReport}) {
  const entries = report.snapshot.nodes.flatMap((node) =>
    (node.slowlogs ?? []).slice(0, 20).map((entry) => ({
      node: node.address,
      command: entry.command,
      duration: entry.durationMicros,
      at: new Date(entry.at * 1000).toLocaleString(),
    }))
  );

  if (entries.length === 0) {
    return (
      <div className="min-w-0 rounded-lg border border-border bg-panel p-3 sm:p-5">
        <h2 className="text-xl font-bold">慢查询详情</h2>
        <p className="mt-3 text-sm text-mute">本次采样未发现慢查询记录。</p>
      </div>
    );
  }

  return (
    <div className="min-w-0 rounded-lg border border-border bg-panel p-3 sm:p-5">
      <h2 className="text-xl font-bold">慢查询详情</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-border text-mute">
              <th className="pb-2 pr-4">节点</th>
              <th className="pb-2 pr-4">命令</th>
              <th className="pb-2 pr-4">耗时</th>
              <th className="pb-2">时间</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {entries.map((e, i) => (
              <tr key={i}>
                <td className="py-2 pr-4 text-mute">{e.node}</td>
                <td className="py-2 pr-4 font-mono">{e.command.length > 80 ? e.command.slice(0, 80) + '...' : e.command}</td>
                <td className={`py-2 pr-4 ${e.duration >= 100000 ? 'text-redis' : e.duration >= 10000 ? 'text-amberx' : 'text-greenx'}`}>{(e.duration / 1000).toFixed(2)}ms</td>
                <td className="py-2 text-mute">{e.at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
