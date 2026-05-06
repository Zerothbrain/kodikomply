'use client';
import { useState } from 'react';
import Navbar from '../../../components/ui/Navbar';
import Footer from '../../../components/ui/Footer';
import ResultCard from '../../../components/ui/ResultCard';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

const PAYMENT_TYPES = [
  'Professional services', 'Goods supplied', 'Rent', 'Dividends', 'Interest',
  'Money transfer commission', 'Insurance premium', 'Director fees', 'Construction works',
];

export default function WithholdingCalculator() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState({
    paymentType: 'Professional services',
    recipientType: 'RESIDENT',
    grossAmount: '',
    vatAmount: '',
    isRent: false,
    totalRentAnnual: '',
    isConstruction: false,
    materialsAmount: '',
    servicesAmount: '',
  });

  function set(k: string, v: unknown) { setForm(f => ({ ...f, [k]: v })); }
  const n = (v: string) => Number(v) || 0;

  async function calculate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/calculator/withholding', {
        paymentType: form.paymentType,
        recipientType: form.recipientType,
        grossAmount: n(form.grossAmount),
        vatAmount: n(form.vatAmount),
        isRent: form.paymentType === 'Rent',
        totalRentAnnual: n(form.totalRentAnnual),
        isConstruction: form.paymentType === 'Construction works',
        materialsAmount: n(form.materialsAmount) || undefined,
        servicesAmount: n(form.servicesAmount) || undefined,
      });
      setResult(res.data);
    } catch {
      toast.error('Withholding tax calculation failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Withholding Tax Calculator</h1>
          <p className="text-gray-500 text-sm mt-1">Calculate WHT on payments to residents and non-residents — exclusive of VAT</p>
        </div>

        <div className="card mb-6">
          <form onSubmit={calculate} className="space-y-4">
            <div>
              <label className="label">Payment type</label>
              <select className="input-field" value={form.paymentType} onChange={e => set('paymentType', e.target.value)}>
                {PAYMENT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Recipient type</label>
              <div className="flex gap-4">
                {['RESIDENT', 'NON_RESIDENT'].map(t => (
                  <button key={t} type="button" onClick={() => set('recipientType', t)}
                    className={`flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${form.recipientType === t ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200'}`}>
                    {t === 'RESIDENT' ? '🇹🇿 Resident' : '🌍 Non-Resident'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Gross payment amount (TZS)</label>
                <input type="number" className="input-field" value={form.grossAmount} onChange={e => set('grossAmount', e.target.value)} required />
              </div>
              <div>
                <label className="label">VAT component (if any) (TZS)</label>
                <input type="number" className="input-field" placeholder="0" value={form.vatAmount} onChange={e => set('vatAmount', e.target.value)} />
                <p className="text-xs text-gray-500 mt-1">WHT is calculated exclusive of VAT</p>
              </div>
            </div>

            {form.paymentType === 'Rent' && (
              <div>
                <label className="label">Total annual rent from this landlord (TZS)</label>
                <input type="number" className="input-field" value={form.totalRentAnnual} onChange={e => set('totalRentAnnual', e.target.value)} />
                <p className="text-xs text-gray-500 mt-1">If total annual rent ≤ TZS 500,000 and not in business, exempt from WHT</p>
              </div>
            )}

            {form.paymentType === 'Construction works' && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl space-y-3">
                <p className="text-sm font-medium text-yellow-800">Construction WHT Split (Materials 2%, Services 5%)</p>
                <p className="text-xs text-yellow-700">If materials and services are not separated, the full amount is taxed at 5%. Optionally separate below:</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Materials amount (TZS) — optional</label>
                    <input type="number" className="input-field" placeholder="Auto: 3/5 of total" value={form.materialsAmount} onChange={e => set('materialsAmount', e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Services amount (TZS) — optional</label>
                    <input type="number" className="input-field" placeholder="Auto: 2/5 of total" value={form.servicesAmount} onChange={e => set('servicesAmount', e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            <button type="submit" disabled={loading || !form.grossAmount} className="btn-primary w-full">
              {loading ? 'Calculating...' : '🧮 Calculate WHT'}
            </button>
          </form>
        </div>

        {result && (
          <div>
            <ResultCard
              title="Withholding Tax Results"
              calculationType="withholding"
              summaryItems={[
                { label: 'WHT Base (excl. VAT)', value: result.whtBase as number },
                { label: 'WHT Rate', value: `${((result.rate as number) * 100).toFixed(0)}%` },
                { label: 'WHT Amount', value: result.whtAmount as number, highlight: true },
                { label: 'Tax Type', value: result.isFinal ? 'FINAL (no further tax)' : 'Non-final (offset against annual)' },
              ]}
              breakdown={result.breakdown as Parameters<typeof ResultCard>[0]['breakdown']}
              explanation={result.explanation as string}
            />
            <button onClick={() => setResult(null)} className="mt-4 btn-secondary w-full">New Calculation</button>
          </div>
        )}

        <div className="card mt-6 bg-brand-50 border-brand-100">
          <h3 className="font-semibold text-brand-700 mb-3">WHT Quick Reference</h3>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
            {[
              ['Professional services (resident)', '5% — non-final'],
              ['Professional services (non-resident)', '15% — final'],
              ['Goods supplied (resident corp.)', '2% — non-final'],
              ['Rent (resident individual)', '10% — final'],
              ['Dividends (resident corp.)', '5% — final'],
              ['Interest (financial institution)', '10% — final'],
              ['Construction — materials', '2%'],
              ['Construction — services', '5%'],
              ['Insurance premium (non-resident)', '5% — final'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-1 border-b border-brand-100">
                <span>{k}</span><span className="font-semibold text-brand-700">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
