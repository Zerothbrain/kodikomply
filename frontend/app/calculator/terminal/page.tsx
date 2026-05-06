'use client';
import { useState } from 'react';
import Navbar from '../../../components/ui/Navbar';
import Footer from '../../../components/ui/Footer';
import ResultCard from '../../../components/ui/ResultCard';
import { formatTZS } from '../../../lib/format';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

const CONTRACT_TYPES = [
  { value: 'general', label: 'General (relates to 5+ years ago)', desc: 'Payment relates to services rendered 5 or more years ago → spread over 6 years' },
  { value: 'specified', label: 'Specified term — terminated early', desc: 'Had a fixed-term contract that was terminated before expiry → spread over unexpired period' },
  { value: 'unspecified_with_clause', label: 'Unspecified term — WITH compensation clause', desc: 'Open-ended contract with a compensation clause → spread forward at prior salary rate, no cap' },
  { value: 'unspecified_without_clause', label: 'Unspecified term — WITHOUT compensation clause', desc: 'Open-ended contract without compensation clause → spread forward, CAPPED at 3 years salary' },
];

export default function TerminalCalculator() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [contractType, setContractType] = useState('general');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [unexpiredYears, setUnexpiredYears] = useState('');
  const [priorYearSalary, setPriorYearSalary] = useState('');

  const n = (v: string) => Number(v) || 0;

  async function calculate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/calculator/terminal-benefits', {
        paymentAmount: n(paymentAmount),
        contractType,
        unexpiredYears: n(unexpiredYears),
        priorYearSalary: n(priorYearSalary),
      });
      setResult(res.data);
    } catch {
      toast.error('Terminal benefits calculation failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Terminal Benefits Calculator</h1>
          <p className="text-gray-500 text-sm mt-1">All 4 ITA contract scenarios — with correct spreading formula</p>
        </div>

        <div className="card mb-4 bg-blue-50 border-blue-100">
          <h3 className="font-semibold text-blue-800 mb-2">About Terminal Benefits Tax</h3>
          <p className="text-blue-700 text-sm">Terminal payments (golden handshakes, redundancy pay) are taxed using a special spreading formula that allocates the payment across multiple years. This prevents a large one-off payment pushing you into a higher bracket.</p>
        </div>

        <form onSubmit={calculate} className="card space-y-6">
          <div>
            <label className="label text-base font-semibold">Contract type</label>
            <div className="space-y-3 mt-2">
              {CONTRACT_TYPES.map(({ value, label, desc }) => (
                <label key={value} className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${contractType === value ? 'border-brand-600 bg-brand-50' : 'border-gray-200 hover:border-brand-300'}`}>
                  <input type="radio" name="contractType" value={value} checked={contractType === value} onChange={() => setContractType(value)} className="mt-1" />
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Total terminal payment received (TZS)</label>
            <input type="number" className="input-field text-lg" placeholder="e.g. 24000000" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} required />
          </div>

          {contractType === 'specified' && (
            <div>
              <label className="label">Unexpired years remaining on contract</label>
              <input type="number" className="input-field" placeholder="e.g. 3" value={unexpiredYears} onChange={e => setUnexpiredYears(e.target.value)} />
              <p className="text-xs text-gray-500 mt-1">Payment will be spread equally over the unexpired period only. Nothing allocated to the expired period.</p>
            </div>
          )}

          {(contractType === 'unspecified_with_clause' || contractType === 'unspecified_without_clause') && (
            <div>
              <label className="label">Prior year annual salary / remuneration (TZS)</label>
              <input type="number" className="input-field" placeholder="e.g. 8400000" value={priorYearSalary} onChange={e => setPriorYearSalary(e.target.value)} />
              <p className="text-xs text-gray-500 mt-1">Payment is spread forward at the same rate as the prior year's salary.</p>
              {contractType === 'unspecified_without_clause' && n(priorYearSalary) > 0 && n(paymentAmount) > 0 && (
                <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                  <p className="font-medium text-yellow-800">Cap calculation:</p>
                  <p className="text-yellow-700 mt-1">3 years × {formatTZS(n(priorYearSalary))} = <strong>{formatTZS(n(priorYearSalary) * 3)}</strong></p>
                  {n(paymentAmount) > n(priorYearSalary) * 3 && (
                    <p className="text-green-700 mt-1">✅ Excess of {formatTZS(n(paymentAmount) - n(priorYearSalary) * 3)} is NOT taxable</p>
                  )}
                </div>
              )}
            </div>
          )}

          <button type="submit" disabled={loading || !paymentAmount} className="btn-primary w-full">
            {loading ? 'Calculating...' : '🧮 Calculate Terminal Benefits Tax'}
          </button>
        </form>

        {result && (
          <div className="mt-6">
            <ResultCard
              title="Terminal Benefits Tax Results"
              calculationType="terminal_benefits"
              summaryItems={[
                { label: 'Total Payment', value: result.totalPayment as number },
                { label: 'Taxable Amount', value: result.taxableAmount as number },
                { label: 'Non-Taxable Amount', value: result.nonTaxableAmount as number },
                { label: 'Total Tax', value: result.totalTax as number, highlight: true },
                { label: 'Net Payment (after tax)', value: result.netPayment as number },
              ]}
              breakdown={(result.yearlyAllocations as Array<{ year: string; amount: number; tax: number }> | undefined)?.map(y => ({
                description: y.year,
                amount: y.amount,
                notes: `Tax: ${formatTZS(y.tax)}`,
              }))}
              explanation={result.explanation as string}
            />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
