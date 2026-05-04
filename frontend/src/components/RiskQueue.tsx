import type {RiskFinding, Severity} from '../types';

interface Props {
  findings: RiskFinding[];
}

const tone: Record<Severity, {border: string; bg: string; text: string}> = {
  critical: {border: 'rgba(220,38,38,0.4)', bg: 'rgba(220,38,38,0.1)', text: 'var(--color-redis-red)'},
  high: {border: 'rgba(220,38,38,0.4)', bg: 'rgba(220,38,38,0.1)', text: 'var(--color-redis-red)'},
  medium: {border: 'rgba(245,158,11,0.35)', bg: 'rgba(245,158,11,0.1)', text: '#f59e0b'},
  low: {border: 'rgba(59,130,246,0.25)', bg: 'rgba(59,130,246,0.1)', text: '#3b82f6'},
};

export function RiskQueue({findings}: Props) {
  return (
    <div className="min-w-0 rounded-lg p-3 sm:p-5" style={{background: 'var(--color-surface)', border: '1px solid var(--color-border)'}}>
      <h2 className="text-xl font-bold text-white">Risk Queue</h2>
      <div className="mt-4 space-y-3">
        {findings.length === 0 && (
          <div className="rounded-lg p-4" style={{border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.1)'}}>
            <div className="mb-1 text-sm font-bold text-emerald-400">Healthy - No Risks</div>
            <p className="text-sm" style={{color: 'var(--color-text-secondary)'}}>No issues found in this sampling.</p>
          </div>
        )}
        {findings.map((item) => {
          const t = tone[item.severity];
          return (
            <article
              key={`${item.category}-${item.title}`}
              className="min-w-0 rounded-lg p-4"
              style={{border: `1px solid ${t.border}`, background: t.bg}}
            >
              <div className="mb-1 text-sm font-bold" style={{color: t.text}}>
                {item.severity.toUpperCase()} · {item.title}
              </div>
              <p className="text-sm" style={{color: 'var(--color-text-secondary)'}}>{item.evidence}</p>
              <p className="mt-2 text-xs" style={{color: 'var(--color-text-secondary)'}}>Recommendation: {item.recommendation}</p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
