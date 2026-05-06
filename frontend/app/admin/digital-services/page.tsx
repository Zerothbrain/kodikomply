'use client';
import { useState, useEffect } from 'react';
import Navbar from '../../../components/ui/Navbar';
import Footer from '../../../components/ui/Footer';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Save, X } from 'lucide-react';

interface ServiceType { id: number; name: string; description: string | null; isActive: boolean; notes: string | null; }

export default function AdminDigitalServicesPage() {
  const [items, setItems] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ServiceType | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<ServiceType>>({});
  const [vatSettings, setVatSettings] = useState<Array<{ id: number; name: string; rate: number | null; fixedAmount: number | null }>>([]);
  const [editingRate, setEditingRate] = useState<number | null>(null);
  const [rateValue, setRateValue] = useState('');

  useEffect(() => {
    load();
    api.get('/admin/tax-rules?category=VAT_SPECIAL').then(r => setVatSettings(r.data)).catch(() => {});
  }, []);

  async function load() {
    try { const { data } = await api.get('/admin/digital-service-types'); setItems(data); }
    catch { toast.error('Failed to load'); }
    setLoading(false);
  }

  function startEdit(item: ServiceType) { setEditing(item); setForm({ ...item }); setCreating(false); }
  function startCreate() { setCreating(true); setEditing(null); setForm({ isActive: true }); }
  function cancel() { setEditing(null); setCreating(false); setForm({}); }

  async function save() {
    try {
      if (creating) { await api.post('/admin/digital-service-types', form); toast.success('Created'); }
      else if (editing) { await api.put(`/admin/digital-service-types/${editing.id}`, form); toast.success('Updated'); }
      cancel(); load();
    } catch { toast.error('Save failed'); }
  }

  async function remove(id: number) {
    if (!confirm('Delete?')) return;
    try { await api.delete(`/admin/digital-service-types/${id}`); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  }

  async function saveRate(id: number) {
    try { await api.put(`/admin/tax-rules/${id}`, { fixedAmount: Number(rateValue) }); toast.success('Updated'); setEditingRate(null); }
    catch { toast.error('Save failed'); }
  }

  const digitalRate = vatSettings.find(s => s.name?.includes('Digital marketplace tax rate'));
  const digitalDay = vatSettings.find(s => s.name?.includes('Digital marketplace filing day'));

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Digital Services Manager</h1>
            <p className="text-gray-500 text-sm">S.116 ITA / S.51 VAT Act — manage electronic service types and tax settings</p>
          </div>
          <button onClick={startCreate} className="btn-primary flex items-center gap-2"><Plus size={16} />Add Service</button>
        </div>

        {/* Rate settings */}
        <div className="card mb-6">
          <h2 className="font-semibold mb-4">Digital Marketplace Tax Settings</h2>
          <div className="grid grid-cols-2 gap-4">
            {digitalRate && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Tax Rate (S.116 ITA)</p>
                {editingRate === digitalRate.id ? (
                  <div className="flex gap-2 items-center">
                    <input type="number" step="0.01" className="input-field flex-1 py-1" value={rateValue} onChange={e => setRateValue(e.target.value)} />
                    <button onClick={() => saveRate(digitalRate.id)} className="text-green-600"><Save size={14} /></button>
                    <button onClick={() => setEditingRate(null)} className="text-gray-400"><X size={14} /></button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-brand-700">{((digitalRate.rate ?? 0.02) * 100).toFixed(0)}%</p>
                    <button onClick={() => { setEditingRate(digitalRate.id); setRateValue(String((digitalRate.rate ?? 0.02) * 100)); }} className="text-gray-400 hover:text-brand-600"><Pencil size={14} /></button>
                  </div>
                )}
              </div>
            )}
            {digitalDay && (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Filing Deadline Day</p>
                {editingRate === digitalDay.id ? (
                  <div className="flex gap-2 items-center">
                    <input type="number" className="input-field flex-1 py-1" value={rateValue} onChange={e => setRateValue(e.target.value)} />
                    <button onClick={() => saveRate(digitalDay.id)} className="text-green-600"><Save size={14} /></button>
                    <button onClick={() => setEditingRate(null)} className="text-gray-400"><X size={14} /></button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold text-brand-700">{digitalDay.fixedAmount ?? 20}th</p>
                    <button onClick={() => { setEditingRate(digitalDay.id); setRateValue(String(digitalDay.fixedAmount ?? 20)); }} className="text-gray-400 hover:text-brand-600"><Pencil size={14} /></button>
                  </div>
                )}
                <p className="text-xs text-gray-400">of the following month</p>
              </div>
            )}
          </div>
        </div>

        {(creating || editing) && (
          <div className="card mb-6 space-y-4">
            <h2 className="font-semibold">{creating ? 'New Service Type' : 'Edit Service Type'}</h2>
            <div>
              <label className="label">Service Name</label>
              <input className="input-field" value={form.name ?? ''} onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input-field h-16" value={form.description ?? ''} onChange={e => setForm({...form, description: e.target.value})} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isActive ?? true} onChange={e => setForm({...form, isActive: e.target.checked})} className="w-4 h-4" /> Active
            </label>
            <div className="flex gap-3">
              <button onClick={save} className="btn-primary flex items-center gap-2"><Save size={14} />Save</button>
              <button onClick={cancel} className="btn-secondary flex items-center gap-2"><X size={14} />Cancel</button>
            </div>
          </div>
        )}

        {loading ? <div className="text-center py-12 text-gray-400">Loading...</div> : (
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.id} className={`bg-white rounded-xl border border-gray-100 shadow-sm p-4 ${!item.isActive ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{item.name}</p>
                    {item.description && <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>}
                  </div>
                  <div className="flex gap-1 ml-4">
                    <button onClick={() => startEdit(item)} className="p-2 text-gray-400 hover:text-brand-600 rounded-lg"><Pencil size={15} /></button>
                    <button onClick={() => remove(item.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg"><Trash2 size={15} /></button>
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
