'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle, BarChart3, Settings, FileText, Users, Save, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import Navbar from '../../../components/ui/Navbar';
import Footer from '../../../components/ui/Footer';
import { isLoggedIn, isAdmin } from '../../../lib/auth';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ChatStats {
  today: number;
  week: number;
  month: number;
  totalSessions: number;
  languages: { language: string; _count: { id: number } }[];
}

interface ChatSession {
  id: number;
  userId: number | null;
  language: string;
  messageCount: number;
  preview: string;
  createdAt: string;
  updatedAt: string;
}

interface SystemPrompt {
  id: number;
  content: string;
  version: number;
  isActive: boolean;
  updatedBy: number;
  createdAt: string;
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'stats', label: 'Usage', icon: BarChart3 },
  { key: 'sessions', label: 'Conversations', icon: MessageCircle },
  { key: 'prompt', label: 'System Prompt', icon: FileText },
  { key: 'limits', label: 'Rate Limits', icon: Users },
] as const;

type Tab = typeof TABS[number]['key'];

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminChatPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('stats');
  const [stats, setStats] = useState<ChatStats | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [prompts, setPrompts] = useState<SystemPrompt[]>([]);
  const [promptContent, setPromptContent] = useState('');
  const [editingPrompt, setEditingPrompt] = useState(false);
  const [defaultLimit, setDefaultLimit] = useState(20);
  const [userLimitId, setUserLimitId] = useState('');
  const [userLimitVal, setUserLimitVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedSession, setExpandedSession] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoggedIn() || !isAdmin()) {
      router.push('/auth/login');
    }
  }, [router]);

  const loadStats = useCallback(async () => {
    try {
      const res = await api.get('/chat/admin/stats');
      setStats(res.data);
    } catch { toast.error('Failed to load stats'); }
  }, []);

  const loadSessions = useCallback(async () => {
    try {
      const res = await api.get('/chat/admin/sessions');
      setSessions(res.data);
    } catch { toast.error('Failed to load sessions'); }
  }, []);

  const loadPrompts = useCallback(async () => {
    try {
      const res = await api.get('/chat/admin/prompts');
      setPrompts(res.data);
      const active = res.data.find((p: SystemPrompt) => p.isActive);
      if (active) setPromptContent(active.content);
    } catch { toast.error('Failed to load prompts'); }
  }, []);

  const loadLimit = useCallback(async () => {
    try {
      const res = await api.get('/chat/admin/limit');
      setDefaultLimit(res.data.defaultLimit);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    if (tab === 'stats') loadStats();
    else if (tab === 'sessions') loadSessions();
    else if (tab === 'prompt') loadPrompts();
    else if (tab === 'limits') loadLimit();
  }, [tab, loadStats, loadSessions, loadPrompts, loadLimit]);

  const savePrompt = async () => {
    if (promptContent.trim().length < 100) {
      toast.error('Prompt is too short');
      return;
    }
    setLoading(true);
    try {
      await api.post('/chat/admin/prompts', { content: promptContent });
      toast.success('System prompt saved and activated');
      setEditingPrompt(false);
      loadPrompts();
    } catch { toast.error('Failed to save prompt'); }
    finally { setLoading(false); }
  };

  const activatePrompt = async (id: number) => {
    try {
      await api.put(`/chat/admin/prompts/${id}/activate`);
      toast.success('Prompt activated');
      loadPrompts();
    } catch { toast.error('Failed to activate prompt'); }
  };

  const saveDefaultLimit = async () => {
    try {
      await api.put('/chat/admin/limit', { limit: defaultLimit });
      toast.success('Default limit updated');
    } catch { toast.error('Failed to update limit'); }
  };

  const saveUserLimit = async () => {
    if (!userLimitId || !userLimitVal) return;
    try {
      await api.put(`/chat/admin/limit/${userLimitId}`, { limit: Number(userLimitVal) });
      toast.success(`Limit set for user #${userLimitId}`);
      setUserLimitId('');
      setUserLimitVal('');
    } catch { toast.error('Failed to set user limit'); }
  };

  const enLangCount = stats?.languages.find(l => l.language === 'EN')?._count.id || 0;
  const swLangCount = stats?.languages.find(l => l.language === 'SW')?._count.id || 0;
  const totalLang = enLangCount + swLangCount || 1;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#1a5c38] text-white flex items-center justify-center">
            <MessageCircle size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">AI Chat Manager</h1>
            <p className="text-sm text-gray-500">Monitor usage, manage prompts and rate limits</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white border rounded-xl p-1 mb-6 w-fit">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tab === t.key ? 'bg-[#1a5c38] text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon size={15} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ── Stats tab ─────────────────────────────────────────────────────── */}
        {tab === 'stats' && (
          <div className="space-y-6">
            {/* KPI row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Today', value: stats?.today ?? '—' },
                { label: 'This Week', value: stats?.week ?? '—' },
                { label: 'This Month', value: stats?.month ?? '—' },
                { label: 'Total Sessions', value: stats?.totalSessions ?? '—' },
              ].map(kpi => (
                <div key={kpi.label} className="bg-white rounded-xl border p-4">
                  <p className="text-xs text-gray-500 mb-1">{kpi.label}</p>
                  <p className="text-2xl font-bold text-[#1a5c38]">{kpi.value}</p>
                </div>
              ))}
            </div>

            {/* Language split */}
            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold text-gray-800 mb-4">Language Split</h3>
              <div className="flex items-center gap-4 mb-2">
                <span className="text-sm text-gray-600 w-8">EN</span>
                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#1a5c38] rounded-full"
                    style={{ width: `${(enLangCount / totalLang) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-10 text-right">{enLangCount}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600 w-8">SW</span>
                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full"
                    style={{ width: `${(swLangCount / totalLang) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-10 text-right">{swLangCount}</span>
              </div>
            </div>

            <button onClick={loadStats} className="flex items-center gap-2 text-sm text-[#1a5c38] hover:underline">
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        )}

        {/* ── Sessions tab ──────────────────────────────────────────────────── */}
        {tab === 'sessions' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">Showing last 50 conversations (anonymised)</p>
            {sessions.length === 0 && (
              <div className="bg-white rounded-xl border p-8 text-center text-gray-400 text-sm">
                No conversations yet
              </div>
            )}
            {sessions.map(s => (
              <div key={s.id} className="bg-white rounded-xl border overflow-hidden">
                <button
                  onClick={() => setExpandedSession(expandedSession === s.id ? null : s.id)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.language === 'SW' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                      {s.language}
                    </span>
                    <span className="text-sm text-gray-700 truncate max-w-xs">{s.preview || 'No preview'}</span>
                    <span className="text-xs text-gray-400 shrink-0">{s.messageCount} msgs</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-400">{new Date(s.updatedAt).toLocaleDateString()}</span>
                    {expandedSession === s.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                </button>
                {expandedSession === s.id && (
                  <div className="px-4 pb-3 border-t bg-gray-50">
                    <p className="text-xs text-gray-500 mt-2">Session #{s.id} · User #{s.userId ?? 'anonymous'} · Created {new Date(s.createdAt).toLocaleString()}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── System Prompt tab ─────────────────────────────────────────────── */}
        {tab === 'prompt' && (
          <div className="space-y-4">
            {/* Version history */}
            {prompts.length > 1 && (
              <div className="bg-white rounded-xl border p-4">
                <h3 className="font-semibold text-sm text-gray-700 mb-3">Version History</h3>
                <div className="space-y-2">
                  {prompts.map(p => (
                    <div key={p.id} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">v{p.version}</span>
                        {p.isActive && <span className="text-[10px] bg-[#1a5c38] text-white px-2 py-0.5 rounded-full">Active</span>}
                        <span className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleString()}</span>
                      </div>
                      {!p.isActive && (
                        <button
                          onClick={() => activatePrompt(p.id)}
                          className="text-xs text-[#1a5c38] hover:underline"
                        >
                          Activate
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Editor */}
            <div className="bg-white rounded-xl border p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm text-gray-700">Active System Prompt</h3>
                <div className="flex gap-2">
                  {!editingPrompt ? (
                    <button
                      onClick={() => setEditingPrompt(true)}
                      className="flex items-center gap-1 px-3 py-1.5 border border-[#1a5c38] text-[#1a5c38] text-xs rounded-lg hover:bg-green-50 transition-colors"
                    >
                      <Settings size={12} /> Edit
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => { setEditingPrompt(false); loadPrompts(); }}
                        className="px-3 py-1.5 border border-gray-200 text-gray-600 text-xs rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={savePrompt}
                        disabled={loading}
                        className="flex items-center gap-1 px-3 py-1.5 bg-[#1a5c38] text-white text-xs rounded-lg hover:bg-[#154d2f] disabled:opacity-50 transition-colors"
                      >
                        <Save size={12} /> Save & Activate
                      </button>
                    </>
                  )}
                </div>
              </div>
              {editingPrompt ? (
                <textarea
                  value={promptContent}
                  onChange={e => setPromptContent(e.target.value)}
                  className="w-full h-96 text-xs font-mono border rounded-lg p-3 outline-none focus:border-[#1a5c38] resize-none"
                />
              ) : (
                <pre className="w-full h-96 text-xs font-mono bg-gray-50 rounded-lg p-3 overflow-auto whitespace-pre-wrap text-gray-700 border">
                  {promptContent || 'Loading...'}
                </pre>
              )}
            </div>
          </div>
        )}

        {/* ── Rate Limits tab ───────────────────────────────────────────────── */}
        {tab === 'limits' && (
          <div className="space-y-4">
            {/* Default limit */}
            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold text-gray-800 mb-1">Default Daily Limit</h3>
              <p className="text-xs text-gray-500 mb-4">Applied to all new users</p>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={defaultLimit}
                  onChange={e => setDefaultLimit(Number(e.target.value))}
                  className="w-24 border rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a5c38]"
                />
                <span className="text-sm text-gray-500">questions per day</span>
                <button
                  onClick={saveDefaultLimit}
                  className="flex items-center gap-1 px-4 py-2 bg-[#1a5c38] text-white text-sm rounded-lg hover:bg-[#154d2f] transition-colors"
                >
                  <Save size={13} /> Save
                </button>
              </div>
            </div>

            {/* Per-user override */}
            <div className="bg-white rounded-xl border p-5">
              <h3 className="font-semibold text-gray-800 mb-1">Per-User Override</h3>
              <p className="text-xs text-gray-500 mb-4">Set a higher limit for premium users (today only)</p>
              <div className="flex items-center gap-3 flex-wrap">
                <input
                  type="number"
                  placeholder="User ID"
                  value={userLimitId}
                  onChange={e => setUserLimitId(e.target.value)}
                  className="w-28 border rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a5c38]"
                />
                <input
                  type="number"
                  placeholder="Daily limit"
                  min={1}
                  max={1000}
                  value={userLimitVal}
                  onChange={e => setUserLimitVal(e.target.value)}
                  className="w-28 border rounded-lg px-3 py-2 text-sm outline-none focus:border-[#1a5c38]"
                />
                <button
                  onClick={saveUserLimit}
                  disabled={!userLimitId || !userLimitVal}
                  className="flex items-center gap-1 px-4 py-2 bg-[#1a5c38] text-white text-sm rounded-lg hover:bg-[#154d2f] disabled:opacity-40 transition-colors"
                >
                  <Save size={13} /> Apply
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
