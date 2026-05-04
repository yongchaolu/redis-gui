import {useEffect, useState} from 'react';
import {useToast} from '../components/Toast';
import {exportReport, listReports} from '../lib/api';
import type {ReportSummary} from '../types';

export function ReportsPage() {
  const {showToast} = useToast();
  const [reports, setReports] = useState<ReportSummary[]>([]);

  useEffect(() => {
    listReports().then(setReports);
  }, []);

  async function handleExport(id: string) {
    try {
      const html = await exportReport(id);
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `redis-report-${id}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      showToast(err instanceof Error ? err.message : '导出失败。', 'error');
    }
  }

  return (
    <section className="min-w-0 rounded-lg border border-border bg-panel p-4 sm:p-6">
      <h1 className="text-2xl font-black sm:text-3xl">历史报告</h1>
      <p className="mt-2 text-sm text-mute">MVP 保存用户主动运行的分析快照，不做后台长期监控。</p>
      <div className="mt-6 space-y-3">
        {reports.length === 0 && (
          <div className="rounded-2xl border border-border bg-white/5 p-4 text-sm text-mute">
            暂无历史报告。运行一次真实分析后，这里会出现报告列表。
          </div>
        )}
        {reports.map((report) => (
          <article key={report.id} className="flex flex-col gap-4 rounded-2xl border border-border bg-white/5 p-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="truncate font-bold">{report.connection}</div>
              <div className="mt-1 truncate text-xs text-mute">{report.mode} · {new Date(report.generatedAt).toLocaleString()} · {report.findingCount} risks</div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-3xl font-black ${report.severity === 'critical' || report.severity === 'high' ? 'text-redis' : report.severity === 'medium' ? 'text-amberx' : 'text-greenx'}`}>{report.score}</span>
              <button onClick={() => handleExport(report.id)} className="rounded-2xl border border-border bg-panel2 px-4 py-2 text-sm hover:border-cyanx/50">导出 HTML</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
