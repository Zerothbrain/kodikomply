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

interface Exemption { id: number; name: string; applicableTo: string; conditions: string | null; isActive: boolean; notes: string | null; }

const empty: Omit<Exemption, 'id'> = { name: '', applicableTo: 'ALL', conditions: null, isActive: true, notes: null };

export default function ExemptionsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Exemption[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<Omit<Exemption, 'id'>>(empty);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn() || !isAdmin()) { router.push('/auth/login'); return; }
    load();
  }, [router]);

  async function load() {
    setLoading(true);
    try { const r = await api.get('/admin/exemptions'); setItems(r.data); }
    catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }

  function set(k: string, v: unknown) { setForm(f => ({ ...f, [k]: v })); }

  async function save() {
    try {
      if (editId) await api.put(`/admin/exemptions/${editId}`, form);
      else await api.post('/admin/exemptions', form);
      toast.success('Saved'); setShowForm(false); setEditId(null); setForm(empty); load();
    } catch { toast.error('Failed to save'); }
  }

  async function del(id: number) {
    if (!confirm('Delete this exemption?')) return;
    try { await api.delete(`/admin/exemptions/${id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Failed to delete'); }
  }

  function startEdit(e: Exemption) { setEditId(e.id); setForm(e); setShowForm(true); }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="text-gray-500 hover:text-brand-600"><ArrowLeft size={20} /></Link>
          <h1 className="text-2xl font-bold text-gray-900">Exemptions Manager</h1>
        </div>

        <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm(empty); }} className="btn-primary flex items-center gap-2 mb-4"><Plus size={16} />Add Exemption</button>

        {showForm && (
          <div className="card mb-4 border-brand-200 bg-brand-50">
            <h3 className="font-bold text-brand-800 mb-4">{editId ? 'Edit Exemption' : 'New Exemption'}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Name</label><input className="input-field" value={form.name} onChange={e => set('name', e.target.value)} /></div>
              <div><label className="label">Applicable To</label>
                <select className="input-field" value={form.applicableTo} onChange={e => set('applicableTo', e.target.value)}>
                  {['INDIVIDUAL', 'COMPANY', 'NGO', 'ALL'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
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
              <tr>{['Name', 'Applicable To', 'Conditions', 'Active', 'Notes', ''].map(h => <th key={h} className="text-left py-3 px-4 font-semibold text-brand-700">{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="py-8 text-center">Loading...</td></tr>
                : items.map(e => (
                  <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{e.name}</td>
                    <td className="py-3 px-4"><span className="badge-green">{e.applicableTo}</span></td>
                    <td className="py-3 px-4 text-xs text-gray-500 max-w-sm">{e.conditions}</td>
                    <td className="py-3 px-4">{e.isActive ? <span className="badge-green">Active</span> : <span className="badge-red">Inactive</span>}</td>
                    <td className="py-3 px-4 text-xs text-gray-500">{e.notes}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button onClick={() => startEdit(e)} className="text-blue-500 hover:text-blue-700"><Pencil size={14} /></button>
                        <button onClick={() => del(e.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
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
