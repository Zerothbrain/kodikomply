'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2, Clock, AlertTriangle, XCircle, ArrowRight,
  RefreshCw, BarChart3, FileText, Calendar, ChevronRight,
  Download, Share2, Loader2, RotateCcw, User, Building2,
  Users, Globe, Briefcase, Star,
} from 'lucide-react';
import Navbar from '../../components/ui/Navbar';
import Footer from '../../components/ui/Footer';
import ReviewForm from '../../components/ReviewForm';
import { getUser, isLoggedIn } from '../../lib/auth';
import { formatTZS, formatDate } from '../../lib/format';
import api from '../../lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────
interface ApplicableModule {
  key: string; label: string;
  status: 'required' | 'applicable' | 'watch' | 'not_applicable';
  note: string; deadlineNote: string; href: string; priority: number;
}

interface TaxProfile {
  id: number; entityType: string; activityTypes: string[];
  residentStatus: string; hasEmployees: boolean; turnoverBand: string;
  applicableModules: ApplicableModule[];
  completedModules: string[];
  moduleData: Record<string, unknown>;
  updatedAt: string;
}

interface Calculation {
  id: number; calculationType: string; createdAt: string;
  resultData: Record<string, unknown>;
}

interface Deadline {
  id: number; taxType: string; description: string;
  nextDueDate: string; daysRemaining: number; isUrgent: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const ENTITY_LABELS: Record<string, string> = {
  INDIVIDUAL: 'Individual', SOLE_PROPRIETOR: 'Sole Proprietor / Business Owner',
  COMPANY: 'Company / Corporation', PARTNERSHIP: 'Partnership',
  NGO: 'NGO / Charity', EMPLOYER: 'Employer with Staff',
};
const ENTITY_ICONS: Record<string, React.ElementType> = {
  INDIVIDUAL: User, SOLE_PROPRIETOR: Briefcase, COMPANY: Building2,
  PARTNERSHIP: Users, NGO: Users, EMPLOYER: Briefcase,
};
const TURNOVER_LABELS: Record<string, string> = {
  BELOW_4M: 'Below TZS 4M', '4M_100M': 'TZS 4M – 100M',
  '100M_200M': 'TZS 100M – 200M', ABOVE_200M: 'Above TZS 200M',
};

// suppress unused import warning
void formatTZS; void Globe;

function StatusIcon({ status }: { status: ApplicableModule['status'] }) {
  if (status === 'required')   return <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />;
  if (status === 'applicable') return <CheckCircle2 size={18} className="text-blue-500 flex-shrink-0" />;
  if (status === 'watch')      return <AlertTriangle size={18} className="text-amber-500 flex-shrink-0" />;
  return <XCircle size={18} className="text-gray-300 flex-shrink-0" />;
}

function StatusBadge({ status }: { status: ApplicableModule['status'] }) {
  const map = {
    required:       'badge-green',
    applicable:     'badge-blue',
    watch:          'badge-yellow',
    not_applicable: 'badge-gray',
  } as const;
  const labels = { required: 'Required', applicable: 'Applies', watch: 'Monitor', not_applicable: 'N/A' };
  return <span className={`badge ${map[status]} text-[10px]`}>{labels[status]}</span>;
}

function ModuleCard({ mod, completed, onComplete }: {
  mod: ApplicableModule; completed: boolean; onComplete: (key: string) => void;
}) {
  const isNA = mod.status === 'not_applicable';
  return (
    <div className={`rounded-xl border p-4 transition-all duration-200 ${
      isNA      ? 'border-gray-100 bg-gray-50/60 opacity-60' :
      completed ? 'border-emerald-200 bg-emerald-50/50' :
                  'border-gray-100 bg-white hover:border-brand-200 hover:shadow-sm'
    }`}>
      <div className="flex items-start gap-3">
        <StatusIcon status={mod.status} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className={`text-sm font-semibold leading-tight ${isNA ? 'text-gray-400' : 'text-gray-800'}`}>{mod.label}</p>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {completed && <span className="badge badge-green text-[10px]">Done</span>}
              {!completed && <StatusBadge status={mod.status} />}
            </div>
          </div>
          <p className={`text-xs leading-relaxed ${isNA ? 'text-gray-400' : 'text-gray-500'}`}>{mod.note}</p>
          {mod.deadlineNote !== 'N/A' && (
            <div className="flex items-center gap-1 mt-2">
              <Clock size={11} className="text-gray-400" />
              <span className="text-[11px] text-gray-400">{mod.deadlineNote}</span>
            </div>
          )}
          {!isNA && (
            <div className="flex items-center gap-3 mt-3">
              <Link href={mod.href} className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
                Open calculator <ChevronRight size={11} />
              </Link>
              {!completed && (
                <button onClick={() => onComplete(mod.key)} className="text-xs text-gray-400 hover:text-emerald-600 transition-colors ml-auto">
                  Mark done ✓
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TaxSummaryPanel({ profile, calculations }: { profile: TaxProfile; calculations: Calculation[] }) {
  const [generating, setGenerating] = useState(false);

  async function downloadPDF() {
    setGenerating(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const user = getUser();
      const now = new Date();

      doc.setFillColor(26, 92, 56);
      doc.rect(0, 0, 210, 28, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16); doc.setFont('helvetica', 'bold');
      doc.text('KodiComply — Tax Profile Summary', 14, 12);
      doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${now.toLocaleDateString('en-TZ')}  |  Tanzania Revenue Authority Compliant`, 14, 21);
      doc.setTextColor(0, 0, 0);

      let y = 38;
      doc.setFontSize(12); doc.setFont('helvetica', 'bold');
      doc.text('TAXPAYER PROFILE', 14, y); y += 7;
      doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      doc.setDrawColor(200, 200, 200); doc.line(14, y, 196, y); y += 5;

      const rows: [string, string][] = [
        ['Name', user?.name ?? 'N/A'],
        ['Entity Type', ENTITY_LABELS[profile.entityType] ?? profile.entityType],
        ['Resident Status', profile.residentStatus === 'RESIDENT' ? 'Tanzania Resident' : profile.residentStatus === 'GOVERNMENT' ? 'Government Employee' : 'Non-Resident'],
        ['Employees', profile.hasEmployees ? 'Yes' : 'No'],
        ['Annual Turnover', TURNOVER_LABELS[profile.turnoverBand] ?? profile.turnoverBand],
      ];
      rows.forEach(([k, v]) => {
        doc.setFont('helvetica', 'bold'); doc.text(k + ':', 14, y);
        doc.setFont('helvetica', 'normal'); doc.text(v, 70, y); y += 6;
      });

      y += 6;
      doc.setFontSize(12); doc.setFont('helvetica', 'bold');
      doc.text('TAX OBLIGATIONS', 14, y); y += 7;
      doc.setDrawColor(200, 200, 200); doc.line(14, y, 196, y); y += 5;
      doc.setFontSize(9);

      profile.applicableModules.forEach(mod => {
        const icon = mod.status === 'not_applicable' ? '✗' : mod.status === 'watch' ? '!' : '✓';
        const done = profile.completedModules.includes(mod.key);
        doc.setFont('helvetica', 'bold');
        doc.text(`${icon} ${mod.label}${done ? ' [COMPLETED]' : ''}`, 14, y); y += 5;
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(mod.note, 170);
        doc.text(lines, 18, y); y += lines.length * 4.5 + 1;
        if (mod.deadlineNote !== 'N/A') {
          doc.setTextColor(100, 100, 100);
          doc.text(`Deadline: ${mod.deadlineNote}`, 18, y);
          doc.setTextColor(0, 0, 0); y += 5;
        }
        y += 2;
        if (y > 270) { doc.addPage(); y = 20; }
      });

      if (calculations.length > 0) {
        if (y > 240) { doc.addPage(); y = 20; }
        y += 4;
        doc.setFontSize(12); doc.setFont('helvetica', 'bold');
        doc.text('RECENT CALCULATIONS', 14, y); y += 7;
        doc.setDrawColor(200, 200, 200); doc.line(14, y, 196, y); y += 5;
        doc.setFontSize(9);
        calculations.slice(0, 8).forEach(c => {
          doc.setFont('helvetica', 'bold');
          doc.text(c.calculationType.replace(/_/g, ' ').toUpperCase(), 14, y);
          doc.setFont('helvetica', 'normal');
          doc.text(formatDate(c.createdAt), 130, y); y += 6;
        });
      }

      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8); doc.setTextColor(150, 150, 150);
        doc.text('KodiComply — For informational purposes only. Not legal or tax advice.', 14, 290);
        doc.text(`Page ${i} of ${totalPages}`, 180, 290);
      }
      doc.save(`KodiComply-TaxProfile-${now.getFullYear()}.pdf`);
    } catch { /* ignore */ }
    setGenerating(false);
  }

  const applicable = profile.applicableModules.filter(m => m.status !== 'not_applicable');
  const done = applicable.filter(m => profile.completedModules.includes(m.key));

  return (
    <div className="card border-2 border-brand-100">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-900 mb-0.5">Tax Summary Report</h3>
          <p className="text-xs text-gray-500">{done.length} of {applicable.length} modules completed</p>
        </div>
        <BarChart3 size={20} className="text-brand-500" />
      </div>
      <div className="flex items-center gap-4 mb-5">
        <div className="relative w-16 h-16 flex-shrink-0">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" fill="none" stroke="#f0f7f3" strokeWidth="6" />
            <circle cx="32" cy="32" r="28" fill="none" stroke="#1a5c38" strokeWidth="6"
              strokeDasharray={`${(done.length / Math.max(applicable.length, 1)) * 175.9} 175.9`}
              strokeLinecap="round" className="transition-all duration-700" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-brand-700 num">
            {Math.round((done.length / Math.max(applicable.length, 1)) * 100)}%
          </span>
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{done.length}/{applicable.length} done</p>
          <p className="text-xs text-gray-400">
            {applicable.length - done.length > 0
              ? `${applicable.length - done.length} remaining`
              : 'All complete!'}
          </p>
        </div>
      </div>
      <button onClick={downloadPDF} disabled={generating} className="btn-primary w-full flex items-center justify-center gap-2 mb-2">
        {generating ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
        {generating ? 'Generating...' : 'Download PDF Report'}
      </button>
      <button className="btn-ghost w-full text-xs flex items-center justify-center gap-2 border border-gray-100 rounded-xl py-2.5">
        <Share2 size={13} /> Share with Accountant
      </button>
    </div>
  );
}

// ── Email Verification Banner ─────────────────────────────────────────────────
function EmailVerificationBanner() {
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);

  const resend = async () => {
    setSending(true);
    try {
      await api.post('/auth/resend-verification');
      setSent(true);
    } catch { /* silent */ }
    finally { setSending(false); }
  };

  const user = getUser();

  return (
    <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 flex items-start gap-3 flex-wrap">
      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
        <AlertTriangle size={16} className="text-amber-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-amber-900 text-sm">Verify your email address</p>
        <p className="text-amber-700 text-xs mt-0.5">
          A verification link was sent to <strong>{user?.email}</strong>. Check your inbox and click the link to unlock calculation summary emails.
        </p>
        {sent && <p className="text-green-700 text-xs mt-1 font-medium">✓ Verification email resent!</p>}
      </div>
      {!sent && (
        <button
          onClick={resend}
          disabled={sending}
          className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 text-white text-xs rounded-xl font-semibold hover:bg-amber-700 disabled:opacity-50 transition-colors shrink-0"
        >
          {sending ? <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" /> : <RefreshCw size={12} />}
          Resend email
        </button>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const user = getUser();
  const [profile, setProfile]           = useState<TaxProfile | null>(null);
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [deadlines, setDeadlines]       = useState<Deadline[]>([]);
  const [loading, setLoading]           = useState(true);
  const [resetting, setResetting]       = useState(false);
  const [filter, setFilter]             = useState<'all' | 'required' | 'done'>('all');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const loadData = useCallback(async () => {
    if (!isLoggedIn()) { router.push('/auth/login'); return; }
    try {
      const [profRes, calcRes, deadRes] = await Promise.allSettled([
        api.get('/profile'),
        api.get('/reports/history'),
        api.get('/deadlines'),
      ]);
      if (profRes.status === 'fulfilled' && profRes.value.data) {
        setProfile(profRes.value.data);
      } else {
        router.push('/onboarding'); return;
      }
      if (calcRes.status === 'fulfilled') setCalculations((calcRes.value.data ?? []).slice(0, 10));
      if (deadRes.status === 'fulfilled') setDeadlines((deadRes.value.data ?? []).slice(0, 5));
    } catch {
      router.push('/onboarding');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { loadData(); }, [loadData]);

  async function markDone(key: string) {
    if (!profile) return;
    try { const r = await api.patch(`/profile/module/${key}`, {}); setProfile(r.data); } catch { /* ignore */ }
  }

  async function resetProfile() {
    if (!confirm('Reset your tax profile? You\'ll answer the 5 questions again.')) return;
    setResetting(true);
    try { await api.delete('/profile'); router.push('/onboarding'); }
    catch { setResetting(false); }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-3 animate-glow">
          <Loader2 size={22} className="text-white animate-spin" />
        </div>
        <p className="text-gray-500 text-sm">Loading your tax profile…</p>
      </div>
    </div>
  );

  if (!profile) return null;

  const EntityIcon = ENTITY_ICONS[profile.entityType] ?? User;
  const applicable    = profile.applicableModules.filter(m => m.status !== 'not_applicable');
  const notApplicable = profile.applicableModules.filter(m => m.status === 'not_applicable');
  const completedCount = applicable.filter(m => profile.completedModules.includes(m.key)).length;
  const progressPct = applicable.length > 0 ? Math.round((completedCount / applicable.length) * 100) : 0;

  const filteredModules = applicable.filter(m => {
    if (filter === 'required') return m.status === 'required';
    if (filter === 'done') return profile.completedModules.includes(m.key);
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      {/* Profile hero */}
      <div style={{ background: '#0d1f17' }} className="border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center shadow-glow-sm">
                <EntityIcon size={24} className="text-white" />
              </div>
              <div>
                <p className="text-white/40 text-xs uppercase tracking-widest font-semibold mb-0.5">Tax Profile</p>
                <h1 className="text-xl font-bold text-white">{user?.name ?? 'My Tax Profile'}</h1>
                <p className="text-white/50 text-sm">
                  {ENTITY_LABELS[profile.entityType]} ·{' '}
                  {profile.residentStatus === 'RESIDENT' ? 'Resident' : profile.residentStatus === 'GOVERNMENT' ? 'Govt. Employee' : 'Non-Resident'} ·{' '}
                  {TURNOVER_LABELS[profile.turnoverBand]}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:block">
                <div className="flex justify-between mb-1">
                  <span className="text-white/40 text-xs">{completedCount}/{applicable.length} modules</span>
                  <span className="text-white/40 text-xs num">{progressPct}%</span>
                </div>
                <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-brand-400 to-brand-300 rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
                </div>
              </div>
              <button onClick={resetProfile} disabled={resetting} title="Reset profile"
                className="w-9 h-9 rounded-xl bg-white/8 hover:bg-white/15 flex items-center justify-center text-white/50 hover:text-white transition-all">
                <RotateCcw size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">

        {/* Email verification banner */}
        {!user?.isEmailVerified && <EmailVerificationBanner />}

        <div className="grid lg:grid-cols-3 gap-6">

          {/* Left — obligations */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-gray-900">Your Tax Obligations</h2>
                <div className="flex gap-1">
                  {(['all', 'required', 'done'] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${filter === f ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                      {f === 'all' ? 'All' : f === 'required' ? 'Required' : 'Done'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3 animate-on-load">
                {filteredModules.map(mod => (
                  <ModuleCard key={mod.key} mod={mod}
                    completed={profile.completedModules.includes(mod.key)} onComplete={markDone} />
                ))}
                {filteredModules.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">No modules in this filter</div>
                )}
              </div>
              {notApplicable.length > 0 && filter === 'all' && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Does Not Apply to You</p>
                  <div className="space-y-1.5">
                    {notApplicable.map(mod => (
                      <div key={mod.key} className="flex items-center gap-2 text-xs text-gray-400">
                        <XCircle size={12} className="text-gray-300 flex-shrink-0" />
                        <span className="font-medium">{mod.label}</span>
                        <span className="text-gray-300 truncate">— {mod.note}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {deadlines.length > 0 && (
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-900">Upcoming Deadlines</h2>
                  <Calendar size={18} className="text-gray-400" />
                </div>
                <div className="space-y-3">
                  {deadlines.map(d => (
                    <div key={d.id} className={`flex items-center gap-3 p-3 rounded-xl border ${d.isUrgent ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-gray-50'}`}>
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${d.isUrgent ? 'bg-red-500' : d.daysRemaining <= 14 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800">{d.taxType}</p>
                        <p className="text-xs text-gray-500">{d.description}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-xs font-bold num ${d.isUrgent ? 'text-red-600' : 'text-gray-500'}`}>{d.daysRemaining <= 0 ? 'OVERDUE' : `${d.daysRemaining}d`}</p>
                        <p className="text-[11px] text-gray-400">{formatDate(d.nextDueDate)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {calculations.length > 0 && (
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-900">Recent Calculations</h2>
                  <Link href="/reports" className="text-xs text-brand-600 font-semibold hover:underline flex items-center gap-1">View all <ArrowRight size={12} /></Link>
                </div>
                <div className="space-y-2">
                  {calculations.slice(0, 6).map(c => (
                    <div key={c.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                      <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText size={13} className="text-brand-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800 capitalize">{c.calculationType.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-gray-400">{formatDate(c.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-5">
            <TaxSummaryPanel profile={profile} calculations={calculations} />

            <div className="card">
              <h3 className="font-bold text-gray-900 mb-4 text-sm">Next Steps</h3>
              <div className="space-y-2">
                {applicable.filter(m => !profile.completedModules.includes(m.key)).slice(0, 5).map(mod => (
                  <Link key={mod.key} href={mod.href}
                    className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-brand-200 hover:bg-brand-50 transition-all group">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-brand-400 flex-shrink-0" />
                      <span className="text-xs font-medium text-gray-700 group-hover:text-brand-700 leading-tight">{mod.label}</span>
                    </div>
                    <ChevronRight size={13} className="text-gray-300 group-hover:text-brand-500" />
                  </Link>
                ))}
                {applicable.filter(m => !profile.completedModules.includes(m.key)).length === 0 && (
                  <div className="text-center py-4">
                    <CheckCircle2 size={24} className="text-emerald-500 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">All modules completed!</p>
                  </div>
                )}
              </div>
            </div>

            <div className="card border-brand-900" style={{ background: '#0d1f17' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm text-white">Your Profile</h3>
                <button onClick={resetProfile} disabled={resetting} className="text-white/40 hover:text-white/70 transition-colors">
                  <RefreshCw size={13} />
                </button>
              </div>
              <div className="space-y-2 text-xs">
                {([
                  ['Entity', ENTITY_LABELS[profile.entityType]],
                  ['Status', profile.residentStatus === 'RESIDENT' ? 'TZ Resident' : profile.residentStatus === 'GOVERNMENT' ? 'Govt. Employee' : 'Non-Resident'],
                  ['Employees', profile.hasEmployees ? 'Yes' : 'No'],
                  ['Turnover', TURNOVER_LABELS[profile.turnoverBand]],
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-white/40">{k}</span>
                    <span className="text-white/80 font-medium text-right max-w-36 leading-tight">{v}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-white/10">
                <Link href="/onboarding" className="text-xs text-brand-300 hover:text-brand-200 flex items-center gap-1">
                  <RefreshCw size={11} /> Update answers
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Leave a review banner */}
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-8">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(i => <Star key={i} size={16} className="text-amber-400 fill-amber-400" />)}
              </div>
              <p className="text-sm text-amber-800 font-medium">Enjoying KodiComply? Let others know what you think.</p>
            </div>
            {reviewSubmitted ? (
              <span className="text-sm text-green-700 font-medium">✓ Review submitted — thank you!</span>
            ) : (
              <button
                onClick={() => setShowReviewForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#1a5c38] text-white text-sm rounded-xl font-medium hover:bg-[#154d2f] transition-colors shrink-0"
              >
                <Star size={14} className="fill-white" /> Write a Review
              </button>
            )}
          </div>
        </div>
      </main>
      {showReviewForm && (
        <ReviewForm onClose={() => setShowReviewForm(false)} onSuccess={() => { setShowReviewForm(false); setReviewSubmitted(true); }} />
      )}
      <Footer />
    </div>
  );
}
