import {useEffect, useState} from 'react';
import {Sidebar, type PageKey} from './components/Sidebar';
import {TopAppBar} from './components/TopAppBar';
import {deleteConnection, listConnections} from './lib/api';
import {ConnectionsPage} from './pages/ConnectionsPage';
import {ConnectionDetailPage} from './pages/ConnectionDetailPage';
import {MemoryAnalysisPage} from './pages/MemoryAnalysisPage';
import {MonitorPage} from './pages/MonitorPage';
import {ConfigPage} from './pages/ConfigPage';
import type {ConnectionProfile, AnalysisReport} from './types';

function App() {
  const [page, setPage] = useState<PageKey>('connections');
  const [connections, setConnections] = useState<ConnectionProfile[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>('');
  const [loadError, setLoadError] = useState('');
  const [currentReport, setCurrentReport] = useState<AnalysisReport | null>(null);

  useEffect(() => {
    listConnections()
      .then((items) => {
        const list = items ?? [];
        setConnections(list);
        if (list.length === 0) {
          setPage('connections');
        }
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
      if (exists) {
        return current.map((item) => (item.id === profile.id ? profile : item));
      }
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

  return (
    <div className="min-h-screen text-ink">
      <div className="fixed inset-0 -z-10 bg-coal" />
      <div className="grid min-h-screen min-w-0 md:h-screen md:grid-cols-[240px_minmax(0,1fr)] md:overflow-hidden">
        <Sidebar
          connection={selectedConnection}
          hasConnections={connections.length > 0}
          page={page}
          onNavigate={handleNavigate}
        />
        <div className="flex min-w-0 flex-col overflow-hidden">
          <TopAppBar
            connection={selectedConnection}
            report={currentReport}
            onDisconnect={() => {
              setSelectedConnectionId('');
              setCurrentReport(null);
              setPage('connections');
            }}
          />
          <main className="min-w-0 flex-1 overflow-y-auto px-4 py-4 lg:px-6 lg:py-5 xl:px-8">
            {loadError && (
              <div className="mb-4 rounded-lg border border-redis/30 bg-redis/10 px-4 py-3 text-sm text-redis">
                {loadError}
              </div>
            )}
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
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
