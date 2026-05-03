import {useEffect, useState} from 'react';
import {Sidebar} from './components/Sidebar';
import {deleteConnection, listConnections} from './lib/api';
import {ConnectionsPage} from './pages/ConnectionsPage';
import {ConnectionDetailPage} from './pages/ConnectionDetailPage';
import type {ConnectionProfile} from './types';

function App() {
  const [page, setPage] = useState<'connections' | 'detail'>('connections');
  const [connections, setConnections] = useState<ConnectionProfile[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>('');
  const [loadError, setLoadError] = useState('');

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

  return (
    <div className="min-h-screen text-ink">
      <div className="fixed inset-0 -z-10 bg-coal" />
      <div className="grid min-h-screen min-w-0 md:h-screen md:grid-cols-[180px_minmax(0,1fr)] md:overflow-hidden lg:grid-cols-[200px_minmax(0,1fr)]">
        <Sidebar connection={selectedConnection} hasConnections={connections.length > 0} />
        <main className="min-w-0 overflow-y-auto px-3 py-4 sm:px-5 md:px-4 md:py-4 lg:px-6 lg:py-6 xl:px-8">
          {loadError && (
            <div className="mb-4 rounded-2xl border border-redis/30 bg-redis/10 px-4 py-3 text-sm text-redis">
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
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
