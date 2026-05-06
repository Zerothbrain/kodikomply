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

interface TaxRule {
  id: number; category: string; name: string; minValue: string | null; maxValue: string | null;
  rate: string | null; fixedAmount: string | null; valueType: string;
  effectiveFrom: string; effectiveTo: string | null; isActive: boolean; notes: string | null;
}

const CATEGORIES = ['PAYE_BAND', 'PRESUMPTIVE', 'VAT', 'CORPORATE', 'SDL', 'WHT', 'DEPRECIATION', 'INSTALLMENT', 'PENALTY', 'INTEREST_RATE', 'CURRENCY_POINT'];

const emptyRule: Omit<TaxRule, 'id'> = {
  category: 'PAYE_BAND', name: '', minValue: null, maxValue: null, rate: null,
  fixedAmount: null, valueType: 'BRACKET', effectiveFrom: '2024-01-01', effectiveTo: null,
  isActive: true, notes: null,
};

export default function TaxRulesPage() {
  const router = useRouter();
  const [rules, setRules] = useState<TaxRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<Omit<TaxRule, 'id'>>(emptyRule);

  useEffect(() => {
    if (!isLoggedIn() || !isAdmin()) { router.push('/auth/login'); return; }
    loadRules();
  }, [router]);

  async function loadRules() {
    setLoading(true);
    try {
      const res = await api.get('/admin/tax-rules');
      setRules(res.data);
    } catch { toast.error('Failed to load tax rules'); }
    finally { setLoading(false); }
  }

  function set(k: string, v: unknown) { setForm(f => ({ ...f, [k]: v })); }

  async function save() {
    try {
      const payload = { ...form, minValue: form.minValue ? Number(form.minValue) : null, maxValue: form.maxValue ? Number(form.maxValue) : null, rate: form.rate ? Number(form.rate) : null, fixedAmount: form.fixedAmount ? Number(form.fixedAmount) : null };
      if (editId) { await api.put(`/admin/tax-rules/${editId}`, payload); toast.success('Rule updated'); }
      else { await api.post('/admin/tax-rules', payload); toast.success('Rule created'); }
      setShowForm(false); setEditId(null); setForm(emptyRule);
      loadRules();
    } catch { toast.error('Failed to save tax rule'); }
  }

  async function deleteRule(id: number) {
    if (!confirm('Delete this tax rule?')) return;
    try { await api.delete(`/admin/tax-rules/${id}`); toast.success('Rule deleted'); loadRules(); }
    catch { toast.error('Failed to delete rule'); }
  }

  function startEdit(rule: TaxRule) {
    setEditId(rule.id);
    setForm({ ...rule, effectiveFrom: rule.effectiveFrom.split('T')[0], effectiveTo: rule.effectiveTo?.split('T')[0] ?? null });
    setShowForm(true);
  }

  const filtered = filterCat ? rules.filter(r => r.category === filterCat) : rules;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="text-gray-500 hover:text-brand-600"><ArrowLeft size={20} /></Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tax Rules Manager</h1>
            <p className="text-gray-500 text-sm">PAYE bands, SDL, VAT, depreciation, interest rates — all editable</p>
          </div>
        </div>

        <div className="flex gap-3 mb-4 flex-wrap">
          <select className="input-field w-auto" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
            <option value="">All categories</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm(emptyRule); }} className="btn-primary flex items-center gap-2">
            <Plus size={16} />Add Rule
          </button>
        </div>

        {showForm && (
          <div className="card mb-4 border-brand-200 bg-brand-50">
            <h3 className="font-bold text-brand-800 mb-4">{editId ? 'Edit Rule' : 'New Tax Rule'}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div><label className="label">Category</label><select className="input-field" value={form.category} onChange={e => set('category', e.target.value)}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
              <div><label className="label">Name</label><input className="input-field" value={form.name} onChange={e => set('name', e.target.value)} /></div>
              <div><label className="label">Value Type</label><select className="input-field" value={form.valueType} onChange={e => set('valueType', e.target.value)}>{['PERCENTAGE', 'FIXED', 'BRACKET'].map(t => <option key={t}>{t}</option>)}</select></div>
              <div><label className="label">Min Value</label><input type="number" className="input-field" value={form.minValue ?? ''} onChange={e => set('minValue', e.target.value || null)} /></div>
              <div><label className="label">Max Value</label><input type="number" className="input-field" placeholder="Leave blank = no limit" value={form.maxValue ?? ''} onChange={e => set('maxValue', e.target.value || null)} /></div>
              <div><label className="label">Rate (decimal, e.g. 0.09 = 9%)</label><input type="number" step="0.000001" className="input-field" value={form.rate ?? ''} onChange={e => set('rate', e.target.value || null)} /></div>
              <div><label className="label">Fixed Amount</label><input type="number" className="input-field" value={form.fixedAmount ?? ''} onChange={e => set('fixedAmount', e.target.value || null)} /></div>
              <div><label className="label">Effective From</label><input type="date" className="input-field" value={form.effectiveFrom} onChange={e => set('effectiveFrom', e.target.value)} /></div>
              <div><label className="label">Effective To</label><input type="date" className="input-field" value={form.effectiveTo ?? ''} onChange={e => set('effectiveTo', e.target.value || null)} /></div>
              <div className="col-span-2"><label className="label">Notes</label><input className="input-field" value={form.notes ?? ''} onChange={e => set('notes', e.target.value || null)} /></div>
              <div className="flex items-center gap-2"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} className="w-4 h-4" /><span className="text-sm font-medium">Active</span></label></div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={save} className="btn-primary flex items-center gap-2"><Check size={16} />Save</button>
              <button onClick={() => { setShowForm(false); setEditId(null); }} className="btn-secondary flex items-center gap-2"><X size={16} />Cancel</button>
            </div>
          </div>
        )}

        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-brand-50 border-b border-brand-100">
                <tr>
                  {['Category', 'Name', 'Min', 'Max', 'Rate', 'Fixed Amt', 'Type', 'Active', 'Effective From', 'Actions'].map(h => (
                    <th key={h} className="text-left py-3 px-4 font-semibold text-brand-700">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={10} className="py-8 text-center text-gray-500">Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={10} className="py-8 text-center text-gray-500">No rules found</td></tr>
                ) : filtered.map(rule => (
                  <tr key={rule.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4"><span className="text-xs font-mono bg-gray-100 rounded px-1.5 py-0.5">{rule.category}</span></td>
                    <td className="py-3 px-4 font-medium">{rule.name}</td>
                    <td className="py-3 px-4 font-mono text-xs">{rule.minValue ? Number(rule.minValue).toLocaleString() : '—'}</td>
                    <td className="py-3 px-4 font-mono text-xs">{rule.maxValue ? Number(rule.maxValue).toLocaleString() : '∞'}</td>
                    <td className="py-3 px-4 font-mono text-xs">{rule.rate ? `${(Number(rule.rate) * 100).toFixed(2)}%` : '—'}</td>
                    <td className="py-3 px-4 font-mono text-xs">{rule.fixedAmount ? Number(rule.fixedAmount).toLocaleString() : '—'}</td>
                    <td className="py-3 px-4 text-xs">{rule.valueType}</td>
                    <td className="py-3 px-4">{rule.isActive ? <span className="badge-green">Active</span> : <span className="badge-red">Inactive</span>}</td>
                    <td className="py-3 px-4 text-xs">{rule.effectiveFrom?.split('T')[0]}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button onClick={() => startEdit(rule)} className="text-blue-500 hover:text-blue-700"><Pencil size={14} /></button>
                        <button onClick={() => deleteRule(rule.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
