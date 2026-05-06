'use client';
import { useState } from 'react';
import Navbar from '../../../components/ui/Navbar';
import Footer from '../../../components/ui/Footer';
import api from '../../../lib/api';
import { formatTZS, formatPercent } from '../../../lib/format';
import toast from 'react-hot-toast';
import { Building2 } from 'lucide-react';
import WizardProgress from '../../../components/ui/WizardProgress';

type Mode = 'tax' | 'installment';

interface CorporateResult {
  applicableRate: number;
  entityType: string;
  taxPayable: number;
  minimumTaxBasis?: string;
  installmentAmount?: number;
  isNilInstallment?: boolean;
  explanation: string;
}

const ENTITY_TYPES = [
  { value: 'Standard resident company',                    label: 'Standard Resident Company',             rate: '30%' },
  { value: 'Non-resident company',                         label: 'Non-Resident Company',                  rate: '30%' },
  { value: 'New DSE listed company (30%+ public float)',   label: 'New DSE-Listed Company (≥30% float)',   rate: '25%' },
  { value: 'Motor vehicle/tractor assembler',              label: 'Motor Vehicle / Tractor Assembler',     rate: '10%' },
  { value: 'Pharmaceuticals/leather manufacturer',         label: 'Pharmaceuticals / Leather Manufacturer',rate: '20%' },
];

export default function CorporateTaxPage() {
  const [mode, setMode] = useState<Mode>('tax');
  const [step, setStep] = useState(1);
  const totalSteps = 4;
  const steps = ['Entity', 'Income', 'Adjustments', 'Results'];

  // Tax calc fields
  const [entityType, setEntityType] = useState(ENTITY_TYPES[0].value);
  const [taxableIncome, setTaxableIncome] = useState('');
  const [annualTurnover, setAnnualTurnover] = useState('');
  const [priorYearLosses, setPriorYearLosses] = useState('0');
  const [consecutiveLossYears, setConsecutiveLossYears] = useState('0');
  const [isRepatriatedIncome, setIsRepatriatedIncome] = useState(false);
  const [isExemptControlled, setIsExemptControlled] = useState(false);

  // Installment fields
  const [installmentNumber, setInstallmentNumber] = useState('1');
  const [estimatedAnnualTax, setEstimatedAnnualTax] = useState('');
  const [taxAlreadyPaid, setTaxAlreadyPaid] = useState('0');
  const [remainingInstallments, setRemainingInstallments] = useState('4');
  const [isAgriculturalSeasonal, setIsAgriculturalSeasonal] = useState(false);

  const [result, setResult] = useState<CorporateResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function calculate() {
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        entityType,
        taxableIncome: Number(taxableIncome) || 0,
        annualTurnover: Number(annualTurnover) || 0,
        priorYearLosses: Number(priorYearLosses) || 0,
        consecutiveLossYears: Number(consecutiveLossYears) || 0,
        isRepatriatedIncome,
        isExemptControlled,
      };
      if (mode === 'installment') {
        payload.installmentNumber = Number(installmentNumber);
        payload.estimatedAnnualTax = Number(estimatedAnnualTax) || 0;
        payload.taxAlreadyPaid = Number(taxAlreadyPaid) || 0;
        payload.remainingInstallments = Number(remainingInstallments) || 1;
        payload.isAgriculturalSeasonal = isAgriculturalSeasonal;
      }
      const { data } = await api.post('/calculator/corporate', payload);
      setResult(data);
      setStep(totalSteps);
    } catch { toast.error('Calculation failed'); }
    setLoading(false);
  }

  function reset() { setResult(null); setStep(1); setTaxableIncome(''); setAnnualTurnover(''); setPriorYearLosses('0'); setConsecutiveLossYears('0'); setEstimatedAnnualTax(''); setTaxAlreadyPaid('0'); }

  const netIncome = Math.max(0, (Number(taxableIncome) || 0) - (Number(priorYearLosses) || 0));

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-2">
          <Building2 size={32} className="text-brand-600" />
          <h1 className="text-3xl font-bold text-gray-900">Corporate Tax Calculator</h1>
        </div>
        <p className="text-gray-500 mb-6">S.4 ITA — income tax for resident and non-resident companies</p>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-6">
          {(['tax', 'installment'] as Mode[]).map(m => (
            <button key={m} onClick={() => { setMode(m); setResult(null); setStep(1); }}
              className={`px-5 py-2 rounded-lg text-sm font-medium ${mode === m ? 'bg-brand-600 text-white' : 'bg-white border text-gray-700 hover:border-brand-400'}`}>
              {m === 'tax' ? 'Annual Tax Liability' : 'Quarterly Installment'}
            </button>
          ))}
        </div>

        {step < totalSteps && <WizardProgress currentStep={step} totalSteps={totalSteps - 1} steps={steps.slice(0, -1)} />}

        {/* Step 1 — Entity type */}
        {step === 1 && (
          <div className="card space-y-5">
            <h2 className="text-lg font-semibold">Step 1: Entity Type</h2>
            <div className="space-y-2">
              {ENTITY_TYPES.map(e => (
                <label key={e.value} className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer ${entityType === e.value ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="flex items-center gap-3">
                    <input type="radio" name="entity" checked={entityType === e.value} onChange={() => setEntityType(e.value)} className="text-brand-600" />
                    <span className="font-medium text-gray-800">{e.label}</span>
                  </div>
                  <span className="text-sm font-bold text-brand-700 bg-brand-100 px-2 py-0.5 rounded">{e.rate}</span>
                </label>
              ))}
            </div>
            <div className="flex items-center gap-3 mt-2">
              <input type="checkbox" id="repatriated" checked={isRepatriatedIncome} onChange={e => setIsRepatriatedIncome(e.target.checked)} className="w-4 h-4 text-brand-600" />
              <label htmlFor="repatriated" className="text-sm text-gray-700">This is repatriated income of a domestic permanent establishment (10% rate)</label>
            </div>
            <button onClick={() => setStep(2)} className="btn-primary w-full">Next →</button>
          </div>
        )}

        {/* Step 2 — Income */}
        {step === 2 && (
          <div className="card space-y-5">
            <h2 className="text-lg font-semibold">Step 2: Income & Turnover</h2>
            <div>
              <label className="label">Taxable Income (TZS)</label>
              <input type="number" className="input-field" value={taxableIncome} onChange={e => setTaxableIncome(e.target.value)} placeholder="Net chargeable income before loss relief" />
            </div>
            <div>
              <label className="label">Annual Turnover / Gross Revenue (TZS)</label>
              <input type="number" className="input-field" value={annualTurnover} onChange={e => setAnnualTurnover(e.target.value)} placeholder="Needed for minimum tax calculation" />
              <p className="text-xs text-gray-400 mt-1">Used if perpetual unrelieved loss applies (0.5% of turnover minimum tax).</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="btn-secondary flex-1">← Back</button>
              <button onClick={() => setStep(3)} disabled={!taxableIncome && !annualTurnover} className="btn-primary flex-1">Next →</button>
            </div>
          </div>
        )}

        {/* Step 3 — Adjustments */}
        {step === 3 && (
          <div className="card space-y-5">
            <h2 className="text-lg font-semibold">Step 3: Loss Relief & Adjustments</h2>
            <div>
              <label className="label">Prior Year Losses Carried Forward (TZS)</label>
              <input type="number" className="input-field" value={priorYearLosses} onChange={e => setPriorYearLosses(e.target.value)} placeholder="0" />
            </div>
            <div>
              <label className="label">Consecutive Loss Years (for perpetual loss minimum tax)</label>
              <input type="number" className="input-field" value={consecutiveLossYears} onChange={e => setConsecutiveLossYears(e.target.value)} placeholder="0" min="0" max="10" />
              <p className="text-xs text-gray-400 mt-1">If 3 or more consecutive loss years, minimum tax of 0.5% of turnover applies.</p>
            </div>
            {(Number(priorYearLosses) > 0 || Number(taxableIncome) > 0) && (
              <div className="bg-gray-50 rounded-lg p-4 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Taxable income</span><span className="font-medium">{formatTZS(Number(taxableIncome) || 0)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Prior year losses</span><span className="font-medium text-red-600">−{formatTZS(Number(priorYearLosses) || 0)}</span></div>
                <div className="flex justify-between font-bold border-t pt-2 mt-2"><span>Net taxable income</span><span>{formatTZS(netIncome)}</span></div>
              </div>
            )}

            {mode === 'installment' && (
              <>
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-sm text-gray-700 mb-3">Quarterly Installment Details</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Installment Number</label>
                      <select className="input-field" value={installmentNumber} onChange={e => setInstallmentNumber(e.target.value)}>
                        {[1,2,3,4].map(n => <option key={n} value={n}>Q{n} — {['March','June','September','December'][n-1]}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Remaining Installments (B)</label>
                      <input type="number" className="input-field" value={remainingInstallments} min="1" max="4" onChange={e => setRemainingInstallments(e.target.value)} />
                    </div>
                    <div>
                      <label className="label">Estimated Annual Tax (A)</label>
                      <input type="number" className="input-field" value={estimatedAnnualTax} onChange={e => setEstimatedAnnualTax(e.target.value)} placeholder="Total tax for the year" />
                    </div>
                    <div>
                      <label className="label">Tax Already Paid (C)</label>
                      <input type="number" className="input-field" value={taxAlreadyPaid} onChange={e => setTaxAlreadyPaid(e.target.value)} placeholder="0" />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm mt-3">
                    <input type="checkbox" checked={isAgriculturalSeasonal} onChange={e => setIsAgriculturalSeasonal(e.target.checked)} className="w-4 h-4" />
                    Agricultural seasonal business (Q1 & Q2 = NIL)
                  </label>
                </div>
              </>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="btn-secondary flex-1">← Back</button>
              <button onClick={calculate} disabled={loading} className="btn-primary flex-1">{loading ? 'Calculating...' : 'Calculate →'}</button>
            </div>
          </div>
        )}

        {/* Results */}
        {step === totalSteps && result && (
          <div className="space-y-6">
            <div className={`card border-2 ${result.taxPayable === 0 && result.isNilInstallment ? 'border-blue-300' : 'border-brand-300'}`}>
              <h2 className="font-semibold text-lg mb-4">{result.entityType}</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-brand-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-500">Tax Rate</p>
                  <p className="text-2xl font-bold text-brand-700">{formatPercent(result.applicableRate)}</p>
                </div>
                <div className={`rounded-lg p-4 text-center ${result.taxPayable > 0 ? 'bg-orange-50' : 'bg-green-50'}`}>
                  <p className="text-xs text-gray-500">{mode === 'installment' && result.installmentAmount !== undefined ? 'Installment Amount' : 'Tax Payable'}</p>
                  <p className={`text-2xl font-bold ${result.taxPayable > 0 ? 'text-orange-700' : 'text-green-700'}`}>
                    {mode === 'installment' && result.installmentAmount !== undefined
                      ? (result.isNilInstallment ? 'NIL' : formatTZS(result.installmentAmount))
                      : formatTZS(result.taxPayable)}
                  </p>
                </div>
              </div>
              {result.minimumTaxBasis && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 mb-3">
                  ⚠️ Minimum tax applies: {result.minimumTaxBasis}
                </div>
              )}
              {result.isNilInstallment && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 mb-3">
                  NIL installment — estimated annual tax or installment amount is below threshold (TZS 50,000 / TZS 12,500).
                </div>
              )}
              <p className="text-sm text-gray-600">{result.explanation}</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-sm text-blue-800">
              <p className="font-semibold mb-2">Quarterly Installment Deadlines</p>
              <div className="grid grid-cols-2 gap-2">
                {['Q1 — 31 March', 'Q2 — 30 June', 'Q3 — 30 September', 'Q4 — 31 December'].map(d => (
                  <p key={d} className="text-xs">• {d}</p>
                ))}
              </div>
              <p className="text-xs mt-2">Formula: (A − C) ÷ B where A = estimated annual tax, C = tax already paid, B = remaining installments.</p>
            </div>

            <button onClick={reset} className="btn-secondary w-full">New Calculation</button>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
