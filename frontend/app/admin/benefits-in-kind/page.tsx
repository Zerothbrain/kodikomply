'use client';
import { useState, useEffect } from 'react';
import Navbar from '../../../components/ui/Navbar';
import Footer from '../../../components/ui/Footer';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Save, X } from 'lucide-react';

interface BenefitInKind {
  id: number;
  name: string;
  valuationMethod: string;
  valuationTable: string | null;
  isExempt: boolean;
  exemptionConditions: string | null;
  isActive: boolean;
  notes: string | null;
}

export default function AdminBenefitsInKindPage() {
  const [items, setItems] = useState<BenefitInKind[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BenefitInKind | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<BenefitInKind>>({});

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const { data } = await api.get('/admin/benefits-in-kind');
      setItems(data);
    } catch { toast.error('Failed to load'); }
    setLoading(false);
  }

  function startEdit(item: BenefitInKind) { setEditing(item); setForm({ ...item }); setCreating(false); }
  function startCreate() { setCreating(true); setEditing(null); setForm({ isExempt: false, isActive: true }); }
  function cancel() { setEditing(null); setCreating(false); setForm({}); }

  async function save() {
    try {
      if (creating) {
        await api.post('/admin/benefits-in-kind', form);
        toast.success('Created');
      } else if (editing) {
        await api.put(`/admin/benefits-in-kind/${editing.id}`, form);
        toast.success('Updated');
      }
      cancel(); load();
    } catch { toast.error('Save failed'); }
  }

  async function remove(id: number) {
    if (!confirm('Delete this benefit?')) return;
    try { await api.delete(`/admin/benefits-in-kind/${id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  }

  const isEditing = editing !== null || creating;

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Benefits in Kind</h1>
            <p className="text-gray-500 text-sm">Fifth Schedule / S.27 ITA valuation rules</p>
          </div>
          <button onClick={startCreate} className="btn-primary flex items-center gap-2"><Plus size={16} />Add Benefit</button>
        </div>

        {isEditing && (
          <div className="card mb-6 space-y-4">
            <h2 className="font-semibold text-lg">{creating ? 'New Benefit' : 'Edit Benefit'}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Name</label>
                <input className="input-field" value={form.name ?? ''} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="label">Valuation Method</label>
                <input className="input-field" value={form.valuationMethod ?? ''} onChange={e => setForm({ ...form, valuationMethod: e.target.value })} placeholder="e.g. TABLE_LOOKUP, PERCENTAGE, FORMULA" />
              </div>
            </div>
            <div>
              <label className="label">Valuation Table (JSON)</label>
              <textarea className="input-field h-32 font-mono text-xs" value={form.valuationTable ?? ''} onChange={e => setForm({ ...form, valuationTable: e.target.value })} placeholder='{"rows": [{"ccFrom": 0, "ccTo": 1000, "newAnnual": 1200000}]}' />
            </div>
            <div>
              <label className="label">Exemption Conditions</label>
              <textarea className="input-field h-20" value={form.exemptionConditions ?? ''} onChange={e => setForm({ ...form, exemptionConditions: e.target.value })} />
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea className="input-field h-16" value={form.notes ?? ''} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isExempt ?? false} onChange={e => setForm({ ...form, isExempt: e.target.checked })} className="w-4 h-4" />
                Is Exempt
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.isActive ?? true} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4" />
                Active
              </label>
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
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900">{item.name}</p>
                      {item.isExempt && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Exempt</span>}
                      {!item.isActive && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactive</span>}
                    </div>
                    <p className="text-xs text-gray-400 font-mono">{item.valuationMethod}</p>
                    {item.exemptionConditions && <p className="text-xs text-gray-500 mt-1">{item.exemptionConditions}</p>}
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
