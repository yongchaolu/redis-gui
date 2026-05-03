import {describe, expect, it, vi} from 'vitest';
import {listConnections, runAnalysis, testConnection} from './api';

describe('api fallback', () => {
  it('does not return fake connections when Wails bindings are unavailable', async () => {
    const connections = await listConnections();

    expect(connections).toEqual([]);
  });

  it('refuses to run fake analysis outside Wails', async () => {
    await expect(runAnalysis('conn-prod')).rejects.toThrow('无法对 conn-prod 运行真实 Redis 分析');
  });

  it('keeps connection test clearly marked as browser preview fallback', async () => {
    const result = await testConnection({
      id: 'test',
      name: 'local',
      mode: 'standalone',
      addresses: ['127.0.0.1:6379'],
      tls: false,
      timeoutSeconds: 3,
    });

    expect(result.ok).toBe(true);
    expect(result.message).toContain('浏览器预览模式');
  });

  it('uses Wails binding when available', async () => {
    vi.stubGlobal('window', {
      go: {
        main: {
          App: {
            ListConnections: vi.fn().mockResolvedValue([{id: 'real', name: '真实连接'}]),
          },
        },
      },
    });

    const connections = await listConnections();

    expect(connections[0].id).toBe('real');
    vi.unstubAllGlobals();
  });
});
