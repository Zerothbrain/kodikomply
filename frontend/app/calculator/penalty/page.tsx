'use client';
import { useState } from 'react';
import Navbar from '../../../components/ui/Navbar';
import Footer from '../../../components/ui/Footer';
import api from '../../../lib/api';
import { formatTZS } from '../../../lib/format';
import toast from 'react-hot-toast';
import { AlertTriangle } from 'lucide-react';

interface PenaltyResult {
  lateFilingPenalty: number;
  additionalFineMin: number;
  additionalFineMax: number;
  latePaymentInterest: number;
  totalLiability: number;
  currencyPointValue: number;
  breakdown: Array<{ description: string; amount: number }>;
  explanation: string;
  registrationPenalty?: { minFine: number; maxFine: number; imprisonmentNote?: string };
}

export default function PenaltyCalculatorPage() {
  const [taxpayerType, setTaxpayerType] = useState<'individual' | 'corporate'>('individual');
  const [taxType, setTaxType] = useState<'income_tax' | 'vat' | 'wht' | 'paye' | 'other'>('income_tax');
  const [assessableTax, setAssessableTax] = useState('');
  const [monthsDelayed, setMonthsDelayed] = useState('1');
  const [monthsOverdue, setMonthsOverdue] = useState('');
  const [principalTax, setPrincipalTax] = useState('');
  const [failureToRegisterVAT, setFailureToRegisterVAT] = useState(false);
  const [isKnowingOrReckless, setIsKnowingOrReckless] = useState(false);
  const [result, setResult] = useState<PenaltyResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function calculate() {
    if (!failureToRegisterVAT && !assessableTax) { toast.error('Enter assessable tax amount'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/calculator/penalties', {
        taxpayerType,
        taxType,
        assessableTax: Number(assessableTax) || 0,
        monthsDelayed: Number(monthsDelayed) || 0,
        monthsOverdue: monthsOverdue ? Number(monthsOverdue) : undefined,
        principalTax: principalTax ? Number(principalTax) : undefined,
        isWHT: taxType === 'wht',
        failureToRegisterVAT,
        isKnowingOrReckless,
      });
      setResult(data);
    } catch { toast.error('Calculation failed'); }
    setLoading(false);
  }

  function reset() { setResult(null); setAssessableTax(''); setMonthsDelayed('1'); setMonthsOverdue(''); setPrincipalTax(''); setFailureToRegisterVAT(false); }

  const TAX_TYPE_LABELS: Record<string, string> = {
    income_tax: 'Income Tax',
    vat: 'VAT (S.78 TAA)',
    wht: 'Withholding Tax',
    paye: 'PAYE',
    other: 'Other',
  };

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-2">
          <AlertTriangle size={32} className="text-red-500" />
          <h1 className="text-3xl font-bold text-gray-900">Penalty Calculator</h1>
        </div>
        <p className="text-gray-500 mb-8">Calculate late filing penalties, late payment interest, and VAT registration penalties under the Tax Administration Act.</p>

        {!result ? (
          <div className="card space-y-6">
            {/* Taxpayer type */}
            <div>
              <label className="label">Taxpayer Type</label>
              <div className="flex gap-3">
                {(['individual', 'corporate'] as const).map(t => (
                  <label key={t} className={`flex-1 flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer ${taxpayerType === t ? 'border-brand-500 bg-brand-50' : 'border-gray-200'}`}>
                    <input type="radio" name="taxpayerType" checked={taxpayerType === t} onChange={() => setTaxpayerType(t)} className="text-brand-600" />
                    <span className="font-medium capitalize">{t === 'individual' ? 'Individual' : 'Corporate / Entity'}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* VAT registration failure toggle */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={failureToRegisterVAT} onChange={e => setFailureToRegisterVAT(e.target.checked)} className="w-4 h-4 text-red-600" />
                <span className="font-medium text-red-800">Failure to register for VAT (special penalty)</span>
              </label>
              {failureToRegisterVAT && (
                <label className="flex items-center gap-3 cursor-pointer mt-3">
                  <input type="checkbox" checked={isKnowingOrReckless} onChange={e => setIsKnowingOrReckless(e.target.checked)} className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-700">Knowing or reckless failure (higher penalty applies)</span>
                </label>
              )}
            </div>

            {!failureToRegisterVAT && (
              <>
                {/* Tax type */}
                <div>
                  <label className="label">Tax Type</label>
                  <select className="input-field" value={taxType} onChange={e => setTaxType(e.target.value as typeof taxType)}>
                    {Object.entries(TAX_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>

                {/* Assessable tax */}
                <div>
                  <label className="label">Assessable Tax Amount (TZS)</label>
                  <input type="number" className="input-field" value={assessableTax} onChange={e => setAssessableTax(e.target.value)} placeholder="Tax that was due" />
                </div>

                {/* Principal tax (optional) */}
                <div>
                  <label className="label">Principal Tax for Interest Calculation (TZS) <span className="text-gray-400 font-normal">— optional, defaults to assessable tax</span></label>
                  <input type="number" className="input-field" value={principalTax} onChange={e => setPrincipalTax(e.target.value)} placeholder="Leave blank to use assessable tax" />
                </div>

                {/* Months delayed */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Months of Filing Delay</label>
                    <input type="number" className="input-field" min="0" value={monthsDelayed} onChange={e => setMonthsDelayed(e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Months Payment Overdue <span className="text-gray-400 font-normal">(for interest)</span></label>
                    <input type="number" className="input-field" min="0" value={monthsOverdue} onChange={e => setMonthsOverdue(e.target.value)} placeholder="Same as filing delay if blank" />
                  </div>
                </div>
              </>
            )}

            <button onClick={calculate} disabled={loading} className="btn-primary w-full">
              {loading ? 'Calculating...' : 'Calculate Penalties'}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary cards */}
            {result.registrationPenalty ? (
              <div className="card border-2 border-red-300 bg-red-50">
                <h2 className="font-semibold text-red-800 mb-4">VAT Registration Penalty</h2>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-white rounded-lg p-4 text-center border border-red-200">
                    <p className="text-xs text-gray-500">Minimum Fine</p>
                    <p className="text-2xl font-bold text-red-700">{formatTZS(result.registrationPenalty.minFine)}</p>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center border border-red-200">
                    <p className="text-xs text-gray-500">Maximum Fine</p>
                    <p className="text-2xl font-bold text-red-700">{formatTZS(result.registrationPenalty.maxFine)}</p>
                  </div>
                </div>
                {result.registrationPenalty.imprisonmentNote && (
                  <div className="bg-red-100 border border-red-300 rounded-lg p-3 text-sm text-red-800">
                    ⚠️ {result.registrationPenalty.imprisonmentNote}
                  </div>
                )}
                <p className="text-sm text-red-700 mt-3">{result.explanation}</p>
                <p className="text-xs text-gray-500 mt-2">Currency point value: {formatTZS(result.currencyPointValue)}</p>
              </div>
            ) : (
              <div className="card border-2 border-orange-300">
                <h2 className="font-semibold mb-4">Penalty Summary — {TAX_TYPE_LABELS[taxType]}</h2>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-orange-50 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-500">Late Filing Penalty</p>
                    <p className="text-2xl font-bold text-orange-700">{formatTZS(result.lateFilingPenalty)}</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-500">Late Payment Interest</p>
                    <p className="text-2xl font-bold text-red-700">{formatTZS(result.latePaymentInterest)}</p>
                  </div>
                  {result.additionalFineMin > 0 && (
                    <div className="bg-amber-50 rounded-lg p-4 text-center col-span-2">
                      <p className="text-xs text-gray-500">Additional Fine Range (court imposed)</p>
                      <p className="text-lg font-bold text-amber-700">{formatTZS(result.additionalFineMin)} – {formatTZS(result.additionalFineMax)}</p>
                    </div>
                  )}
                  <div className="bg-gray-900 rounded-lg p-4 text-center col-span-2">
                    <p className="text-xs text-gray-300">Total Liability (tax + penalty + interest)</p>
                    <p className="text-3xl font-bold text-white">{formatTZS(result.totalLiability)}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{result.explanation}</p>
                <p className="text-xs text-gray-400 mt-2">Currency point = {formatTZS(result.currencyPointValue)}</p>
              </div>
            )}

            {/* Breakdown table */}
            <div className="card">
              <h3 className="font-semibold mb-3">Calculation Breakdown</h3>
              <table className="w-full text-sm">
                <tbody>
                  {result.breakdown.map((row, i) => (
                    <tr key={i} className={`border-b border-gray-100 last:border-0 ${row.description === 'TOTAL LIABILITY' ? 'font-bold bg-gray-50' : ''}`}>
                      <td className="py-2 text-gray-700">{row.description}</td>
                      <td className="py-2 text-right font-medium">{row.amount > 0 ? formatTZS(row.amount) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button onClick={reset} className="btn-secondary w-full">New Calculation</button>
          </div>
        )}

        <div className="mt-10 bg-amber-50 border border-amber-200 rounded-xl p-6">
          <h3 className="font-semibold text-amber-800 mb-2">Legal Basis</h3>
          <p className="text-sm text-amber-700">
            Penalties computed under the Tax Administration Act (TAA) Cap 438 R.E. 2019: S.76 (late filing), S.78 (VAT),
            S.79 (late payment compound interest). WHT penalties under ITA S.81. Currency point = TZS 15,000.
            Always verify current rates with TRA — penalties may be negotiated in settlement.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
