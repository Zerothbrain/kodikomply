'use client';
import { useState, useEffect } from 'react';
import Navbar from '../../../components/ui/Navbar';
import Footer from '../../../components/ui/Footer';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Save, X } from 'lucide-react';

interface RetirementFund {
  id: number;
  name: string;
  type: 'APPROVED' | 'UNAPPROVED';
  isResident: boolean;
  isActive: boolean;
  notes: string | null;
}

export default function AdminRetirementFundsPage() {
  const [items, setItems] = useState<RetirementFund[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<RetirementFund | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<RetirementFund>>({});

  useEffect(() => { load(); }, []);

  async function load() {
    try { const { data } = await api.get('/admin/retirement-funds'); setItems(data); }
    catch { toast.error('Failed to load'); }
    setLoading(false);
  }

  function startEdit(item: RetirementFund) { setEditing(item); setForm({ ...item }); setCreating(false); }
  function startCreate() { setCreating(true); setEditing(null); setForm({ type: 'APPROVED', isResident: true, isActive: true }); }
  function cancel() { setEditing(null); setCreating(false); setForm({}); }

  async function save() {
    try {
      if (creating) { await api.post('/admin/retirement-funds', form); toast.success('Created'); }
      else if (editing) { await api.put(`/admin/retirement-funds/${editing.id}`, form); toast.success('Updated'); }
      cancel(); load();
    } catch { toast.error('Save failed'); }
  }

  async function remove(id: number) {
    if (!confirm('Delete this fund?')) return;
    try { await api.delete(`/admin/retirement-funds/${id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  }

  const isEditing = editing !== null || creating;

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Retirement Funds</h1>
            <p className="text-gray-500 text-sm">S.61–63 ITA — approved and unapproved funds</p>
          </div>
          <button onClick={startCreate} className="btn-primary flex items-center gap-2"><Plus size={16} />Add Fund</button>
        </div>

        {isEditing && (
          <div className="card mb-6 space-y-4">
            <h2 className="font-semibold text-lg">{creating ? 'New Fund' : 'Edit Fund'}</h2>
            <div>
              <label className="label">Fund Name</label>
              <input className="input-field" value={form.name ?? ''} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. NSSF — National Social Security Fund" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Type</label>
                <select className="input-field" value={form.type ?? 'APPROVED'} onChange={e => setForm({ ...form, type: e.target.value as 'APPROVED' | 'UNAPPROVED' })}>
                  <option value="APPROVED">Approved</option>
                  <option value="UNAPPROVED">Unapproved</option>
                </select>
              </div>
              <div className="flex flex-col justify-end gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.isResident ?? true} onChange={e => setForm({ ...form, isResident: e.target.checked })} className="w-4 h-4" />
                  Resident Fund (Tanzania-registered)
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.isActive ?? true} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4" />
                  Active
                </label>
              </div>
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea className="input-field h-20" value={form.notes ?? ''} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="flex gap-3">
              <button onClick={save} className="btn-primary flex items-center gap-2"><Save size={16} />Save</button>
              <button onClick={cancel} className="btn-secondary flex items-center gap-2"><X size={16} />Cancel</button>
            </div>
          </div>
        )}

        {loading ? <div className="text-center py-12 text-gray-400">Loading...</div> : (
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.id} className={`bg-white rounded-xl border shadow-sm p-4 ${!item.isActive ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900">{item.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${item.type === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{item.type}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${item.isResident ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{item.isResident ? 'Resident' : 'Non-resident'}</span>
                      {!item.isActive && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactive</span>}
                    </div>
                    {item.notes && <p className="text-xs text-gray-500">{item.notes}</p>}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button onClick={() => startEdit(item)} className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg"><Pencil size={16} /></button>
                    <button onClick={() => remove(item.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
