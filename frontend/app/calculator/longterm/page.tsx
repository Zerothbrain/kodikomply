'use client';
import { useState } from 'react';
import Navbar from '../../../components/ui/Navbar';
import Footer from '../../../components/ui/Footer';
import api from '../../../lib/api';
import { formatTZS, formatPercent } from '../../../lib/format';
import toast from 'react-hot-toast';
import WizardProgress from '../../../components/ui/WizardProgress';

export default function LongTermContractPage() {
  const [step, setStep] = useState(1);
  const totalSteps = 6;
  const steps = ['Contract', 'Budget', 'Expenditure', 'Year Info', 'Prior Years', 'Results'];

  const [contractName, setContractName] = useState('');
  const [totalValue, setTotalValue] = useState('');
  const [estimatedTotal, setEstimatedTotal] = useState('');
  const [toDateExpenditure, setToDateExpenditure] = useState('');
  const [currentYearExp, setCurrentYearExp] = useState('');
  const [startYear, setStartYear] = useState((new Date().getFullYear() - 1).toString());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear().toString());
  const [priorIncome, setPriorIncome] = useState('0');
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  async function calculate() {
    setLoading(true);
    try {
      const { data } = await api.post('/calculator/long-term-contract', {
        contractName,
        totalContractValue: Number(totalValue),
        estimatedTotalExpenditure: Number(estimatedTotal),
        expenditureIncurredToDate: Number(toDateExpenditure),
        currentYearExpenditure: Number(currentYearExp),
        contractStartYear: Number(startYear),
        currentYearOfIncome: Number(currentYear),
        priorYearsIncomeRecognised: Number(priorIncome) || 0,
      });
      setResult(data);
      setStep(6);
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Calculation failed');
    }
    setLoading(false);
  }

  const pct = toDateExpenditure && estimatedTotal
    ? Math.min(100, (Number(toDateExpenditure) / Number(estimatedTotal)) * 100)
    : null;

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Long-Term Contracts</h1>
        <p className="text-gray-500 mb-6">S.26 ITA — percentage of completion method</p>

        <WizardProgress currentStep={step} totalSteps={totalSteps} steps={steps} />

        <div className="bg-brand-50 border border-brand-200 rounded-lg p-4 text-sm text-brand-800 mb-6">
          Applies to: construction, installation, manufacturing contracts spanning more than one year (not expected to complete within 6 months of start). Accrual basis taxpayers only.
        </div>

        {step === 1 && (
          <div className="card space-y-5">
            <h2 className="text-lg font-semibold">Step 1: Contract Details</h2>
            <div>
              <label className="label">Contract Name / Description</label>
              <input className="input-field" value={contractName} onChange={e => setContractName(e.target.value)} placeholder="e.g. Dodoma Road Construction Phase 2" />
            </div>
            <button onClick={() => setStep(2)} disabled={!contractName} className="btn-primary w-full">Next →</button>
          </div>
        )}

        {step === 2 && (
          <div className="card space-y-5">
            <h2 className="text-lg font-semibold">Step 2: Contract Budget</h2>
            <div>
              <label className="label">Total Contract Value (TZS)</label>
              <input type="number" className="input-field" value={totalValue} onChange={e => setTotalValue(e.target.value)} placeholder="e.g. 5000000000" />
            </div>
            <div>
              <label className="label">Estimated Total Contract Expenditure (TZS)</label>
              <input type="number" className="input-field" value={estimatedTotal} onChange={e => setEstimatedTotal(e.target.value)} placeholder="e.g. 3500000000" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="btn-secondary flex-1">← Back</button>
              <button onClick={() => setStep(3)} disabled={!totalValue || !estimatedTotal} className="btn-primary flex-1">Next →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="card space-y-5">
            <h2 className="text-lg font-semibold">Step 3: Expenditure</h2>
            <div>
              <label className="label">Total Expenditure Incurred to Date (TZS)</label>
              <input type="number" className="input-field" value={toDateExpenditure} onChange={e => setToDateExpenditure(e.target.value)} placeholder="Cumulative expenditure since contract start" />
            </div>
            <div>
              <label className="label">Expenditure Incurred THIS Year of Income (TZS)</label>
              <input type="number" className="input-field" value={currentYearExp} onChange={e => setCurrentYearExp(e.target.value)} placeholder="Current year only" />
            </div>
            {pct !== null && (
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500">Estimated % Completion</p>
                <p className="text-3xl font-bold text-brand-600">{pct.toFixed(2)}%</p>
                <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                  <div className="bg-brand-500 h-3 rounded-full" style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="btn-secondary flex-1">← Back</button>
              <button onClick={() => setStep(4)} disabled={!toDateExpenditure || !currentYearExp} className="btn-primary flex-1">Next →</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="card space-y-5">
            <h2 className="text-lg font-semibold">Step 4: Year Information</h2>
            <div>
              <label className="label">Contract Start Year</label>
              <input type="number" className="input-field" value={startYear} onChange={e => setStartYear(e.target.value)} />
            </div>
            <div>
              <label className="label">Current Year of Income</label>
              <input type="number" className="input-field" value={currentYear} onChange={e => setCurrentYear(e.target.value)} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="btn-secondary flex-1">← Back</button>
              <button onClick={() => setStep(5)} className="btn-primary flex-1">Next →</button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="card space-y-5">
            <h2 className="text-lg font-semibold">Step 5: Prior Years Income Recognised</h2>
            <div>
              <label className="label">Income Already Recognised in Prior Years (TZS)</label>
              <input type="number" className="input-field" value={priorIncome} onChange={e => setPriorIncome(e.target.value)} placeholder="0 if this is the first year" />
              <p className="text-xs text-gray-400 mt-1">Sum of all income recognised under this contract in previous years of income.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(4)} className="btn-secondary flex-1">← Back</button>
              <button onClick={calculate} disabled={loading} className="btn-primary flex-1">{loading ? 'Calculating...' : 'Calculate →'}</button>
            </div>
          </div>
        )}

        {step === 6 && result && (
          <div className="space-y-6">
            <div className="card border-2 border-brand-300">
              <h2 className="font-semibold text-lg mb-4">{contractName}</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-brand-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-500">% Completion</p>
                  <p className="text-2xl font-bold text-brand-700">{(result.percentageCompletion as number).toFixed(2)}%</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-500">Income This Year</p>
                  <p className="text-2xl font-bold text-green-700">{formatTZS(result.incomeForYear as number)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-500">Deductions This Year</p>
                  <p className="text-2xl font-bold text-red-600">{formatTZS(result.deductionsForYear as number)}</p>
                </div>
                <div className={`rounded-lg p-4 text-center ${(result.netTaxableAmount as number) >= 0 ? 'bg-orange-50' : 'bg-blue-50'}`}>
                  <p className="text-xs text-gray-500">Net Taxable Amount</p>
                  <p className={`text-2xl font-bold ${(result.netTaxableAmount as number) >= 0 ? 'text-orange-700' : 'text-blue-700'}`}>
                    {formatTZS(result.netTaxableAmount as number)}
                  </p>
                </div>
              </div>
              {!!result.lossCarrybackEligible && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                  Loss this year may be carried back to prior years with Commissioner approval.
                </div>
              )}
              {(result.warnings as string[]).map((w, i) => (
                <div key={i} className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 mt-2">{w}</div>
              ))}
            </div>
            <div className="card">
              <h3 className="font-semibold mb-3">Breakdown</h3>
              <table className="w-full text-sm">
                <tbody>
                  {(result.breakdown as Array<{ description: string; amount: number; notes?: string }>).map((row, i) => (
                    <tr key={i} className="border-b border-gray-100 last:border-0">
                      <td className="py-2 text-gray-700">{row.description}</td>
                      <td className="py-2 text-right font-medium">{row.amount !== 0 ? formatTZS(row.amount) : row.notes ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button onClick={() => setStep(1)} className="btn-secondary w-full">New Calculation</button>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
