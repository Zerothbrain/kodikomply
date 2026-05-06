'use client';
import { useState, useEffect } from 'react';
import Navbar from '../../../components/ui/Navbar';
import Footer from '../../../components/ui/Footer';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import { Plus, Save, Trash2, Search } from 'lucide-react';

interface Translation {
  id: number;
  language: string;
  key: string;
  value: string;
  category: string;
}

export default function AdminTranslationsPage() {
  const [items, setItems] = useState<Translation[]>([]);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState('SW');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newCategory, setNewCategory] = useState('general');

  useEffect(() => { load(); }, [lang]);

  async function load() {
    setLoading(true);
    try { const { data } = await api.get(`/admin/translations?language=${lang}`); setItems(data); }
    catch { toast.error('Failed to load'); }
    setLoading(false);
  }

  async function saveEdit(id: number) {
    try {
      await api.put(`/admin/translations/${id}`, { value: editValue });
      toast.success('Updated');
      setEditingId(null);
      load();
    } catch { toast.error('Save failed'); }
  }

  async function create() {
    if (!newKey || !newValue) { toast.error('Key and value required'); return; }
    try {
      await api.post('/admin/translations', { language: lang, key: newKey, value: newValue, category: newCategory });
      toast.success('Created');
      setNewKey(''); setNewValue(''); setNewCategory('general');
      load();
    } catch { toast.error('Create failed'); }
  }

  async function remove(id: number) {
    if (!confirm('Delete this translation?')) return;
    try { await api.delete(`/admin/translations/${id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  }

  const categories = Array.from(new Set(items.map(i => i.category))).sort();
  const filtered = items.filter(i =>
    search === '' || i.key.toLowerCase().includes(search.toLowerCase()) || i.value.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = categories.reduce<Record<string, Translation[]>>((acc, cat) => {
    acc[cat] = filtered.filter(i => i.category === cat);
    return acc;
  }, {});

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Translations</h1>
            <p className="text-gray-500 text-sm">Manage EN / SW interface strings</p>
          </div>
          <div className="flex gap-2">
            {['EN', 'SW'].map(l => (
              <button key={l} onClick={() => setLang(l)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${lang === l ? 'bg-brand-600 text-white' : 'bg-white border text-gray-700 hover:border-brand-400'}`}>
                {l === 'EN' ? 'English' : 'Swahili'}
              </button>
            ))}
          </div>
        </div>

        <div className="card mb-6 space-y-3">
          <h2 className="font-semibold">Add New Translation ({lang})</h2>
          <div className="grid grid-cols-4 gap-3">
            <input className="input-field col-span-1" placeholder="Key (e.g. nav.calculators)" value={newKey} onChange={e => setNewKey(e.target.value)} />
            <input className="input-field col-span-2" placeholder="Value" value={newValue} onChange={e => setNewValue(e.target.value)} />
            <input className="input-field col-span-1" placeholder="Category" value={newCategory} onChange={e => setNewCategory(e.target.value)} />
          </div>
          <button onClick={create} className="btn-primary flex items-center gap-2"><Plus size={16} />Add Translation</button>
        </div>

        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input-field pl-9" placeholder="Search keys or values..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? <div className="text-center py-12 text-gray-400">Loading...</div> : (
          <div className="space-y-6">
            {Object.entries(grouped).filter(([, rows]) => rows.length > 0).map(([cat, rows]) => (
              <div key={cat}>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">{cat}</h3>
                <div className="space-y-1">
                  {rows.map(item => (
                    <div key={item.id} className="bg-white rounded-lg border border-gray-100 px-4 py-2 flex items-center gap-3">
                      <span className="font-mono text-xs text-gray-400 w-48 flex-shrink-0 truncate">{item.key}</span>
                      {editingId === item.id ? (
                        <>
                          <input className="input-field flex-1 py-1 text-sm" value={editValue} onChange={e => setEditValue(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') saveEdit(item.id); if (e.key === 'Escape') setEditingId(null); }} autoFocus />
                          <button onClick={() => saveEdit(item.id)} className="p-1 text-green-600 hover:bg-green-50 rounded"><Save size={14} /></button>
                          <button onClick={() => setEditingId(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded text-xs">✕</button>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 text-sm text-gray-800 cursor-pointer hover:text-brand-600"
                            onClick={() => { setEditingId(item.id); setEditValue(item.value); }}>{item.value}</span>
                          <button onClick={() => remove(item.id)} className="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div className="text-center py-12 text-gray-400">No translations found.</div>}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
