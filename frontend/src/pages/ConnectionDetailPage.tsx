import {useEffect, useState} from 'react';
import {BigKeyList} from '../components/BigKeyList';
import {ClusterTopology} from '../components/ClusterTopology';
import {CommandStatsTable} from '../components/CommandStatsTable';
import {HealthCards} from '../components/HealthCards';
import {RiskQueue} from '../components/RiskQueue';
import {SlowLogDetail} from '../components/SlowLogDetail';
import {useToast} from '../components/Toast';
import {exportReport, listReports, runAnalysis} from '../lib/api';
import type {AnalysisReport, ConnectionProfile, ReportSummary} from '../types';

interface Props {
  connection: ConnectionProfile;
  connections: ConnectionProfile[];
  onBack: () => void;
  onSelectConnection: (id: string) => void;
  onDelete: (id: string) => void;
}

const modeLabel: Record<string, string> = {
  standalone: '单点',
  sentinel: '哨兵',
  cluster: '集群',
};

export function ConnectionDetailPage({connection, connections, onBack, onSelectConnection, onDelete}: Props) {
  const {showToast} = useToast();
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [lastRunAt, setLastRunAt] = useState<string>('');
  const [history, setHistory] = useState<ReportSummary[]>([]);
  const [historyLimit, setHistoryLimit] = useState(10);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setReport(null);
    setError('');
    setLastRunAt('');
    setHistoryLimit(10);
    loadHistory(10);
    handleRun();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection.id]);

  async function loadHistory(limit = historyLimit) {
    try {
      const all = await listReports();
      setHistory(all.filter((r) => r.connectionId === connection.id).slice(0, limit));
    } catch {
      setHistory([]);
    }
  }

  async function handleRun() {
    setRunning(true);
    setError('');
    try {
      const result = await runAnalysis(connection.id);
      setReport(result);
      setLastRunAt(new Date().toLocaleString());
      await loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : '运行分析失败。');
    } finally {
      setRunning(false);
    }
  }

  async function handleExport() {
    if (!report?.id) return;
    setExporting(true);
    try {
      const html = await exportReport(report.id);
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `redis-report-${report.connection}-${new Date().toISOString().slice(0, 10)}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast('导出失败', 'error');
    } finally {
      setExporting(false);
    }
  }

  function handleIntelligentAnalysis() {
    showToast('智能分析功能后续将接入大模型，提供在线诊断建议。', 'info');
  }

  async function handleDelete() {
    try {
      await onDelete(connection.id);
      setShowDeleteConfirm(false);
      onBack();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '删除失败', 'error');
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <header className="min-w-0 rounded-3xl border border-white/10 bg-panel p-4 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <button
              onClick={onBack}
              className="mb-3 inline-flex items-center gap-1 rounded-xl bg-white/5 px-3 py-1.5 text-xs text-mute transition hover:bg-white/10 hover:text-ink"
            >
              ← 返回连接管理
            </button>
            {connections.length > 1 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {connections.map((conn) => (
                  <button
                    key={conn.id}
                    onClick={() => onSelectConnection(conn.id)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${conn.id === connection.id ? 'bg-cyanx/15 text-cyanx ring-1 ring-cyanx/30' : 'bg-white/5 text-mute hover:bg-white/10 hover:text-ink'}`}
                  >
                    {conn.name}
                  </button>
                ))}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-black sm:text-3xl">{connection.name}</h1>
              <span className="rounded-full bg-cyanx/10 px-2.5 py-0.5 text-xs text-cyanx">{modeLabel[connection.mode] ?? connection.mode}</span>
              {connection.tls && <span className="rounded-full bg-greenx/10 px-2.5 py-0.5 text-xs text-greenx">TLS</span>}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-mute">
              <div className="min-w-0 truncate max-w-[200px] sm:max-w-xs">{connection.addresses.join(', ')}</div>
              <span>超时 {connection.timeoutSeconds}s</span>
              {lastRunAt && <span>上次分析：{lastRunAt}</span>}
            </div>
            {(connection.tags ?? []).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {(connection.tags ?? []).map((tag) => (
                  <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-mute">{tag}</span>
                ))}
              </div>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-2xl border border-white/10 bg-panel px-4 py-2.5 text-sm text-redis hover:bg-redis/10"
            >
              删除连接
            </button>
          </div>
        </div>
      </header>

      {error && <div className="rounded-2xl border border-redis/30 bg-redis/10 px-4 py-3 text-sm text-redis">{error}</div>}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button onClick={handleRun} disabled={running} className="rounded-2xl bg-redis px-5 py-3 text-sm font-bold text-white shadow-danger hover:bg-red-500 disabled:opacity-50">
          {running ? '分析中...' : '重新分析'}
        </button>
        <button disabled className="cursor-not-allowed rounded-2xl border border-cyanx/20 px-5 py-3 text-sm text-cyanx/50">
          智能分析 <span className="ml-1 rounded bg-cyanx/10 px-1.5 py-0.5 text-[10px]">Beta</span>
        </button>
        <button onClick={handleExport} disabled={!report || exporting} className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-mute hover:border-white/20 hover:text-ink disabled:cursor-not-allowed disabled:opacity-45">
          {exporting ? '导出中...' : '导出 HTML'}
        </button>
      </div>

      {!report ? (
        <div className="rounded-3xl border border-white/10 bg-panel p-5 sm:p-7">
          <div className="text-xs uppercase tracking-[.28em] text-cyanx">Analyzing</div>
          <h2 className="mt-3 text-2xl font-black">正在分析...</h2>
          <p className="mt-2 text-sm leading-6 text-mute">首次进入详情页会自动运行 Redis 采样分析，请稍候。</p>
        </div>
      ) : (
        <>
          <HealthCards report={report} />
          <section className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,.85fr)]">
            <ClusterTopology report={report} />
            <div className="min-w-0 space-y-5">
              <RiskQueue report={report} />
            </div>
          </section>
          <section className="mt-5 space-y-5">
            <SlowLogDetail report={report} />
            <CommandStatsTable report={report} />
            <BigKeyList report={report} />
          </section>
        </>
      )}

      {/* History */}
      {history.length > 0 && (
        <>
          <div className="border-t border-white/5" />
          <section className="min-w-0 rounded-3xl border border-white/10 bg-panel p-4 sm:p-6">
            <h2 className="text-xl font-black">历史报告</h2>
            <div className="mt-4 space-y-3">
              {history.map((item) => (
                <article key={item.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{new Date(item.generatedAt).toLocaleString()}</div>
                    <div className="mt-1 text-xs text-mute">{item.findingCount} 个风险项</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-2xl font-black ${item.severity === 'critical' || item.severity === 'high' ? 'text-redis' : item.severity === 'medium' ? 'text-amberx' : 'text-greenx'}`}>{item.score}</span>
                  </div>
                </article>
              ))}
            </div>
            {history.length >= historyLimit && (
              <button
                onClick={() => {
                  const next = historyLimit + 10;
                  setHistoryLimit(next);
                  loadHistory(next);
                }}
                className="mt-3 w-full rounded-2xl border border-white/10 bg-panel2 py-2.5 text-sm text-mute transition hover:border-cyanx/50 hover:text-ink"
              >
                加载更多
              </button>
            )}
          </section>
        </>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-panel p-6">
            <h3 className="text-lg font-bold">确认删除连接？</h3>
            <p className="mt-2 text-sm text-mute">删除后该连接的所有历史报告也会被一并清除，此操作不可撤销。</p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 rounded-2xl border border-white/10 bg-panel2 px-4 py-3 text-sm font-bold text-ink hover:border-cyanx/50">取消</button>
              <button onClick={handleDelete} className="flex-1 rounded-2xl bg-redis px-4 py-3 text-sm font-bold text-white shadow-danger hover:bg-red-500">确认删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
