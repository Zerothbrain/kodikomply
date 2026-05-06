'use client';
import { useState } from 'react';
import Navbar from '../../../components/ui/Navbar';
import Footer from '../../../components/ui/Footer';
import WizardProgress from '../../../components/ui/WizardProgress';
import ResultCard from '../../../components/ui/ResultCard';
import { formatTZS } from '../../../lib/format';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

const TOTAL_STEPS = 7;

export default function VATCalculator() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const [annualTurnover, setAnnualTurnover] = useState('');
  const [sixMonthTurnover, setSixMonthTurnover] = useState('');
  const [isProfessional, setIsProfessional] = useState(false);
  const [hasMixedSupplies, setHasMixedSupplies] = useState(false);
  const [taxableSales, setTaxableSales] = useState('');
  const [exemptSales, setExemptSales] = useState('');
  const [taxablePurchases, setTaxablePurchases] = useState('');
  const [exemptPurchases, setExemptPurchases] = useState('');
  const [mixedPurchases, setMixedPurchases] = useState('');
  const [hasImports, setHasImports] = useState(false);
  const [importedGoods, setImportedGoods] = useState('');
  const [importDuty, setImportDuty] = useState('');
  const [importedServices, setImportedServices] = useState('');

  const n = (v: string) => Number(v) || 0;

  async function calculate() {
    setLoading(true);
    try {
      const res = await api.post('/calculator/vat', {
        annualTurnover: n(annualTurnover),
        sixMonthTurnover: n(sixMonthTurnover),
        isLicensedProfessional: isProfessional,
        taxableSales: n(taxableSales),
        exemptSales: hasMixedSupplies ? n(exemptSales) : 0,
        taxablePurchases: n(taxablePurchases),
        exemptPurchases: n(exemptPurchases),
        mixedPurchases: n(mixedPurchases),
        importedGoods: n(importedGoods),
        importDuty: n(importDuty),
        importedServices: n(importedServices),
      });
      setResult(res.data);
      setStep(TOTAL_STEPS);
    } catch {
      toast.error('VAT calculation failed.');
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
          <h1 className="text-2xl font-bold text-gray-900">VAT Calculator</h1>
          <p className="text-gray-500 text-sm mt-1">Registration check, output/input tax, apportionment, and import VAT</p>
        </div>

        {step < TOTAL_STEPS && n(annualTurnover) > 0 && (
          <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 mb-6">
            <p className="text-xs text-gray-500">Annual turnover</p>
            <p className="font-bold text-brand-700">{formatTZS(n(annualTurnover))}</p>
            <p className="text-xs text-gray-500 mt-1">
              {n(annualTurnover) >= 200_000_000 || isProfessional
                ? '⚠️ VAT registration required'
                : '✅ Below registration threshold (TZS 200M)'}
            </p>
          </div>
        )}

        <WizardProgress currentStep={step} totalSteps={TOTAL_STEPS} />

        {step < TOTAL_STEPS && (
          <div className="card space-y-4">
            {step === 1 && (
              <div>
                <h2 className="text-lg font-bold mb-4">What is your annual turnover?</h2>
                <div>
                  <label className="label">Annual turnover (TZS)</label>
                  <input type="number" className="input-field" placeholder="e.g. 250000000" value={annualTurnover} onChange={e => setAnnualTurnover(e.target.value)} />
                </div>
                <div className="mt-4">
                  <label className="label">6-month turnover (TZS) — optional</label>
                  <input type="number" className="input-field" placeholder="If you've been in business less than a year" value={sixMonthTurnover} onChange={e => setSixMonthTurnover(e.target.value)} />
                </div>
                <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
                  <p><strong>VAT Registration Thresholds:</strong></p>
                  <ul className="list-disc pl-4 mt-1 space-y-1">
                    <li>Annual turnover ≥ TZS 200,000,000 → must register</li>
                    <li>Any 6-month period ≥ TZS 100,000,000 → must register</li>
                    <li>Licensed professionals → must register regardless of turnover</li>
                  </ul>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="text-lg font-bold mb-4">Are you a licensed professional?</h2>
                <p className="text-gray-500 text-sm mb-5">Lawyers, accountants, doctors, engineers, and other licensed professionals must register for VAT regardless of turnover.</p>
                <div className="flex gap-4">
                  {[true, false].map(v => (
                    <button key={String(v)} onClick={() => setIsProfessional(v)}
                      className={`flex-1 py-4 rounded-xl border-2 font-semibold transition-all ${isProfessional === v ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 hover:border-brand-300'}`}>
                      {v ? '👨‍💼 Yes — licensed professional' : '🏪 No — other business'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="text-lg font-bold mb-4">Do you make both taxable and exempt supplies?</h2>
                <p className="text-gray-500 text-sm mb-5">Exempt supplies include financial services, land/property (certain), medical services, and educational services. If you make both types, VAT apportionment applies.</p>
                <div className="flex gap-4">
                  {[true, false].map(v => (
                    <button key={String(v)} onClick={() => setHasMixedSupplies(v)}
                      className={`flex-1 py-4 rounded-xl border-2 font-semibold transition-all ${hasMixedSupplies === v ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 hover:border-brand-300'}`}>
                      {v ? '🔀 Yes — mixed supplies' : '✅ No — all taxable (or all exempt)'}
                    </button>
                  ))}
                </div>
                {hasMixedSupplies && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded-lg text-sm text-yellow-800">
                    <p>Apportionment formula: <strong>I × T/A</strong></p>
                    <p className="mt-1">If T/A ≥ 90% → claim all. If T/A &lt; 10% → claim nothing. Between → apply formula.</p>
                  </div>
                )}
              </div>
            )}

            {step === 4 && (
              <div>
                <h2 className="text-lg font-bold mb-4">Enter your sales values</h2>
                <div className="space-y-4">
                  <div>
                    <label className="label">Taxable sales (VAT-exclusive) (TZS)</label>
                    <input type="number" className="input-field" value={taxableSales} onChange={e => setTaxableSales(e.target.value)} />
                  </div>
                  {hasMixedSupplies && (
                    <div>
                      <label className="label">Exempt sales (TZS)</label>
                      <input type="number" className="input-field" value={exemptSales} onChange={e => setExemptSales(e.target.value)} />
                    </div>
                  )}
                  {n(taxableSales) > 0 && <p className="text-sm text-brand-600">Output VAT = {formatTZS(n(taxableSales) * 0.18)}</p>}
                </div>
              </div>
            )}

            {step === 5 && (
              <div>
                <h2 className="text-lg font-bold mb-4">Enter your purchase values</h2>
                <div className="space-y-4">
                  <div>
                    <label className="label">Taxable purchases (directly for taxable supplies) (TZS)</label>
                    <input type="number" className="input-field" value={taxablePurchases} onChange={e => setTaxablePurchases(e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Exempt purchases (for exempt supplies — NOT claimable) (TZS)</label>
                    <input type="number" className="input-field" value={exemptPurchases} onChange={e => setExemptPurchases(e.target.value)} />
                  </div>
                  {hasMixedSupplies && (
                    <div>
                      <label className="label">Mixed purchases (for both taxable and exempt — will be apportioned) (TZS)</label>
                      <input type="number" className="input-field" value={mixedPurchases} onChange={e => setMixedPurchases(e.target.value)} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 6 && (
              <div>
                <h2 className="text-lg font-bold mb-4">Did you import any goods or services?</h2>
                <div className="flex gap-4 mb-6">
                  {[true, false].map(v => (
                    <button key={String(v)} onClick={() => setHasImports(v)}
                      className={`flex-1 py-4 rounded-xl border-2 font-semibold transition-all ${hasImports === v ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 hover:border-brand-300'}`}>
                      {v ? '🚢 Yes — I have imports' : '❌ No imports'}
                    </button>
                  ))}
                </div>
                {hasImports && (
                  <div className="space-y-4">
                    <div>
                      <label className="label">Imported goods — CIF value (TZS)</label>
                      <input type="number" className="input-field" value={importedGoods} onChange={e => setImportedGoods(e.target.value)} />
                    </div>
                    <div>
                      <label className="label">Import duty + excise duty + other levies (TZS)</label>
                      <input type="number" className="input-field" value={importDuty} onChange={e => setImportDuty(e.target.value)} />
                    </div>
                    <div>
                      <label className="label">Imported services (reverse charge) (TZS)</label>
                      <input type="number" className="input-field" value={importedServices} onChange={e => setImportedServices(e.target.value)} />
                      <p className="text-xs text-gray-500 mt-1">Reverse charge: you must account for output AND input VAT in same return — net effect is zero.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
              <button onClick={back} disabled={step === 1} className="btn-secondary disabled:opacity-50">← Back</button>
              <button onClick={next} disabled={loading} className="btn-primary">
                {loading ? 'Calculating...' : step === TOTAL_STEPS - 1 ? '🧮 Calculate VAT →' : 'Continue →'}
              </button>
            </div>
          </div>
        )}

        {step === TOTAL_STEPS && result && (
          <div>
            {!!result.mustRegister && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="font-bold text-red-700">⚠️ VAT Registration Required</p>
                <p className="text-red-600 text-sm mt-1">{String(result.registrationReason ?? '')}</p>
              </div>
            )}
            <ResultCard
              title="VAT Calculation Results"
              calculationType="vat"
              summaryItems={[
                { label: 'Output VAT (on taxable sales)', value: result.outputTax as number },
                { label: 'Input VAT (direct taxable purchases)', value: result.inputTaxDirect as number },
                { label: 'Input VAT (apportioned)', value: result.inputTaxApportioned as number },
                { label: 'Import VAT', value: result.importVAT as number },
                { label: 'Net VAT Payable / (Refundable)', value: result.netVAT as number, highlight: true },
                { label: 'Apportionment Ratio (T/A)', value: `${result.apportionmentRatio}%` },
                { label: 'Apportionment Category', value: result.apportionmentCategory as string },
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
