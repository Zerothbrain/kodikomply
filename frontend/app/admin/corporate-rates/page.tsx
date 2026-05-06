'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Pencil, Check, X } from 'lucide-react';
import Navbar from '../../../components/ui/Navbar';
import Footer from '../../../components/ui/Footer';
import { isAdmin, isLoggedIn } from '../../../lib/auth';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

interface CorpRate { id: number; entityType: string; rate: string; conditions: string | null; startDate: string; endDate: string | null; isActive: boolean; notes: string | null; }

const empty: Omit<CorpRate, 'id'> = { entityType: '', rate: '0.30', conditions: null, startDate: '2024-01-01', endDate: null, isActive: true, notes: null };

export default function CorporateRatesPage() {
  const router = useRouter();
  const [rates, setRates] = useState<CorpRate[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<Omit<CorpRate, 'id'>>(empty);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn() || !isAdmin()) { router.push('/auth/login'); return; }
    api.get('/admin/corporate-rates').then(r => setRates(r.data)).catch(() => toast.error('Failed to load rates')).finally(() => setLoading(false));
  }, [router]);

  function set(k: string, v: unknown) { setForm(f => ({ ...f, [k]: v })); }

  async function save() {
    try {
      const payload = { ...form, rate: Number(form.rate) };
      if (editId) await api.put(`/admin/corporate-rates/${editId}`, payload);
      else await api.post('/admin/corporate-rates', payload);
      toast.success('Saved'); setShowForm(false); setEditId(null); setForm(empty);
      const r = await api.get('/admin/corporate-rates'); setRates(r.data);
    } catch { toast.error('Failed to save'); }
  }

  function startEdit(r: CorpRate) { setEditId(r.id); setForm({ ...r, startDate: r.startDate?.split('T')[0], endDate: r.endDate?.split('T')[0] ?? null }); setShowForm(true); }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="text-gray-500 hover:text-brand-600"><ArrowLeft size={20} /></Link>
          <h1 className="text-2xl font-bold text-gray-900">Corporate Tax Rates</h1>
        </div>

        <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm(empty); }} className="btn-primary flex items-center gap-2 mb-4">
          <Plus size={16} />Add Rate
        </button>

        {showForm && (
          <div className="card mb-4 border-brand-200 bg-brand-50">
            <h3 className="font-bold text-brand-800 mb-4">{editId ? 'Edit Corporate Rate' : 'New Corporate Rate'}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className="label">Entity Type</label><input className="input-field" placeholder="e.g. Standard resident company" value={form.entityType} onChange={e => set('entityType', e.target.value)} /></div>
              <div><label className="label">Rate (decimal, e.g. 0.30 = 30%)</label><input type="number" step="0.001" className="input-field" value={form.rate} onChange={e => set('rate', e.target.value)} /></div>
              <div><label className="label">Start Date</label><input type="date" className="input-field" value={form.startDate} onChange={e => set('startDate', e.target.value)} /></div>
              <div><label className="label">End Date (leave blank = no expiry)</label><input type="date" className="input-field" value={form.endDate ?? ''} onChange={e => set('endDate', e.target.value || null)} /></div>
              <div className="col-span-2"><label className="label">Conditions</label><textarea className="input-field h-20" value={form.conditions ?? ''} onChange={e => set('conditions', e.target.value || null)} /></div>
              <div className="col-span-2"><label className="label">Notes</label><input className="input-field" value={form.notes ?? ''} onChange={e => set('notes', e.target.value || null)} /></div>
              <div><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} /><span className="text-sm font-medium">Active</span></label></div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={save} className="btn-primary flex items-center gap-2"><Check size={16} />Save</button>
              <button onClick={() => setShowForm(false)} className="btn-secondary flex items-center gap-2"><X size={16} />Cancel</button>
            </div>
          </div>
        )}

        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-brand-50 border-b border-brand-100">
              <tr>{['Entity Type', 'Rate', 'Conditions', 'Start', 'End', 'Active', ''].map(h => <th key={h} className="text-left py-3 px-4 font-semibold text-brand-700">{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className="py-8 text-center text-gray-500">Loading...</td></tr>
                : rates.map(r => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium max-w-xs">{r.entityType}</td>
                    <td className="py-3 px-4 font-mono font-bold text-brand-700 text-lg">{(Number(r.rate) * 100).toFixed(1)}%</td>
                    <td className="py-3 px-4 text-xs text-gray-500 max-w-sm">{r.conditions}</td>
                    <td className="py-3 px-4 text-xs">{r.startDate?.split('T')[0]}</td>
                    <td className="py-3 px-4 text-xs">{r.endDate?.split('T')[0] ?? 'Ongoing'}</td>
                    <td className="py-3 px-4">{r.isActive ? <span className="badge-green">Active</span> : <span className="badge-red">Inactive</span>}</td>
                    <td className="py-3 px-4"><button onClick={() => startEdit(r)} className="text-blue-500 hover:text-blue-700"><Pencil size={14} /></button></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </main>
      <Footer />
    </div>
  );
}
