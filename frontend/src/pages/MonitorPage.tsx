import {useCallback, useEffect, useRef, useState} from 'react';
import {Icon} from '../components/Icon';
import {getRealtimeOPS, getSlowLog} from '../lib/api';
import type {ConnectionProfile, SlowLogEntry} from '../types';

interface Props {
  connection: ConnectionProfile;
}

export function MonitorPage({ connection }: Props) {
  const [opsHistory, setOpsHistory] = useState<number[]>([]);
  const [currentOPS, setCurrentOPS] = useState(0);
  const [slowLog, setSlowLog] = useState<SlowLogEntry[]>([]);
  const [running, setRunning] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pollOPS = useCallback(async () => {
    try {
      const ops = await getRealtimeOPS(connection.id);
      setCurrentOPS(ops);
      setOpsHistory((prev) => {
        const next = [...prev, ops];
        return next.length > 60 ? next.slice(-60) : next;
      });
    } catch {
      // ignore polling errors
    }
  }, [connection.id]);

  const pollSlowLog = useCallback(async () => {
    try {
      const logs = await getSlowLog(connection.id);
      setSlowLog(logs.slice(0, 20));
    } catch {
      // ignore
    }
  }, [connection.id]);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    pollOPS();
    pollSlowLog();
    intervalRef.current = setInterval(() => {
      pollOPS();
    }, 1000);
    const slowLogInterval = setInterval(pollSlowLog, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      clearInterval(slowLogInterval);
    };
  }, [running, pollOPS, pollSlowLog]);

  const maxOPS = Math.max(...opsHistory, 1);

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden">
      {/* OPS Chart */}
      <div className="flex-[2] rounded-lg border border-border bg-panel p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink">Operations Per Second</h3>
          <div className="flex items-center gap-2">
            <span className="rounded bg-redis/20 px-2 py-0.5 font-mono text-xs font-bold text-redis">
              {currentOPS.toLocaleString()} ops/s
            </span>
            <button
              onClick={() => setRunning(!running)}
              className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                running ? 'bg-greenx/20 text-greenx' : 'bg-amberx/20 text-amberx'
              }`}
            >
              {running ? 'LIVE' : 'PAUSED'}
            </button>
          </div>
        </div>
        <div className="relative h-[calc(100%-2.5rem)] overflow-hidden rounded border-l border-b border-border">
          <svg className="h-full w-full" viewBox={`0 0 ${Math.max(opsHistory.length, 1)} ${maxOPS}`} preserveAspectRatio="none">
            <defs>
              <linearGradient id="ops-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#DC2626" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#DC2626" stopOpacity="0" />
              </linearGradient>
            </defs>
            {opsHistory.length > 1 && (
              <>
                <path
                  d={`M0 ${maxOPS} ${opsHistory.map((v, i) => `L${i} ${maxOPS - v}`).join(' ')} L${opsHistory.length - 1} ${maxOPS} Z`}
                  fill="url(#ops-gradient)"
                />
                <path
                  d={opsHistory.map((v, i) => `${i === 0 ? 'M' : 'L'}${i} ${maxOPS - v}`).join(' ')}
                  fill="none"
                  stroke="#DC2626"
                  strokeWidth={maxOPS * 0.01}
                  vectorEffect="non-scaling-stroke"
                />
              </>
            )}
          </svg>
          <div className="absolute bottom-1 left-2 flex gap-4 text-[9px] text-mute">
            <span>-60s</span>
            <span>-45s</span>
            <span>-30s</span>
            <span>-15s</span>
            <span>NOW</span>
          </div>
        </div>
      </div>

      {/* Bottom: Slow Log */}
      <div className="flex-[3] overflow-hidden rounded-lg border border-border bg-panel">
        <div className="flex items-center gap-2 border-b border-border px-4 py-2">
          <Icon name="warning" className="text-amberx text-[16px]" />
          <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-white">Slow Log</h3>
          <span className="ml-auto font-mono text-[10px] text-mute">
            slowlog-log-slower-than 10000us
          </span>
        </div>
        <div className="h-[calc(100%-2.5rem)] overflow-y-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="sticky top-0 border-b border-border bg-panel2/50 text-mute">
              <tr>
                <th className="px-3 py-1.5 font-medium uppercase tracking-tight w-16">ID</th>
                <th className="px-3 py-1.5 font-medium uppercase tracking-tight w-24">Duration</th>
                <th className="px-3 py-1.5 font-medium uppercase tracking-tight">Command</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {slowLog.map((entry) => {
                const ms = entry.durationMicros / 1000;
                const color = ms > 100 ? 'text-redis font-bold' : ms > 10 ? 'text-amberx' : 'text-ink';
                return (
                  <tr key={entry.id} className="hover:bg-panel2/50">
                    <td className="px-3 py-1.5 text-mute">{entry.id}</td>
                    <td className={`px-3 py-1.5 ${color}`}>{ms.toFixed(1)}ms</td>
                    <td className="max-w-[200px] truncate px-3 py-1.5 text-ink">{entry.command}</td>
                  </tr>
                );
              })}
              {slowLog.length === 0 && (
                <tr><td colSpan={3} className="px-3 py-4 text-center text-mute">No slow log entries</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Status Bar */}
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-4 rounded-full border border-border bg-panel/90 px-4 py-2 backdrop-blur-sm">
        <div className="flex items-center gap-1.5">
          <Icon name="memory" className="text-[14px] text-cyanx" />
          <span className="font-mono text-[11px] text-ink">{currentOPS.toLocaleString()} ops/s</span>
        </div>
        <div className="h-3 w-px bg-border" />
        <div className="flex items-center gap-1.5">
          <Icon name="speed" className="text-[14px] text-greenx" />
          <span className="font-mono text-[11px] text-ink">Active</span>
        </div>
      </div>
    </div>
  );
}
