'use client';
import { useState } from 'react';
import Navbar from '../../../components/ui/Navbar';
import Footer from '../../../components/ui/Footer';
import api from '../../../lib/api';
import { formatTZS } from '../../../lib/format';
import toast from 'react-hot-toast';
import { Car, Home, CreditCard } from 'lucide-react';

type Tab = 'vehicle' | 'premises' | 'loan';

export default function BenefitsPage() {
  const [tab, setTab] = useState<Tab>('vehicle');

  // Vehicle benefit state
  const [engineCC, setEngineCC] = useState('');
  const [vehicleAge, setVehicleAge] = useState('');
  const [employerClaims, setEmployerClaims] = useState(true);
  const [vehicleResult, setVehicleResult] = useState<Record<string, unknown> | null>(null);

  // Premises benefit state
  const [marketRent, setMarketRent] = useState('');
  const [totalIncome, setTotalIncome] = useState('');
  const [rentPaid, setRentPaid] = useState('');
  const [isGovt, setIsGovt] = useState(false);
  const [occupiedMonths, setOccupiedMonths] = useState('12');
  const [premisesResult, setPremisesResult] = useState<Record<string, unknown> | null>(null);

  // Loan benefit state
  const [loanAmount, setLoanAmount] = useState('');
  const [loanTerm, setLoanTerm] = useState('');
  const [actualRate, setActualRate] = useState('');
  const [basicSalary, setBasicSalary] = useState('');
  const [loanResult, setLoanResult] = useState<Record<string, unknown> | null>(null);

  const [loading, setLoading] = useState(false);

  async function calcVehicle() {
    if (!engineCC || !vehicleAge) { toast.error('Enter engine size and vehicle age'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/calculator/vehicle-benefit', {
        engineCC: Number(engineCC),
        vehicleAgeYears: Number(vehicleAge),
        employerClaimsDeduction: employerClaims,
      });
      setVehicleResult(data);
    } catch { toast.error('Calculation failed'); }
    setLoading(false);
  }

  async function calcPremises() {
    if (!marketRent || !totalIncome) { toast.error('Enter market rent and total income'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/calculator/residential-benefit', {
        marketRentalValue: Number(marketRent),
        employeeTotalIncome: Number(totalIncome),
        rentPaidByEmployee: Number(rentPaid) || 0,
        isGovernmentEmployee: isGovt,
        isGovernmentPremises: isGovt,
        occupiedMonths: Number(occupiedMonths),
      });
      setPremisesResult(data);
    } catch { toast.error('Calculation failed'); }
    setLoading(false);
  }

  async function calcLoan() {
    if (!loanAmount || !loanTerm || !actualRate || !basicSalary) { toast.error('Fill all fields'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/calculator/loan-benefit', {
        loanAmount: Number(loanAmount),
        loanTermMonths: Number(loanTerm),
        actualRateCharged: Number(actualRate) / 100,
        basicMonthlySalary: Number(basicSalary),
      });
      setLoanResult(data);
    } catch { toast.error('Calculation failed'); }
    setLoading(false);
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'vehicle', label: 'Motor Vehicle Benefit', icon: <Car size={18} /> },
    { id: 'premises', label: 'Residential Premises', icon: <Home size={18} /> },
    { id: 'loan', label: 'Low Interest Loan', icon: <CreditCard size={18} /> },
  ];

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Benefits in Kind Calculator</h1>
        <p className="text-gray-500 mb-8">S.27 ITA — quantify taxable employment benefits</p>

        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'bg-brand-600 text-white' : 'bg-white border text-gray-700 hover:border-brand-400'}`}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* Motor Vehicle Benefit */}
        {tab === 'vehicle' && (
          <div className="card space-y-5">
            <div className="bg-brand-50 border border-brand-200 rounded-lg p-4 text-sm text-brand-800">
              <strong>S.27(1)(a) + Fifth Schedule ITA:</strong> Motor vehicle benefit is taxable ONLY if the employer claims a deduction for the vehicle. If no deduction is claimed, the benefit is NIL.
            </div>
            <div>
              <label className="label">Engine Size (cc)</label>
              <input type="number" className="input-field" placeholder="e.g. 2000" value={engineCC} onChange={e => setEngineCC(e.target.value)} />
            </div>
            <div>
              <label className="label">Vehicle Age (years)</label>
              <input type="number" className="input-field" placeholder="e.g. 3" value={vehicleAge} onChange={e => setVehicleAge(e.target.value)} />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="empClaims" checked={employerClaims} onChange={e => setEmployerClaims(e.target.checked)} className="w-4 h-4 text-brand-600" />
              <label htmlFor="empClaims" className="text-sm font-medium text-gray-700">Employer claims deduction for this vehicle</label>
            </div>
            <button onClick={calcVehicle} disabled={loading} className="btn-primary w-full">
              {loading ? 'Calculating...' : 'Calculate Vehicle Benefit'}
            </button>
            {vehicleResult && (
              <div className={`rounded-xl p-6 border-2 ${vehicleResult.isTaxable ? 'border-orange-300 bg-orange-50' : 'border-green-300 bg-green-50'}`}>
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600">{vehicleResult.isTaxable ? 'Taxable Benefit' : 'Status'}</p>
                  <p className={`text-3xl font-bold ${vehicleResult.isTaxable ? 'text-orange-700' : 'text-green-700'}`}>
                    {vehicleResult.isTaxable ? formatTZS(vehicleResult.annualBenefit as number) : 'NIL — EXEMPT'}
                  </p>
                  {!!vehicleResult.isTaxable && <p className="text-sm text-gray-500">{formatTZS(vehicleResult.monthlyBenefit as number)}/month</p>}
                </div>
                <p className="text-sm text-gray-700">{String(vehicleResult.explanation ?? '')}</p>
              </div>
            )}
          </div>
        )}

        {/* Residential Premises Benefit */}
        {tab === 'premises' && (
          <div className="card space-y-5">
            <div className="bg-brand-50 border border-brand-200 rounded-lg p-4 text-sm text-brand-800">
              <strong>S.27(1)(c) ITA:</strong> Taxable benefit = lower of (i) market rent for period, or (ii) greater of 15% of income OR TZS 600,000/year — less rent paid by employee.
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="isGovt" checked={isGovt} onChange={e => setIsGovt(e.target.checked)} className="w-4 h-4 text-brand-600" />
              <label htmlFor="isGovt" className="text-sm font-medium text-gray-700">Government employee / government premises (EXEMPT)</label>
            </div>
            {!isGovt && <>
              <div>
                <label className="label">Market Rental Value (annual TZS)</label>
                <input type="number" className="input-field" placeholder="e.g. 6000000" value={marketRent} onChange={e => setMarketRent(e.target.value)} />
              </div>
              <div>
                <label className="label">Employee Total Annual Income (before this benefit, TZS)</label>
                <input type="number" className="input-field" placeholder="e.g. 12000000" value={totalIncome} onChange={e => setTotalIncome(e.target.value)} />
              </div>
              <div>
                <label className="label">Rent Paid by Employee (TZS)</label>
                <input type="number" className="input-field" placeholder="0 if employer pays all" value={rentPaid} onChange={e => setRentPaid(e.target.value)} />
              </div>
              <div>
                <label className="label">Months Occupied</label>
                <input type="number" className="input-field" placeholder="12" value={occupiedMonths} onChange={e => setOccupiedMonths(e.target.value)} />
              </div>
            </>}
            <button onClick={calcPremises} disabled={loading} className="btn-primary w-full">
              {loading ? 'Calculating...' : 'Calculate Premises Benefit'}
            </button>
            {premisesResult && (
              <div className={`rounded-xl p-6 border-2 ${premisesResult.isExempt ? 'border-green-300 bg-green-50' : 'border-orange-300 bg-orange-50'}`}>
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600">{premisesResult.isExempt ? 'Status' : 'Taxable Benefit'}</p>
                  <p className={`text-3xl font-bold ${premisesResult.isExempt ? 'text-green-700' : 'text-orange-700'}`}>
                    {premisesResult.isExempt ? 'EXEMPT' : formatTZS(premisesResult.taxableBenefit as number)}
                  </p>
                </div>
                <p className="text-sm text-gray-700">{premisesResult.explanation as string}</p>
                {Array.isArray(premisesResult.breakdown) && premisesResult.breakdown.length > 1 && (
                  <table className="w-full text-sm mt-4">
                    <tbody>
                      {(premisesResult.breakdown as Array<{ description: string; amount: number }>).map((row, i) => (
                        <tr key={i} className="border-b border-gray-100 last:border-0">
                          <td className="py-1 text-gray-600">{row.description}</td>
                          <td className="py-1 text-right font-medium">{row.amount !== 0 ? formatTZS(row.amount) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        )}

        {/* Low Interest Loan Benefit */}
        {tab === 'loan' && (
          <div className="card space-y-5">
            <div className="bg-brand-50 border border-brand-200 rounded-lg p-4 text-sm text-brand-800">
              <strong>S.27(1)(b) ITA:</strong> Taxable benefit = (loan amount × statutory rate) − (loan amount × actual rate). Exempt if loan term &lt;12 months AND loan &lt;3 months basic salary.
            </div>
            <div>
              <label className="label">Loan Amount (TZS)</label>
              <input type="number" className="input-field" placeholder="e.g. 5000000" value={loanAmount} onChange={e => setLoanAmount(e.target.value)} />
            </div>
            <div>
              <label className="label">Loan Term (months)</label>
              <input type="number" className="input-field" placeholder="e.g. 24" value={loanTerm} onChange={e => setLoanTerm(e.target.value)} />
            </div>
            <div>
              <label className="label">Interest Rate Charged by Employer (%)</label>
              <input type="number" step="0.1" className="input-field" placeholder="e.g. 5" value={actualRate} onChange={e => setActualRate(e.target.value)} />
            </div>
            <div>
              <label className="label">Employee Basic Monthly Salary (TZS)</label>
              <input type="number" className="input-field" placeholder="e.g. 1500000" value={basicSalary} onChange={e => setBasicSalary(e.target.value)} />
            </div>
            <button onClick={calcLoan} disabled={loading} className="btn-primary w-full">
              {loading ? 'Calculating...' : 'Calculate Loan Benefit'}
            </button>
            {loanResult && (
              <div className={`rounded-xl p-6 border-2 ${loanResult.isExempt ? 'border-green-300 bg-green-50' : 'border-orange-300 bg-orange-50'}`}>
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600">{loanResult.isExempt ? 'Status' : 'Annual Taxable Benefit'}</p>
                  <p className={`text-3xl font-bold ${loanResult.isExempt ? 'text-green-700' : 'text-orange-700'}`}>
                    {loanResult.isExempt ? 'EXEMPT' : formatTZS(loanResult.taxableBenefit as number)}
                  </p>
                  {!loanResult.isExempt && <p className="text-sm text-gray-500">Statutory rate: {((loanResult.statutoryRate as number) * 100).toFixed(1)}%</p>}
                </div>
                <p className="text-sm text-gray-700">{String(loanResult.explanation ?? '')}</p>
                {!!loanResult.isExempt && <p className="text-sm text-green-700 font-medium mt-2">{String(loanResult.exemptionReason ?? '')}</p>}
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
