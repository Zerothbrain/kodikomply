'use client';
import { useState, useEffect } from 'react';
import Navbar from '../../../components/ui/Navbar';
import Footer from '../../../components/ui/Footer';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Save, X } from 'lucide-react';

interface ImportItem { id: number; itemNumber: number; description: string; conditions: string | null; isActive: boolean; notes: string | null; }

export default function AdminVatImportsPage() {
  const [items, setItems] = useState<ImportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ImportItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<ImportItem>>({});

  useEffect(() => { load(); }, []);

  async function load() {
    try { const { data } = await api.get('/admin/vat-exempt-imports'); setItems(data); }
    catch { toast.error('Failed to load'); }
    setLoading(false);
  }

  function startEdit(item: ImportItem) { setEditing(item); setForm({ ...item }); setCreating(false); }
  function startCreate() { setCreating(true); setEditing(null); setForm({ isActive: true, itemNumber: (items.length > 0 ? Math.max(...items.map(i => i.itemNumber)) + 1 : 1) }); }
  function cancel() { setEditing(null); setCreating(false); setForm({}); }

  async function save() {
    try {
      if (creating) { await api.post('/admin/vat-exempt-imports', form); toast.success('Created'); }
      else if (editing) { await api.put(`/admin/vat-exempt-imports/${editing.id}`, form); toast.success('Updated'); }
      cancel(); load();
    } catch { toast.error('Save failed'); }
  }

  async function remove(id: number) {
    if (!confirm('Delete this import exemption?')) return;
    try { await api.delete(`/admin/vat-exempt-imports/${id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  }

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">VAT Exempt Imports Manager</h1>
            <p className="text-gray-500 text-sm">First Schedule VAT Act Cap 148 R.E.2023 — manage VAT-exempt import items</p>
          </div>
          <button onClick={startCreate} className="btn-primary flex items-center gap-2"><Plus size={16} />Add Item</button>
        </div>

        {(creating || editing) && (
          <div className="card mb-6 space-y-4">
            <h2 className="font-semibold">{creating ? 'New Import Exemption' : 'Edit Import Exemption'}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Item Number</label>
                <input type="number" className="input-field" value={form.itemNumber ?? ''} onChange={e => setForm({...form, itemNumber: Number(e.target.value)})} />
              </div>
              <div>
                <label className="label flex items-center gap-2">
                  <input type="checkbox" checked={form.isActive ?? true} onChange={e => setForm({...form, isActive: e.target.checked})} className="w-4 h-4" /> Active
                </label>
              </div>
              <div className="col-span-2">
                <label className="label">Description</label>
                <textarea className="input-field h-16" value={form.description ?? ''} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <div className="col-span-2">
                <label className="label">Conditions / Qualifications</label>
                <textarea className="input-field h-16" value={form.conditions ?? ''} onChange={e => setForm({...form, conditions: e.target.value})} />
              </div>
              <div className="col-span-2">
                <label className="label">Notes</label>
                <textarea className="input-field h-16" value={form.notes ?? ''} onChange={e => setForm({...form, notes: e.target.value})} />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={save} className="btn-primary flex items-center gap-2"><Save size={14} />Save</button>
              <button onClick={cancel} className="btn-secondary flex items-center gap-2"><X size={14} />Cancel</button>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-400 mb-3">{items.length} items</p>

        {loading ? <div className="text-center py-12 text-gray-400">Loading...</div> : (
          <div className="space-y-1">
            {items.map(item => (
              <div key={item.id} className={`bg-white rounded-lg border border-gray-100 px-4 py-3 flex items-start gap-3 ${!item.isActive ? 'opacity-50' : ''}`}>
                <span className="w-8 h-8 bg-brand-100 text-brand-700 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0">{item.itemNumber}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{item.description}</p>
                  {item.conditions && <p className="text-xs text-gray-500 mt-0.5">Conditions: {item.conditions}</p>}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => startEdit(item)} className="p-1.5 text-gray-400 hover:text-brand-600 rounded"><Pencil size={14} /></button>
                  <button onClick={() => remove(item.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded"><Trash2 size={14} /></button>
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
