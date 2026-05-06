'use client';
import { useState } from 'react';
import Navbar from '../../../components/ui/Navbar';
import Footer from '../../../components/ui/Footer';
import WizardProgress from '../../../components/ui/WizardProgress';
import ResultCard from '../../../components/ui/ResultCard';
import { formatTZS } from '../../../lib/format';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

const TOTAL_STEPS = 10;

export default function BusinessCalculator() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const [businessType, setBusinessType] = useState('sole_proprietor');
  const [turnover, setTurnover] = useState('');
  const [isAgriculture, setIsAgriculture] = useState(false);
  const [serviceRevenue, setServiceRevenue] = useState('');
  const [tradingStockSales, setTradingStockSales] = useState('');
  const [openingStock, setOpeningStock] = useState('');
  const [purchases, setPurchases] = useState('');
  const [closingStock, setClosingStock] = useState('');
  const [expenses, setExpenses] = useState({
    rent: '', salaries: '', utilities: '', interest: '', repairs: '',
    rdExpenditure: '', retirementContributions: '', otherAllowable: '',
  });
  const [teaDonations, setTeaDonations] = useState('');
  const [otherDonations, setOtherDonations] = useState('');
  const [hasBadDebts, setHasBadDebts] = useState(false);
  const [badDebts, setBadDebts] = useState('');
  const [isAccrualBasis, setIsAccrualBasis] = useState(true);
  const [depreciableAssets, setDepreciableAssets] = useState<Array<{ class: string; openingBalance: number; additions: number; disposalProceeds: number }>>([]);

  const n = (v: string) => Number(v) || 0;
  function setExp(k: string, v: string) { setExpenses(e => ({ ...e, [k]: v })); }

  function addAsset() { setDepreciableAssets(a => [...a, { class: '3', openingBalance: 0, additions: 0, disposalProceeds: 0 }]); }
  function updateAsset(i: number, k: string, v: unknown) { setDepreciableAssets(a => a.map((item, idx) => idx === i ? { ...item, [k]: v } : item)); }
  function removeAsset(i: number) { setDepreciableAssets(a => a.filter((_, idx) => idx !== i)); }

  async function calculate() {
    setLoading(true);
    try {
      const res = await api.post('/calculator/business', {
        businessType,
        annualTurnover: n(turnover),
        isAgriculture,
        serviceRevenue: n(serviceRevenue),
        tradingStockSales: n(tradingStockSales),
        openingStock: n(openingStock),
        purchases: n(purchases),
        closingStock: n(closingStock),
        expenses: Object.fromEntries(Object.entries(expenses).map(([k, v]) => [k, n(v) || undefined])),
        donations: { teaDonations: n(teaDonations), otherDonations: n(otherDonations) },
        badDebts: hasBadDebts ? n(badDebts) : 0,
        isAccrualBasis,
        depreciableAssets: depreciableAssets.map(a => ({ ...a, class: Number(a.class) || a.class })),
      });
      setResult(res.data);
      setStep(TOTAL_STEPS);
    } catch {
      toast.error('Business tax calculation failed.');
    } finally {
      setLoading(false);
    }
  }

  function next() { if (step < TOTAL_STEPS - 1) setStep(s => s + 1); else calculate(); }
  function back() { if (step > 1) setStep(s => s - 1); }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Business Income Tax Calculator</h1>
          <p className="text-gray-500 text-sm mt-1">Sole proprietors, partnerships, limited companies, and NGOs</p>
        </div>

        {step < TOTAL_STEPS && n(turnover) > 0 && (
          <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 mb-6">
            <p className="text-xs text-gray-500">Annual turnover</p>
            <p className="font-bold text-brand-700">{formatTZS(n(turnover))}</p>
            {isAgriculture && n(turnover) < 3_000_000 && businessType === 'sole_proprietor' && (
              <p className="text-xs text-green-600 mt-1">✅ Subsistence farming exemption may apply</p>
            )}
          </div>
        )}

        <WizardProgress currentStep={step} totalSteps={TOTAL_STEPS} />

        {step < TOTAL_STEPS && (
          <div className="card space-y-4">
            {step === 1 && (
              <div>
                <h2 className="text-lg font-bold mb-4">What type of business do you have?</h2>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { v: 'sole_proprietor', label: 'Sole Proprietor', emoji: '👤' },
                    { v: 'partnership', label: 'Partnership', emoji: '🤝' },
                    { v: 'limited_company', label: 'Limited Company', emoji: '🏢' },
                    { v: 'ngo', label: 'NGO / Non-Profit', emoji: '🏥' },
                  ].map(({ v, label, emoji }) => (
                    <button key={v} onClick={() => setBusinessType(v)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${businessType === v ? 'border-brand-600 bg-brand-50' : 'border-gray-200 hover:border-brand-300'}`}>
                      <span className="text-2xl">{emoji}</span>
                      <p className="font-semibold text-sm mt-1">{label}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="text-lg font-bold mb-4">What is your annual turnover?</h2>
                <div>
                  <label className="label">Annual turnover (gross receipts) (TZS)</label>
                  <input type="number" className="input-field text-lg" placeholder="e.g. 50000000" value={turnover} onChange={e => setTurnover(e.target.value)} />
                </div>
                <div className="mt-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={isAgriculture} onChange={e => setIsAgriculture(e.target.checked)} className="w-5 h-5" />
                    <div>
                      <p className="font-medium">This is a farming/agricultural business</p>
                      <p className="text-xs text-gray-500">Individual subsistence farmers with turnover &lt; TZS 3M are fully exempt</p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="text-lg font-bold mb-4">What is your gross income breakdown?</h2>
                <div className="space-y-4">
                  <div>
                    <label className="label">Service revenue / professional fees (TZS)</label>
                    <input type="number" className="input-field" placeholder="0" value={serviceRevenue} onChange={e => setServiceRevenue(e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Trading stock sales (TZS)</label>
                    <input type="number" className="input-field" placeholder="0" value={tradingStockSales} onChange={e => setTradingStockSales(e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <h2 className="text-lg font-bold mb-2">Do you have trading stock?</h2>
                <p className="text-gray-500 text-sm mb-4">Trading stock allowance = Opening stock + Purchases − Closing stock. Valued at lower of cost or net realisable value.</p>
                <div className="space-y-4">
                  <div><label className="label">Opening stock (TZS)</label><input type="number" className="input-field" value={openingStock} onChange={e => setOpeningStock(e.target.value)} /></div>
                  <div><label className="label">Purchases during year (TZS)</label><input type="number" className="input-field" value={purchases} onChange={e => setPurchases(e.target.value)} /></div>
                  <div><label className="label">Closing stock (TZS)</label><input type="number" className="input-field" value={closingStock} onChange={e => setClosingStock(e.target.value)} /></div>
                  {(n(openingStock) + n(purchases) - n(closingStock)) > 0 && (
                    <p className="text-brand-600 font-medium">Trading stock allowance: {formatTZS(n(openingStock) + n(purchases) - n(closingStock))}</p>
                  )}
                </div>
              </div>
            )}

            {step === 5 && (
              <div>
                <h2 className="text-lg font-bold mb-4">Enter your main expenses</h2>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    ['rent', 'Rent (TZS/year)'],
                    ['salaries', 'Salaries & wages (TZS)'],
                    ['utilities', 'Utilities (TZS)'],
                    ['interest', 'Interest expense (TZS)'],
                    ['repairs', 'Repairs & maintenance (TZS)'],
                    ['rdExpenditure', 'R&D expenditure (TZS)'],
                    ['retirementContributions', 'Retirement contributions (TZS)'],
                    ['otherAllowable', 'Other allowable expenses (TZS)'],
                  ].map(([k, label]) => (
                    <div key={k}>
                      <label className="label">{label}</label>
                      <input type="number" className="input-field" placeholder="0" value={expenses[k as keyof typeof expenses]} onChange={e => setExp(k, e.target.value)} />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-3">Only expenses wholly and exclusively in production of income are deductible. Repairs = restoration only, not improvement.</p>
              </div>
            )}

            {step === 6 && (
              <div>
                <h2 className="text-lg font-bold mb-4">Did you make any donations?</h2>
                <div className="space-y-4">
                  <div>
                    <label className="label">Donations to TEA Education Fund (TZS) — FULLY deductible</label>
                    <input type="number" className="input-field" placeholder="0" value={teaDonations} onChange={e => setTeaDonations(e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Other donations (TZS) — capped at 2% of business income</label>
                    <input type="number" className="input-field" placeholder="0" value={otherDonations} onChange={e => setOtherDonations(e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {step === 7 && (
              <div>
                <h2 className="text-lg font-bold mb-4">Did you write off any bad debts?</h2>
                <div className="flex gap-4 mb-4">
                  {[true, false].map(v => (
                    <button key={String(v)} onClick={() => setHasBadDebts(v)}
                      className={`flex-1 py-3 rounded-xl border-2 font-semibold transition-all ${hasBadDebts === v ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200'}`}>
                      {v ? 'Yes — I have bad debts' : 'No bad debts'}
                    </button>
                  ))}
                </div>
                {hasBadDebts && (
                  <div className="space-y-3">
                    <div>
                      <label className="label">Bad debts amount (TZS)</label>
                      <input type="number" className="input-field" value={badDebts} onChange={e => setBadDebts(e.target.value)} />
                    </div>
                    <div>
                      <label className="label">Accounting basis</label>
                      <div className="flex gap-4">
                        {[true, false].map(v => (
                          <button key={String(v)} onClick={() => setIsAccrualBasis(v)}
                            className={`flex-1 py-3 rounded-xl border-2 text-sm transition-all ${isAccrualBasis === v ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200'}`}>
                            {v ? '📊 Accrual basis' : '💰 Cash basis'}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Only accrual basis taxpayers can claim bad debts — after all reasonable recovery steps have been taken.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 8 && (
              <div>
                <h2 className="text-lg font-bold mb-2">Do you have depreciable assets?</h2>
                <p className="text-gray-500 text-sm mb-4">Tanzania uses pool-based reducing balance depreciation. Rates: Class 1 (computers) 33.3%, Class 2 (vehicles) 25%, Class 3 (plant) 12.5%, Class 4 (buildings) 5%, Agriculture 100%.</p>
                <div className="space-y-3">
                  {depreciableAssets.map((a, i) => (
                    <div key={i} className="p-4 border border-gray-200 rounded-xl space-y-3">
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="label">Asset class</label>
                          <select className="input-field" value={a.class} onChange={e => updateAsset(i, 'class', e.target.value)}>
                            {[['1', 'Class 1 — Computers (33.3%)'], ['2', 'Class 2 — Vehicles (25%)'], ['3', 'Class 3 — Plant/Machinery (12.5%)'], ['4', 'Class 4 — Buildings (5%)'], ['agriculture', 'Agriculture (100%)']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                          </select>
                        </div>
                        <button onClick={() => removeAsset(i)} className="self-end mb-1 text-red-400 text-xs hover:text-red-600">Remove</button>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div><label className="label">Opening balance (TZS)</label><input type="number" className="input-field" value={a.openingBalance || ''} onChange={e => updateAsset(i, 'openingBalance', Number(e.target.value))} /></div>
                        <div><label className="label">Additions this year (TZS)</label><input type="number" className="input-field" value={a.additions || ''} onChange={e => updateAsset(i, 'additions', Number(e.target.value))} /></div>
                        <div><label className="label">Disposal proceeds (TZS)</label><input type="number" className="input-field" value={a.disposalProceeds || ''} onChange={e => updateAsset(i, 'disposalProceeds', Number(e.target.value))} /></div>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={addAsset} className="mt-3 text-brand-600 text-sm font-medium hover:text-brand-700">+ Add asset class</button>
              </div>
            )}

            {step === 9 && (
              <div>
                <h2 className="text-lg font-bold mb-4">Review and Calculate</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b"><span>Business type</span><strong className="capitalize">{businessType.replace('_', ' ')}</strong></div>
                  <div className="flex justify-between py-2 border-b"><span>Annual turnover</span><strong>{formatTZS(n(turnover))}</strong></div>
                  <div className="flex justify-between py-2 border-b"><span>Service revenue</span><strong>{formatTZS(n(serviceRevenue))}</strong></div>
                  <div className="flex justify-between py-2 border-b"><span>Trading stock sales</span><strong>{formatTZS(n(tradingStockSales))}</strong></div>
                  <div className="flex justify-between py-2 border-b"><span>Total expenses entered</span><strong>{formatTZS(Object.values(expenses).reduce((s, v) => s + n(v), 0))}</strong></div>
                  <div className="flex justify-between py-2"><span>Depreciable asset classes</span><strong>{depreciableAssets.length}</strong></div>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
              <button onClick={back} disabled={step === 1} className="btn-secondary disabled:opacity-50">← Back</button>
              <button onClick={next} disabled={loading} className="btn-primary">
                {loading ? 'Calculating...' : step === TOTAL_STEPS - 1 ? '🧮 Calculate Tax →' : 'Continue →'}
              </button>
            </div>
          </div>
        )}

        {step === TOTAL_STEPS && result && (
          <div>
            {!!result.isSubsistenceFarmerExempt && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                <p className="font-bold text-green-700">✅ Subsistence Farming Exemption Applies</p>
                <p className="text-green-600 text-sm mt-1">{String(result.explanation ?? '')}</p>
              </div>
            )}
            <ResultCard
              title="Business Income Tax Results"
              calculationType="business"
              summaryItems={[
                { label: 'Gross Income', value: result.grossIncome as number },
                { label: 'Total Deductions', value: result.totalDeductions as number },
                { label: 'Taxable Income', value: result.taxableIncome as number },
                { label: 'Tax Payable', value: result.taxPayable as number, highlight: true },
              ]}
              breakdown={result.breakdown as Parameters<typeof ResultCard>[0]['breakdown']}
              explanation={result.explanation as string}
            />
            <button onClick={() => { setStep(1); setResult(null); }} className="mt-4 btn-secondary w-full">Start New Calculation</button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
