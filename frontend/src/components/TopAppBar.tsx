import type { ConnectionProfile, AnalysisReport } from '../types';
import { Icon } from './Icon';

interface TopAppBarProps {
  connection?: ConnectionProfile;
  report?: AnalysisReport | null;
  onRefresh?: () => void;
  onDisconnect?: () => void;
}

export function TopAppBar({ connection, report, onRefresh, onDisconnect }: TopAppBarProps) {
  const redisVersion = report?.snapshot?.nodes?.[0]?.info?.['redis_version'];
  const uptimeSeconds = report?.snapshot?.nodes?.[0]?.info?.['uptime_in_seconds'];
  const uptimeFormatted = uptimeSeconds
    ? formatUptime(parseInt(uptimeSeconds, 10))
    : null;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-panel/95 px-5 backdrop-blur-sm">
      <div className="flex items-center gap-5">
        {connection ? (
          <>
            <span className="font-mono text-xs uppercase tracking-widest text-white font-bold">
              {connection.addresses[0] ?? connection.name}
            </span>
            {redisVersion && (
              <span className="font-mono text-xs uppercase tracking-widest text-mute">
                v{redisVersion}
              </span>
            )}
            {uptimeFormatted && (
              <span className="font-mono text-xs uppercase tracking-widest text-mute">
                Up: {uptimeFormatted}
              </span>
            )}
          </>
        ) : (
          <span className="text-xs text-mute">Redis Lens</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="text-mute transition-colors hover:text-white active:scale-95"
            title="Refresh"
          >
            <Icon name="refresh" className="text-[20px]" />
          </button>
        )}
        <button
          className="text-mute transition-colors hover:text-white active:scale-95"
          title="Settings"
        >
          <Icon name="settings" className="text-[20px]" />
        </button>
        {connection && onDisconnect && (
          <button
            onClick={onDisconnect}
            className="rounded-md bg-redis px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white active:scale-95 transition-transform"
          >
            Disconnect
          </button>
        )}
      </div>
    </header>
  );
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  return parts.join(' ') || '<1h';
}
