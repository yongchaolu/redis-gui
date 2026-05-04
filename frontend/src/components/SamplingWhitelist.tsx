const commands = ['INFO', 'SLOWLOG GET', 'LATENCY LATEST', 'CLIENT LIST', 'CLUSTER NODES', 'MEMORY STATS'];

export function SamplingWhitelist() {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-panel p-3 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">采样命令</h2>
        <span className="text-xs text-greenx">只读白名单</span>
      </div>
      <div className="grid grid-cols-1 gap-2 text-xs text-mute min-[420px]:grid-cols-2">
        {commands.map((command) => (
          <span key={command} className="rounded-xl bg-white/5 px-3 py-2">{command}</span>
        ))}
      </div>
    </div>
  );
}
