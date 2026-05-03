import type {AnalysisReport, ConnectionProfile, ReportSummary} from '../types';

declare global {
  interface Window {
    go?: {
      main?: {
        App?: Record<string, (...args: unknown[]) => Promise<unknown>>;
      };
    };
  }
}

const app = () => {
  if (typeof window === 'undefined') {
    return undefined;
  }
  return window.go?.main?.App;
};

export function isWailsAvailable() {
  return Boolean(app());
}

export async function listConnections(): Promise<ConnectionProfile[]> {
  if (app()?.ListConnections) {
    const result = await app()!.ListConnections();
    return (result as ConnectionProfile[] | null) ?? [];
  }
  return [];
}

export async function saveConnection(profile: ConnectionProfile): Promise<ConnectionProfile> {
  if (app()?.SaveConnection) {
    return app()!.SaveConnection(profile) as Promise<ConnectionProfile>;
  }
  return {...profile, id: profile.id ?? `mock-${Date.now()}`};
}

export async function testConnection(profile: ConnectionProfile): Promise<{ok: boolean; message: string; mode: string}> {
  if (app()?.TestConnection) {
    return app()!.TestConnection(profile) as Promise<{ok: boolean; message: string; mode: string}>;
  }
  await new Promise((resolve) => setTimeout(resolve, 300));
  return {ok: true, message: '浏览器预览模式：连接测试使用 mock 结果。', mode: profile.mode};
}

export async function runAnalysis(connectionId: string): Promise<AnalysisReport> {
  if (app()?.RunAnalysis) {
    return app()!.RunAnalysis(connectionId) as Promise<AnalysisReport>;
  }
  throw new Error(`当前不在 Wails 桌面环境，无法对 ${connectionId} 运行真实 Redis 分析。`);
}

export async function listReports(): Promise<ReportSummary[]> {
  if (app()?.ListReports) {
    const result = await app()!.ListReports();
    return (result as ReportSummary[] | null) ?? [];
  }
  return [];
}

export async function exportReport(reportId: string): Promise<string> {
  if (app()?.ExportReport) {
    return app()!.ExportReport(reportId) as Promise<string>;
  }
  throw new Error(`当前不在 Wails 桌面环境，无法导出报告 ${reportId}。`);
}

export async function deleteConnection(connectionId: string): Promise<void> {
  if (app()?.DeleteConnection) {
    await app()!.DeleteConnection(connectionId);
    return;
  }
  throw new Error('当前不在 Wails 桌面环境，无法删除连接。');
}
