import React, { useState, useEffect } from 'react';
import { Card, Badge, cn } from '../lib/utils';
import { LineChart, Line, ResponsiveContainer, YAxis, XAxis, CartesianGrid, Tooltip } from 'recharts';
import { Play, Pause, Trash2, AlertTriangle, Terminal } from 'lucide-react';

const SLOW_LOG_DATA = [
  { id: '#412', duration: '14.2ms', command: 'KEYS *', priority: 'critical' },
  { id: '#411', duration: '8.9ms', command: 'FLUSHDB', priority: 'warning' },
  { id: '#410', duration: '5.4ms', command: 'SMEMBERS large_set_01', priority: 'low' },
  { id: '#409', duration: '4.2ms', command: 'ZREVRANGE test_rank 0 -1', priority: 'low' },
  { id: '#408', duration: '2.1ms', command: 'HGETALL analytics_hash', priority: 'low' },
];

const STREAM_LOGS = [
  { time: '1716482931.024', addr: '[0 127.0.0.1:51294]', cmd: 'GET', args: '"user:session:9a8f2"', color: 'text-blue-400' },
  { time: '1716482931.025', addr: '[0 127.0.0.1:51294]', cmd: 'SETEX', args: '"user:session:9a8f2" "3600" "{...}"', color: 'text-green-400' },
  { time: '1716482931.031', addr: '[1 10.0.1.4:49210]', cmd: 'HGETALL', args: '"product:stock:id881"', color: 'text-yellow-400' },
  { time: '1716482931.045', addr: '[0 127.0.0.1:51294]', cmd: 'ZADD', args: '"leaderboard" "420" "user:501"', color: 'text-pink-400' },
  { time: '1716482931.056', addr: '[0 127.0.0.1:51294]', cmd: 'EXPIRE', args: '"leaderboard" "60"', color: 'text-blue-400' },
  { time: '1716482931.072', addr: '[0 127.0.0.1:52111]', cmd: 'PUBLISH', args: '"notifications" "Order #1233 confirmed"', color: 'text-red-400' },
  { time: '1716482931.080', addr: '[0 127.0.0.1:51294]', cmd: 'GET', args: '"config:global"', color: 'text-blue-400' },
];

export const RealTimeMonitorView = () => {
  const [data, setData] = useState(Array.from({ length: 30 }, (_, i) => ({ time: i, ops: 1400 + Math.random() * 200 })));

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => [...prev.slice(1), { time: prev[prev.length - 1].time + 1, ops: 1400 + Math.random() * 200 }]);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
      {/* Large OPS Graph */}
      <Card className="h-64 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-h2 font-semibold">Operations Per Second</h3>
          <div className="px-3 py-1 bg-redis-red/10 border border-redis-red/20 rounded font-mono text-redis-red">
            {Math.round(data[data.length - 1].ops)} ops/s
          </div>
        </div>
        <div className="flex-grow">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
              <Line type="monotone" dataKey="ops" stroke="#dc2626" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid grid-cols-12 gap-6">
        {/* Stream Terminal */}
        <section className="col-span-12 lg:col-span-8 bg-obsidian border border-border rounded-lg flex flex-col h-[500px] overflow-hidden">
          <div className="bg-surface px-4 py-2 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-redis-red animate-pulse" />
              <span className="font-mono text-[10px] uppercase tracking-widest font-bold">Live Monitor Stream</span>
            </div>
            <div className="flex gap-2">
              <button className="p-1 hover:text-white transition-colors"><Pause className="w-3 h-3" /></button>
              <button className="p-1 hover:text-white transition-colors"><Trash2 className="w-3 h-3" /></button>
            </div>
          </div>
          <div className="flex-1 terminal-scroll overflow-y-auto p-4 font-mono text-xs space-y-1.5 selection:bg-redis-red/30">
            {STREAM_LOGS.map((log, idx) => (
              <div key={idx} className="flex gap-4 group hover:bg-white/5 p-1 rounded transition-colors">
                <span className="text-text-secondary shrink-0">{log.time}</span>
                <span className="text-blue-500 whitespace-nowrap">{log.addr}</span>
                <span className={cn("font-bold uppercase min-w-[60px]", log.color)}>{log.cmd}</span>
                <span className="text-slate-200 truncate">{log.args}</span>
              </div>
            ))}
            <div className="animate-pulse text-redis-red/50">_</div>
          </div>
        </section>

        {/* Slow Log */}
        <Card className="col-span-12 lg:col-span-4 p-0 overflow-hidden flex flex-col h-[500px]">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2 bg-surface">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <h2 className="text-xs font-bold uppercase tracking-widest">Slow Log Entry</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-obsidian sticky top-0">
                <tr className="text-[10px] uppercase text-text-secondary border-b border-border">
                  <th className="px-4 py-2">ID</th>
                  <th className="px-4 py-2">Dur</th>
                  <th className="px-4 py-2">Cmd</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {SLOW_LOG_DATA.map((row) => (
                  <tr key={row.id} className="hover:bg-surface-hover transition-colors">
                    <td className="px-4 py-3 text-text-secondary">{row.id}</td>
                    <td className={cn("px-4 py-3 font-bold", 
                      row.priority === 'critical' ? 'text-red-500' : 'text-orange-500'
                    )}>{row.duration}</td>
                    <td className="px-4 py-3 truncate max-w-[100px]">{row.command}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-obsidian border-t border-border text-[10px] text-text-secondary font-mono italic">
            Config: slowlog-log-slower-than 10000ms
          </div>
        </Card>
      </div>
    </div>
  );
};
