import {useEffect, useState} from 'react';
import {FileText, Download, AlertTriangle} from 'lucide-react';
import {useToast} from '../components/Toast';
import {exportReport, listReports} from '../lib/api';
import {Card, Badge} from '../lib/utils';
import type {ReportSummary} from '../types';

export function ReportsPage() {
  const {showToast} = useToast();
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    listReports()
      .then(setReports)
      .catch((err) => showToast(err instanceof Error ? err.message : '加载报告失败', 'error'))
      .finally(() => setLoading(false));
  }, [showToast]);

  async function handleExport(id: string) {
    try {
      const html = await exportReport(id);
      const blob = new Blob([html], {type: 'text/html'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `redis-report-${id}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      showToast(err instanceof Error ? err.message : '导出失败', 'error');
    }
  }

  function severityColor(severity: string): string {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'var(--color-redis-red)';
      case 'medium':
        return '#f59e0b';
      default:
        return '#10b981';
    }
  }

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="animate-pulse font-mono text-sm" style={{color: 'var(--color-text-secondary)'}}>
          Loading reports...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5" style={{color: 'var(--color-redis-red)'}} />
            History Reports
          </h2>
          <p className="text-sm mt-1" style={{color: 'var(--color-text-secondary)'}}>
            Saved analysis snapshots from previous runs
          </p>
        </div>
        <Badge style={{background: 'var(--color-border)', color: 'var(--color-text-secondary)'}}>
          {reports.length} reports
        </Badge>
      </div>

      {reports.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16">
          <AlertTriangle className="w-10 h-10 mb-3 opacity-20" style={{color: 'var(--color-text-secondary)'}} />
          <p className="text-sm" style={{color: 'var(--color-text-secondary)'}}>No reports yet</p>
          <p className="text-xs mt-1" style={{color: 'var(--color-text-secondary)'}}>
            Run an analysis to generate your first report
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <Card key={report.id} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3">
                  <span className="truncate text-sm font-bold text-white">{report.connection}</span>
                  <Badge style={{
                    background: 'rgba(59,130,246,0.2)',
                    color: '#60a5fa',
                    border: '1px solid rgba(59,130,246,0.3)',
                  }}>
                    {report.mode}
                  </Badge>
                </div>
                <div className="mt-1.5 flex items-center gap-3 font-mono text-xs" style={{color: 'var(--color-text-secondary)'}}>
                  <span>{new Date(report.generatedAt).toLocaleString()}</span>
                  <span style={{color: 'var(--color-border)'}}>·</span>
                  <span>{report.findingCount} findings</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-3xl font-mono font-bold" style={{color: severityColor(report.severity)}}>
                    {report.score}
                  </div>
                  <div className="text-[10px] font-mono uppercase tracking-wider" style={{color: severityColor(report.severity)}}>
                    {report.severity}
                  </div>
                </div>
                <button
                  onClick={() => handleExport(report.id)}
                  className="flex items-center gap-2 rounded-md px-4 py-2.5 text-xs font-bold text-white transition hover:brightness-110 active:scale-95"
                  style={{border: '1px solid var(--color-border)', background: 'var(--color-surface-hover)'}}
                >
                  <Download className="w-3.5 h-3.5" />
                  Export HTML
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
