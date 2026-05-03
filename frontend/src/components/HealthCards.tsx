import type {AnalysisReport} from '../types';

export function HealthCards({report}: {report: AnalysisReport}) {
  const hitRate = (() => {
    let hits = 0, misses = 0;
    for (const node of report.snapshot.nodes) {
      const info = node.info ?? {};
      hits += Number(info['keyspace_hits'] ?? 0);
      misses += Number(info['keyspace_misses'] ?? 0);
    }
    if (hits + misses === 0) return '-';
    return `${((hits / (hits + misses)) * 100).toFixed(1)}%`;
  })();

  const ops = report.metrics?.ops_per_sec ?? '-';
  const bigKeys = report.metrics?.big_keys ?? '0';

  const cards = [
    {label: '健康评分', value: `${report.score}`, suffix: '/100', tone: 'text-greenx'},
    {label: '节点数量', value: report.metrics?.nodes ?? `${report.snapshot?.nodes?.length ?? 0}`, suffix: 'nodes', tone: 'text-ink'},
    {label: '内存水位', value: report.metrics?.memory_usage ?? '-', suffix: '', tone: 'text-amberx'},
    {label: '风险项', value: `${report.findings?.length ?? 0}`, suffix: 'items', tone: (report.findings?.length ?? 0) > 0 ? 'text-redis' : 'text-greenx'},
    {label: '命中率', value: hitRate, suffix: '', tone: hitRate !== '-' && parseFloat(hitRate) < 50 ? 'text-redis' : hitRate !== '-' && parseFloat(hitRate) < 80 ? 'text-amberx' : 'text-greenx'},
    {label: 'QPS', value: ops, suffix: '/s', tone: 'text-cyanx'},
    {label: '大 Key', value: bigKeys, suffix: '个', tone: Number(bigKeys) > 0 ? 'text-redis' : 'text-greenx'},
  ];
  return (
    <section className="mb-5 grid min-w-0 grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="min-w-0 rounded-2xl border border-white/10 bg-panel p-2.5 shadow-glow sm:rounded-3xl sm:p-4 lg:p-5">
          <div className="truncate text-[11px] text-mute sm:text-sm">{card.label}</div>
          <div className="mt-2 flex min-w-0 items-end gap-1 sm:mt-4 sm:gap-2">
            <span className={`truncate text-2xl font-black sm:text-4xl lg:text-5xl ${card.tone}`}>{card.value}</span>
            {card.suffix && <span className="pb-1 text-xs text-mute sm:pb-2 sm:text-sm">{card.suffix}</span>}
          </div>
          {card.label === '健康评分' && (
            <div className="mt-3 h-1.5 rounded-full bg-white/10 sm:mt-4 sm:h-2">
              <div className="h-1.5 rounded-full bg-greenx sm:h-2" style={{width: `${report.score}%`}} />
            </div>
          )}
        </div>
      ))}
    </section>
  );
}
