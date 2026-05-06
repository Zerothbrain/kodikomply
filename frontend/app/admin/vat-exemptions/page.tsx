'use client';
import { useState, useEffect } from 'react';
import Navbar from '../../../components/ui/Navbar';
import Footer from '../../../components/ui/Footer';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Save, X, ToggleRight, ToggleLeft, Search } from 'lucide-react';

interface VatItem {
  id: number; category: string; itemName: string; hsCode: string | null;
  exemptionType: string; conditions: string | null; isActive: boolean; notes: string | null;
}

export default function AdminVatExemptionsPage() {
  const [items, setItems] = useState<VatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<VatItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<VatItem>>({});
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('ALL');

  const categories = ['ALL', ...Array.from(new Set(items.map(i => i.category))).sort()];

  useEffect(() => { load(); }, []);

  async function load() {
    try { const { data } = await api.get('/admin/vat-exempt-items'); setItems(data); }
    catch { toast.error('Failed to load'); }
    setLoading(false);
  }

  function startEdit(item: VatItem) { setEditing(item); setForm({ ...item }); setCreating(false); }
  function startCreate() { setCreating(true); setEditing(null); setForm({ exemptionType: 'EXEMPT', isActive: true }); }
  function cancel() { setEditing(null); setCreating(false); setForm({}); }

  async function save() {
    try {
      if (creating) { await api.post('/admin/vat-exempt-items', { ...form, effectiveFrom: new Date().toISOString() }); toast.success('Created'); }
      else if (editing) { await api.put(`/admin/vat-exempt-items/${editing.id}`, form); toast.success('Updated'); }
      cancel(); load();
    } catch { toast.error('Save failed'); }
  }

  async function toggle(item: VatItem) {
    try { await api.put(`/admin/vat-exempt-items/${item.id}`, { isActive: !item.isActive }); load(); }
    catch { toast.error('Update failed'); }
  }

  async function remove(id: number) {
    if (!confirm('Delete this item?')) return;
    try { await api.delete(`/admin/vat-exempt-items/${id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  }

  const TYPE_COLORS: Record<string, string> = {
    EXEMPT: 'bg-green-100 text-green-700',
    ZERO_RATED: 'bg-blue-100 text-blue-700',
    TAXABLE: 'bg-red-100 text-red-700',
  };

  const filtered = items.filter(i => {
    const matchCat = catFilter === 'ALL' || i.category === catFilter;
    const matchSearch = search === '' || i.itemName.toLowerCase().includes(search.toLowerCase()) || (i.hsCode ?? '').includes(search);
    return matchCat && matchSearch;
  });

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">VAT Exempt Supplies Manager</h1>
            <p className="text-gray-500 text-sm">VAT Act Cap 148 R.E.2023 — manage all exempt, zero-rated, and taxable supply classifications</p>
          </div>
          <button onClick={startCreate} className="btn-primary flex items-center gap-2"><Plus size={16} />Add Item</button>
        </div>

        {(creating || editing) && (
          <div className="card mb-6 space-y-4">
            <h2 className="font-semibold">{creating ? 'New Item' : 'Edit Item'}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Category</label>
                <input className="input-field" value={form.category ?? ''} onChange={e => setForm({...form, category: e.target.value})} placeholder="e.g. Agricultural Implements" />
              </div>
              <div>
                <label className="label">VAT Treatment</label>
                <select className="input-field" value={form.exemptionType ?? 'EXEMPT'} onChange={e => setForm({...form, exemptionType: e.target.value})}>
                  <option value="EXEMPT">EXEMPT</option>
                  <option value="ZERO_RATED">ZERO-RATED</option>
                  <option value="TAXABLE">TAXABLE 18%</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="label">Item Name</label>
                <input className="input-field" value={form.itemName ?? ''} onChange={e => setForm({...form, itemName: e.target.value})} />
              </div>
              <div>
                <label className="label">HS Code</label>
                <input className="input-field" value={form.hsCode ?? ''} onChange={e => setForm({...form, hsCode: e.target.value})} placeholder="e.g. 8701.x" />
              </div>
              <div>
                <label className="label flex items-center gap-2">
                  <input type="checkbox" checked={form.isActive ?? true} onChange={e => setForm({...form, isActive: e.target.checked})} className="w-4 h-4" /> Active
                </label>
              </div>
              <div className="col-span-2">
                <label className="label">Conditions</label>
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

        <div className="flex gap-3 mb-4 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input-field pl-9" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input-field w-56" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        <p className="text-xs text-gray-400 mb-3">{filtered.length} items</p>

        {loading ? <div className="text-center py-12 text-gray-400">Loading...</div> : (
          <div className="space-y-1">
            {filtered.map(item => (
              <div key={item.id} className={`bg-white rounded-lg border border-gray-100 px-4 py-3 flex items-center gap-3 ${!item.isActive ? 'opacity-50' : ''}`}>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${TYPE_COLORS[item.exemptionType] ?? 'bg-gray-100 text-gray-600'}`}>{item.exemptionType}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{item.itemName}</p>
                  <p className="text-xs text-gray-400">{item.category}{item.hsCode ? ` · HS: ${item.hsCode}` : ''}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => toggle(item)} className="p-1.5 text-gray-400 hover:text-brand-600 rounded">
                    {item.isActive ? <ToggleRight size={16} className="text-green-500" /> : <ToggleLeft size={16} />}
                  </button>
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
