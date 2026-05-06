'use client';
import { useState } from 'react';
import Navbar from '../../../components/ui/Navbar';
import Footer from '../../../components/ui/Footer';
import { formatTZS } from '../../../lib/format';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import {
  Store, CheckCircle2, XCircle, AlertTriangle,
  TrendingDown, BookOpen, Calendar, ChevronRight,
  Info, Loader2,
} from 'lucide-react';

interface PresumptiveBand {
  range: string;
  nonS43Tax: string;
  s43Tax: string;
}

interface PresumptiveResult {
  annualTurnover: number;
  isS43Compliant: boolean;
  isEligible: boolean;
  isNil: boolean;
  taxPayable: number;
  effectiveRate: number;
  band: string;
  calculation: string;
  complianceNote: string;
  savingsByComplying: number;
  deadlineNote: string;
  statuteRef: string;
  fullTable: PresumptiveBand[];
}

const ENTITY_OPTIONS = [
  { value: 'individual', label: 'Individual / Sole Proprietor' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'other', label: 'Other (Company / NGO)' },
];

export default function PresumptiveCalculator() {
  const [turnover, setTurnover] = useState('');
  const [entityType, setEntityType] = useState<'individual' | 'partnership' | 'other'>('individual');
  const [isS43, setIsS43] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PresumptiveResult | null>(null);

  const n = (v: string) => Number(v.replace(/,/g, '')) || 0;

  async function calculate() {
    if (!turnover || isS43 === null) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/calculator/presumptive', {
        annualTurnover: n(turnover),
        isS43Compliant: isS43,
        entityType,
      });
      setResult(res.data);
    } catch {
      toast.error('Calculation failed — please try again');
    } finally {
      setLoading(false);
    }
  }

  const isCompanyOrNGO = entityType === 'other';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="flex-1 py-12 px-4">
        <div className="max-w-3xl mx-auto">

          {/* Header */}
          <div className="mb-8 animate-fade-up">
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
              <a href="/dashboard" className="hover:text-brand-600 transition-colors">Dashboard</a>
              <ChevronRight size={14} />
              <span className="text-gray-600">Presumptive Tax Calculator</span>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-600 flex items-center justify-center flex-shrink-0 shadow-glow-sm">
                <Store size={22} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Presumptive Tax Calculator</h1>
                <p className="text-gray-500 text-sm mt-1">
                  S.4(2) First Schedule ITA Cap 332 · For small businesses with annual turnover below TZS 100,000,000
                </p>
              </div>
            </div>
          </div>

          {/* Company / NGO Warning */}
          {isCompanyOrNGO && (
            <div className="mb-6 flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl animate-fade-up">
              <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> Presumptive tax applies only to individuals, sole proprietors, and partnerships.
                Companies and NGOs are taxed under standard corporate income tax rules regardless of turnover size.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

            {/* Input form */}
            <div className="lg:col-span-3 card animate-fade-up">
              <h2 className="font-semibold text-gray-800 mb-5 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center">1</span>
                Your Details
              </h2>

              {/* Entity type */}
              <div className="mb-5">
                <label className="label">Taxpayer type</label>
                <div className="grid grid-cols-1 gap-2 mt-1">
                  {ENTITY_OPTIONS.map(o => (
                    <button
                      key={o.value}
                      onClick={() => setEntityType(o.value as typeof entityType)}
                      className={`text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                        entityType === o.value
                          ? 'border-brand-500 bg-brand-50 text-brand-700'
                          : 'border-gray-100 bg-white text-gray-700 hover:border-gray-200'
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Turnover */}
              <div className="mb-5">
                <label className="label">Annual turnover (TZS)</label>
                <input
                  type="number"
                  placeholder="e.g. 25000000"
                  value={turnover}
                  onChange={e => setTurnover(e.target.value)}
                  className="input mt-1"
                  disabled={isCompanyOrNGO}
                />
                <p className="text-xs text-gray-400 mt-1">Total revenue / sales in the income year — before any deductions</p>
              </div>

              {/* S.43 compliance */}
              <div className="mb-6">
                <label className="label flex items-center gap-1">
                  Do you maintain proper books of account?
                  <span className="text-xs font-normal text-gray-400 ml-1">(S.43 TAA compliance)</span>
                </label>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <button
                    onClick={() => setIsS43(true)}
                    disabled={isCompanyOrNGO}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      isS43 === true
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-gray-100 bg-white text-gray-600 hover:border-gray-200'
                    }`}
                  >
                    <CheckCircle2 size={16} className={isS43 === true ? 'text-brand-500' : 'text-gray-300'} />
                    Yes — I keep records
                  </button>
                  <button
                    onClick={() => setIsS43(false)}
                    disabled={isCompanyOrNGO}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      isS43 === false
                        ? 'border-red-400 bg-red-50 text-red-700'
                        : 'border-gray-100 bg-white text-gray-600 hover:border-gray-200'
                    }`}
                  >
                    <XCircle size={16} className={isS43 === false ? 'text-red-400' : 'text-gray-300'} />
                    No — no records
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  S.43 TAA requires: stock records, daily cashbook, and basic accounts. Compliant taxpayers pay lower rates.
                </p>
              </div>

              <button
                onClick={calculate}
                disabled={loading || isCompanyOrNGO || !turnover || isS43 === null}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {loading ? (
                  <><Loader2 size={16} className="animate-spin" /> Calculating...</>
                ) : (
                  <>Calculate Presumptive Tax <ChevronRight size={16} /></>
                )}
              </button>
            </div>

            {/* Rate table sidebar */}
            <div className="lg:col-span-2 space-y-4">
              <div className="card animate-fade-up">
                <h3 className="font-semibold text-gray-800 mb-3 text-sm flex items-center gap-2">
                  <BookOpen size={14} className="text-brand-600" />
                  Rate Table (First Schedule)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2 text-gray-500 font-medium">Turnover Band</th>
                        <th className="text-right py-2 text-red-500 font-medium">Non-S43</th>
                        <th className="text-right py-2 text-brand-600 font-medium">S43 ✓</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {[
                        { range: 'Below 4M',     nonS43: 'NIL',          s43: 'NIL' },
                        { range: '4M – 7M',      nonS43: '100,000',      s43: '3% of excess over 4M' },
                        { range: '7M – 11M',     nonS43: '250,000',      s43: '90k + 3% > 7M' },
                        { range: '11M – 100M',   nonS43: '3.5%',         s43: '3.5%' },
                      ].map(row => (
                        <tr key={row.range}>
                          <td className="py-2 text-gray-600 num">{row.range}</td>
                          <td className="py-2 text-right text-red-600 num font-medium">{row.nonS43}</td>
                          <td className="py-2 text-right text-brand-600 num font-medium">{row.s43}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card animate-fade-up bg-brand-50 border border-brand-100">
                <div className="flex gap-2">
                  <Info size={14} className="text-brand-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-brand-700 space-y-1">
                    <p><strong>Who qualifies?</strong> Individuals, sole proprietors, and partnerships with annual turnover ≤ TZS 100M.</p>
                    <p><strong>Companies and NGOs</strong> always file under standard business income tax rules.</p>
                    <p><strong>Due date:</strong> Annual return and payment by 30 June each year.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Result */}
          {result && (
            <div className="mt-8 space-y-5 animate-fade-up">

              {/* Not eligible */}
              {!result.isEligible && (
                <div className="card border-l-4 border-l-amber-400">
                  <div className="flex gap-3">
                    <AlertTriangle size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-800">Presumptive tax does not apply</p>
                      <p className="text-sm text-gray-500 mt-1">{result.calculation}</p>
                      <a href="/calculator/business" className="inline-flex items-center gap-1 text-xs text-brand-600 font-medium mt-2 hover:underline">
                        Go to Business Income Tax Calculator <ChevronRight size={12} />
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* NIL result */}
              {result.isEligible && result.isNil && (
                <div className="card border-l-4 border-l-brand-500">
                  <div className="flex gap-3">
                    <CheckCircle2 size={20} className="text-brand-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-gray-800">NIL — No presumptive tax due</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Turnover of {formatTZS(result.annualTurnover)} is below the TZS 4,000,000 threshold. No presumptive tax payable.
                      </p>
                      <p className="text-xs text-gray-400 mt-2">{result.statuteRef}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Main result */}
              {result.isEligible && !result.isNil && (
                <>
                  {/* Tax payable hero */}
                  <div className="card bg-gradient-to-br from-brand-700 to-brand-900 text-white shadow-glow">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-brand-200 text-sm font-medium mb-1">Annual Presumptive Tax Payable</p>
                        <p className="text-4xl font-black num tracking-tight">{formatTZS(result.taxPayable)}</p>
                        <p className="text-brand-200 text-sm mt-2">{result.calculation}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-brand-300 text-xs mb-1">Effective rate</p>
                        <p className="text-2xl font-bold num">{(result.effectiveRate * 100).toFixed(2)}%</p>
                        <p className="text-brand-300 text-xs mt-1">{result.band}</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-brand-600 flex items-center gap-2">
                      <Calendar size={14} className="text-brand-300" />
                      <span className="text-brand-200 text-xs">{result.deadlineNote}</span>
                    </div>
                  </div>

                  {/* Compliance note */}
                  <div className={`card border-l-4 ${result.isS43Compliant ? 'border-l-brand-500' : 'border-l-amber-400'}`}>
                    <div className="flex gap-3">
                      {result.isS43Compliant
                        ? <CheckCircle2 size={18} className="text-brand-500 flex-shrink-0 mt-0.5" />
                        : <TrendingDown size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                      }
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">
                          {result.isS43Compliant ? 'S.43 Compliant — Lower Rate Applied' : 'Non-Compliant Rate — Higher Tax'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">{result.complianceNote}</p>

                        {!result.isS43Compliant && result.savingsByComplying > 0 && (
                          <div className="mt-3 p-3 bg-amber-50 rounded-lg">
                            <p className="text-xs font-semibold text-amber-800">
                              Potential saving by maintaining records: {formatTZS(result.savingsByComplying)} per year
                            </p>
                            <p className="text-xs text-amber-700 mt-1">
                              Stock register + daily cashbook + basic income & expenditure account satisfies S.43 TAA.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Full rate table comparison */}
                  <div className="card">
                    <h3 className="font-semibold text-gray-800 mb-4 text-sm">Full Rate Table — Your Position</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-100">
                            <th className="text-left py-3 pr-4 text-gray-500 font-medium">Turnover Band</th>
                            <th className="text-right py-3 px-4 text-red-500 font-medium">Not S.43 Compliant</th>
                            <th className="text-right py-3 pl-4 text-brand-600 font-medium">S.43 Compliant</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {result.fullTable.map((row, i) => (
                            <tr key={i} className={
                              result.band && (
                                (result.isS43Compliant && row.s43Tax === result.band) ||
                                (!result.isS43Compliant && row.nonS43Tax === result.band)
                              ) ? 'bg-brand-50' : ''
                            }>
                              <td className="py-3 pr-4 text-gray-600 num font-medium">{row.range}</td>
                              <td className="py-3 px-4 text-right text-red-600 num">{row.nonS43Tax}</td>
                              <td className="py-3 pl-4 text-right text-brand-700 num">{row.s43Tax}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-gray-400 mt-3">{result.statuteRef}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
