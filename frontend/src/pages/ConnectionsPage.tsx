import {useState} from 'react';
import {Icon} from '../components/Icon';
import {useToast} from '../components/Toast';
import {saveConnection, testConnection} from '../lib/api';
import type {ConnectionMode, ConnectionProfile} from '../types';

interface Props {
  connections: ConnectionProfile[];
  loadingConnections?: boolean;
  onSaved: (profile: ConnectionProfile) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
}

const MODE_OPTIONS: { value: ConnectionMode; label: string }[] = [
  { value: 'standalone', label: 'Standalone' },
  { value: 'sentinel', label: 'Sentinel' },
  { value: 'cluster', label: 'Cluster' },
];

export function ConnectionsPage({connections, loadingConnections, onSaved, onDelete, onSelect}: Props) {
  const {showToast} = useToast();
  const [selectedId, setSelectedId] = useState<string>('');
  const [editing, setEditing] = useState<ConnectionProfile | null>(null);
  const [testResult, setTestResult] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string>('');

  const isNew = editing !== null && editing.id === '';

  function handleNew() {
    setEditing({
      id: '', name: '', mode: 'standalone', addresses: ['127.0.0.1:6379'],
      sentinelMaster: '', username: '', password: '', tls: false, timeoutSeconds: 3,
      tags: [], createdAt: new Date(), updatedAt: new Date(),
    } as ConnectionProfile);
    setTestResult('');
    setShowPassword(false);
    setShowAdvanced(false);
  }

  function handleSelectConn(conn: ConnectionProfile) {
    setSelectedId(conn.id);
    setEditing({...conn});
    setTestResult('');
    setShowPassword(false);
    setShowAdvanced(false);
  }

  if (loadingConnections) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-pulse text-mute">Loading connections...</div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 gap-0 overflow-hidden rounded-lg border border-border">
      {/* Left Panel: Connection List */}
      <aside className="flex w-[280px] shrink-0 flex-col border-r border-border bg-panel lg:w-[300px]">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-xs font-bold uppercase tracking-widest text-mute">Saved Connections</span>
          <button
            onClick={handleNew}
            className="rounded-md bg-redis p-1 text-white transition hover:bg-red-500 active:scale-95"
            title="New Connection"
          >
            <Icon name="add" className="text-[18px]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {connections.length === 0 ? (
            <div className="p-4 text-center text-xs text-mute">No connections yet</div>
          ) : (
            connections.map((conn) => (
              <div
                key={conn.id}
                onClick={() => handleSelectConn(conn)}
                className={`group relative flex cursor-pointer items-start gap-3 border-b border-border px-4 py-3 transition-colors ${
                  selectedId === conn.id ? 'bg-panel2' : 'hover:bg-panel2/50'
                }`}
              >
                <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full bg-mute" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Icon name={conn.mode === 'cluster' ? 'hub' : 'dns'} className="text-[16px] text-mute" />
                    <span className="truncate text-sm font-semibold text-ink">{conn.name}</span>
                  </div>
                  <div className="mt-0.5 truncate font-mono text-[11px] text-mute">{conn.addresses[0]}</div>
                </div>
                <div className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === conn.id ? '' : conn.id); }}
                    className="rounded p-0.5 text-mute opacity-0 transition hover:bg-white/10 hover:text-ink group-hover:opacity-100"
                  >
                    <Icon name="more_vert" className="text-[16px]" />
                  </button>
                  {menuOpenId === conn.id && (
                    <div className="absolute right-0 top-full z-10 mt-1 w-28 rounded-md border border-border bg-panel py-1 shadow-lg">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSelectConn(conn); setMenuOpenId(''); }}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-ink hover:bg-panel2"
                      >
                        <Icon name="edit" className="text-[14px]" /> Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(conn.id);
                          if (selectedId === conn.id) { setSelectedId(''); setEditing(null); }
                          setMenuOpenId('');
                        }}
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-redis hover:bg-redis/10"
                      >
                        <Icon name="delete" className="text-[14px]" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-border px-4 py-2 text-[10px] text-mute">
          v1.0.0 Desktop
        </div>
      </aside>

      {/* Right Panel: Form */}
      <main className="flex flex-1 flex-col overflow-y-auto bg-coal p-6 lg:p-8">
        {!editing && !isNew ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <Icon name="dns" className="text-4xl text-mute" />
              <p className="mt-2 text-sm text-mute">Select a connection or create a new one</p>
            </div>
          </div>
        ) : (
          <EditingForm
            profile={editing!}
            testResult={testResult}
            setTestResult={setTestResult}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            showAdvanced={showAdvanced}
            setShowAdvanced={setShowAdvanced}
            onSaved={onSaved}
            showToast={showToast}
            onCancel={() => { setEditing(null); setSelectedId(''); }}
            onSelect={onSelect}
          />
        )}
      </main>
    </div>
  );
}

function EditingForm({profile, testResult, setTestResult, showPassword, setShowPassword, showAdvanced, setShowAdvanced, onSaved, showToast, onCancel, onSelect}: {
  profile: ConnectionProfile;
  testResult: string;
  setTestResult: (s: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  showAdvanced: boolean;
  setShowAdvanced: (v: boolean) => void;
  onSaved: (p: ConnectionProfile) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onCancel: () => void;
  onSelect: (id: string) => void;
}) {
  const isEdit = !!profile.id;
  const [mode, setMode] = useState<ConnectionMode>(profile.mode || 'standalone');
  const [name, setName] = useState(profile.name);
  const [addresses, setAddresses] = useState(profile.addresses.join(', '));
  const [sentinelMaster, setSentinelMaster] = useState(profile.sentinelMaster || '');
  const [username, setUsername] = useState(profile.username || '');
  const [password, setPassword] = useState(profile.password || '');
  const [tls, setTls] = useState(profile.tls);
  const [timeoutSeconds, setTimeoutSeconds] = useState(profile.timeoutSeconds || 3);
  const [tags, setTags] = useState((profile.tags ?? []).join(', '));
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  function draft(): ConnectionProfile {
    return {
      ...profile, name, mode,
      addresses: addresses.split(',').map((a) => a.trim()).filter(Boolean),
      sentinelMaster: mode === 'sentinel' ? sentinelMaster : '',
      username, password, tls, timeoutSeconds,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
    };
  }

  async function handleTest() {
    setTesting(true);
    try {
      const result = await testConnection(draft());
      setTestResult(`${result.ok ? 'Success' : 'Failed'}: ${result.message}`);
    } catch (err) {
      setTestResult(err instanceof Error ? err.message : 'Test failed');
    } finally {
      setTesting(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const saved = await saveConnection(draft());
      onSaved(saved);
      onSelect(saved.id);
      showToast('Connection saved', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  }

  const hostPort = addresses.split(',')[0]?.split(':') ?? ['127.0.0.1', '6379'];
  const host = hostPort[0] || '127.0.0.1';
  const port = hostPort[1] || '6379';

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="text-xl font-bold text-ink">{isEdit ? 'Edit Connection' : 'New Connection'}</h1>

      {/* Mode Tabs */}
      <div className="mt-4 flex gap-1 rounded-lg border border-border bg-panel p-1">
        {MODE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setMode(opt.value)}
            className={`flex-1 rounded-md py-2 text-xs font-bold uppercase tracking-wider transition ${
              mode === opt.value
                ? 'border border-border bg-panel2 text-white'
                : 'text-mute hover:text-ink'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Form */}
      <div className="mt-5 rounded-lg border border-border bg-panel p-5">
        <div className="space-y-4">
          <label className="block text-xs text-mute">
            Connection Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Production Cache"
              className="mt-1.5 w-full rounded-md border border-border bg-black/20 px-3 py-2.5 text-sm text-ink outline-none focus:border-cyanx focus:ring-1 focus:ring-cyanx/30"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs text-mute">
              Host
              <input
                value={host}
                onChange={(e) => setAddresses(`${e.target.value}:${port}`)}
                placeholder="127.0.0.1"
                className="mt-1.5 w-full rounded-md border border-border bg-black/20 px-3 py-2.5 font-mono text-sm text-ink outline-none focus:border-cyanx focus:ring-1 focus:ring-cyanx/30"
              />
            </label>
            <label className="block text-xs text-mute">
              Port
              <input
                value={port}
                onChange={(e) => setAddresses(`${host}:${e.target.value}`)}
                placeholder="6379"
                className="mt-1.5 w-full rounded-md border border-border bg-black/20 px-3 py-2.5 font-mono text-sm text-ink outline-none focus:border-cyanx focus:ring-1 focus:ring-cyanx/30"
              />
            </label>
          </div>

          {mode === 'sentinel' && (
            <label className="block text-xs text-mute">
              Sentinel Master Name
              <input
                value={sentinelMaster}
                onChange={(e) => setSentinelMaster(e.target.value)}
                placeholder="mymaster"
                className="mt-1.5 w-full rounded-md border border-border bg-black/20 px-3 py-2.5 text-sm text-ink outline-none focus:border-cyanx focus:ring-1 focus:ring-cyanx/30"
              />
            </label>
          )}

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs text-mute">
              Username <span className="text-mute/50">(optional)</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="default"
                className="mt-1.5 w-full rounded-md border border-border bg-black/20 px-3 py-2.5 text-sm text-ink outline-none focus:border-cyanx focus:ring-1 focus:ring-cyanx/30"
              />
            </label>
            <label className="block text-xs text-mute">
              Password
              <div className="relative mt-1.5">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-md border border-border bg-black/20 px-3 py-2.5 pr-9 text-sm text-ink outline-none focus:border-cyanx focus:ring-1 focus:ring-cyanx/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-mute hover:text-ink"
                >
                  <Icon name={showPassword ? 'visibility_off' : 'visibility'} className="text-[18px]" />
                </button>
              </div>
            </label>
          </div>

          {/* Advanced Settings Accordion */}
          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1 text-xs text-mute transition hover:text-ink"
            >
              <Icon name={showAdvanced ? 'expand_more' : 'chevron_right'} className="text-[16px]" />
              Advanced Settings
            </button>
            {showAdvanced && (
              <div className="mt-3 space-y-3 rounded-md border border-border bg-panel2/50 p-3">
                <label className="block text-xs text-mute">
                  Tags <span className="text-mute/50">(comma separated)</span>
                  <input
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="production, cache, critical"
                    className="mt-1.5 w-full rounded-md border border-border bg-black/20 px-3 py-2 text-sm text-ink outline-none focus:border-cyanx"
                  />
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs text-mute">
                    <input type="checkbox" checked={tls} onChange={(e) => setTls(e.target.checked)} className="h-3.5 w-3.5 accent-cyanx" />
                    Enable TLS
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-mute">
                    Timeout
                    <input type="number" min={1} max={60} value={timeoutSeconds} onChange={(e) => setTimeoutSeconds(Number(e.target.value))} className="w-14 rounded border border-border bg-black/20 px-2 py-1 text-center font-mono text-xs text-ink outline-none focus:border-cyanx" />
                    sec
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Test Result */}
      {testResult && (
        <div className="mt-3 rounded-md border border-cyanx/30 bg-cyanx/10 px-4 py-2.5 text-xs text-cyanx">
          {testResult}
        </div>
      )}

      {/* Actions */}
      <div className="mt-5 flex gap-3">
        <button
          onClick={handleTest}
          disabled={testing}
          className="flex-1 rounded-md border border-border bg-panel px-5 py-3 text-sm font-bold text-ink transition hover:border-white/25 hover:bg-panel2 disabled:opacity-50"
        >
          {testing ? 'Testing...' : 'Test Connection'}
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 rounded-md bg-redis px-5 py-3 text-sm font-bold text-white shadow-[0_0_15px_rgba(220,38,38,0.3)] transition hover:bg-red-500 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Connect & Save'}
        </button>
      </div>
    </div>
  );
}
