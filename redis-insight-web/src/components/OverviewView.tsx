import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import { Badge, Card } from '../lib/utils';
import { Database, ShieldAlert, Zap, Globe, Cpu, Users } from 'lucide-react';

const MOCK_QPS_DATA = Array.from({ length: 20 }, (_, i) => ({
  time: i,
  qps: 1200 + Math.random() * 800
}));

const COMMAND_DATA = [
  { name: 'GET', calls: '842,910', time: '1,240,551', avg: '1.47', usage: 45 },
  { name: 'SET', calls: '312,004', time: '890,200', avg: '2.85', usage: 22 },
  { name: 'HGETALL', calls: '110,451', time: '1,450,210', avg: '13.12', usage: 12 },
  { name: 'EXPIRE', calls: '98,202', time: '45,100', avg: '0.46', usage: 8 },
];

export const OverviewView = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Top Section */}
      <div className="grid grid-cols-12 gap-4">
        {/* Instance Info */}
        <Card className="col-span-12 lg:col-span-4 border-l-4 border-emerald-500">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-h2 font-semibold">Instance Node</h3>
            <div className="flex items-center gap-2 text-emerald-400">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              <span className="text-[10px] font-mono tracking-widest font-bold">HEALTHY</span>
            </div>
          </div>
          <div className="space-y-3 font-mono text-sm">
            {[
              { label: 'OS', value: 'Linux 5.15.0-67-generic' },
              { label: 'Process ID', value: '12459' },
              { label: 'Role', value: 'Master' },
              { label: 'Arch', value: 'x64' },
            ].map((item) => (
              <div key={item.label} className="flex justify-between border-b border-border/50 pb-1">
                <span className="text-text-secondary">{item.label}</span>
                <span className="text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Metrics */}
        <div className="col-span-12 lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-[10px] uppercase tracking-widest text-text-secondary">Clients</span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <div className="mt-4">
              <div className="text-3xl font-mono font-bold">1,284</div>
              <div className="text-[10px] text-emerald-400 font-mono">+12% from peak</div>
            </div>
          </Card>
          <Card className="flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-[10px] uppercase tracking-widest text-text-secondary">Hit Rate</span>
              <Database className="w-4 h-4 text-redis-red" />
            </div>
            <div className="mt-4">
              <div className="text-3xl font-mono font-bold">98.4%</div>
              <div className="text-[10px] text-text-secondary font-mono">Keyspace Efficiency</div>
            </div>
          </Card>
          <Card className="flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-[10px] uppercase tracking-widest text-text-secondary">Total Commands</span>
              <Zap className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="mt-4">
              <div className="text-3xl font-mono font-bold">4.2M</div>
              <div className="text-[10px] text-text-secondary font-mono">Since Uptime</div>
            </div>
          </Card>
        </div>
      </div>

      {/* Main Analysis Section */}
      <div className="grid grid-cols-12 gap-4">
        {/* QPS Chart */}
        <Card className="col-span-12 lg:col-span-8 h-[350px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-h2">Operations Per Second (QPS)</h3>
            <div className="flex gap-2">
              <Badge className="bg-redis-red/20 text-redis-red border border-redis-red/40">Live</Badge>
              <Badge className="bg-border text-text-secondary">Historical</Badge>
            </div>
          </div>
          <div className="flex-grow w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_QPS_DATA}>
                <defs>
                  <linearGradient id="colorQps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '4px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="qps" stroke="#dc2626" fillOpacity={1} fill="url(#colorQps)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Memory Usage */}
        <Card className="col-span-12 lg:col-span-4 flex flex-col items-center">
          <h3 className="text-h2 mb-8">Memory Usage</h3>
          <div className="relative w-48 h-48 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[{value: 75}, {value: 25}]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  startAngle={180}
                  endAngle={-180}
                  dataKey="value"
                  stroke="none"
                >
                  <Cell fill="#dc2626" />
                  <Cell fill="#334155" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold">75%</span>
              <span className="text-[10px] text-text-secondary font-mono uppercase">1.2GB / 1.6GB</span>
            </div>
          </div>
          <div className="w-full space-y-3 pt-4 border-t border-border/50">
             <div className="flex justify-between items-center text-sm">
                <span className="text-text-secondary">Fragmentation Ratio</span>
                <span className="font-mono text-white">1.04</span>
             </div>
             <div className="flex justify-between items-center text-sm">
                <span className="text-text-secondary">Peak Memory</span>
                <span className="font-mono text-white">1.42 GB</span>
             </div>
          </div>
        </Card>
      </div>

      {/* Commands Table */}
      <Card className="overflow-hidden p-0">
        <div className="bg-surface-hover/50 px-6 py-3 border-b border-border flex justify-between items-center">
          <h3 className="text-sm font-mono font-bold uppercase tracking-widest">Frequent Commands</h3>
          <span className="text-[10px] text-text-secondary font-mono">Last 5 Minutes</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-sm">
            <thead>
              <tr className="bg-obsidian/50 text-text-secondary border-b border-border">
                <th className="px-6 py-4 font-medium uppercase tracking-tighter">Command</th>
                <th className="px-6 py-4 font-medium uppercase tracking-tighter">Calls</th>
                <th className="px-6 py-4 font-medium uppercase tracking-tighter text-right">Total Time (µs)</th>
                <th className="px-6 py-4 font-medium uppercase tracking-tighter text-right">Usage %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {COMMAND_DATA.map((cmd) => (
                <tr key={cmd.name} className="hover:bg-surface-hover transition-colors">
                  <td className="px-6 py-4 font-bold text-white">{cmd.name}</td>
                  <td className="px-6 py-4 text-slate-300">{cmd.calls}</td>
                  <td className="px-6 py-4 text-right text-slate-300">{cmd.time}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3 justify-end">
                      <div className="w-24 bg-border h-1.5 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full" style={{ width: `${cmd.usage}%` }} />
                      </div>
                      <span className="text-[10px] text-text-secondary w-8">{cmd.usage}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
