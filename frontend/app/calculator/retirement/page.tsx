'use client';
import { useState } from 'react';
import Navbar from '../../../components/ui/Navbar';
import Footer from '../../../components/ui/Footer';
import api from '../../../lib/api';
import { formatTZS } from '../../../lib/format';
import toast from 'react-hot-toast';

type Mode = 'contribution' | 'payment';

export default function RetirementPage() {
  const [mode, setMode] = useState<Mode>('contribution');

  // Contribution state
  const [actualContrib, setActualContrib] = useState('');
  const [grossSalary, setGrossSalary] = useState('');
  const [fundName, setFundName] = useState('NSSF — National Social Security Fund');
  const [isApproved, setIsApproved] = useState(true);
  const [includesEmployer, setIncludesEmployer] = useState(true);
  const [contribResult, setContribResult] = useState<Record<string, unknown> | null>(null);

  // Payment state
  const [paymentAmount, setPaymentAmount] = useState('');
  const [isFromResident, setIsFromResident] = useState(true);
  const [isApprovedFund, setIsApprovedFund] = useState(true);
  const [totalContribs, setTotalContribs] = useState('');
  const [paymentResult, setPaymentResult] = useState<Record<string, unknown> | null>(null);

  const [loading, setLoading] = useState(false);

  async function calcContrib() {
    if (!actualContrib || !grossSalary) { toast.error('Fill all fields'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/calculator/retirement-contribution', {
        actualContribution: Number(actualContrib),
        grossSalary: Number(grossSalary),
        fundName,
        isApprovedFund: isApproved,
        includesEmployerContribution: includesEmployer,
      });
      setContribResult(data);
    } catch { toast.error('Calculation failed'); }
    setLoading(false);
  }

  async function calcPayment() {
    if (!paymentAmount) { toast.error('Enter payment amount'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/calculator/retirement-payment', {
        paymentAmount: Number(paymentAmount),
        isFromResidentFund: isFromResident,
        isApprovedFund: isApprovedFund,
        totalContributionsMade: Number(totalContribs) || 0,
        isFromNonResidentFund: !isFromResident,
      });
      setPaymentResult(data);
    } catch { toast.error('Calculation failed'); }
    setLoading(false);
  }

  const approvedFunds = ['NSSF — National Social Security Fund', 'PPF — Parastatal Pension Fund', 'PSPF — Public Service Pension Fund', 'GEPF — Government Employees Provident Fund', 'LAPF — Local Authorities Provident Fund', 'NHIF — National Health Insurance Fund'];

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Retirement Fund Module</h1>
        <p className="text-gray-500 mb-6">S.61–63 ITA — deductions and payment taxation</p>

        <div className="flex gap-2 mb-6">
          {(['contribution', 'payment'] as Mode[]).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-5 py-2 rounded-lg text-sm font-medium ${mode === m ? 'bg-brand-600 text-white' : 'bg-white border text-gray-700 hover:border-brand-400'}`}>
              {m === 'contribution' ? 'Contributions Deduction (S.61)' : 'Retirement Payments (S.63)'}
            </button>
          ))}
        </div>

        {mode === 'contribution' && (
          <div className="card space-y-5">
            <div className="bg-brand-50 border border-brand-200 rounded-lg p-4 text-sm text-brand-800">
              <strong>S.61 ITA:</strong> Deduction = LOWER of actual contribution OR statutory amount. Only approved funds qualify.
            </div>
            <div>
              <label className="label">Retirement Fund</label>
              <select className="input-field" value={fundName} onChange={e => { setFundName(e.target.value); setIsApproved(true); }}>
                {approvedFunds.map(f => <option key={f}>{f}</option>)}
                <option value="OTHER (unapproved fund)">Other — unapproved fund (NO deduction)</option>
              </select>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="approved" checked={isApproved} onChange={e => setIsApproved(e.target.checked)} className="w-4 h-4 text-brand-600" />
              <label htmlFor="approved" className="text-sm text-gray-700">This is an approved fund</label>
            </div>
            <div>
              <label className="label">Actual Contribution (monthly TZS)</label>
              <input type="number" className="input-field" value={actualContrib} onChange={e => setActualContrib(e.target.value)} placeholder="e.g. 150000" />
            </div>
            <div>
              <label className="label">Gross Monthly Salary (TZS)</label>
              <input type="number" className="input-field" value={grossSalary} onChange={e => setGrossSalary(e.target.value)} placeholder="e.g. 1500000" />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="inclEmp" checked={includesEmployer} onChange={e => setIncludesEmployer(e.target.checked)} className="w-4 h-4 text-brand-600" />
              <label htmlFor="inclEmp" className="text-sm text-gray-700">Include employer contribution in calculation (included in your income)</label>
            </div>
            <button onClick={calcContrib} disabled={loading} className="btn-primary w-full">{loading ? 'Calculating...' : 'Calculate Deduction'}</button>
            {contribResult && (
              <div className="bg-green-50 border-2 border-green-300 rounded-xl p-6">
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600">Allowable Deduction</p>
                  <p className="text-3xl font-bold text-green-700">{formatTZS(contribResult.allowableDeduction as number)}/month</p>
                  <p className="text-sm text-gray-500 mt-1">Statutory: {formatTZS(contribResult.statutoryAmount as number)}</p>
                </div>
                <p className="text-sm text-gray-700">{contribResult.explanation as string}</p>
                {(contribResult.excessContribution as number) > 0 && (
                  <p className="text-sm text-orange-700 font-medium mt-2">Excess contribution (not deductible): {formatTZS(contribResult.excessContribution as number)}</p>
                )}
              </div>
            )}
          </div>
        )}

        {mode === 'payment' && (
          <div className="card space-y-5">
            <div className="bg-brand-50 border border-brand-200 rounded-lg p-4 text-sm text-brand-800">
              <strong>S.63 ITA:</strong> Payments from resident funds (approved or unapproved) are EXEMPT. Non-resident fund payments are taxable. For unapproved non-resident funds, only gains are taxable.
            </div>
            <div>
              <label className="label">Retirement Payment Received (TZS)</label>
              <input type="number" className="input-field" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} placeholder="e.g. 50000000" />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="isRes" checked={isFromResident} onChange={e => setIsFromResident(e.target.checked)} className="w-4 h-4 text-brand-600" />
              <label htmlFor="isRes" className="text-sm text-gray-700">Payment from a RESIDENT fund (Tanzania-registered)</label>
            </div>
            {!isFromResident && <>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="isApp" checked={isApprovedFund} onChange={e => setIsApprovedFund(e.target.checked)} className="w-4 h-4 text-brand-600" />
                <label htmlFor="isApp" className="text-sm text-gray-700">Non-resident fund is an APPROVED fund</label>
              </div>
              {!isApprovedFund && (
                <div>
                  <label className="label">Total Own Contributions Made (TZS)</label>
                  <input type="number" className="input-field" value={totalContribs} onChange={e => setTotalContribs(e.target.value)} placeholder="Your contributions (return of capital)" />
                </div>
              )}
            </>}
            <button onClick={calcPayment} disabled={loading} className="btn-primary w-full">{loading ? 'Calculating...' : 'Calculate Tax on Payment'}</button>
            {paymentResult && (
              <div className={`rounded-xl p-6 border-2 ${paymentResult.isExempt ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600">{paymentResult.isExempt ? 'Status' : 'Taxable Amount'}</p>
                  <p className={`text-3xl font-bold ${paymentResult.isExempt ? 'text-green-700' : 'text-red-600'}`}>
                    {paymentResult.isExempt ? 'EXEMPT' : formatTZS(paymentResult.taxableAmount as number)}
                  </p>
                </div>
                <p className="text-sm text-gray-700">{paymentResult.reason as string}</p>
                <p className="text-sm text-gray-600 mt-2">{paymentResult.explanation as string}</p>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
