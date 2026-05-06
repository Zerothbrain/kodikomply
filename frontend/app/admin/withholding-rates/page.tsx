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

interface WHTRate { id: number; paymentType: string; recipientType: string; rate: string; isFinal: boolean; notes: string | null; isActive: boolean; effectiveFrom: string; }

const empty: Omit<WHTRate, 'id'> = { paymentType: '', recipientType: 'RESIDENT', rate: '0', isFinal: false, notes: null, isActive: true, effectiveFrom: '2024-01-01' };

export default function WHRatesPage() {
  const router = useRouter();
  const [rates, setRates] = useState<WHTRate[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<Omit<WHTRate, 'id'>>(empty);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn() || !isAdmin()) { router.push('/auth/login'); return; }
    loadRates();
  }, [router]);

  async function loadRates() {
    setLoading(true);
    try { const r = await api.get('/admin/withholding-rates'); setRates(r.data); }
    catch { toast.error('Failed to load WHT rates'); }
    finally { setLoading(false); }
  }

  function set(k: string, v: unknown) { setForm(f => ({ ...f, [k]: v })); }

  async function save() {
    try {
      const payload = { ...form, rate: Number(form.rate) };
      if (editId) await api.put(`/admin/withholding-rates/${editId}`, payload);
      else await api.post('/admin/withholding-rates', payload);
      toast.success('Saved'); setShowForm(false); setEditId(null); setForm(empty); loadRates();
    } catch { toast.error('Failed to save'); }
  }

  function startEdit(r: WHTRate) { setEditId(r.id); setForm({ ...r, effectiveFrom: r.effectiveFrom?.split('T')[0] }); setShowForm(true); }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="text-gray-500 hover:text-brand-600"><ArrowLeft size={20} /></Link>
          <h1 className="text-2xl font-bold text-gray-900">Withholding Tax Rates</h1>
        </div>

        <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm(empty); }} className="btn-primary flex items-center gap-2 mb-4">
          <Plus size={16} />Add Rate
        </button>

        {showForm && (
          <div className="card mb-4 border-brand-200 bg-brand-50">
            <h3 className="font-bold text-brand-800 mb-4">{editId ? 'Edit WHT Rate' : 'New WHT Rate'}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div><label className="label">Payment Type</label><input className="input-field" value={form.paymentType} onChange={e => set('paymentType', e.target.value)} /></div>
              <div><label className="label">Recipient Type</label>
                <select className="input-field" value={form.recipientType} onChange={e => set('recipientType', e.target.value)}>
                  <option value="RESIDENT">RESIDENT</option><option value="NON_RESIDENT">NON_RESIDENT</option>
                </select>
              </div>
              <div><label className="label">Rate (decimal)</label><input type="number" step="0.001" className="input-field" value={form.rate} onChange={e => set('rate', e.target.value)} /></div>
              <div><label className="label">Effective From</label><input type="date" className="input-field" value={form.effectiveFrom} onChange={e => set('effectiveFrom', e.target.value)} /></div>
              <div className="flex gap-4 items-center mt-6">
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isFinal} onChange={e => set('isFinal', e.target.checked)} /><span className="text-sm">Final WHT</span></label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} /><span className="text-sm">Active</span></label>
              </div>
              <div><label className="label">Notes</label><input className="input-field" value={form.notes ?? ''} onChange={e => set('notes', e.target.value || null)} /></div>
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
              <tr>{['Payment Type', 'Recipient', 'Rate', 'Final?', 'Active', 'Effective From', 'Notes', ''].map(h => <th key={h} className="text-left py-3 px-4 font-semibold text-brand-700">{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={8} className="py-8 text-center text-gray-500">Loading...</td></tr>
                : rates.map(r => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{r.paymentType}</td>
                    <td className="py-3 px-4"><span className={r.recipientType === 'RESIDENT' ? 'badge-green' : 'badge-yellow'}>{r.recipientType}</span></td>
                    <td className="py-3 px-4 font-mono font-bold text-brand-700">{(Number(r.rate) * 100).toFixed(0)}%</td>
                    <td className="py-3 px-4">{r.isFinal ? <span className="badge-red">FINAL</span> : <span className="badge-green">Non-final</span>}</td>
                    <td className="py-3 px-4">{r.isActive ? <span className="badge-green">Active</span> : <span className="badge-red">Inactive</span>}</td>
                    <td className="py-3 px-4 text-xs">{r.effectiveFrom?.split('T')[0]}</td>
                    <td className="py-3 px-4 text-xs text-gray-500 max-w-xs truncate">{r.notes}</td>
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
