'use client';
import { useState } from 'react';
import Navbar from '../../../components/ui/Navbar';
import Footer from '../../../components/ui/Footer';
import api from '../../../lib/api';
import { formatTZS, formatPercent } from '../../../lib/format';
import toast from 'react-hot-toast';
import WizardProgress from '../../../components/ui/WizardProgress';

export default function ForeignTaxReliefPage() {
  const [step, setStep] = useState(1);
  const totalSteps = 6;
  const steps = ['Residency', 'Country', 'Foreign Income', 'Tanzania Income', 'Tax Amounts', 'Results'];

  const [isResident, setIsResident] = useState(true);
  const [country, setCountry] = useState('');
  const [foreignIncome, setForeignIncome] = useState('');
  const [foreignTaxPaid, setForeignTaxPaid] = useState('');
  const [tanzaniaIncome, setTanzaniaIncome] = useState('');
  const [tanzaniaTax, setTanzaniaTax] = useState('');
  const [electDeduct, setElectDeduct] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  async function calculate() {
    setLoading(true);
    try {
      const { data } = await api.post('/calculator/foreign-tax-relief', {
        isResident,
        foreignCountry: country,
        foreignIncome: Number(foreignIncome),
        foreignTaxPaid: Number(foreignTaxPaid),
        totalTanzaniaIncome: Number(tanzaniaIncome),
        tanzaniaTaxPayable: Number(tanzaniaTax),
        electToDeductInstead: electDeduct,
      });
      setResult(data);
      setStep(6);
    } catch { toast.error('Calculation failed'); }
    setLoading(false);
  }

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Foreign Tax Relief</h1>
        <p className="text-gray-500 mb-6">S.98 ITA — credit for foreign taxes paid by resident persons</p>

        <WizardProgress currentStep={step} totalSteps={totalSteps} steps={steps} />

        {step === 1 && (
          <div className="card space-y-5">
            <h2 className="text-lg font-semibold">Step 1: Are you a resident person?</h2>
            <div className="bg-brand-50 border border-brand-200 rounded-lg p-4 text-sm text-brand-800">
              Foreign tax relief is ONLY available to resident persons. Non-residents are not eligible.
            </div>
            <div className="space-y-3">
              {[true, false].map(v => (
                <label key={String(v)} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${isResident === v ? 'border-brand-500 bg-brand-50' : 'border-gray-200'}`}>
                  <input type="radio" name="resident" checked={isResident === v} onChange={() => setIsResident(v)} className="text-brand-600" />
                  <span className="font-medium">{v ? 'Yes — I am a Tanzania resident for tax purposes' : 'No — I am a non-resident'}</span>
                </label>
              ))}
            </div>
            {!isResident && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                Non-resident persons are not eligible for foreign tax relief under S.98 ITA.
              </div>
            )}
            <button onClick={() => { if (!isResident) { calculate(); return; } setStep(2); }} className="btn-primary w-full">
              {isResident ? 'Next →' : 'Show Ineligibility Result'}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="card space-y-5">
            <h2 className="text-lg font-semibold">Step 2: Source Country</h2>
            <div>
              <label className="label">Country where foreign income was earned</label>
              <input className="input-field" value={country} onChange={e => setCountry(e.target.value)} placeholder="e.g. Kenya, United Kingdom, South Africa" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="btn-secondary flex-1">← Back</button>
              <button onClick={() => setStep(3)} disabled={!country} className="btn-primary flex-1">Next →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="card space-y-5">
            <h2 className="text-lg font-semibold">Step 3: Foreign Income & Tax Paid</h2>
            <div>
              <label className="label">Foreign Income Earned (TZS equivalent)</label>
              <input type="number" className="input-field" value={foreignIncome} onChange={e => setForeignIncome(e.target.value)} placeholder="Convert to TZS at applicable rate" />
            </div>
            <div>
              <label className="label">Tax Paid in {country || 'Foreign Country'} (TZS equivalent)</label>
              <input type="number" className="input-field" value={foreignTaxPaid} onChange={e => setForeignTaxPaid(e.target.value)} placeholder="Foreign tax in TZS equivalent" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="btn-secondary flex-1">← Back</button>
              <button onClick={() => setStep(4)} disabled={!foreignIncome || !foreignTaxPaid} className="btn-primary flex-1">Next →</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="card space-y-5">
            <h2 className="text-lg font-semibold">Step 4: Total Tanzania Income</h2>
            <div>
              <label className="label">Total Tanzania Income INCLUDING the foreign income (TZS)</label>
              <input type="number" className="input-field" value={tanzaniaIncome} onChange={e => setTanzaniaIncome(e.target.value)} placeholder="All income — domestic + foreign" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="btn-secondary flex-1">← Back</button>
              <button onClick={() => setStep(5)} disabled={!tanzaniaIncome} className="btn-primary flex-1">Next →</button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="card space-y-5">
            <h2 className="text-lg font-semibold">Step 5: Tanzania Tax Liability</h2>
            <div>
              <label className="label">Tanzania Income Tax Payable (before any foreign relief, TZS)</label>
              <input type="number" className="input-field" value={tanzaniaTax} onChange={e => setTanzaniaTax(e.target.value)} placeholder="Total TZ tax before foreign credit" />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="electDeduct" checked={electDeduct} onChange={e => setElectDeduct(e.target.checked)} className="w-4 h-4 text-brand-600" />
              <label htmlFor="electDeduct" className="text-sm text-gray-700">
                Show alternative: elect to DEDUCT foreign tax instead of credit (cannot do both)
              </label>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(4)} className="btn-secondary flex-1">← Back</button>
              <button onClick={calculate} disabled={loading || !tanzaniaTax} className="btn-primary flex-1">{loading ? 'Calculating...' : 'Calculate →'}</button>
            </div>
          </div>
        )}

        {step === 6 && result && (
          <div className="space-y-6">
            {!result.isEligible ? (
              <div className="card border-2 border-red-300 bg-red-50">
                <h2 className="font-semibold text-red-700 mb-2">Not Eligible</h2>
                <p className="text-sm text-red-600">{result.ineligibilityReason as string}</p>
              </div>
            ) : (
              <>
                <div className="card border-2 border-green-300">
                  <h2 className="font-semibold mb-4">Foreign Tax Relief Result</h2>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-brand-50 rounded-lg p-4 text-center">
                      <p className="text-xs text-gray-500">Average TZ Rate</p>
                      <p className="text-2xl font-bold text-brand-700">{formatPercent(result.averageTanzaniaRate as number)}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <p className="text-xs text-gray-500">Credit Applied</p>
                      <p className="text-2xl font-bold text-green-700">{formatTZS(result.actualCredit as number)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <p className="text-xs text-gray-500">Final Tax Payable</p>
                      <p className="text-2xl font-bold text-orange-700">{formatTZS(result.finalTaxPayable as number)}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <p className="text-xs text-gray-500">Tax Saving</p>
                      <p className="text-2xl font-bold text-blue-700">{formatTZS(result.taxSaving as number)}</p>
                    </div>
                  </div>
                  {(result.unrelievedForeignTax as number) > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                      Unrelieved foreign tax: {formatTZS(result.unrelievedForeignTax as number)} — can be carried forward to next year of income.
                    </div>
                  )}
                </div>
                <div className="card">
                  <h3 className="font-semibold mb-3">Calculation Breakdown</h3>
                  <table className="w-full text-sm">
                    <tbody>
                      {(result.breakdown as Array<{ description: string; amount: number; notes?: string }>).map((row, i) => (
                        row.amount !== 0 && (
                          <tr key={i} className="border-b border-gray-100 last:border-0">
                            <td className="py-2 text-gray-700">{row.description}</td>
                            <td className="py-2 text-right font-medium">{formatTZS(row.amount)}</td>
                          </tr>
                        )
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            <button onClick={() => setStep(1)} className="btn-secondary w-full">New Calculation</button>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
