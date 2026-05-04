import type {AnalysisReport, Severity} from '../types';

const tone: Record<Severity, string> = {
  critical: 'border-redis/40 bg-redis/10 text-redis',
  high: 'border-redis/40 bg-redis/10 text-redis',
  medium: 'border-amberx/35 bg-amberx/10 text-amberx',
  low: 'border-cyanx/25 bg-cyanx/10 text-cyanx',
};

export function RiskQueue({report}: {report: AnalysisReport}) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-panel p-3 sm:p-5">
      <h2 className="text-xl font-bold">风险队列</h2>
      <div className="mt-4 space-y-3">
        {report.findings.length === 0 && (
          <div className="rounded-2xl border border-greenx/30 bg-greenx/10 p-4">
            <div className="mb-1 text-sm font-bold text-greenx">健康 · 暂无风险</div>
            <p className="text-sm text-mute">这次采样没有发现需要立即处理的问题。</p>
          </div>
        )}
        {report.findings.map((item) => (
          <article key={`${item.category}-${item.title}`} className={`min-w-0 rounded-2xl border p-4 ${tone[item.severity]}`}>
            <div className="mb-1 text-sm font-bold">{item.severity.toUpperCase()} · {item.title}</div>
            <p className="text-sm text-mute">{item.evidence}</p>
            <p className="mt-2 text-xs text-mute">建议：{item.recommendation}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
