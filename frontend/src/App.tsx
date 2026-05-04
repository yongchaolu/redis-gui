import {useEffect, useState} from 'react';
import {LayoutDashboard, Activity, Layers, Settings, Database, RefreshCcw, LogOut, Plug, FileText} from 'lucide-react';
import {ConnectionsPage} from './pages/ConnectionsPage';
import {ConnectionDetailPage} from './pages/ConnectionDetailPage';
import {MonitorPage} from './pages/MonitorPage';
import {MemoryAnalysisPage} from './pages/MemoryAnalysisPage';
import {ConfigPage} from './pages/ConfigPage';
import {ReportsPage} from './pages/ReportsPage';
import {deleteConnection, listConnections} from './lib/api';
import {cn} from './lib/utils';
import type {ConnectionProfile, AnalysisReport} from './types';
import {motion, AnimatePresence} from 'motion/react';

type PageKey = 'connections' | 'detail' | 'monitor' | 'memory' | 'config' | 'reports';

const NAV_ITEMS = [
  {id: 'detail' as PageKey, label: 'Overview', icon: LayoutDashboard},
  {id: 'monitor' as PageKey, label: 'Real-time Monitor', icon: Activity},
  {id: 'memory' as PageKey, label: 'Memory Analysis', icon: Layers},
  {id: 'config' as PageKey, label: 'Configuration', icon: Settings},
  {id: 'reports' as PageKey, label: 'Reports', icon: FileText},
  {id: 'connections' as PageKey, label: 'Connections', icon: Plug},
];

export default function App() {
  const [page, setPage] = useState<PageKey>('connections');
  const [connections, setConnections] = useState<ConnectionProfile[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [selectedConnectionId, setSelectedConnectionId] = useState('');
  const [loadError, setLoadError] = useState('');
  const [currentReport, setCurrentReport] = useState<AnalysisReport | null>(null);

  useEffect(() => {
    listConnections()
      .then((items) => {
        const list = items ?? [];
        setConnections(list);
        if (list.length === 0) setPage('connections');
      })
      .catch((err) => {
        setConnections([]);
        setPage('connections');
        setLoadError(err instanceof Error ? err.message : '加载连接列表失败');
      })
      .finally(() => setLoadingConnections(false));
  }, []);

  const selectedConnection = connections.find((c) => c.id === selectedConnectionId);

  function handleSaved(profile: ConnectionProfile) {
    setConnections((current) => {
      const exists = current.some((item) => item.id === profile.id);
      if (exists) return current.map((item) => (item.id === profile.id ? profile : item));
      return [profile, ...current];
    });
    setSelectedConnectionId(profile.id);
    setPage('detail');
  }

  async function handleDelete(id: string) {
    try {
      await deleteConnection(id);
      setConnections((current) => {
        const next = current.filter((c) => c.id !== id);
        if (selectedConnectionId === id) {
          setSelectedConnectionId('');
          setPage('connections');
        }
        return next;
      });
    } catch (err) {
      throw err instanceof Error ? err : new Error('删除连接失败');
    }
  }

  function handleNavigate(nextPage: PageKey) {
    if (nextPage === 'connections') {
      setSelectedConnectionId('');
      setCurrentReport(null);
    }
    setPage(nextPage);
  }

  // Extract real data from report
  const nodeInfo = currentReport?.snapshot?.nodes?.[0]?.info;
  const redisVersion = nodeInfo?.['redis_version'] ?? '-';
  const uptimeSeconds = parseInt(nodeInfo?.['uptime_in_seconds'] ?? '0', 10);
  const connAddr = selectedConnection?.addresses?.[0] ?? '-';

  function formatUptime(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
    return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden selection:bg-redis-red/30" style={{background: 'var(--color-obsidian)'}}>
      {/* Sidebar */}
      <aside className="w-[240px] shrink-0 flex flex-col" style={{borderRight: '1px solid var(--color-border)', background: 'var(--color-surface)'}}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded flex items-center justify-center text-white" style={{background: 'var(--color-redis-red)'}}>
              <Database className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-wider leading-none" style={{color: 'var(--color-redis-red)'}}>Redis Lens</h1>
              <p className="text-[10px] font-mono mt-1" style={{color: 'var(--color-text-secondary)'}}>v1.0.0-stable</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 mt-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = page === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-6 py-3 transition-all duration-200 group relative",
                  isActive
                    ? "text-white border-l-2"
                    : "hover:text-white"
                )}
                style={isActive ? {background: 'rgba(255,255,255,0.05)', borderLeftColor: 'var(--color-redis-red)'} : {color: 'var(--color-text-secondary)'}}
              >
                <Icon className={cn("w-5 h-5", isActive ? "" : "group-hover:text-white")} style={isActive ? {color: 'var(--color-redis-red)'} : undefined} />
                <span className="text-sm font-medium tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Connection Status */}
        <div className="p-4" style={{borderTop: '1px solid var(--color-border)', background: 'rgba(15,23,42,0.3)'}}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded text-white flex items-center justify-center font-bold text-xs" style={{background: 'var(--color-redis-red)'}}>
              {selectedConnection ? selectedConnection.name.slice(0, 2).toUpperCase() : '--'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{selectedConnection?.name ?? 'No Connection'}</p>
              <p className="text-[10px] truncate font-mono" style={{color: 'var(--color-text-secondary)'}}>{connAddr}</p>
            </div>
            {selectedConnection && (
              <div className="ml-auto w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header
          className="h-14 flex items-center justify-between px-6 sticky top-0 z-30"
          style={{borderBottom: '1px solid var(--color-border)', background: 'rgba(30,41,59,0.95)', backdropFilter: 'blur(8px)'}}
        >
          <div className="flex items-center gap-6 font-mono text-[10px] uppercase tracking-widest" style={{color: 'var(--color-text-secondary)'}}>
            <span className="font-bold animate-pulse" style={{color: 'var(--color-redis-red)'}}>Redis Performance Monitor</span>
            {selectedConnection && (
              <div className="flex gap-4 pl-4" style={{borderLeft: '1px solid var(--color-border)'}}>
                <span>{connAddr}</span>
                <span>v{redisVersion}</span>
                <span className="text-white font-bold">Up: {formatUptime(uptimeSeconds)}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {selectedConnection && (
              <>
                <button
                  onClick={() => { if (page === 'detail') setCurrentReport(null); }}
                  className="p-2 transition-colors active:scale-90"
                  style={{color: 'var(--color-text-secondary)'}}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
                >
                  <RefreshCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleNavigate('config')}
                  className="p-2 transition-colors"
                  style={{color: 'var(--color-text-secondary)'}}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleNavigate('connections')}
                  className="px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest text-white transition-all active:scale-95 hover:brightness-110"
                  style={{background: 'var(--color-redis-red)'}}
                >
                  Disconnect
                </button>
              </>
            )}
          </div>
        </header>

        {/* Content Canvas */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 custom-scrollbar scroll-smooth">
          {loadError && (
            <div className="mb-4 rounded-lg px-4 py-3 text-sm" style={{border: '1px solid rgba(220,38,38,0.3)', background: 'rgba(220,38,38,0.1)', color: 'var(--color-redis-red)'}}>
              {loadError}
            </div>
          )}
          <AnimatePresence mode="wait">
            <motion.div
              key={page + (selectedConnectionId ?? '')}
              initial={{opacity: 0, y: 10}}
              animate={{opacity: 1, y: 0}}
              exit={{opacity: 0, y: -10}}
              transition={{duration: 0.2}}
            >
              {page === 'connections' && (
                <ConnectionsPage
                  connections={connections}
                  loadingConnections={loadingConnections}
                  onSaved={handleSaved}
                  onDelete={handleDelete}
                  onSelect={(id) => { setSelectedConnectionId(id); setPage('detail'); }}
                />
              )}
              {page === 'detail' && selectedConnection && (
                <ConnectionDetailPage
                  connection={selectedConnection}
                  connections={connections}
                  onBack={() => setPage('connections')}
                  onSelectConnection={(id) => setSelectedConnectionId(id)}
                  onDelete={handleDelete}
                  onReportLoaded={setCurrentReport}
                />
              )}
              {page === 'monitor' && selectedConnection && (
                <MonitorPage connection={selectedConnection} />
              )}
              {page === 'memory' && selectedConnection && (
                <MemoryAnalysisPage connection={selectedConnection} />
              )}
              {page === 'config' && selectedConnection && (
                <ConfigPage connection={selectedConnection} />
              )}
              {page === 'reports' && (
                <ReportsPage />
              )}
              {page !== 'connections' && !selectedConnection && (
                <div className="flex flex-col items-center justify-center min-h-[400px]" style={{color: 'var(--color-text-secondary)'}}>
                  <Database className="w-12 h-12 mb-4 opacity-20" />
                  <p className="font-mono text-sm tracking-widest uppercase">No connection selected</p>
                  <p className="text-[10px] mt-2 italic">Please connect to a Redis instance first</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
