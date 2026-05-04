import type {ClusterSample, NodeSample} from '../types';

interface Props {
  cluster: ClusterSample;
  nodes: NodeSample[];
}

export function ClusterTopology({cluster, nodes}: Props) {
  return (
    <div className="min-w-0 rounded-lg p-3 sm:p-5" style={{background: 'var(--color-surface)', border: '1px solid var(--color-border)'}}>
      <div className="mb-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-white">Cluster Topology</h2>
          <p className="mt-1 text-sm" style={{color: 'var(--color-text-secondary)'}}>Slots, master-slave relationships, node status</p>
        </div>
        <span className="w-fit rounded-full px-3 py-1 text-xs text-blue-400" style={{border: '1px solid rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.1)'}}>cluster</span>
      </div>
      <div className="relative min-h-[260px] overflow-hidden rounded-lg p-3 sm:min-h-[330px] sm:p-5 lg:min-h-[390px]" style={{border: '1px solid var(--color-border)', background: 'rgba(0,0,0,0.2)'}}>
        <div className="relative grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {nodes.map((node, index) => (
            <div
              key={`${node.address}-${index}`}
              className="min-w-0 rounded-lg p-3 sm:p-4"
              style={{
                border: node.error
                  ? '1px solid rgba(220,38,38,0.5)'
                  : node.role === 'master'
                    ? '1px solid rgba(16,185,129,0.4)'
                    : '1px solid var(--color-border)',
                background: node.error
                  ? 'rgba(220,38,38,0.1)'
                  : node.role === 'master'
                    ? 'rgba(16,185,129,0.1)'
                    : 'var(--color-surface-hover)',
              }}
            >
              <div className="text-xs uppercase tracking-[.2em]" style={{color: 'var(--color-text-secondary)'}}>{node.role || 'node'}</div>
              <div className="mt-1 truncate font-bold" style={{color: node.error ? 'var(--color-redis-red)' : node.role === 'master' ? '#10b981' : 'white'}}>{node.address}</div>
              <div className="mt-3 line-clamp-2 text-xs" style={{color: 'var(--color-text-secondary)'}}>{node.error ?? 'Sampling complete'}</div>
            </div>
          ))}
        </div>
        {cluster && (
          <div
            className="relative mt-3 rounded-lg px-4 py-3 sm:absolute sm:bottom-5 sm:right-5 sm:mt-0"
            style={{
              border: cluster.error ? '1px solid rgba(220,38,38,0.3)' : '1px solid rgba(245,158,11,0.3)',
              background: cluster.error ? 'rgba(220,38,38,0.1)' : 'rgba(245,158,11,0.1)',
            }}
          >
            <div className="text-xs uppercase tracking-[.2em]" style={{color: cluster.error ? 'var(--color-redis-red)' : '#f59e0b'}}>Cluster</div>
            <div className="mt-1 truncate text-sm text-white">
              {cluster.error ?? `state=${cluster.state} · slots=${cluster.slotsAssigned}/16384`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
