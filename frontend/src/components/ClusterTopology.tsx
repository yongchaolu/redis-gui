import type {AnalysisReport} from '../types';

export function ClusterTopology({report}: {report: AnalysisReport}) {
  const nodes = report.snapshot?.nodes?.length > 0 ? report.snapshot.nodes : [];
  return (
    <div className="min-w-0 rounded-lg border border-border bg-panel p-3 sm:p-5">
      <div className="mb-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-bold">拓扑视图</h2>
          <p className="mt-1 text-sm text-mute">槽位、主从关系、节点状态和热点分片</p>
        </div>
        <span className="w-fit rounded-full border border-cyanx/30 bg-cyanx/10 px-3 py-1 text-xs text-cyanx">{report.mode}</span>
      </div>
      <div className="relative min-h-[260px] overflow-hidden rounded-[1.5rem] border border-border bg-black/20 p-3 sm:min-h-[330px] sm:p-5 lg:min-h-[390px]">
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-40" viewBox="0 0 800 390" fill="none">
          <path d="M110 100 C180 140 190 150 255 180" stroke="#40d7ff" strokeWidth="2" strokeDasharray="6 6" />
          <path d="M320 175 C390 145 410 120 455 105" stroke="#40d7ff" strokeWidth="2" strokeDasharray="6 6" />
          <path d="M115 130 C125 210 145 250 160 300" stroke="#ffffff" strokeOpacity=".25" strokeWidth="2" />
          <path d="M285 215 C295 250 315 275 350 305" stroke="#ffffff" strokeOpacity=".25" strokeWidth="2" />
          <path d="M500 135 C560 210 615 245 660 305" stroke="#d93f32" strokeWidth="2" />
        </svg>
        <div className="relative grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {nodes.map((node, index) => (
            <div
              key={`${node.address}-${index}`}
              className={`min-w-0 rounded-2xl border p-3 sm:rounded-lg sm:p-4 ${node.role === 'master' ? 'border-greenx/40 bg-greenx/10' : 'border-border bg-panel2'} ${node.error ? 'border-redis/50 bg-redis/10' : ''}`}
            >
              <div className="text-xs uppercase tracking-[.2em] text-mute">{node.role || 'node'}</div>
              <div className={`mt-1 truncate font-bold ${node.error ? 'text-redis' : node.role === 'master' ? 'text-greenx' : 'text-ink'}`}>{node.address}</div>
              <div className="mt-3 line-clamp-2 text-xs text-mute">{node.error ? node.error : '只读采样完成'}</div>
            </div>
          ))}
        </div>
        {report.snapshot?.cluster && (
          <div className={`relative mt-3 rounded-2xl border px-4 py-3 sm:absolute sm:bottom-5 sm:right-5 sm:mt-0 ${report.snapshot.cluster.error ? 'border-redis/30 bg-redis/10' : 'border-amberx/30 bg-amberx/10'}`}>
            <div className={`text-xs uppercase tracking-[.2em] ${report.snapshot.cluster.error ? 'text-redis' : 'text-amberx'}`}>Cluster</div>
            <div className="mt-1 truncate text-sm">{report.snapshot.cluster.error ? report.snapshot.cluster.error : `state=${report.snapshot.cluster.state} · slots=${report.snapshot.cluster.slotsAssigned}/16384`}</div>
          </div>
        )}
      </div>
    </div>
  );
}
