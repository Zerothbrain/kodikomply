'use client';
import { useState } from 'react';
import Navbar from '../../../components/ui/Navbar';
import Footer from '../../../components/ui/Footer';
import api from '../../../lib/api';
import { formatTZS } from '../../../lib/format';
import toast from 'react-hot-toast';
import { RefreshCw, CheckCircle, Clock } from 'lucide-react';

interface RefundResult {
  eligibleForImmediateRefund: boolean;
  reason: string;
  refundAmount: number;
  applicationDeadlineNote: string;
  processNote: string;
  legalRef: string;
}

export default function VatRefundPage() {
  const [zeroRatedTurnover, setZeroRatedTurnover] = useState('');
  const [zeroRatedInput, setZeroRatedInput] = useState('');
  const [negativeNet, setNegativeNet] = useState('');
  const [consecutivePeriods, setConsecutivePeriods] = useState('0');
  const [result, setResult] = useState<RefundResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function calculate() {
    if (!negativeNet) { toast.error('Enter your negative net VAT amount'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/calculator/vat-refund', {
        zeroRatedTurnoverPercent: Number(zeroRatedTurnover) || 0,
        zeroRatedInputTaxPercent: Number(zeroRatedInput) || 0,
        negativeNetAmount: Number(negativeNet),
        consecutiveNegativePeriods: Number(consecutivePeriods) || 0,
      });
      setResult(data);
    } catch { toast.error('Calculation failed'); }
    setLoading(false);
  }

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-2">
          <RefreshCw size={32} className="text-brand-600" />
          <h1 className="text-3xl font-bold text-gray-900">VAT Refund Eligibility</h1>
        </div>
        <p className="text-gray-500 mb-8">S.85–88 VAT Act Cap 148 R.E.2023 — determine if you qualify for an immediate VAT refund or must carry forward.</p>

        {!result ? (
          <div className="card space-y-5">
            <div className="bg-brand-50 border border-brand-200 rounded-lg p-4 text-sm text-brand-800">
              <strong>Immediate refund (S.86)</strong> is available if: 50%+ of turnover is zero-rated, OR 50%+ of input tax relates to zero-rated supplies, OR negative net amount has persisted for 6+ consecutive periods.
            </div>

            <div>
              <label className="label">% of Turnover from Zero-Rated Supplies</label>
              <div className="relative">
                <input type="number" min="0" max="100" className="input-field pr-8" value={zeroRatedTurnover} onChange={e => setZeroRatedTurnover(e.target.value)} placeholder="0" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">Exports, zero-rated supplies as a % of your total taxable turnover</p>
            </div>

            <div>
              <label className="label">% of Input Tax Relating to Zero-Rated Supplies</label>
              <div className="relative">
                <input type="number" min="0" max="100" className="input-field pr-8" value={zeroRatedInput} onChange={e => setZeroRatedInput(e.target.value)} placeholder="0" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
              </div>
            </div>

            <div>
              <label className="label">Negative Net VAT Amount (TZS) — Input Tax Exceeds Output Tax</label>
              <input type="number" className="input-field" value={negativeNet} onChange={e => setNegativeNet(e.target.value)} placeholder="Amount to be refunded or carried forward" />
            </div>

            <div>
              <label className="label">Consecutive Tax Periods with Negative Net Amount</label>
              <input type="number" min="0" max="12" className="input-field" value={consecutivePeriods} onChange={e => setConsecutivePeriods(e.target.value)} placeholder="0" />
              <p className="text-xs text-gray-400 mt-1">How many consecutive monthly periods has your VAT account been negative?</p>
            </div>

            <button onClick={calculate} disabled={loading} className="btn-primary w-full">
              {loading ? 'Checking...' : 'Check Eligibility'}
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className={`card border-2 ${result.eligibleForImmediateRefund ? 'border-green-300 bg-green-50' : 'border-amber-300 bg-amber-50'}`}>
              <div className="flex items-center gap-3 mb-3">
                {result.eligibleForImmediateRefund
                  ? <CheckCircle size={28} className="text-green-600" />
                  : <Clock size={28} className="text-amber-500" />}
                <p className={`text-xl font-bold ${result.eligibleForImmediateRefund ? 'text-green-700' : 'text-amber-700'}`}>
                  {result.eligibleForImmediateRefund ? 'Eligible for Immediate Refund' : 'Must Carry Forward'}
                </p>
              </div>
              <p className="text-sm text-gray-700 mb-3">{result.reason}</p>

              {result.eligibleForImmediateRefund && (
                <div className="bg-white rounded-lg p-4 text-center border border-green-200 mb-3">
                  <p className="text-xs text-gray-500">Refund Amount</p>
                  <p className="text-3xl font-bold text-green-700">{formatTZS(result.refundAmount)}</p>
                </div>
              )}

              <div className="space-y-2">
                <div className="bg-white bg-opacity-70 rounded-lg p-3 text-sm">
                  <p className="font-semibold text-gray-700 mb-1">Process</p>
                  <p className="text-gray-600">{result.processNote}</p>
                </div>
                {result.applicationDeadlineNote && (
                  <div className="bg-white bg-opacity-70 rounded-lg p-3 text-sm">
                    <p className="font-semibold text-gray-700 mb-1">Deadline</p>
                    <p className="text-gray-600">{result.applicationDeadlineNote}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
              <p className="font-semibold mb-1">Before Applying for Refund — Checklist</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>All VAT returns must be filed up to date</li>
                <li>No outstanding tax liabilities (refund is offset against these first)</li>
                <li>Submit application with supporting documentation to Commissioner</li>
                <li>Commissioner must decide within 90 days of receiving application</li>
                <li>Application deadline: 3 years from end of the relevant tax period</li>
              </ul>
            </div>

            <p className="text-xs text-gray-400 text-center">{result.legalRef}</p>
            <button onClick={() => setResult(null)} className="btn-secondary w-full">New Check</button>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
