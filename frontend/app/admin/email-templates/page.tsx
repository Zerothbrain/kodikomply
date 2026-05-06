'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Save, Send, ToggleLeft, ToggleRight, ChevronRight, RefreshCw, Check } from 'lucide-react';
import Navbar from '../../../components/ui/Navbar';
import Footer from '../../../components/ui/Footer';
import { isLoggedIn, isAdmin, getUser } from '../../../lib/auth';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

interface EmailTemplate {
  id: number;
  slug: string;
  name: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  isActive: boolean;
  variables: string[];
}

const SLUG_LABELS: Record<string, string> = {
  email_verification: 'Email Verification',
  calculation_summary: 'Calculation Summary',
  welcome: 'Welcome Email',
};

export default function AdminEmailTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selected, setSelected] = useState<EmailTemplate | null>(null);
  const [draft, setDraft] = useState<Partial<EmailTemplate>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [tab, setTab] = useState<'html' | 'text'>('html');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isLoggedIn() || !isAdmin()) { router.push('/auth/login'); return; }
    const user = getUser();
    if (user?.email) setTestEmail(user.email);
  }, [router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/email-templates');
      setTemplates(res.data);
      if (!selected && res.data.length > 0) {
        setSelected(res.data[0]);
        setDraft(res.data[0]);
      }
    } catch { toast.error('Failed to load templates'); }
    finally { setLoading(false); }
  }, [selected]);

  useEffect(() => { load(); }, []); // eslint-disable-line

  const selectTemplate = (t: EmailTemplate) => {
    setSelected(t);
    setDraft(t);
    setSaved(false);
    setTab('html');
  };

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await api.put(`/admin/email-templates/${selected.slug}`, {
        subject: draft.subject,
        htmlBody: draft.htmlBody,
        textBody: draft.textBody,
        isActive: draft.isActive,
      });
      const updated = res.data;
      setTemplates(ts => ts.map(t => t.slug === updated.slug ? updated : t));
      setSelected(updated);
      setDraft(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const toggleActive = async () => {
    if (!selected) return;
    const newValue = !draft.isActive;
    setDraft(d => ({ ...d, isActive: newValue }));
    try {
      const res = await api.put(`/admin/email-templates/${selected.slug}`, { isActive: newValue });
      const updated = res.data;
      setTemplates(ts => ts.map(t => t.slug === updated.slug ? updated : t));
      setSelected(updated);
      toast.success(newValue ? 'Template activated' : 'Template deactivated');
    } catch {
      setDraft(d => ({ ...d, isActive: !newValue }));
      toast.error('Failed to update');
    }
  };

  const sendTest = async () => {
    if (!selected || !testEmail.trim()) return;
    setSendingTest(true);
    try {
      await api.post(`/admin/email-templates/${selected.slug}/test`, { to: testEmail.trim() });
      toast.success(`Test email sent to ${testEmail.trim()}`);
    } catch { toast.error('Failed to send test email — check SMTP settings'); }
    finally { setSendingTest(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1a5c38] text-white flex items-center justify-center">
              <Mail size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Email Templates</h1>
              <p className="text-sm text-gray-500">Edit the HTML and text versions of system emails</p>
            </div>
          </div>
          <button onClick={load} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400 text-sm">Loading templates…</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

            {/* Left sidebar — template list */}
            <div className="lg:col-span-1 space-y-2">
              {templates.map(t => (
                <button
                  key={t.slug}
                  onClick={() => selectTemplate(t)}
                  className={`w-full text-left rounded-xl border px-4 py-3 transition-all ${
                    selected?.slug === t.slug
                      ? 'border-[#1a5c38] bg-[#1a5c38]/5 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-sm text-gray-900 truncate">
                      {SLUG_LABELS[t.slug] || t.name}
                    </span>
                    {selected?.slug === t.slug && <ChevronRight size={14} className="text-[#1a5c38] shrink-0" />}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                      t.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${t.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {t.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">{t.slug}</span>
                  </div>
                </button>
              ))}

              {/* SMTP note */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-4">
                <p className="text-xs text-amber-800 font-semibold mb-1">SMTP Required</p>
                <p className="text-xs text-amber-700 leading-relaxed">
                  Set <code className="bg-amber-100 px-1 rounded font-mono">SMTP_HOST</code>,{' '}
                  <code className="bg-amber-100 px-1 rounded font-mono">SMTP_USER</code>, and{' '}
                  <code className="bg-amber-100 px-1 rounded font-mono">SMTP_PASS</code> in{' '}
                  <code className="bg-amber-100 px-1 rounded font-mono">backend/.env</code> to send emails.
                </p>
              </div>
            </div>

            {/* Right — editor */}
            {selected && (
              <div className="lg:col-span-3 space-y-4">

                {/* Template name + toggle */}
                <div className="bg-white rounded-xl border p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-base font-bold text-gray-900">
                        {SLUG_LABELS[selected.slug] || selected.name}
                      </h2>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{selected.slug}</p>
                    </div>
                    <button
                      onClick={toggleActive}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        draft.isActive
                          ? 'text-green-700 bg-green-50 hover:bg-green-100'
                          : 'text-gray-500 bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {draft.isActive
                        ? <ToggleRight size={18} className="text-green-600" />
                        : <ToggleLeft size={18} />}
                      {draft.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                </div>

                {/* Subject */}
                <div className="bg-white rounded-xl border p-5">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    value={draft.subject || ''}
                    onChange={e => setDraft(d => ({ ...d, subject: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c38]/30 focus:border-[#1a5c38]"
                    placeholder="Email subject…"
                  />
                </div>

                {/* Body editor tabs */}
                <div className="bg-white rounded-xl border overflow-hidden">
                  <div className="flex border-b bg-gray-50">
                    <button
                      onClick={() => setTab('html')}
                      className={`px-5 py-3 text-sm font-medium transition-colors ${
                        tab === 'html' ? 'bg-white border-b-2 border-[#1a5c38] text-[#1a5c38]' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      HTML Body
                    </button>
                    <button
                      onClick={() => setTab('text')}
                      className={`px-5 py-3 text-sm font-medium transition-colors ${
                        tab === 'text' ? 'bg-white border-b-2 border-[#1a5c38] text-[#1a5c38]' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Plain Text
                    </button>
                  </div>

                  <div className="p-5">
                    {tab === 'html' ? (
                      <>
                        <p className="text-xs text-gray-400 mb-2">
                          Full HTML email. Use <code className="bg-gray-100 px-1 rounded">{`{{variable}}`}</code> placeholders — see reference below.
                        </p>
                        <textarea
                          value={draft.htmlBody || ''}
                          onChange={e => setDraft(d => ({ ...d, htmlBody: e.target.value }))}
                          rows={22}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#1a5c38]/30 focus:border-[#1a5c38] resize-y"
                          spellCheck={false}
                        />
                      </>
                    ) : (
                      <>
                        <p className="text-xs text-gray-400 mb-2">
                          Plain text fallback for email clients that don&apos;t support HTML.
                        </p>
                        <textarea
                          value={draft.textBody || ''}
                          onChange={e => setDraft(d => ({ ...d, textBody: e.target.value }))}
                          rows={16}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1a5c38]/30 focus:border-[#1a5c38] resize-y"
                          spellCheck={false}
                        />
                      </>
                    )}
                  </div>
                </div>

                {/* Variables reference */}
                {selected.variables && selected.variables.length > 0 && (
                  <div className="bg-white rounded-xl border p-5">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      Available Variables
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selected.variables.map(v => (
                        <span key={v} className="font-mono text-xs bg-[#1a5c38]/8 text-[#1a5c38] border border-[#1a5c38]/20 rounded-lg px-2.5 py-1">
                          {`{{${v}}}`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Save + Test row */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Save */}
                  <button
                    onClick={save}
                    disabled={saving}
                    className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      saved
                        ? 'bg-green-500 text-white'
                        : 'bg-[#1a5c38] text-white hover:bg-[#154d2f]'
                    } disabled:opacity-60`}
                  >
                    {saved ? <Check size={16} /> : <Save size={16} />}
                    {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
                  </button>

                  {/* Test send */}
                  <div className="flex flex-1 gap-2">
                    <input
                      type="email"
                      value={testEmail}
                      onChange={e => setTestEmail(e.target.value)}
                      placeholder="recipient@example.com"
                      className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1a5c38]/30 focus:border-[#1a5c38]"
                    />
                    <button
                      onClick={sendTest}
                      disabled={sendingTest || !testEmail.trim()}
                      className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      <Send size={15} />
                      {sendingTest ? 'Sending…' : 'Send Test'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
