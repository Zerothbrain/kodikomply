'use client';
import { useState } from 'react';
import Navbar from '../../../components/ui/Navbar';
import Footer from '../../../components/ui/Footer';
import ResultCard from '../../../components/ui/ResultCard';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

export default function InvestmentCalculator() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState({
    dividendAmount: '', dividendFromResident: true,
    interest: '', rent: '', royalties: '',
    lifeInsuranceProceeds: '', lifeInsurancePremiums: '', lifeInsuranceResident: true,
  });
  const [assets, setAssets] = useState<Array<{
    description: string; proceeds: number; costBase: number;
    isPrivateResidence: boolean; yearsOwned: number; yearsLivedIn: number;
    isAgriculturalLand: boolean; marketValue: number;
    isDSEShares: boolean; ownershipPct: number;
  }>>([]);

  const n = (v: string) => Number(v) || 0;
  function set(k: string, v: unknown) { setForm(f => ({ ...f, [k]: v })); }
  function addAsset() { setAssets(a => [...a, { description: '', proceeds: 0, costBase: 0, isPrivateResidence: false, yearsOwned: 0, yearsLivedIn: 0, isAgriculturalLand: false, marketValue: 0, isDSEShares: false, ownershipPct: 0 }]); }
  function updateAsset(i: number, k: string, v: unknown) { setAssets(a => a.map((item, idx) => idx === i ? { ...item, [k]: v } : item)); }

  async function calculate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/calculator/investment', {
        dividends: n(form.dividendAmount) ? { amount: n(form.dividendAmount), fromResidentCorp: form.dividendFromResident } : undefined,
        interest: n(form.interest) || undefined,
        rent: n(form.rent) || undefined,
        royalties: n(form.royalties) || undefined,
        lifeInsuranceProceeds: n(form.lifeInsuranceProceeds) || undefined,
        lifeInsurancePremiumsPaid: n(form.lifeInsurancePremiums) || undefined,
        lifeInsuranceFromResidentInsurer: form.lifeInsuranceResident,
        assetGains: assets.filter(a => a.proceeds > a.costBase).map(a => ({
          description: a.description,
          proceedsAmount: a.proceeds,
          costBase: a.costBase,
          isPrivateResidence: a.isPrivateResidence,
          yearsOwned: a.yearsOwned,
          yearsLivedIn: a.yearsLivedIn,
          isAgriculturalLand: a.isAgriculturalLand,
          marketValueOfLand: a.marketValue,
          isDSEShares: a.isDSEShares,
          ownershipPercentage: a.ownershipPct,
        })),
      });
      setResult(res.data);
    } catch {
      toast.error('Investment calculation failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Investment Income Calculator</h1>
          <p className="text-gray-500 text-sm mt-1">Dividends, interest, rent, royalties, life insurance, and capital gains</p>
        </div>

        <form onSubmit={calculate} className="space-y-4">
          <div className="card">
            <h2 className="font-bold text-gray-800 mb-4">Dividend Income</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Dividend amount (TZS)</label><input type="number" className="input-field" value={form.dividendAmount} onChange={e => set('dividendAmount', e.target.value)} /></div>
              <div>
                <label className="label">From resident corporation?</label>
                <div className="flex gap-3 mt-1">
                  {[true, false].map(v => (
                    <button key={String(v)} type="button" onClick={() => set('dividendFromResident', v)}
                      className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-all ${form.dividendFromResident === v ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200'}`}>
                      {v ? 'Yes' : 'No'}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">{form.dividendFromResident ? 'Final WHT at source — not included in your income' : 'Included in your taxable income'}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="font-bold text-gray-800 mb-4">Other Investment Income</h2>
            <div className="grid grid-cols-2 gap-4">
              {[['interest', 'Interest income (TZS)'], ['rent', 'Rental income (TZS)'], ['royalties', 'Royalties (TZS)']].map(([k, label]) => (
                <div key={k}><label className="label">{label}</label><input type="number" className="input-field" value={form[k as keyof typeof form] as string} onChange={e => set(k, e.target.value)} /></div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="font-bold text-gray-800 mb-4">Life Insurance</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Proceeds received (TZS)</label><input type="number" className="input-field" value={form.lifeInsuranceProceeds} onChange={e => set('lifeInsuranceProceeds', e.target.value)} /></div>
              <div><label className="label">Total premiums paid (TZS)</label><input type="number" className="input-field" value={form.lifeInsurancePremiums} onChange={e => set('lifeInsurancePremiums', e.target.value)} /></div>
            </div>
            <div className="mt-3">
              <label className="label">Insurer is Tanzania resident?</label>
              <div className="flex gap-3 mt-1">
                {[true, false].map(v => (
                  <button key={String(v)} type="button" onClick={() => set('lifeInsuranceResident', v)}
                    className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium ${form.lifeInsuranceResident === v ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200'}`}>
                    {v ? 'Yes — resident insurer (exempt)' : 'No — non-resident (taxable gain)'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800">Capital Assets</h2>
              <button type="button" onClick={addAsset} className="text-brand-600 text-sm font-medium">+ Add asset</button>
            </div>
            {assets.map((a, i) => (
              <div key={i} className="p-4 border border-gray-200 rounded-xl mb-4 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-3"><label className="label">Description</label><input type="text" className="input-field" placeholder="e.g. Land plot Kariakoo" value={a.description} onChange={e => updateAsset(i, 'description', e.target.value)} /></div>
                  <div><label className="label">Sale proceeds (TZS)</label><input type="number" className="input-field" value={a.proceeds || ''} onChange={e => updateAsset(i, 'proceeds', Number(e.target.value))} /></div>
                  <div><label className="label">Cost base (TZS)</label><input type="number" className="input-field" value={a.costBase || ''} onChange={e => updateAsset(i, 'costBase', Number(e.target.value))} /></div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {[['isPrivateResidence', 'Private residence'], ['isAgriculturalLand', 'Agri. land'], ['isDSEShares', 'DSE shares']].map(([k, label]) => (
                      <label key={k} className="flex items-center gap-1 text-xs">
                        <input type="checkbox" checked={a[k as keyof typeof a] as boolean} onChange={e => updateAsset(i, k, e.target.checked)} />{label}
                      </label>
                    ))}
                  </div>
                </div>
                {a.isPrivateResidence && (
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="label">Years owned</label><input type="number" className="input-field" value={a.yearsOwned || ''} onChange={e => updateAsset(i, 'yearsOwned', Number(e.target.value))} /></div>
                    <div><label className="label">Years lived in</label><input type="number" className="input-field" value={a.yearsLivedIn || ''} onChange={e => updateAsset(i, 'yearsLivedIn', Number(e.target.value))} /></div>
                  </div>
                )}
                {a.isDSEShares && (
                  <div><label className="label">Your ownership % of company</label><input type="number" className="input-field" value={a.ownershipPct || ''} onChange={e => updateAsset(i, 'ownershipPct', Number(e.target.value))} /></div>
                )}
              </div>
            ))}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Calculating...' : '🧮 Calculate Investment Tax'}
          </button>
        </form>

        {result && (
          <div className="mt-6">
            <ResultCard
              title="Investment Income Tax Results"
              calculationType="investment"
              summaryItems={[
                { label: 'Total Investment Income', value: result.totalIncome as number },
                { label: 'Taxable Income', value: result.taxableIncome as number, highlight: true },
                { label: 'Exempt Income', value: result.exemptIncome as number },
                { label: 'Income via Final WHT', value: result.finalWHTIncome as number },
              ]}
              breakdown={result.breakdown as Parameters<typeof ResultCard>[0]['breakdown']}
              explanation={result.explanation as string}
            />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
