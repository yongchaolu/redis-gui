import {useState} from 'react';
import {useToast} from '../components/Toast';
import {deleteConnection as apiDelete, saveConnection, testConnection} from '../lib/api';
import type {ConnectionMode, ConnectionProfile} from '../types';

interface Props {
  connections: ConnectionProfile[];
  loadingConnections?: boolean;
  onSaved: (profile: ConnectionProfile) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
}

const modeLabel: Record<string, string> = {
  standalone: '单点',
  sentinel: '哨兵',
  cluster: '集群',
};

export function ConnectionsPage({connections, loadingConnections, onSaved, onDelete, onSelect}: Props) {
  const {showToast} = useToast();
  const [editing, setEditing] = useState<ConnectionProfile | null>(null);
  const [deletingId, setDeletingId] = useState<string>('');
  const [testResult, setTestResult] = useState('');
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? connections.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.addresses.some((a) => a.toLowerCase().includes(search.toLowerCase())) ||
        (c.tags ?? []).some((t) => t.toLowerCase().includes(search.toLowerCase()))
      )
    : connections;

  if (loadingConnections) {
    return (
      <div className="space-y-5">
        <section className="min-w-0 rounded-3xl border border-white/10 bg-panel p-4 sm:p-6">
          <div className="h-8 w-40 animate-pulse rounded bg-white/10" />
          <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-white/10" />
        </section>
        <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-3xl bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="min-w-0 rounded-3xl border border-white/10 bg-panel p-4 sm:p-6">
        <h1 className="text-2xl font-black sm:text-3xl">连接管理</h1>
        <p className="mt-2 text-sm text-mute">支持单点、哨兵和集群。密码会加密保存，不会明文写入 SQLite。</p>
        {connections.length > 0 && (
          <div className="mt-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索连接名称、地址或标签..."
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-ink outline-none focus:border-cyanx"
            />
          </div>
        )}
      </section>

      {connections.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
          <p className="text-sm text-mute">还没有保存的连接。点击下方按钮创建第一个 Redis 连接。</p>
          <button onClick={() => setEditing({id: '', name: '', mode: 'standalone', addresses: ['127.0.0.1:6379'], sentinelMaster: '', username: '', password: '', tls: false, timeoutSeconds: 3, tags: [], createdAt: new Date(), updatedAt: new Date()} as ConnectionProfile)} className="mt-4 rounded-2xl bg-redis px-5 py-3 text-sm font-bold text-white shadow-danger hover:bg-red-500">
            + 创建连接
          </button>
        </div>
      )}

      {search.trim() && filtered.length === 0 && connections.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
          <p className="text-sm text-mute">未找到匹配 "{search}" 的连接。</p>
        </div>
      )}

      <div className="grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((conn) => (
          <article
            key={conn.id}
            onClick={() => onSelect(conn.id)}
            className="relative flex flex-col rounded-3xl border border-white/10 bg-panel p-4 transition hover:-translate-y-0.5 hover:border-white/25 hover:bg-panel2 hover:shadow-glow cursor-pointer sm:p-5"
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate font-bold">{conn.name}</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  <span className="rounded-full bg-cyanx/10 px-2 py-0.5 text-[10px] text-cyanx">{modeLabel[conn.mode] ?? conn.mode}</span>
                  {conn.tls && <span className="rounded-full bg-greenx/10 px-2 py-0.5 text-[10px] text-greenx">TLS</span>}
                </div>
              </div>
              <div className="flex shrink-0 gap-1" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setEditing(conn)} className="rounded-xl bg-white/5 px-2 py-1 text-xs text-mute transition hover:bg-white/10 hover:text-ink">编辑</button>
                <button onClick={() => setDeletingId(conn.id)} className="rounded-xl bg-white/5 px-2 py-1 text-xs text-redis transition hover:bg-redis/10">删除</button>
              </div>
            </div>

            <div className="mb-3 text-xs text-mute">
              {conn.addresses.slice(0, 3).map((addr) => (
                <div key={addr} className="truncate">{addr}</div>
              ))}
              {conn.addresses.length > 3 && <div className="text-white/30">+{conn.addresses.length - 3} 个节点</div>}
            </div>

            {(conn.tags ?? []).length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1">
                {(conn.tags ?? []).map((tag) => (
                  <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-mute">{tag}</span>
                ))}
              </div>
            )}

            <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-3">
              <span className="text-[10px] text-mute">超时 {conn.timeoutSeconds}s</span>
              {deletingId === conn.id ? (
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <button onClick={async () => { try { await onDelete(conn.id); setDeletingId(''); } catch (err) { showToast(err instanceof Error ? err.message : '删除失败', 'error'); setDeletingId(''); } }} className="rounded-xl bg-redis px-2 py-1 text-[10px] font-bold text-white">确认</button>
                  <button onClick={() => setDeletingId('')} className="rounded-xl bg-white/5 px-2 py-1 text-[10px] text-mute">取消</button>
                </div>
              ) : null}
            </div>
          </article>
        ))}

        {connections.length > 0 && (
          <button onClick={() => setEditing({id: '', name: '', mode: 'standalone', addresses: ['127.0.0.1:6379'], sentinelMaster: '', username: '', password: '', tls: false, timeoutSeconds: 3, tags: [], createdAt: new Date(), updatedAt: new Date()} as ConnectionProfile)} className="flex min-h-[160px] flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-panel transition hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.03] hover:shadow-glow">
            <span className="text-2xl text-mute">+</span>
            <span className="mt-1 text-xs text-mute">新建连接</span>
          </button>
        )}
      </div>

      {editing && <EditModal profile={editing} onClose={() => setEditing(null)} onSaved={onSaved} onTestResult={setTestResult} testResult={testResult} showToast={showToast} />}
    </div>
  );
}

function EditModal({profile, onClose, onSaved, onTestResult, testResult, showToast}: {
  profile: ConnectionProfile;
  onClose: () => void;
  onSaved: (p: ConnectionProfile) => void;
  onTestResult: (s: string) => void;
  testResult: string;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}) {
  const [mode, setMode] = useState<ConnectionMode>(profile.mode || 'standalone');
  const [name, setName] = useState(profile.name);
  const [addresses, setAddresses] = useState(profile.addresses.join(', '));
  const [sentinelMaster, setSentinelMaster] = useState(profile.sentinelMaster);
  const [password, setPassword] = useState(profile.password);
  const [tls, setTls] = useState(profile.tls);
  const [timeoutSeconds, setTimeoutSeconds] = useState(profile.timeoutSeconds || 3);
  const [tags, setTags] = useState((profile.tags ?? []).join(', '));
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  function draftProfile(): ConnectionProfile {
    return {
      ...profile,
      name,
      mode,
      addresses: addresses.split(',').map((item) => item.trim()).filter(Boolean),
      sentinelMaster: mode === 'sentinel' ? sentinelMaster : '',
      password,
      tls,
      timeoutSeconds,
      tags: tags.split(',').map((item) => item.trim()).filter(Boolean),
    };
  }

  async function handleSave() {
    setSaving(true);
    try {
      const saved = await saveConnection(draftProfile());
      onSaved(saved);
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : '保存失败', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    try {
      const result = await testConnection(draftProfile());
      onTestResult(`${result.ok ? '成功' : '失败'}：${result.message}`);
    } catch (err) {
      onTestResult(err instanceof Error ? err.message : '测试连接失败');
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-panel p-5 sm:p-7">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-black">{profile.id ? '编辑连接' : '新建连接'}</h2>
          <button onClick={onClose} className="rounded-xl p-1 text-mute transition hover:bg-white/5 hover:text-ink">✕</button>
        </div>

        <div className="space-y-4">
          <label className="block text-sm text-mute">连接名称
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：生产缓存集群" className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-ink outline-none focus:border-cyanx" />
          </label>

          <label className="block text-sm text-mute">连接模式
            <select value={mode} onChange={(e) => setMode(e.target.value as ConnectionMode)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-ink outline-none focus:border-cyanx">
              <option value="standalone">单点 standalone</option>
              <option value="sentinel">哨兵 sentinel</option>
              <option value="cluster">集群 cluster</option>
            </select>
          </label>

          <label className="block text-sm text-mute">地址，多个用逗号分隔
            <input value={addresses} onChange={(e) => setAddresses(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-ink outline-none focus:border-cyanx" />
          </label>

          {mode === 'sentinel' && (
            <label className="block text-sm text-mute">Sentinel master
              <input value={sentinelMaster} onChange={(e) => setSentinelMaster(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-ink outline-none focus:border-cyanx" />
            </label>
          )}

          <label className="block text-sm text-mute">标签，多个用逗号分隔
            <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="例如：生产,缓存,重要" className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-ink outline-none focus:border-cyanx" />
          </label>

          <label className="block text-sm text-mute">密码
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-ink outline-none focus:border-cyanx" />
          </label>

          <div className="flex items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-mute">
              <input type="checkbox" checked={tls} onChange={(e) => setTls(e.target.checked)} className="h-4 w-4 accent-cyanx" />
              启用 TLS
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-mute">
              超时
              <input type="number" min={1} max={60} value={timeoutSeconds} onChange={(e) => setTimeoutSeconds(Number(e.target.value))} className="w-16 rounded-xl border border-white/10 bg-black/20 px-2 py-1 text-center text-sm text-ink outline-none focus:border-cyanx" />
              秒
            </label>
          </div>

          {testResult && <div className="rounded-2xl border border-cyanx/30 bg-cyanx/10 px-4 py-3 text-sm text-cyanx">{testResult}</div>}

          <div className="grid gap-3 md:grid-cols-2">
            <button onClick={handleTest} className="rounded-2xl border border-white/10 bg-panel2 px-5 py-3 text-sm font-bold text-ink hover:border-cyanx/50">{testing ? '测试中...' : '测试连接'}</button>
            <button onClick={handleSave} className="rounded-2xl bg-redis px-5 py-3 text-sm font-bold text-white shadow-danger hover:bg-red-500">{saving ? '保存中...' : '保存连接'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
