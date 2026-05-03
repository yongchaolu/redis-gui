import type {AnalysisReport} from '../types';

export function BigKeyList({report}: {report: AnalysisReport}) {
  const keys = report.snapshot.nodes.flatMap((node) =>
    (node.bigKeys ?? []).map((bk) => ({
      node: node.address,
      ...bk,
    }))
  ).sort((a, b) => b.size - a.size);

  if (keys.length === 0) {
    return (
      <div className="min-w-0 rounded-3xl border border-white/10 bg-panel p-3 sm:p-5">
        <h2 className="text-xl font-bold">大 Key 扫描</h2>
        <p className="mt-3 text-sm text-mute">本次采样未发现大小超过阈值的大 Key。</p>
      </div>
    );
  }

  function formatSize(size: number) {
    if (size > 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)}MB`;
    if (size > 1024) return `${(size / 1024).toFixed(1)}KB`;
    return `${size}B`;
  }

  return (
    <div className="min-w-0 rounded-3xl border border-white/10 bg-panel p-3 sm:p-5">
      <h2 className="text-xl font-bold">大 Key 扫描</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-white/10 text-mute">
              <th className="pb-2 pr-4">节点</th>
              <th className="pb-2 pr-4">Key</th>
              <th className="pb-2 pr-4">类型</th>
              <th className="pb-2 pr-4">大小</th>
              <th className="pb-2">元素数</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {keys.map((k, i) => (
              <tr key={i} className={k.size > 1024 * 1024 ? 'text-redis' : ''}>
                <td className="py-2 pr-4 text-mute">{k.node}</td>
                <td className="py-2 pr-4 font-mono">{k.name.length > 50 ? k.name.slice(0, 50) + '...' : k.name}</td>
                <td className="py-2 pr-4">{k.type}</td>
                <td className="py-2 pr-4">{formatSize(k.size)}</td>
                <td className="py-2">{k.length > 0 ? k.length.toLocaleString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
