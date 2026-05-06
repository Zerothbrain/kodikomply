'use client';
import { useState, useEffect } from 'react';
import Navbar from '../../../components/ui/Navbar';
import Footer from '../../../components/ui/Footer';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Save, X, ToggleLeft, ToggleRight } from 'lucide-react';

interface ExemptAmount {
  id: number;
  name: string;
  description: string;
  applicableTo: string;
  conditions: string | null;
  legalReference: string | null;
  isActive: boolean;
}

export default function AdminExemptAmountsPage() {
  const [items, setItems] = useState<ExemptAmount[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ExemptAmount | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<ExemptAmount>>({});
  const [search, setSearch] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    try { const { data } = await api.get('/admin/exempt-amounts'); setItems(data); }
    catch { toast.error('Failed to load'); }
    setLoading(false);
  }

  function startEdit(item: ExemptAmount) { setEditing(item); setForm({ ...item }); setCreating(false); }
  function startCreate() { setCreating(true); setEditing(null); setForm({ applicableTo: 'ALL', isActive: true }); }
  function cancel() { setEditing(null); setCreating(false); setForm({}); }

  async function save() {
    try {
      if (creating) { await api.post('/admin/exempt-amounts', form); toast.success('Created'); }
      else if (editing) { await api.put(`/admin/exempt-amounts/${editing.id}`, form); toast.success('Updated'); }
      cancel(); load();
    } catch { toast.error('Save failed'); }
  }

  async function toggleActive(item: ExemptAmount) {
    try {
      await api.put(`/admin/exempt-amounts/${item.id}`, { ...item, isActive: !item.isActive });
      toast.success(item.isActive ? 'Deactivated' : 'Activated');
      load();
    } catch { toast.error('Update failed'); }
  }

  async function remove(id: number) {
    if (!confirm('Delete this exemption?')) return;
    try { await api.delete(`/admin/exempt-amounts/${id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  }

  const isEditing = editing !== null || creating;
  const filtered = items.filter(i => search === '' || i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Exempt Amounts</h1>
            <p className="text-gray-500 text-sm">Second Schedule ITA — manage exemptions list</p>
          </div>
          <button onClick={startCreate} className="btn-primary flex items-center gap-2"><Plus size={16} />Add Exemption</button>
        </div>

        {isEditing && (
          <div className="card mb-6 space-y-4">
            <h2 className="font-semibold text-lg">{creating ? 'New Exemption' : 'Edit Exemption'}</h2>
            <div>
              <label className="label">Name</label>
              <input className="input-field" value={form.name ?? ''} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input-field h-20" value={form.description ?? ''} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Applicable To</label>
                <select className="input-field" value={form.applicableTo ?? 'ALL'} onChange={e => setForm({ ...form, applicableTo: e.target.value })}>
                  <option value="ALL">All Taxpayers</option>
                  <option value="INDIVIDUAL">Individuals Only</option>
                  <option value="ENTITY">Entities Only</option>
                </select>
              </div>
              <div>
                <label className="label">Legal Reference</label>
                <input className="input-field" value={form.legalReference ?? ''} onChange={e => setForm({ ...form, legalReference: e.target.value })} placeholder="e.g. Second Schedule para 1" />
              </div>
            </div>
            <div>
              <label className="label">Conditions</label>
              <textarea className="input-field h-20" value={form.conditions ?? ''} onChange={e => setForm({ ...form, conditions: e.target.value })} placeholder="Any conditions or limitations..." />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isActive ?? true} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4" />
              Active (visible in exempt checker tool)
            </label>
            <div className="flex gap-3">
              <button onClick={save} className="btn-primary flex items-center gap-2"><Save size={16} />Save</button>
              <button onClick={cancel} className="btn-secondary flex items-center gap-2"><X size={16} />Cancel</button>
            </div>
          </div>
        )}

        <div className="mb-4">
          <input className="input-field" placeholder="Search exemptions..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? <div className="text-center py-12 text-gray-400">Loading...</div> : (
          <div className="space-y-2">
            <p className="text-sm text-gray-400 mb-3">{filtered.length} exemption{filtered.length !== 1 ? 's' : ''}</p>
            {filtered.map(item => (
              <div key={item.id} className={`bg-white rounded-xl border shadow-sm p-4 ${!item.isActive ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900">{item.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        item.applicableTo === 'ALL' ? 'bg-blue-100 text-blue-700' :
                        item.applicableTo === 'INDIVIDUAL' ? 'bg-purple-100 text-purple-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>{item.applicableTo}</span>
                      {!item.isActive && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactive</span>}
                    </div>
                    <p className="text-sm text-gray-600">{item.description}</p>
                    {item.legalReference && <p className="text-xs text-brand-600 mt-1">{item.legalReference}</p>}
                  </div>
                  <div className="flex gap-1 ml-4">
                    <button onClick={() => toggleActive(item)} title={item.isActive ? 'Deactivate' : 'Activate'}
                      className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg">
                      {item.isActive ? <ToggleRight size={18} className="text-green-500" /> : <ToggleLeft size={18} />}
                    </button>
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
