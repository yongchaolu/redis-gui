import type { ConnectionProfile } from '../types';
import { Icon } from './Icon';

export type PageKey = 'connections' | 'detail' | 'monitor' | 'memory' | 'config';

interface SidebarProps {
  connection?: ConnectionProfile;
  hasConnections: boolean;
  page: PageKey;
  onNavigate: (page: PageKey) => void;
}

const NAV_ITEMS: { key: PageKey; label: string; icon: string }[] = [
  { key: 'connections', label: 'Connections', icon: 'dns' },
  { key: 'detail', label: 'Overview', icon: 'dashboard' },
  { key: 'monitor', label: 'Real-time Monitor', icon: 'monitoring' },
  { key: 'memory', label: 'Memory Analysis', icon: 'analytics' },
  { key: 'config', label: 'Configuration', icon: 'settings' },
];

export function Sidebar({ connection, hasConnections, page, onNavigate }: SidebarProps) {
  const connected = !!connection;

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-full w-[240px] border-r border-border bg-panel font-sans antialiased tracking-tight text-sm md:block">
      <div className="p-5">
        <div className="flex items-center gap-2">
          <Icon name="database" className="text-redis text-xl" filled />
          <h1 className="text-base font-black text-redis uppercase tracking-wider">Redis Lens</h1>
        </div>
        <p className="mt-0.5 text-[10px] text-mute">v1.0.0-stable</p>
      </div>

      <nav className="mt-2 px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = page === item.key;
          const isDisabled = !hasConnections && item.key !== 'connections';
          return (
            <button
              key={item.key}
              onClick={() => !isDisabled && onNavigate(item.key)}
              disabled={isDisabled}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors ${
                isActive
                  ? 'border-l-2 border-redis bg-panel2 text-white'
                  : isDisabled
                    ? 'cursor-not-allowed text-mute/50'
                    : 'border-l-2 border-transparent text-mute hover:bg-panel2/50 hover:text-ink'
              }`}
            >
              <Icon name={item.icon} className="text-[18px]" />
              <span className="text-[13px]">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="absolute bottom-0 left-0 w-full border-t border-border p-4">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              connected ? 'bg-greenx animate-ping' : 'bg-mute'
            }`}
          />
          <span className="text-[11px] uppercase tracking-widest text-mute">
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        {connection && (
          <div className="mt-1 truncate text-[10px] text-mute">
            {connection.addresses[0] ?? connection.name}
          </div>
        )}
      </div>
    </aside>
  );
}
