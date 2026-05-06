'use client';
import { useState } from 'react';
import Navbar from '../../../components/ui/Navbar';
import Footer from '../../../components/ui/Footer';
import api from '../../../lib/api';
import { formatTZS, formatPercent } from '../../../lib/format';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import WizardProgress from '../../../components/ui/WizardProgress';

interface Partner { name: string; percentageShare: string; tinNumber: string }

export default function PartnershipPage() {
  const [step, setStep] = useState(1);
  const totalSteps = 5;
  const steps = ['Partners', 'Gross Income', 'Deductions', 'WHT Paid', 'Results'];

  const [partnershipName, setPartnershipName] = useState('');
  const [yearOfIncome, setYearOfIncome] = useState(new Date().getFullYear().toString());
  const [partners, setPartners] = useState<Partner[]>([
    { name: '', percentageShare: '50', tinNumber: '' },
    { name: '', percentageShare: '50', tinNumber: '' },
  ]);
  const [grossIncome, setGrossIncome] = useState('');
  const [deductions, setDeductions] = useState('');
  const [whtPaid, setWhtPaid] = useState('0');
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  function addPartner() {
    setPartners([...partners, { name: '', percentageShare: '0', tinNumber: '' }]);
  }

  function removePartner(i: number) {
    setPartners(partners.filter((_, idx) => idx !== i));
  }

  function updatePartner(i: number, field: keyof Partner, value: string) {
    const updated = [...partners];
    updated[i] = { ...updated[i], [field]: value };
    setPartners(updated);
  }

  const totalShare = partners.reduce((s, p) => s + (Number(p.percentageShare) || 0), 0);

  async function calculate() {
    if (Math.abs(totalShare - 100) > 0.01) { toast.error(`Shares must sum to 100% (currently ${totalShare}%)`); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/calculator/partnership', {
        partnershipName,
        yearOfIncome: Number(yearOfIncome),
        grossBusinessIncome: Number(grossIncome),
        allowableDeductions: Number(deductions) || 0,
        whtPaidByPartnership: Number(whtPaid) || 0,
        partners: partners.map(p => ({ name: p.name, percentageShare: Number(p.percentageShare), tinNumber: p.tinNumber })),
      });
      setResult(data);
      setStep(5);
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Calculation failed');
    }
    setLoading(false);
  }

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Partnership Taxation</h1>
        <p className="text-gray-500 mb-6">S.48–51 ITA — partnership income allocated to partners</p>

        <WizardProgress currentStep={step} totalSteps={totalSteps} steps={steps} />

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 mb-6">
          <strong>Key principle (S.48 ITA):</strong> The partnership itself pays NO income tax. Tax flows through to each individual partner proportionate to their share.
        </div>

        {step === 1 && (
          <div className="card space-y-5">
            <h2 className="text-lg font-semibold">Step 1: Partnership Details & Partners</h2>
            <div>
              <label className="label">Partnership Name</label>
              <input className="input-field" value={partnershipName} onChange={e => setPartnershipName(e.target.value)} placeholder="e.g. Juma & Associates" />
            </div>
            <div>
              <label className="label">Year of Income</label>
              <input type="number" className="input-field" value={yearOfIncome} onChange={e => setYearOfIncome(e.target.value)} />
            </div>
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="label">Partners</label>
                <button onClick={addPartner} className="flex items-center gap-1 text-brand-600 text-sm font-medium hover:underline">
                  <Plus size={16} />Add partner
                </button>
              </div>
              {partners.map((p, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 mb-3 items-center">
                  <input className="input-field col-span-4" placeholder="Partner name" value={p.name} onChange={e => updatePartner(i, 'name', e.target.value)} />
                  <input type="number" className="input-field col-span-3" placeholder="% share" value={p.percentageShare} onChange={e => updatePartner(i, 'percentageShare', e.target.value)} />
                  <input className="input-field col-span-4" placeholder="TIN (optional)" value={p.tinNumber} onChange={e => updatePartner(i, 'tinNumber', e.target.value)} />
                  <button onClick={() => removePartner(i)} className="col-span-1 text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                </div>
              ))}
              <div className={`text-sm font-medium ${Math.abs(totalShare - 100) < 0.01 ? 'text-green-600' : 'text-red-500'}`}>
                Total shares: {totalShare}% {Math.abs(totalShare - 100) < 0.01 ? '✓' : '(must equal 100%)'}
              </div>
            </div>
            <button onClick={() => setStep(2)} disabled={!partnershipName || partners.length < 2} className="btn-primary w-full">Next →</button>
          </div>
        )}

        {step === 2 && (
          <div className="card space-y-5">
            <h2 className="text-lg font-semibold">Step 2: Partnership Gross Business Income</h2>
            <div>
              <label className="label">Gross Business Income (TZS)</label>
              <input type="number" className="input-field" value={grossIncome} onChange={e => setGrossIncome(e.target.value)} placeholder="e.g. 50000000" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="btn-secondary flex-1">← Back</button>
              <button onClick={() => setStep(3)} disabled={!grossIncome} className="btn-primary flex-1">Next →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="card space-y-5">
            <h2 className="text-lg font-semibold">Step 3: Allowable Deductions</h2>
            <div>
              <label className="label">Total Allowable Deductions (TZS)</label>
              <input type="number" className="input-field" value={deductions} onChange={e => setDeductions(e.target.value)} placeholder="0" />
              <p className="text-xs text-gray-400 mt-1">Include all business expenses, depreciation, etc.</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-sm">
              <div className="flex justify-between"><span>Gross income</span><span className="font-medium">{formatTZS(Number(grossIncome))}</span></div>
              <div className="flex justify-between"><span>Deductions</span><span className="font-medium text-red-600">−{formatTZS(Number(deductions) || 0)}</span></div>
              <div className="flex justify-between font-bold border-t pt-2 mt-2"><span>Net income</span><span>{formatTZS(Math.max(0, Number(grossIncome) - (Number(deductions) || 0)))}</span></div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="btn-secondary flex-1">← Back</button>
              <button onClick={() => setStep(4)} className="btn-primary flex-1">Next →</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="card space-y-5">
            <h2 className="text-lg font-semibold">Step 4: WHT Paid by Partnership</h2>
            <div>
              <label className="label">Withholding Tax Paid by Partnership (TZS)</label>
              <input type="number" className="input-field" value={whtPaid} onChange={e => setWhtPaid(e.target.value)} placeholder="0" />
              <p className="text-xs text-gray-400 mt-1">This will be proportionally allocated to each partner as a tax credit.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="btn-secondary flex-1">← Back</button>
              <button onClick={calculate} disabled={loading} className="btn-primary flex-1">{loading ? 'Calculating...' : 'Calculate →'}</button>
            </div>
          </div>
        )}

        {step === 5 && result && (
          <div className="space-y-6">
            <div className={`card border-2 ${result.isLoss ? 'border-red-300' : 'border-green-300'}`}>
              <h2 className="text-lg font-semibold mb-4">Partnership Results — {partnershipName}</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">Net {result.isLoss ? 'Loss' : 'Income'}</p>
                  <p className={`text-2xl font-bold ${result.isLoss ? 'text-red-600' : 'text-green-700'}`}>
                    {formatTZS((result.isLoss ? result.partnershipLoss : result.partnershipIncome) as number)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-500 mb-1">WHT Allocated</p>
                  <p className="text-2xl font-bold text-brand-600">{formatTZS(result.totalWHTAllocated as number)}</p>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 mb-4">
                {result.note as string}
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold mb-4">Partner Allocations</h3>
              <div className="space-y-4">
                {(result.partners as Array<{
                  partnerName: string; percentageShare: number; allocatedIncome: number;
                  allocatedWHTCredit: number; estimatedPersonalTax: number; netTaxPayable: number;
                }>).map((p, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold">{p.partnerName}</p>
                        <p className="text-xs text-gray-500">{formatPercent(p.percentageShare / 100)} share</p>
                      </div>
                      <p className={`text-xl font-bold ${p.allocatedIncome >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                        {formatTZS(Math.abs(p.allocatedIncome))}
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center text-xs">
                      <div><p className="text-gray-400">WHT Credit</p><p className="font-medium">{formatTZS(p.allocatedWHTCredit)}</p></div>
                      <div><p className="text-gray-400">Est. Tax</p><p className="font-medium">{formatTZS(p.estimatedPersonalTax)}</p></div>
                      <div><p className="text-gray-400">Net Tax Due</p><p className="font-bold text-brand-700">{formatTZS(p.netTaxPayable)}</p></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => setStep(1)} className="btn-secondary w-full">Start New Calculation</button>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
