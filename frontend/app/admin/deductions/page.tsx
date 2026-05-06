'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import Navbar from '../../../components/ui/Navbar';
import Footer from '../../../components/ui/Footer';
import { isAdmin, isLoggedIn } from '../../../lib/auth';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

interface Deduction { id: number; name: string; category: string; maxAmount: string | null; isPercentage: boolean; percentageRate: string | null; conditions: string | null; isActive: boolean; effectiveFrom: string; effectiveTo: string | null; notes: string | null; }

const empty: Omit<Deduction, 'id'> = { name: '', category: 'Employment', maxAmount: null, isPercentage: false, percentageRate: null, conditions: null, isActive: true, effectiveFrom: '2024-01-01', effectiveTo: null, notes: null };

export default function DeductionsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Deduction[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<Omit<Deduction, 'id'>>(empty);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn() || !isAdmin()) { router.push('/auth/login'); return; }
    load();
  }, [router]);

  async function load() {
    setLoading(true);
    try { const r = await api.get('/admin/deductions'); setItems(r.data); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }

  function set(k: string, v: unknown) { setForm(f => ({ ...f, [k]: v })); }

  async function save() {
    try {
      const payload = { ...form, maxAmount: form.maxAmount ? Number(form.maxAmount) : null, percentageRate: form.percentageRate ? Number(form.percentageRate) : null };
      if (editId) await api.put(`/admin/deductions/${editId}`, payload);
      else await api.post('/admin/deductions', payload);
      toast.success('Saved'); setShowForm(false); setEditId(null); setForm(empty); load();
    } catch { toast.error('Failed to save'); }
  }

  async function del(id: number) {
    if (!confirm('Delete this deduction?')) return;
    try { await api.delete(`/admin/deductions/${id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Failed to delete'); }
  }

  function startEdit(d: Deduction) { setEditId(d.id); setForm({ ...d, effectiveFrom: d.effectiveFrom?.split('T')[0], effectiveTo: d.effectiveTo?.split('T')[0] ?? null }); setShowForm(true); }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="text-gray-500 hover:text-brand-600"><ArrowLeft size={20} /></Link>
          <h1 className="text-2xl font-bold text-gray-900">Deductions Manager</h1>
        </div>

        <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm(empty); }} className="btn-primary flex items-center gap-2 mb-4"><Plus size={16} />Add Deduction</button>

        {showForm && (
          <div className="card mb-4 border-brand-200 bg-brand-50">
            <h3 className="font-bold text-brand-800 mb-4">{editId ? 'Edit Deduction' : 'New Deduction'}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Name</label><input className="input-field" value={form.name} onChange={e => set('name', e.target.value)} /></div>
              <div><label className="label">Category</label><input className="input-field" value={form.category} onChange={e => set('category', e.target.value)} placeholder="Employment, Business, etc." /></div>
              <div><label className="label">Max Amount (TZS)</label><input type="number" className="input-field" value={form.maxAmount ?? ''} onChange={e => set('maxAmount', e.target.value || null)} /></div>
              <div className="flex items-center gap-4 mt-6">
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isPercentage} onChange={e => set('isPercentage', e.target.checked)} /><span className="text-sm">Is Percentage?</span></label>
                {form.isPercentage && <input type="number" step="0.01" className="input-field w-28" placeholder="Rate 0-1" value={form.percentageRate ?? ''} onChange={e => set('percentageRate', e.target.value || null)} />}
              </div>
              <div><label className="label">Effective From</label><input type="date" className="input-field" value={form.effectiveFrom} onChange={e => set('effectiveFrom', e.target.value)} /></div>
              <div><label className="label">Effective To</label><input type="date" className="input-field" value={form.effectiveTo ?? ''} onChange={e => set('effectiveTo', e.target.value || null)} /></div>
              <div className="col-span-2"><label className="label">Conditions</label><textarea className="input-field h-16" value={form.conditions ?? ''} onChange={e => set('conditions', e.target.value || null)} /></div>
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
              <tr>{['Name', 'Category', 'Max Amount', 'Rate', 'Conditions', 'Active', 'Effective From', ''].map(h => <th key={h} className="text-left py-3 px-4 font-semibold text-brand-700">{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={8} className="py-8 text-center">Loading...</td></tr>
                : items.map(d => (
                  <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{d.name}</td>
                    <td className="py-3 px-4 text-xs"><span className="badge-green">{d.category}</span></td>
                    <td className="py-3 px-4 font-mono text-xs">{d.maxAmount ? Number(d.maxAmount).toLocaleString() : '—'}</td>
                    <td className="py-3 px-4 text-xs">{d.isPercentage && d.percentageRate ? `${(Number(d.percentageRate) * 100).toFixed(1)}%` : '—'}</td>
                    <td className="py-3 px-4 text-xs text-gray-500 max-w-xs truncate">{d.conditions}</td>
                    <td className="py-3 px-4">{d.isActive ? <span className="badge-green">Active</span> : <span className="badge-red">Inactive</span>}</td>
                    <td className="py-3 px-4 text-xs">{d.effectiveFrom?.split('T')[0]}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button onClick={() => startEdit(d)} className="text-blue-500 hover:text-blue-700"><Pencil size={14} /></button>
                        <button onClick={() => del(d.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                      </div>
                    </td>
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
