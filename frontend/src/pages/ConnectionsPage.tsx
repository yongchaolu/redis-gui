import {useState} from 'react';
import {Plus, Database, Network, MoreVertical, Edit3, Trash2, Eye, EyeOff, ChevronRight, ChevronDown} from 'lucide-react';
import {useToast} from '../components/Toast';
import {saveConnection, testConnection} from '../lib/api';
import {cn} from '../lib/utils';
import type {ConnectionMode, ConnectionProfile} from '../types';

interface Props {
  connections: ConnectionProfile[];
  loadingConnections?: boolean;
  onSaved: (profile: ConnectionProfile) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
}

const MODE_OPTIONS: {value: ConnectionMode; label: string}[] = [
  {value: 'standalone', label: 'Standalone'},
  {value: 'sentinel', label: 'Sentinel'},
  {value: 'cluster', label: 'Cluster'},
];

export function ConnectionsPage({connections, loadingConnections, onSaved, onDelete, onSelect}: Props) {
  const {showToast} = useToast();
  const [selectedId, setSelectedId] = useState('');
  const [editing, setEditing] = useState<ConnectionProfile | null>(null);
  const [testResult, setTestResult] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState('');

  function handleNew() {
    setEditing({
      id: '', name: '', mode: 'standalone', addresses: ['127.0.0.1:6379'],
      sentinelMaster: '', username: '', password: '', tls: false, timeoutSeconds: 3,
      tags: [],
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
        <div className="animate-pulse" style={{color: 'var(--color-text-secondary)'}}>Loading connections...</div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 gap-0 overflow-hidden rounded-lg" style={{border: '1px solid var(--color-border)'}}>
      {/* Left Panel */}
      <aside className="flex w-[280px] shrink-0 flex-col lg:w-[300px]" style={{borderRight: '1px solid var(--color-border)', background: 'var(--color-surface)'}}>
        <div className="flex items-center justify-between px-4 py-3" style={{borderBottom: '1px solid var(--color-border)'}}>
          <span className="text-xs font-bold uppercase tracking-widest" style={{color: 'var(--color-text-secondary)'}}>Saved Connections</span>
          <button onClick={handleNew} className="rounded-md p-1 text-white transition hover:brightness-110 active:scale-95" style={{background: 'var(--color-redis-red)'}} title="New Connection">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {connections.length === 0 ? (
            <div className="p-4 text-center text-xs" style={{color: 'var(--color-text-secondary)'}}>No connections yet</div>
          ) : (
            connections.map((conn) => (
              <div
                key={conn.id}
                onClick={() => handleSelectConn(conn)}
                className={cn("group relative flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors", selectedId === conn.id ? '' : 'hover:bg-white/5')}
                style={{borderBottom: '1px solid var(--color-border)', background: selectedId === conn.id ? 'var(--color-surface-hover)' : undefined}}
              >
                <span className="mt-1 inline-block h-2 w-2 shrink-0 rounded-full" style={{background: 'var(--color-text-secondary)'}} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {conn.mode === 'cluster' ? <Network className="w-4 h-4" style={{color: 'var(--color-text-secondary)'}} /> : <Database className="w-4 h-4" style={{color: 'var(--color-text-secondary)'}} />}
                    <span className="truncate text-sm font-semibold text-white">{conn.name}</span>
                  </div>
                  <div className="mt-0.5 truncate font-mono text-[11px]" style={{color: 'var(--color-text-secondary)'}}>{conn.addresses[0]}</div>
                </div>
                <div className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === conn.id ? '' : conn.id); }}
                    className="rounded p-0.5 opacity-0 transition hover:bg-white/10 hover:text-white group-hover:opacity-100"
                    style={{color: 'var(--color-text-secondary)'}}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {menuOpenId === conn.id && (
                    <div className="absolute right-0 top-full z-10 mt-1 w-28 rounded-md py-1 shadow-lg" style={{background: 'var(--color-surface)', border: '1px solid var(--color-border)'}}>
                      <button onClick={(e) => { e.stopPropagation(); handleSelectConn(conn); setMenuOpenId(''); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-white hover:bg-white/5">
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); onDelete(conn.id); if (selectedId === conn.id) { setSelectedId(''); setEditing(null); } setMenuOpenId(''); }} className="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-white/5" style={{color: 'var(--color-redis-red)'}}>
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="px-4 py-2 text-[10px]" style={{borderTop: '1px solid var(--color-border)', color: 'var(--color-text-secondary)'}}>
          v1.0.0 Desktop
        </div>
      </aside>

      {/* Right Panel */}
      <main className="flex flex-1 flex-col overflow-y-auto p-6 lg:p-8" style={{background: 'var(--color-obsidian)'}}>
        {!editing ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <Database className="w-12 h-12 mx-auto mb-2 opacity-20" style={{color: 'var(--color-text-secondary)'}} />
              <p className="text-sm" style={{color: 'var(--color-text-secondary)'}}>Select a connection or create a new one</p>
            </div>
          </div>
        ) : (
          <EditingForm
            profile={editing}
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

  const inputStyle = {
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid var(--color-border)',
    color: 'white',
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="text-xl font-bold text-white">{isEdit ? 'Edit Connection' : 'New Connection'}</h1>

      {/* Mode Tabs */}
      <div className="mt-4 flex gap-1 rounded-lg p-1" style={{border: '1px solid var(--color-border)', background: 'var(--color-surface)'}}>
        {MODE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setMode(opt.value)}
            className={cn("flex-1 rounded-md py-2 text-xs font-bold uppercase tracking-wider transition", mode === opt.value ? 'text-white' : 'hover:text-white')}
            style={mode === opt.value
              ? {border: '1px solid var(--color-border)', background: 'var(--color-surface-hover)'}
              : {color: 'var(--color-text-secondary)'}
            }
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Form */}
      <div className="mt-5 rounded-lg p-5" style={{border: '1px solid var(--color-border)', background: 'var(--color-surface)'}}>
        <div className="space-y-4">
          <label className="block text-xs" style={{color: 'var(--color-text-secondary)'}}>
            Connection Name
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Production Cache" className="mt-1.5 w-full rounded-md px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-blue-500" style={inputStyle} />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs" style={{color: 'var(--color-text-secondary)'}}>
              Host
              <input value={host} onChange={(e) => setAddresses(`${e.target.value}:${port}`)} placeholder="127.0.0.1" className="mt-1.5 w-full rounded-md px-3 py-2.5 font-mono text-sm outline-none focus:ring-1 focus:ring-blue-500" style={inputStyle} />
            </label>
            <label className="block text-xs" style={{color: 'var(--color-text-secondary)'}}>
              Port
              <input value={port} onChange={(e) => setAddresses(`${host}:${e.target.value}`)} placeholder="6379" className="mt-1.5 w-full rounded-md px-3 py-2.5 font-mono text-sm outline-none focus:ring-1 focus:ring-blue-500" style={inputStyle} />
            </label>
          </div>

          {mode === 'sentinel' && (
            <label className="block text-xs" style={{color: 'var(--color-text-secondary)'}}>
              Sentinel Master Name
              <input value={sentinelMaster} onChange={(e) => setSentinelMaster(e.target.value)} placeholder="mymaster" className="mt-1.5 w-full rounded-md px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-blue-500" style={inputStyle} />
            </label>
          )}

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs" style={{color: 'var(--color-text-secondary)'}}>
              Username <span className="opacity-50">(optional)</span>
              <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="default" className="mt-1.5 w-full rounded-md px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-blue-500" style={inputStyle} />
            </label>
            <label className="block text-xs" style={{color: 'var(--color-text-secondary)'}}>
              Password
              <div className="relative mt-1.5">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-md px-3 py-2.5 pr-9 text-sm outline-none focus:ring-1 focus:ring-blue-500" style={inputStyle} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 hover:text-white" style={{color: 'var(--color-text-secondary)'}}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </label>
          </div>

          {/* Advanced Settings */}
          <div>
            <button onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-1 text-xs transition hover:text-white" style={{color: 'var(--color-text-secondary)'}}>
              {showAdvanced ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              Advanced Settings
            </button>
            {showAdvanced && (
              <div className="mt-3 space-y-3 rounded-md p-3" style={{border: '1px solid var(--color-border)', background: 'rgba(45,55,72,0.5)'}}>
                <label className="block text-xs" style={{color: 'var(--color-text-secondary)'}}>
                  Tags <span className="opacity-50">(comma separated)</span>
                  <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="production, cache, critical" className="mt-1.5 w-full rounded-md px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500" style={inputStyle} />
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs" style={{color: 'var(--color-text-secondary)'}}>
                    <input type="checkbox" checked={tls} onChange={(e) => setTls(e.target.checked)} className="h-3.5 w-3.5 accent-blue-500" />
                    Enable TLS
                  </label>
                  <label className="flex items-center gap-1.5 text-xs" style={{color: 'var(--color-text-secondary)'}}>
                    Timeout
                    <input type="number" min={1} max={60} value={timeoutSeconds} onChange={(e) => setTimeoutSeconds(Number(e.target.value))} className="w-14 rounded px-2 py-1 text-center font-mono text-xs outline-none focus:ring-1 focus:ring-blue-500" style={inputStyle} />
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
        <div className="mt-3 rounded-md px-4 py-2.5 text-xs text-blue-400" style={{border: '1px solid rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.1)'}}>
          {testResult}
        </div>
      )}

      {/* Actions */}
      <div className="mt-5 flex gap-3">
        <button onClick={handleTest} disabled={testing} className="flex-1 rounded-md px-5 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-50" style={{border: '1px solid var(--color-border)', background: 'var(--color-surface)'}}>
          {testing ? 'Testing...' : 'Test Connection'}
        </button>
        <button onClick={handleSave} disabled={saving} className="flex-1 rounded-md px-5 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-50" style={{background: 'var(--color-redis-red)', boxShadow: '0 0 15px rgba(220,38,38,0.3)'}}>
          {saving ? 'Saving...' : 'Connect & Save'}
        </button>
      </div>
    </div>
  );
}
