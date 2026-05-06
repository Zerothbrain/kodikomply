'use client';
import { useState, useEffect } from 'react';
import Navbar from '../../../components/ui/Navbar';
import Footer from '../../../components/ui/Footer';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import { Save, X, Pencil } from 'lucide-react';

interface DepreciationClass {
  id: number;
  name: string;
  description: string;
  rate: number;
  method: string;
  notes: string | null;
}

export default function AdminDepreciationPage() {
  const [classes, setClasses] = useState<DepreciationClass[]>([]);
  const [writeoff, setWriteoff] = useState<{ id: number; fixedAmount: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<DepreciationClass>>({});

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const { data } = await api.get('/admin/tax-rules?category=DEPRECIATION');
      const { data: woData } = await api.get('/admin/tax-rules?category=DEPRECIATION_WRITEOFF');
      setClasses(data);
      if (woData?.[0]) setWriteoff({ id: woData[0].id, fixedAmount: woData[0].fixedAmount });
    } catch { toast.error('Failed to load'); }
    setLoading(false);
  }

  function startEdit(item: DepreciationClass) { setEditing(item.id); setForm({ ...item }); }

  async function save(id: number) {
    try {
      await api.put(`/admin/tax-rules/${id}`, form);
      toast.success('Updated');
      setEditing(null);
      load();
    } catch { toast.error('Save failed'); }
  }

  async function saveWriteoff() {
    if (!writeoff) return;
    try {
      await api.put(`/admin/tax-rules/${writeoff.id}`, { fixedAmount: writeoff.fixedAmount });
      toast.success('Write-off threshold updated');
    } catch { toast.error('Save failed'); }
  }

  const methodBadge = (method: string) => {
    if (method === 'STRAIGHT_LINE') return 'bg-blue-100 text-blue-700';
    return 'bg-purple-100 text-purple-700';
  };

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Depreciation Classes</h1>
          <p className="text-gray-500 text-sm">Third Schedule ITA — capital allowance rates and methods</p>
        </div>

        {writeoff && (
          <div className="card mb-6">
            <h2 className="font-semibold mb-3">Pool Write-off Threshold</h2>
            <p className="text-sm text-gray-500 mb-3">Assets in a pool with remaining value below this amount may be written off in full.</p>
            <div className="flex gap-3 items-center">
              <div className="flex-1">
                <label className="label">Threshold Amount (TZS)</label>
                <input type="number" className="input-field" value={writeoff.fixedAmount}
                  onChange={e => setWriteoff({ ...writeoff, fixedAmount: Number(e.target.value) })} />
              </div>
              <button onClick={saveWriteoff} className="btn-primary mt-5 flex items-center gap-2"><Save size={16} />Save</button>
            </div>
          </div>
        )}

        {loading ? <div className="text-center py-12 text-gray-400">Loading...</div> : (
          <div className="space-y-3">
            {classes.map(item => (
              <div key={item.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                {editing === item.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="label">Rate (%)</label>
                        <input type="number" step="0.01" className="input-field"
                          value={((form.rate ?? item.rate) * 100).toFixed(0)}
                          onChange={e => setForm({ ...form, rate: Number(e.target.value) / 100 })} />
                      </div>
                      <div>
                        <label className="label">Method</label>
                        <select className="input-field" value={form.method ?? item.method}
                          onChange={e => setForm({ ...form, method: e.target.value })}>
                          <option value="DIMINISHING_BALANCE">Diminishing Balance</option>
                          <option value="STRAIGHT_LINE">Straight Line</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="label">Description</label>
                      <textarea className="input-field h-16" value={form.description ?? item.description}
                        onChange={e => setForm({ ...form, description: e.target.value })} />
                    </div>
                    <div>
                      <label className="label">Notes</label>
                      <textarea className="input-field h-16" value={form.notes ?? item.notes ?? ''}
                        onChange={e => setForm({ ...form, notes: e.target.value })} />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => save(item.id)} className="btn-primary flex items-center gap-2"><Save size={14} />Save</button>
                      <button onClick={() => setEditing(null)} className="btn-secondary flex items-center gap-2"><X size={14} />Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900">{item.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${methodBadge(item.method)}`}>
                          {item.method === 'STRAIGHT_LINE' ? 'Straight Line' : 'Diminishing Balance'}
                        </span>
                        <span className="text-lg font-bold text-brand-700">{(item.rate * 100).toFixed(0)}%</span>
                      </div>
                      <p className="text-sm text-gray-600">{item.description}</p>
                      {item.notes && <p className="text-xs text-amber-700 mt-1 bg-amber-50 rounded px-2 py-1 inline-block">{item.notes}</p>}
                    </div>
                    <button onClick={() => startEdit(item)} className="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg ml-4">
                      <Pencil size={16} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-5">
          <h3 className="font-semibold text-blue-800 mb-2">Third Schedule Reference</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p>Class 1 (37.5%): Computers, software, data handling, instruments — diminishing balance</p>
            <p>Class 2 (25%): Automobiles, taxis, buses, minibuses — diminishing balance</p>
            <p>Class 3 (12.5%): Plant &amp; machinery, furniture — diminishing balance</p>
            <p>Class 5 (20%): Intangibles with finite life — straight line over useful life</p>
            <p>Class 6 (2%): Non-residential buildings — straight line</p>
            <p>Class 7 (useful life): Railroads, pipelines, power, communications — straight line</p>
            <p>Class 8 (100%): Mining rights / buildings — diminishing balance</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
