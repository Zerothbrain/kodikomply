'use client';
import { useState, useEffect } from 'react';
import Navbar from '../../../components/ui/Navbar';
import Footer from '../../../components/ui/Footer';
import api from '../../../lib/api';
import { Search, CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp, Home } from 'lucide-react';

interface VatItem {
  id: number; category: string; itemName: string; hsCode: string | null;
  exemptionType: string; conditions: string | null; notes: string | null;
}

type Tab = 'supplies' | 'imports' | 'realestate';

const TYPE_CONFIG: Record<string, { label: string; color: string; icon: JSX.Element }> = {
  EXEMPT:     { label: 'EXEMPT',      color: 'bg-green-100 text-green-800 border-green-200',  icon: <CheckCircle size={14} className="text-green-600" /> },
  ZERO_RATED: { label: 'ZERO-RATED',  color: 'bg-blue-100 text-blue-800 border-blue-200',    icon: <CheckCircle size={14} className="text-blue-600" /> },
  TAXABLE:    { label: 'TAXABLE 18%', color: 'bg-red-100 text-red-800 border-red-200',       icon: <XCircle size={14} className="text-red-600" /> },
};

// ── Real Estate VAT Checker ───────────────────────────────────────────────────
function RealEstateChecker() {
  const [txnType, setTxnType] = useState('');
  const [propType, setPropType] = useState('');
  const [isNew, setIsNew] = useState<boolean | null>(null);
  const [occupied2yr, setOccupied2yr] = useState<boolean | null>(null);
  const [isDeveloper, setIsDeveloper] = useState<boolean | null>(null);
  const [salePrice, setSalePrice] = useState('');
  const [result, setResult] = useState<{ vatTreatment: string; notes: string; threshold?: number } | null>(null);

  function determineResult() {
    if (!txnType || !propType) return;
    if (propType === 'VACANT_LAND') { setResult({ vatTreatment: 'EXEMPT', notes: 'Sale of vacant land is always EXEMPT — S.10 VAT Act Cap 148 R.E.2023.' }); return; }
    if (propType === 'COMMERCIAL') { setResult({ vatTreatment: 'TAXABLE', notes: 'Commercial property transactions are taxable at 18%.' }); return; }
    if ((txnType === 'LEASE' || txnType === 'HIRE') && propType === 'RESIDENTIAL') { setResult({ vatTreatment: 'EXEMPT', notes: 'Lease or hire of residential premises (right to occupy and reside) is EXEMPT — S.10 VAT Act.' }); return; }
    if (txnType === 'SALE' && propType === 'RESIDENTIAL') {
      if (isNew === true) { setResult({ vatTreatment: 'TAXABLE', notes: 'First sale of newly constructed residential premises is TAXABLE at 18% — S.10 VAT Act.' }); return; }
      if (isNew === false && occupied2yr === true) { setResult({ vatTreatment: 'EXEMPT', notes: 'Sale of existing residential property occupied as a residence for 2 or more years is EXEMPT — S.10 VAT Act.' }); return; }
      if (isNew === false && occupied2yr === false) {
        if (isDeveloper === true) {
          const price = Number(salePrice);
          if (price && price <= 50000000) { setResult({ vatTreatment: 'EXEMPT', notes: `Developer sale at TZS ${price.toLocaleString()} which is ≤ TZS 50,000,000 threshold — EXEMPT — S.10 VAT Act.`, threshold: 50000000 }); return; }
          if (price && price > 50000000) { setResult({ vatTreatment: 'TAXABLE', notes: `Developer sale at TZS ${price.toLocaleString()} which EXCEEDS the TZS 50,000,000 threshold — TAXABLE at 18% — S.10 VAT Act.`, threshold: 50000000 }); return; }
        }
        if (isDeveloper === false) { setResult({ vatTreatment: 'TAXABLE', notes: 'Sale of residential property occupied less than 2 years is TAXABLE at 18% — S.10 VAT Act.' }); return; }
      }
    }
  }

  useEffect(() => { setResult(null); }, [txnType, propType, isNew, occupied2yr, isDeveloper, salePrice]);

  const btnClass = (active: boolean) => `flex-1 py-2 px-3 rounded-lg text-sm border-2 font-medium cursor-pointer transition-colors ${active ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`;

  return (
    <div className="space-y-5">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <strong>S.10 VAT Act Cap 148 R.E.2023</strong> — Immovable property VAT rules. Answer each question to determine VAT treatment.
      </div>

      <div>
        <p className="label mb-2">1. What type of transaction?</p>
        <div className="flex gap-2">
          {[['SALE','Sale'],['LEASE','Lease'],['HIRE','Hire']].map(([v,l]) => (
            <label key={v} className={btnClass(txnType===v)} onClick={() => setTxnType(v)}>{l}</label>
          ))}
        </div>
      </div>

      {txnType && (
        <div>
          <p className="label mb-2">2. What type of property?</p>
          <div className="flex gap-2">
            {[['VACANT_LAND','Vacant Land'],['RESIDENTIAL','Residential'],['COMMERCIAL','Commercial']].map(([v,l]) => (
              <label key={v} className={btnClass(propType===v)} onClick={() => setPropType(v)}>{l}</label>
            ))}
          </div>
        </div>
      )}

      {txnType === 'SALE' && propType === 'RESIDENTIAL' && (
        <div>
          <p className="label mb-2">3. Is this newly constructed? (first sale)</p>
          <div className="flex gap-2">
            <label className={btnClass(isNew===true)} onClick={() => setIsNew(true)}>Yes — newly built</label>
            <label className={btnClass(isNew===false)} onClick={() => setIsNew(false)}>No — existing property</label>
          </div>
        </div>
      )}

      {txnType === 'SALE' && propType === 'RESIDENTIAL' && isNew === false && (
        <div>
          <p className="label mb-2">4. Has it been occupied as a residence for 2 or more years?</p>
          <div className="flex gap-2">
            <label className={btnClass(occupied2yr===true)} onClick={() => setOccupied2yr(true)}>Yes — 2+ years</label>
            <label className={btnClass(occupied2yr===false)} onClick={() => setOccupied2yr(false)}>No — less than 2 years</label>
          </div>
        </div>
      )}

      {txnType === 'SALE' && propType === 'RESIDENTIAL' && isNew === false && occupied2yr === false && (
        <div>
          <p className="label mb-2">5. Are you a real estate developer?</p>
          <div className="flex gap-2">
            <label className={btnClass(isDeveloper===true)} onClick={() => setIsDeveloper(true)}>Yes</label>
            <label className={btnClass(isDeveloper===false)} onClick={() => setIsDeveloper(false)}>No</label>
          </div>
        </div>
      )}

      {isDeveloper === true && (
        <div>
          <p className="label mb-2">6. What is the sale price? (TZS)</p>
          <input type="number" className="input-field" value={salePrice} onChange={e => setSalePrice(e.target.value)} placeholder="e.g. 45000000" />
        </div>
      )}

      <button onClick={determineResult} className="btn-primary w-full">Determine VAT Treatment</button>

      {result && (
        <div className={`rounded-xl border-2 p-5 ${result.vatTreatment === 'EXEMPT' ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
          <div className="flex items-center gap-3 mb-2">
            {result.vatTreatment === 'EXEMPT' ? <CheckCircle size={28} className="text-green-600" /> : <XCircle size={28} className="text-red-600" />}
            <p className={`text-2xl font-bold ${result.vatTreatment === 'EXEMPT' ? 'text-green-700' : 'text-red-700'}`}>{result.vatTreatment === 'EXEMPT' ? 'EXEMPT — No VAT' : 'TAXABLE — 18% VAT'}</p>
          </div>
          <p className="text-sm text-gray-700">{result.notes}</p>
          {result.threshold && <p className="text-xs text-gray-500 mt-2">Threshold: TZS {result.threshold.toLocaleString()} (admin editable)</p>}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function VatExemptCheckerPage() {
  const [tab, setTab] = useState<Tab>('supplies');
  const [items, setItems] = useState<VatItem[]>([]);
  const [imports, setImports] = useState<Array<{ id: number; itemNumber: number; description: string; conditions: string | null }>>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    if (tab === 'supplies') {
      setLoading(true);
      Promise.all([
        api.get('/calculator/vat-exempt-items'),
        api.get('/calculator/vat-categories'),
      ]).then(([itemsRes, catRes]) => {
        setItems(itemsRes.data);
        setCategories(['ALL', ...catRes.data]);
      }).finally(() => setLoading(false));
    }
    if (tab === 'imports') {
      setLoading(true);
      api.get('/calculator/vat-exempt-imports').then(r => setImports(r.data)).finally(() => setLoading(false));
    }
  }, [tab]);

  const filtered = items.filter(i => {
    const matchCat = selectedCategory === 'ALL' || i.category === selectedCategory;
    const matchSearch = search === '' || i.itemName.toLowerCase().includes(search.toLowerCase()) || (i.hsCode ?? '').toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">VAT Exempt Checker</h1>
          <p className="text-gray-500">Determine if your goods, services, or imports are exempt from VAT under the VAT Act Cap 148 R.E.2023.</p>
        </div>

        <div className="flex gap-2 mb-6">
          {([['supplies','Exempt Supplies'],['imports','Exempt Imports'],['realestate','Real Estate']] as [Tab,string][]).map(([t,l]) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${tab===t ? 'bg-brand-600 text-white' : 'bg-white border text-gray-700 hover:border-brand-400'}`}>
              {t === 'realestate' && <Home size={14} />}{l}
            </button>
          ))}
        </div>

        {tab === 'supplies' && (
          <>
            <div className="flex gap-3 mb-4 flex-wrap">
              <div className="relative flex-1 min-w-48">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input className="input-field pl-9" placeholder="Search item name or HS code..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select className="input-field w-56" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                {categories.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <p className="text-xs text-gray-400 mb-4">{filtered.length} items found</p>
            {loading ? <div className="text-center py-12 text-gray-400">Loading...</div> : (
              <div className="space-y-2">
                {filtered.map(item => {
                  const cfg = TYPE_CONFIG[item.exemptionType] ?? TYPE_CONFIG.TAXABLE;
                  return (
                    <div key={item.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                      <button className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50" onClick={() => setExpanded(expanded === item.id ? null : item.id)}>
                        <div className="flex items-center gap-3">
                          {cfg.icon}
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{item.itemName}</p>
                            {item.hsCode && <p className="text-xs text-gray-400 font-mono mt-0.5">HS: {item.hsCode}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.color}`}>{cfg.label}</span>
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{item.category}</span>
                          {expanded === item.id ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                        </div>
                      </button>
                      {expanded === item.id && (item.conditions || item.notes) && (
                        <div className="px-4 pb-4 border-t border-gray-50 pt-3 space-y-2">
                          {item.conditions && <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-sm text-amber-800"><span className="font-semibold">Conditions: </span>{item.conditions}</div>}
                          {item.notes && <p className="text-xs text-gray-500">{item.notes}</p>}
                        </div>
                      )}
                    </div>
                  );
                })}
                {filtered.length === 0 && <div className="text-center py-12 text-gray-400">No items match your search.</div>}
              </div>
            )}
          </>
        )}

        {tab === 'imports' && (
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800 mb-4">
              These imports are exempt from VAT at the point of importation under the Second Schedule to the VAT Act Cap 148 R.E.2023.
            </div>
            {loading ? <div className="text-center py-12 text-gray-400">Loading...</div> : imports.map(item => (
              <div key={item.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">{item.itemNumber}</span>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{item.description}</p>
                  {item.conditions && <p className="text-xs text-amber-700 mt-1 bg-amber-50 rounded px-2 py-1 inline-block">{item.conditions}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'realestate' && <RealEstateChecker />}

        <div className="mt-10 bg-amber-50 border border-amber-200 rounded-xl p-5">
          <p className="font-semibold text-amber-800 mb-1">Important</p>
          <p className="text-sm text-amber-700">This tool provides guidance based on the VAT Act Cap 148 R.E.2023. Exemptions may have specific conditions or require ministerial approval. Always verify with TRA or a qualified tax professional for your specific circumstances.</p>
          <p className="text-xs text-amber-600 mt-2">VAT records must be kept for <strong>5 years</strong> (S.93 VAT Act) — different from income tax records (7 years under TAA).</p>
        </div>
      </main>
      <Footer />
    </>
  );
}
