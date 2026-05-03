import type { ConnectionProfile } from '../types';

interface SidebarProps {
  connection?: ConnectionProfile;
  hasConnections: boolean;
}

export function Sidebar({ connection, hasConnections }: SidebarProps) {
  return (
    <aside className="min-w-0 border-b border-white/10 bg-black/25 px-3 py-3 backdrop-blur-xl sm:px-4 md:h-screen md:overflow-y-auto md:border-b-0 md:border-r md:py-4 lg:py-5">
      <div className="mb-3 flex items-center gap-2 md:mb-4 md:block lg:mb-6">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-redis shadow-danger md:h-10 md:w-10">
          <span className="text-base font-black tracking-tight text-white">R</span>
        </div>
        <div className="min-w-0">
          <div className="truncate text-[10px] uppercase tracking-[.2em] text-mute md:text-xs md:tracking-[.28em]">Redis Lens</div>
          <div className="truncate text-sm font-semibold md:text-base">性能分析台</div>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-white/10 bg-panel/80 p-3 md:mt-4 md:rounded-2xl md:p-3 lg:mt-6">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[.2em] text-mute">Active Target</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] ${connection ? 'bg-greenx/15 text-greenx' : 'bg-white/10 text-mute'}`}>{connection ? 'Ready' : 'Empty'}</span>
        </div>
        <div className="truncate text-sm font-semibold">{connection?.name ?? '未选择连接'}</div>
        <div className="mt-1 truncate text-[10px] text-mute">{connection ? `${connection.mode} · ${connection.addresses.length} endpoint(s)` : '创建连接后开始分析'}</div>
      </div>

      <div className="mt-3 rounded-xl border border-white/10 bg-panel/80 p-3 md:mt-4 md:rounded-2xl md:p-3 lg:mt-4">
        <div className="text-[10px] uppercase tracking-[.2em] text-mute mb-1.5">采样白名单</div>
        <div className="space-y-0.5 text-[10px] text-mute">
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-1 w-1 rounded-full bg-greenx" />
            INFO / SLOWLOG
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-1 w-1 rounded-full bg-greenx" />
            LATENCY / CLIENT
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-1 w-1 rounded-full bg-greenx" />
            CLUSTER / MEMORY
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block h-1 w-1 rounded-full bg-greenx" />
            SCAN (只读)
          </div>
        </div>
      </div>

      {!hasConnections && (
        <div className="mt-3 rounded-xl border border-amberx/30 bg-amberx/10 p-3 md:mt-4 md:rounded-2xl md:p-3 lg:mt-4">
          <div className="text-[10px] uppercase tracking-[.2em] text-amberx mb-1">提示</div>
          <p className="text-[10px] text-mute">还没有保存的连接。请在右侧创建第一个 Redis 连接。</p>
        </div>
      )}
    </aside>
  );
}
