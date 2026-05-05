import {useCallback, useEffect, useRef, useState} from 'react';
import {LineChart, Line, ResponsiveContainer, CartesianGrid, Tooltip} from 'recharts';
import {Pause, Play, Trash2, AlertTriangle} from 'lucide-react';
import {Card, cn} from '../lib/utils';
import {getRealtimeOPS, getSlowLog} from '../lib/api';
import type {ConnectionProfile, SlowLogEntry} from '../types';

interface Props {
  connection: ConnectionProfile;
}

export function MonitorPage({connection}: Props) {
  const [data, setData] = useState<Array<{time: number; ops: number}>>(() =>
    Array.from({length: 30}, (_, i) => ({time: i, ops: 0}))
  );
  const [slowLog, setSlowLog] = useState<SlowLogEntry[]>([]);
  const [running, setRunning] = useState(true);
  const timeRef = useRef(30);

  const pollOPS = useCallback(async () => {
    try {
      const ops = await getRealtimeOPS(connection.id);
      timeRef.current += 1;
      setData((prev) => [...prev.slice(1), {time: timeRef.current, ops}]);
    } catch {
      // ignore
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
    if (!running) return;
    pollOPS();
    pollSlowLog();
    const opsInterval = setInterval(pollOPS, 1000);
    const slowInterval = setInterval(pollSlowLog, 5000);
    return () => {
      clearInterval(opsInterval);
      clearInterval(slowInterval);
    };
  }, [running, pollOPS, pollSlowLog]);

  const currentOPS = data[data.length - 1]?.ops ?? 0;

  return (
    <div className="space-y-6">
      {/* Large OPS Graph */}
      <Card className="h-64 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-semibold text-white">每秒操作数</h3>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded font-mono" style={{background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)', color: 'var(--color-redis-red)'}}>
              {currentOPS.toLocaleString()} ops/s
            </div>
            <button
              onClick={() => setRunning(!running)}
              className={cn("px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider", running ? "text-emerald-400" : "text-yellow-400")}
              style={{background: running ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)'}}
            >
              {running ? '实时' : '已暂停'}
            </button>
          </div>
        </div>
        <div className="flex-grow">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
              <Tooltip contentStyle={{backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '4px'}} itemStyle={{color: '#fff'}} />
              <Line type="monotone" dataKey="ops" stroke="#dc2626" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-12 gap-6">
        {/* Stream */}
        <section className="col-span-12 lg:col-span-8 rounded-lg flex flex-col h-[500px] overflow-hidden" style={{background: 'var(--color-obsidian)', border: '1px solid var(--color-border)'}}>
          <div className="px-4 py-2 flex items-center justify-between" style={{background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)'}}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{background: 'var(--color-redis-red)'}} />
              <span className="font-mono text-[10px] uppercase tracking-widest font-bold">慢查询日志</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setRunning(!running)} className="p-1 hover:text-white transition-colors" style={{color: 'var(--color-text-secondary)'}}>
                {running ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              </button>
              <button onClick={() => setSlowLog([])} className="p-1 hover:text-white transition-colors" style={{color: 'var(--color-text-secondary)'}}>
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1.5 terminal-scroll">
            {slowLog.length > 0 ? slowLog.map((entry, idx) => {
              const ms = entry.durationMicros / 1000;
              const color = ms > 100 ? 'text-red-400' : ms > 10 ? 'text-yellow-400' : 'text-blue-400';
              return (
                <div key={idx} className="flex gap-4 group p-1 rounded transition-colors hover:bg-white/5">
                  <span className="shrink-0" style={{color: 'var(--color-text-secondary)'}}>{entry.at}</span>
                  <span className={cn("font-bold uppercase min-w-[80px]", color)}>SLOWLOG</span>
                  <span className="text-slate-200 truncate">{entry.command}</span>
                  <span className={cn("ml-auto shrink-0", color)}>{ms.toFixed(1)}ms</span>
                </div>
              );
            }) : (
              <div className="flex items-center justify-center h-full" style={{color: 'var(--color-text-secondary)'}}>
                <div className="text-center">
                  <p className="font-mono text-sm tracking-widest uppercase">等待数据...</p>
                  <p className="text-[10px] mt-2 italic">慢查询日志将显示在此处</p>
                </div>
              </div>
            )}
            <div className="animate-pulse" style={{color: 'rgba(220,38,38,0.5)'}}>_</div>
          </div>
        </section>

        {/* Slow Log Table */}
        <Card className="col-span-12 lg:col-span-4 p-0 overflow-hidden flex flex-col h-[500px]">
          <div className="px-4 py-3 flex items-center gap-2" style={{borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)'}}>
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <h2 className="text-xs font-bold uppercase tracking-widest">慢查询记录</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead style={{background: 'var(--color-obsidian)'}}>
                <tr style={{color: 'var(--color-text-secondary)', borderBottom: '1px solid var(--color-border)'}}>
                  <th className="px-4 py-2 text-[10px] uppercase">ID</th>
                  <th className="px-4 py-2 text-[10px] uppercase">耗时</th>
                  <th className="px-4 py-2 text-[10px] uppercase">命令</th>
                </tr>
              </thead>
              <tbody>
                {slowLog.map((entry) => {
                  const ms = entry.durationMicros / 1000;
                  return (
                    <tr key={entry.id} className="transition-colors" style={{borderBottom: '1px solid rgba(51,65,85,0.3)'}}>
                      <td className="px-4 py-3" style={{color: 'var(--color-text-secondary)'}}>#{entry.id}</td>
                      <td className={cn("px-4 py-3 font-bold", ms > 100 ? 'text-red-500' : 'text-orange-500')}>{ms.toFixed(1)}ms</td>
                      <td className="px-4 py-3 truncate max-w-[100px]">{entry.command}</td>
                    </tr>
                  );
                })}
                {slowLog.length === 0 && (
                  <tr><td colSpan={3} className="px-4 py-6 text-center" style={{color: 'var(--color-text-secondary)'}}>暂无慢查询记录</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 text-[10px] font-mono italic" style={{background: 'var(--color-obsidian)', borderTop: '1px solid var(--color-border)', color: 'var(--color-text-secondary)'}}>
            Config: slowlog-log-slower-than 10000us
          </div>
        </Card>
      </div>
    </div>
  );
}
