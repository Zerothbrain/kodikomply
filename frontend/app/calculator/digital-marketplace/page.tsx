'use client';
import { useState, useEffect } from 'react';
import Navbar from '../../../components/ui/Navbar';
import Footer from '../../../components/ui/Footer';
import api from '../../../lib/api';
import { formatTZS } from '../../../lib/format';
import toast from 'react-hot-toast';
import { Globe, AlertCircle } from 'lucide-react';

interface DigitalResult {
  taxRate: number;
  taxDue: number;
  filingDeadline: string;
  explanation: string;
  legalRef: string;
}

interface ServiceType { id: number; name: string; description: string | null; }

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function DigitalMarketplacePage() {
  const [mode, setMode] = useState<'nonresident' | 'resident'>('nonresident');
  const [grossPayment, setGrossPayment] = useState('');
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [result, setResult] = useState<DigitalResult | null>(null);
  const [services, setServices] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/calculator/digital-service-types').then(r => setServices(r.data)).catch(() => {});
  }, []);

  async function calculate() {
    if (!grossPayment) { toast.error('Enter gross payment amount'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/calculator/digital-marketplace', {
        grossPaymentFromTanzania: Number(grossPayment),
        month,
        year,
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
          <Globe size={32} className="text-brand-600" />
          <h1 className="text-3xl font-bold text-gray-900">Digital Marketplace Tax</h1>
        </div>
        <p className="text-gray-500 mb-6">S.116 ITA Cap 332 R.E.2023 — 2% tax on gross payments from Tanzania individuals to non-resident digital service providers.</p>

        <div className="flex gap-2 mb-6">
          {([['nonresident','Non-Resident Provider'],['resident','TZ Resident Paying']] as const).map(([v,l]) => (
            <button key={v} onClick={() => { setMode(v); setResult(null); }} className={`px-4 py-2 rounded-lg text-sm font-medium ${mode===v ? 'bg-brand-600 text-white' : 'bg-white border text-gray-700 hover:border-brand-400'}`}>{l}</button>
          ))}
        </div>

        {mode === 'nonresident' ? (
          <>
            <div className="card space-y-5 mb-6">
              <div className="bg-brand-50 border border-brand-200 rounded-lg p-4 text-sm text-brand-800">
                <strong>Who this applies to:</strong> Non-resident persons receiving payments from Tanzania individuals (not in the course of business) for electronic/digital services. Rate: <strong>2% of gross payment</strong> (excluding VAT). Self-assessed — no withholding agent.
              </div>

              <div>
                <label className="label">Gross Payment Received from Tanzania Individuals This Month (TZS, excluding VAT)</label>
                <input type="number" className="input-field" value={grossPayment} onChange={e => setGrossPayment(e.target.value)} placeholder="e.g. 5000000" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Month of Income</label>
                  <select className="input-field" value={month} onChange={e => setMonth(Number(e.target.value))}>
                    {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Year</label>
                  <input type="number" className="input-field" value={year} onChange={e => setYear(Number(e.target.value))} />
                </div>
              </div>

              <button onClick={calculate} disabled={loading} className="btn-primary w-full">
                {loading ? 'Calculating...' : 'Calculate Tax Due'}
              </button>
            </div>

            {result && (
              <div className="space-y-4">
                <div className="card border-2 border-brand-300">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-brand-50 rounded-lg p-4 text-center">
                      <p className="text-xs text-gray-500">Tax Rate</p>
                      <p className="text-2xl font-bold text-brand-700">{(result.taxRate * 100).toFixed(0)}%</p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4 text-center">
                      <p className="text-xs text-gray-500">Tax Due</p>
                      <p className="text-2xl font-bold text-orange-700">{formatTZS(result.taxDue)}</p>
                    </div>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                    <p className="font-semibold text-red-700">Filing Deadline: {result.filingDeadline}</p>
                    <p className="text-red-600 text-xs mt-1">File and pay by the 20th of the following month via TRA e-Tax portal.</p>
                  </div>
                  <p className="text-sm text-gray-600 mt-3">{result.explanation}</p>
                  <p className="text-xs text-gray-400 mt-2">{result.legalRef}</p>
                </div>
                <button onClick={() => setResult(null)} className="btn-secondary w-full">New Calculation</button>
              </div>
            )}
          </>
        ) : (
          <div className="card space-y-4">
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-1">Information for Tanzania Residents Paying Foreign Platforms</p>
                <p>When you pay a foreign digital platform for services, the platform may be liable to pay 2% digital marketplace tax to TRA on those payments. <strong>This is the platform's obligation — not yours.</strong> However, you should be aware that TRA may scrutinise such payments.</p>
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <p className="font-semibold mb-2">VAT on Digital Services Received</p>
              <p>If you receive electronic services from a non-resident supplier that is not registered for Tanzania VAT, you may be liable to account for VAT on those services yourself under the reverse-charge mechanism. Contact TRA for guidance on self-accounting for VAT on imported services.</p>
            </div>
          </div>
        )}

        {/* Electronic services list */}
        {services.length > 0 && (
          <div className="mt-8 card">
            <h2 className="font-semibold mb-3">Electronic Services Covered (S.116 ITA / S.51 VAT Act)</h2>
            <div className="space-y-2">
              {services.map(s => (
                <div key={s.id} className="flex items-start gap-2 text-sm py-2 border-b border-gray-50 last:border-0">
                  <span className="w-1.5 h-1.5 bg-brand-500 rounded-full flex-shrink-0 mt-2" />
                  <div>
                    <p className="font-medium text-gray-800">{s.name}</p>
                    {s.description && <p className="text-xs text-gray-500">{s.description}</p>}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">This list is maintained in the admin panel and may be updated as new digital service types are defined by TRA.</p>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
