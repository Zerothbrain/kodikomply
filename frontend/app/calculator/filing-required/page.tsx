'use client';
import { useState } from 'react';
import Navbar from '../../../components/ui/Navbar';
import Footer from '../../../components/ui/Footer';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import { FileText, CheckCircle, XCircle } from 'lucide-react';

interface FilingResult {
  mustFile: boolean;
  reason: string;
  deadline: string;
  whatToAttach: string[];
  legalRef: string;
}

const INCOME_TYPES = [
  { value: 'employment_paye', label: 'Employment income (PAYE fully withheld by employer)' },
  { value: 'capital_gains_instalment', label: 'Capital gains on land/shares/mineral rights (single instalment)' },
  { value: 'business', label: 'Business income (self-employed, sole trader, partnership)' },
  { value: 'investment', label: 'Investment income (dividends, interest, rent)' },
  { value: 'final_wht', label: 'Income subject to final withholding tax only' },
  { value: 'digital_services_wht', label: 'Digital services income (S.116 final withholding)' },
  { value: 'foreign', label: 'Foreign source income' },
  { value: 'other', label: 'Other income types' },
];

export default function FilingRequiredPage() {
  const [isResident, setIsResident] = useState<boolean | null>(null);
  const [hasTaxPayable, setHasTaxPayable] = useState<boolean | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [result, setResult] = useState<FilingResult | null>(null);
  const [loading, setLoading] = useState(false);

  function toggleType(v: string) {
    setSelectedTypes(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
  }

  async function check() {
    if (isResident === null || hasTaxPayable === null) { toast.error('Answer all questions'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/calculator/filing-required', {
        isResident,
        hasTaxPayable,
        incomeTypes: selectedTypes,
      });
      setResult(data);
    } catch { toast.error('Check failed'); }
    setLoading(false);
  }

  const radioClass = (active: boolean) => `flex-1 flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer text-sm font-medium ${active ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`;

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-2">
          <FileText size={32} className="text-brand-600" />
          <h1 className="text-3xl font-bold text-gray-900">Do I Need to File a Return?</h1>
        </div>
        <p className="text-gray-500 mb-8">S.117–118 ITA Cap 332 R.E.2023 — determine if you are required to file an annual income tax return.</p>

        {!result ? (
          <div className="card space-y-6">
            <div>
              <label className="label mb-2">1. Are you a resident or non-resident for tax purposes?</label>
              <div className="flex gap-3">
                <label className={radioClass(isResident === true)} onClick={() => setIsResident(true)}>
                  <input type="radio" name="resident" checked={isResident === true} readOnly className="text-brand-600" /> Resident
                </label>
                <label className={radioClass(isResident === false)} onClick={() => setIsResident(false)}>
                  <input type="radio" name="resident" checked={isResident === false} readOnly className="text-brand-600" /> Non-Resident
                </label>
              </div>
            </div>

            <div>
              <label className="label mb-2">2. Do you have any income tax payable for this year of income?</label>
              <div className="flex gap-3">
                <label className={radioClass(hasTaxPayable === true)} onClick={() => setHasTaxPayable(true)}>
                  <input type="radio" name="taxpayable" checked={hasTaxPayable === true} readOnly className="text-brand-600" /> Yes — tax is payable
                </label>
                <label className={radioClass(hasTaxPayable === false)} onClick={() => setHasTaxPayable(false)}>
                  <input type="radio" name="taxpayable" checked={hasTaxPayable === false} readOnly className="text-brand-600" /> No — zero tax payable
                </label>
              </div>
            </div>

            <div>
              <label className="label mb-2">3. What types of income did you receive this year? <span className="font-normal text-gray-400">(select all that apply)</span></label>
              <div className="space-y-2">
                {INCOME_TYPES.map(t => (
                  <label key={t.value} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer text-sm ${selectedTypes.includes(t.value) ? 'border-brand-400 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="checkbox" checked={selectedTypes.includes(t.value)} onChange={() => toggleType(t.value)} className="text-brand-600 w-4 h-4" />
                    {t.label}
                  </label>
                ))}
              </div>
            </div>

            <button onClick={check} disabled={loading} className="btn-primary w-full">
              {loading ? 'Checking...' : 'Check Filing Requirement'}
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className={`card border-2 ${result.mustFile ? 'border-orange-300 bg-orange-50' : 'border-green-300 bg-green-50'}`}>
              <div className="flex items-center gap-3 mb-3">
                {result.mustFile ? <XCircle size={28} className="text-orange-500" /> : <CheckCircle size={28} className="text-green-600" />}
                <p className={`text-xl font-bold ${result.mustFile ? 'text-orange-700' : 'text-green-700'}`}>
                  {result.mustFile ? 'You ARE required to file a return' : 'You are NOT required to file'}
                </p>
              </div>
              <p className="text-sm text-gray-700">{result.reason}</p>
            </div>

            {result.mustFile && (
              <>
                <div className="card">
                  <p className="font-semibold mb-2">Filing Deadline</p>
                  <p className="text-sm text-gray-700 bg-blue-50 rounded-lg p-3 border border-blue-100">{result.deadline}</p>
                </div>

                <div className="card">
                  <p className="font-semibold mb-3">What to Attach</p>
                  <ul className="space-y-2">
                    {result.whatToAttach.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="w-5 h-5 bg-brand-100 text-brand-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i+1}</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            {!result.mustFile && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                <p className="font-semibold mb-1">Note</p>
                <p>You are not required to file unless the Commissioner General specifically requests it. Keep records of all income and taxes withheld in case you are requested to file.</p>
              </div>
            )}

            <p className="text-xs text-gray-400 text-center">{result.legalRef}</p>
            <button onClick={() => setResult(null)} className="btn-secondary w-full">Check Again</button>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
