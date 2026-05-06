'use client';
import { useState } from 'react';
import Navbar from '../../../components/ui/Navbar';
import Footer from '../../../components/ui/Footer';
import WizardProgress from '../../../components/ui/WizardProgress';
import ResultCard from '../../../components/ui/ResultCard';
import { formatTZS } from '../../../lib/format';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

interface Allowance { type: string; amount: number; isReimbursement: boolean; actualExpense: number; }
interface Benefit { type: string; amount: number; }

const TOTAL_STEPS = 10;
const STEP_LABELS = [
  'Employment status', 'Residency', 'Basic salary', 'Allowances',
  'Expense reimbursements', 'Benefits', 'Government employee', 'Retirement', 'Terminal payment', 'Results',
];

const ALLOWANCE_TYPES = ['travel', 'subsistence', 'entertainment', 'housing', 'transport', 'foreign_service', 'other'];
const BENEFIT_TYPES = ['motor_vehicle', 'motor_vehicle_no_deduction', 'residential_premises', 'tips', 'bonus', 'commission', 'medical', 'cafeteria'];

export default function EmploymentCalculator() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const [isEmployed, setIsEmployed] = useState<boolean | null>(null);
  const [isResident, setIsResident] = useState<boolean | null>(null);
  const [employerIsResident, setEmployerIsResident] = useState(true);
  const [basicSalary, setBasicSalary] = useState('');
  const [allowances, setAllowances] = useState<Allowance[]>([]);
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [isGovt, setIsGovt] = useState(false);
  const [retirement, setRetirement] = useState('');
  const [hasTerminal, setHasTerminal] = useState(false);
  const [directorFees, setDirectorFees] = useState('');

  function addAllowance() {
    setAllowances(a => [...a, { type: 'travel', amount: 0, isReimbursement: false, actualExpense: 0 }]);
  }
  function updateAllowance(i: number, k: keyof Allowance, v: unknown) {
    setAllowances(a => a.map((item, idx) => idx === i ? { ...item, [k]: v } : item));
  }
  function removeAllowance(i: number) { setAllowances(a => a.filter((_, idx) => idx !== i)); }

  function addBenefit() { setBenefits(b => [...b, { type: 'motor_vehicle', amount: 0 }]); }
  function updateBenefit(i: number, k: keyof Benefit, v: unknown) {
    setBenefits(b => b.map((item, idx) => idx === i ? { ...item, [k]: v } : item));
  }
  function removeBenefit(i: number) { setBenefits(b => b.filter((_, idx) => idx !== i)); }

  async function calculate() {
    setLoading(true);
    try {
      const input = {
        isEmployed: isEmployed ?? true,
        isResident: isResident ?? true,
        employerIsResident,
        monthlyBasicSalary: Number(basicSalary) || 0,
        allowances: allowances.filter(a => a.amount > 0),
        benefits: benefits.filter(b => b.amount > 0),
        isGovernmentEmployee: isGovt,
        retirementContributionMonthly: Number(retirement) || 0,
        hasTerminalPayment: hasTerminal,
        directorFees: Number(directorFees) || 0,
      };
      const res = await api.post('/calculator/employment', input);
      setResult(res.data);
      setStep(TOTAL_STEPS);
    } catch {
      toast.error('Calculation failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  }

  const n = (v: string) => Number(v) || 0;
  const grossEst = n(basicSalary) + n(directorFees) + allowances.reduce((s, a) => s + a.amount, 0) + benefits.reduce((s, b) => s + b.amount, 0);
  const retEst = n(retirement);
  const taxableEst = Math.max(0, grossEst - retEst);

  const canNext = [
    isEmployed !== null,
    isResident !== null,
    n(basicSalary) > 0,
    true, true, true,
    true, true, true,
  ];

  function next() { if (step < TOTAL_STEPS - 1) setStep(s => s + 1); else calculate(); }
  function back() { if (step > 1) setStep(s => s - 1); }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Employment Tax (PAYE) Calculator</h1>
          <p className="text-gray-500 text-sm mt-1">Tanzania Income Tax Act — PAYE + SDL calculation</p>
        </div>

        {/* Running estimate */}
        {step < TOTAL_STEPS && (
          <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 mb-6 flex gap-6 flex-wrap">
            <div><p className="text-xs text-gray-500">Estimated gross</p><p className="font-bold text-brand-700">{formatTZS(grossEst)}</p></div>
            <div><p className="text-xs text-gray-500">Estimated taxable</p><p className="font-bold text-brand-700">{formatTZS(taxableEst)}</p></div>
          </div>
        )}

        <WizardProgress currentStep={step} totalSteps={TOTAL_STEPS} stepLabels={STEP_LABELS} />

        {step < TOTAL_STEPS && (
          <div className="card">
            {/* Step 1 */}
            {step === 1 && (
              <div>
                <h2 className="text-lg font-bold mb-1">Are you employed by someone?</h2>
                <p className="text-gray-500 text-sm mb-6">Employment means: an employer exists, payments are periodic, and there is a contract or agreement.</p>
                <div className="flex gap-4">
                  {[true, false].map(v => (
                    <button key={String(v)} onClick={() => setIsEmployed(v)}
                      className={`flex-1 py-4 rounded-xl border-2 font-semibold transition-all ${isEmployed === v ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 hover:border-brand-300'}`}>
                      {v ? '✅ Yes, I am employed' : '❌ No (freelancer / business owner)'}
                    </button>
                  ))}
                </div>
                {isEmployed === false && <p className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">For business/self-employment income, use the <a href="/calculator/business" className="underline">Business Tax Calculator</a>.</p>}
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div>
                <h2 className="text-lg font-bold mb-1">Are you a resident of Tanzania?</h2>
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800 mb-5">
                  <p className="font-semibold mb-1">You are a Tanzania resident if:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>You have a permanent home in TZ and were present any part of the year, OR</li>
                    <li>You were present in TZ for 183+ days, OR</li>
                    <li>You averaged 122+ days/year over 3 years, OR</li>
                    <li>You are a government employee posted abroad</li>
                  </ul>
                </div>
                <div className="flex gap-4">
                  {[true, false].map(v => (
                    <button key={String(v)} onClick={() => setIsResident(v)}
                      className={`flex-1 py-4 rounded-xl border-2 font-semibold transition-all ${isResident === v ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 hover:border-brand-300'}`}>
                      {v ? '🏠 Yes, I am a resident' : '✈️ No, I am non-resident'}
                    </button>
                  ))}
                </div>
                {isResident === false && (
                  <div className="mt-4">
                    <label className="label">Is your employer resident in Tanzania or has a permanent establishment here?</label>
                    <div className="flex gap-4 mt-2">
                      {[true, false].map(v => (
                        <button key={String(v)} onClick={() => setEmployerIsResident(v)}
                          className={`flex-1 py-3 rounded-xl border-2 text-sm font-medium transition-all ${employerIsResident === v ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 hover:border-brand-300'}`}>
                          {v ? 'Yes — employer is TZ resident' : 'No — employer is non-resident'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <div>
                <h2 className="text-lg font-bold mb-1">What is your monthly salary?</h2>
                <p className="text-gray-500 text-sm mb-5">Enter your gross basic salary before any deductions (TZS).</p>
                <div>
                  <label className="label">Monthly basic salary (TZS)</label>
                  <input type="number" className="input-field text-lg" placeholder="e.g. 850000" value={basicSalary} onChange={e => setBasicSalary(e.target.value)} />
                </div>
                <div className="mt-4">
                  <label className="label">Director fees (if any) (TZS/month)</label>
                  <input type="number" className="input-field" placeholder="0" value={directorFees} onChange={e => setDirectorFees(e.target.value)} />
                </div>
              </div>
            )}

            {/* Step 4 */}
            {step === 4 && (
              <div>
                <h2 className="text-lg font-bold mb-1">Do you receive any allowances?</h2>
                <p className="text-gray-500 text-sm mb-5">Add all allowances you receive. If any are exact reimbursements of actual expenses, flag them in the next step.</p>
                <div className="space-y-3">
                  {allowances.map((a, i) => (
                    <div key={i} className="p-4 border border-gray-200 rounded-xl space-y-3">
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="label">Type</label>
                          <select className="input-field" value={a.type} onChange={e => updateAllowance(i, 'type', e.target.value)}>
                            {ALLOWANCE_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                          </select>
                        </div>
                        <div className="flex-1">
                          <label className="label">Monthly amount (TZS)</label>
                          <input type="number" className="input-field" value={a.amount || ''} onChange={e => updateAllowance(i, 'amount', Number(e.target.value))} />
                        </div>
                        <button onClick={() => removeAllowance(i)} className="self-end mb-1 text-red-400 hover:text-red-600 text-xs">Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={addAllowance} className="mt-3 text-brand-600 text-sm font-medium hover:text-brand-700">+ Add allowance</button>
                {allowances.length === 0 && <p className="text-gray-400 text-sm mt-2">No allowances — click Add to include one.</p>}
              </div>
            )}

            {/* Step 5 */}
            {step === 5 && (
              <div>
                <h2 className="text-lg font-bold mb-1">Are any allowances reimbursements?</h2>
                <p className="text-gray-500 text-sm mb-5">If you received an allowance to cover actual expenses incurred for your employer, enter the actual expense amount. Only the excess is taxable.</p>
                {allowances.length === 0 ? (
                  <p className="text-gray-400">No allowances entered — continue to next step.</p>
                ) : (
                  <div className="space-y-3">
                    {allowances.map((a, i) => (
                      <div key={i} className="p-4 border border-gray-200 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium capitalize">{a.type.replace('_', ' ')} allowance — {formatTZS(a.amount)}</p>
                          <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={a.isReimbursement} onChange={e => updateAllowance(i, 'isReimbursement', e.target.checked)} />
                            This is a reimbursement
                          </label>
                        </div>
                        {a.isReimbursement && (
                          <div>
                            <label className="label">Actual expense incurred (TZS)</label>
                            <input type="number" className="input-field" value={a.actualExpense || ''} onChange={e => updateAllowance(i, 'actualExpense', Number(e.target.value))} />
                            {a.actualExpense > 0 && a.amount > a.actualExpense && (
                              <p className="text-xs text-red-600 mt-1">Excess of {formatTZS(a.amount - a.actualExpense)} will be taxable</p>
                            )}
                            {a.actualExpense >= a.amount && <p className="text-xs text-green-600 mt-1">Full reimbursement — not taxable</p>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 6 */}
            {step === 6 && (
              <div>
                <h2 className="text-lg font-bold mb-1">Do you receive any non-cash benefits?</h2>
                <div className="space-y-3">
                  {benefits.map((b, i) => (
                    <div key={i} className="p-4 border border-gray-200 rounded-xl flex gap-3 items-end">
                      <div className="flex-1">
                        <label className="label">Benefit type</label>
                        <select className="input-field" value={b.type} onChange={e => updateBenefit(i, 'type', e.target.value)}>
                          {BENEFIT_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="label">Monthly value (TZS)</label>
                        <input type="number" className="input-field" value={b.amount || ''} onChange={e => updateBenefit(i, 'amount', Number(e.target.value))} />
                      </div>
                      <button onClick={() => removeBenefit(i)} className="mb-1 text-red-400 text-xs hover:text-red-600">Remove</button>
                    </div>
                  ))}
                </div>
                <button onClick={addBenefit} className="mt-3 text-brand-600 text-sm font-medium hover:text-brand-700">+ Add benefit</button>
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded-lg text-xs text-yellow-800">
                  <p><strong>Note:</strong> Medical benefits (non-discriminatory, for employee + spouse + 4 children) are NOT taxable. Motor vehicle benefit where employer claims NO deduction is also NOT taxable.</p>
                </div>
              </div>
            )}

            {/* Step 7 */}
            {step === 7 && (
              <div>
                <h2 className="text-lg font-bold mb-1">Are you a government employee?</h2>
                <p className="text-gray-500 text-sm mb-5">Government employees receive special treatment for housing, transport, responsibility, extra duty, overtime, hardship, and honoraria allowances — these are all exempt.</p>
                <div className="flex gap-4">
                  {[true, false].map(v => (
                    <button key={String(v)} onClick={() => setIsGovt(v)}
                      className={`flex-1 py-4 rounded-xl border-2 font-semibold transition-all ${isGovt === v ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 hover:border-brand-300'}`}>
                      {v ? '🏛️ Yes — government employee' : '🏢 No — private sector'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 8 */}
            {step === 8 && (
              <div>
                <h2 className="text-lg font-bold mb-1">Do you contribute to a retirement fund?</h2>
                <p className="text-gray-500 text-sm mb-5">NSSF contributions and approved retirement fund contributions are deductible from taxable income (actual or statutory — whichever is lesser).</p>
                <div>
                  <label className="label">Monthly retirement contribution (TZS) — enter 0 if none</label>
                  <input type="number" className="input-field" placeholder="e.g. 60000 (NSSF at 10% of salary)" value={retirement} onChange={e => setRetirement(e.target.value)} />
                  {basicSalary && <p className="text-xs text-gray-500 mt-1">NSSF statutory rate: 10% = {formatTZS(n(basicSalary) * 0.10)}/month</p>}
                </div>
              </div>
            )}

            {/* Step 9 */}
            {step === 9 && (
              <div>
                <h2 className="text-lg font-bold mb-1">Did you receive any termination payment this year?</h2>
                <p className="text-gray-500 text-sm mb-5">Terminal benefits (golden handshake, redundancy payment, etc.) are taxed separately using a special spreading formula.</p>
                <div className="flex gap-4">
                  {[true, false].map(v => (
                    <button key={String(v)} onClick={() => setHasTerminal(v)}
                      className={`flex-1 py-4 rounded-xl border-2 font-semibold transition-all ${hasTerminal === v ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 hover:border-brand-300'}`}>
                      {v ? '✅ Yes — I received terminal payment' : '❌ No terminal payment'}
                    </button>
                  ))}
                </div>
                {hasTerminal && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
                    After seeing your PAYE result, use the <a href="/calculator/terminal" className="underline font-medium">Terminal Benefits Calculator</a> for the full terminal benefits calculation with all 4 contract scenarios.
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
              <button onClick={back} disabled={step === 1} className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed">← Back</button>
              <button onClick={next} disabled={!canNext[step - 1]} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? 'Calculating...' : step === TOTAL_STEPS - 1 ? '🧮 Calculate PAYE →' : 'Continue →'}
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {step === TOTAL_STEPS && result && (
          <div>
            <ResultCard
              title="Employment Tax (PAYE) Results"
              calculationType="employment"
              summaryItems={[
                { label: 'Gross Monthly Income', value: result.grossIncome as number },
                { label: 'Taxable Income', value: result.taxableIncome as number },
                { label: 'PAYE (Monthly)', value: result.payeMonthly as number, highlight: true },
                { label: 'PAYE (Annual)', value: result.payeAnnual as number },
                { label: 'SDL (Employer pays)', value: result.sdl as number },
                { label: 'Net Take-Home', value: result.netIncome as number },
                { label: 'Effective Rate', value: `${result.effectiveRate}%` },
                { label: 'Excluded Amounts', value: result.excludedAmounts as number },
              ]}
              breakdown={result.breakdown as Parameters<typeof ResultCard>[0]['breakdown']}
              explanation={result.explanation as string}
            />
            <button onClick={() => { setStep(1); setResult(null); }} className="mt-4 btn-secondary w-full">
              Start New Calculation
            </button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
