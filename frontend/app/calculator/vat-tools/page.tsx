'use client';
import { useState } from 'react';
import Navbar from '../../../components/ui/Navbar';
import Footer from '../../../components/ui/Footer';
import api from '../../../lib/api';
import { formatTZS } from '../../../lib/format';
import toast from 'react-hot-toast';
import { Calculator, RefreshCw, AlertTriangle, Package, Users, FileX } from 'lucide-react';

type Tool = 'pricing' | 'baddebt' | 'adjustment' | 'layby' | 'goingconcern' | 'connected';

// ── VAT Pricing Tool ──────────────────────────────────────────────────────────
function PricingTool() {
  const [amount, setAmount] = useState('');
  const [isInclusive, setIsInclusive] = useState(false);
  const [result, setResult] = useState<{ exclusive: number; vat: number; inclusive: number } | null>(null);

  async function calculate() {
    if (!amount) return;
    const { data } = await api.post('/calculator/vat-pricing', { amount: Number(amount), isInclusive });
    setResult(data);
  }

  return (
    <div className="space-y-5">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <strong>S.38 VAT Act:</strong> As a registered VAT person, all advertised prices MUST be VAT-inclusive. Your receipts and tax invoices must show the total VAT amount separately.
      </div>
      <div className="flex gap-3">
        <button onClick={() => { setIsInclusive(false); setResult(null); }} className={`flex-1 py-2 rounded-lg text-sm border-2 font-medium ${!isInclusive ? 'border-brand-500 bg-brand-50' : 'border-gray-200'}`}>My price is VAT-exclusive</button>
        <button onClick={() => { setIsInclusive(true); setResult(null); }} className={`flex-1 py-2 rounded-lg text-sm border-2 font-medium ${isInclusive ? 'border-brand-500 bg-brand-50' : 'border-gray-200'}`}>My price is VAT-inclusive</button>
      </div>
      <div>
        <label className="label">{isInclusive ? 'VAT-Inclusive Price (TZS)' : 'VAT-Exclusive Price (TZS)'}</label>
        <input type="number" className="input-field" value={amount} onChange={e => { setAmount(e.target.value); setResult(null); }} onKeyDown={e => e.key === 'Enter' && calculate()} placeholder="Enter price" />
      </div>
      <button onClick={calculate} className="btn-primary w-full">Calculate</button>
      {result && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500">VAT-Exclusive</p>
            <p className="text-xl font-bold text-gray-800">{formatTZS(result.exclusive)}</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500">VAT (18%)</p>
            <p className="text-xl font-bold text-orange-700">{formatTZS(result.vat)}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500">VAT-Inclusive</p>
            <p className="text-xl font-bold text-green-700">{formatTZS(result.inclusive)}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Bad Debt Tool ─────────────────────────────────────────────────────────────
function BadDebtTool() {
  const [side, setSide] = useState<'supplier'|'customer'>('supplier');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [writtenOff, setWrittenOff] = useState(false);
  const [laterPayment, setLaterPayment] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  async function calculate() {
    if (!invoiceAmount || !dueDate) { toast.error('Fill required fields'); return; }
    try {
      const { data } = await api.post('/calculator/vat-bad-debt', {
        side, invoiceAmountInclVAT: Number(invoiceAmount), invoiceDate: dueDate, dueDate,
        writtenOff, laterPaymentDate: laterPayment ? new Date().toISOString() : undefined,
      });
      setResult(data);
    } catch { toast.error('Failed'); }
  }

  const dir = result?.direction as string;
  return (
    <div className="space-y-5">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
        <strong>S.78 VAT Act:</strong> Supplier may claim decreasing adjustment if debt is overdue 18+ months AND written off. Customer MUST make increasing adjustment after 18 months without paying.
      </div>
      <div className="flex gap-3">
        <button onClick={() => { setSide('supplier'); setResult(null); }} className={`flex-1 py-2 rounded-lg text-sm border-2 font-medium ${side==='supplier' ? 'border-brand-500 bg-brand-50' : 'border-gray-200'}`}>I am the Supplier</button>
        <button onClick={() => { setSide('customer'); setResult(null); }} className={`flex-1 py-2 rounded-lg text-sm border-2 font-medium ${side==='customer' ? 'border-brand-500 bg-brand-50' : 'border-gray-200'}`}>I am the Customer</button>
      </div>
      <div>
        <label className="label">Invoice Amount (VAT-Inclusive, TZS)</label>
        <input type="number" className="input-field" value={invoiceAmount} onChange={e => setInvoiceAmount(e.target.value)} />
      </div>
      <div>
        <label className="label">Date Payment Became Overdue</label>
        <input type="date" className="input-field" value={dueDate} onChange={e => setDueDate(e.target.value)} />
      </div>
      {side === 'supplier' && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={writtenOff} onChange={e => setWrittenOff(e.target.checked)} className="w-4 h-4" />
          I have written off this debt in my books
        </label>
      )}
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={laterPayment} onChange={e => setLaterPayment(e.target.checked)} className="w-4 h-4" />
        {side === 'supplier' ? 'The customer has since paid (reversing the adjustment)' : 'I have since paid the supplier (reversing the adjustment)'}
      </label>
      <button onClick={calculate} className="btn-primary w-full">Calculate Adjustment</button>
      {result && (
        <div className={`rounded-xl border-2 p-4 ${result.eligible ? (dir === 'DECREASING' ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50') : 'border-gray-200 bg-gray-50'}`}>
          <p className={`font-bold text-lg mb-1 ${result.eligible ? (dir === 'DECREASING' ? 'text-green-700' : 'text-red-700') : 'text-gray-500'}`}>
            {result.eligible ? `${dir} ADJUSTMENT — ${formatTZS(result.adjustmentAmount as number)}` : 'Not Yet Eligible'}
          </p>
          <p className="text-sm text-gray-700">{result.explanation as string}</p>
          {!!result.returnPeriodNote && <p className="text-xs text-gray-500 mt-2 italic">{result.returnPeriodNote as string}</p>}
          <p className="text-xs text-brand-600 mt-2">{result.legalRef as string}</p>
        </div>
      )}
    </div>
  );
}

// ── Adjustment Events Tool ────────────────────────────────────────────────────
function AdjustmentTool() {
  const [side, setSide] = useState<'supplier'|'customer'>('supplier');
  const [eventType, setEventType] = useState('PRICE_CHANGE');
  const [originalVAT, setOriginalVAT] = useState('');
  const [revisedVAT, setRevisedVAT] = useState('');
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  async function calculate() {
    if (!originalVAT || !revisedVAT) { toast.error('Enter both VAT amounts'); return; }
    try {
      const { data } = await api.post('/calculator/vat-adjustment', { side, eventType, originalVAT: Number(originalVAT), revisedVAT: Number(revisedVAT) });
      setResult(data);
    } catch { toast.error('Failed'); }
  }

  return (
    <div className="space-y-5">
      <div className="bg-brand-50 border border-brand-200 rounded-lg p-4 text-sm text-brand-800">
        <strong>S.75–77 VAT Act:</strong> Adjustment events (cancellation, price change, goods returned, supply type change) require adjustments in the period you become aware of the event.
      </div>
      <div className="flex gap-3">
        {(['supplier','customer'] as const).map(s => (
          <button key={s} onClick={() => { setSide(s); setResult(null); }} className={`flex-1 py-2 rounded-lg text-sm border-2 font-medium capitalize ${side===s ? 'border-brand-500 bg-brand-50' : 'border-gray-200'}`}>I am the {s}</button>
        ))}
      </div>
      <div>
        <label className="label">Adjustment Event</label>
        <select className="input-field" value={eventType} onChange={e => setEventType(e.target.value)}>
          <option value="CANCELLATION">Cancellation of supply</option>
          <option value="PRICE_CHANGE">Change in consideration (price changed)</option>
          <option value="GOODS_RETURNED">Return of goods to supplier</option>
          <option value="SUPPLY_TYPE_CHANGED">Supply became / ceased to be taxable</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Original VAT Charged (TZS)</label>
          <input type="number" className="input-field" value={originalVAT} onChange={e => setOriginalVAT(e.target.value)} />
        </div>
        <div>
          <label className="label">Revised VAT (should have been) (TZS)</label>
          <input type="number" className="input-field" value={revisedVAT} onChange={e => setRevisedVAT(e.target.value)} />
        </div>
      </div>
      <button onClick={calculate} className="btn-primary w-full">Calculate Adjustment</button>
      {result && (
        <div className={`rounded-xl border-2 p-4 ${result.direction === 'DECREASING' ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
          <p className={`font-bold mb-1 ${result.direction === 'DECREASING' ? 'text-green-700' : 'text-red-700'}`}>{result.direction as string} ADJUSTMENT — {formatTZS(result.adjustmentAmount as number)}</p>
          <p className="text-sm text-gray-700">{result.explanation as string}</p>
          <p className="text-xs text-gray-500 mt-2 italic">{result.deadlineNote as string}</p>
          {!!result.adjustmentNoteRequired && <p className="text-xs text-red-600 font-medium mt-1">⚠️ Adjustment note required — must be issued within 7 days.</p>}
        </div>
      )}
    </div>
  );
}

// ── Lay-By Tool ───────────────────────────────────────────────────────────────
function LayByTool() {
  const [total, setTotal] = useState('');
  const [payments, setPayments] = useState([{ amount: '', date: '' }]);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  function addPayment() { setPayments([...payments, { amount: '', date: '' }]); }
  function updatePayment(i: number, field: 'amount'|'date', val: string) {
    const p = [...payments]; p[i] = { ...p[i], [field]: val }; setPayments(p);
  }

  async function calculate() {
    const validPayments = payments.filter(p => p.amount && p.date);
    if (!validPayments.length) { toast.error('Add at least one payment'); return; }
    try {
      const { data } = await api.post('/calculator/vat-lay-by', { totalPriceInclVAT: Number(total), payments: validPayments.map(p => ({ amount: Number(p.amount), date: p.date })) });
      setResult(data);
    } catch { toast.error('Failed'); }
  }

  return (
    <div className="space-y-5">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <strong>S.16 VAT Act:</strong> Lay-by sales — price paid in instalments, delivery after deposit, ownership transfers on delivery. VAT is payable at EACH instalment (not when goods delivered).
      </div>
      <div>
        <label className="label">Total Selling Price (VAT-Inclusive, TZS)</label>
        <input type="number" className="input-field" value={total} onChange={e => setTotal(e.target.value)} />
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="label">Payment Schedule</label>
          <button onClick={addPayment} className="text-brand-600 text-sm font-medium hover:underline">+ Add Payment</button>
        </div>
        {payments.map((p, i) => (
          <div key={i} className="grid grid-cols-2 gap-2 mb-2">
            <input type="number" className="input-field" placeholder={`Payment ${i+1} (TZS)`} value={p.amount} onChange={e => updatePayment(i, 'amount', e.target.value)} />
            <input type="date" className="input-field" value={p.date} onChange={e => updatePayment(i, 'date', e.target.value)} />
          </div>
        ))}
      </div>
      <button onClick={calculate} className="btn-primary w-full">Calculate VAT Per Instalment</button>
      {result && (
        <div className="space-y-3">
          <table className="w-full text-sm border border-gray-100 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-2 px-3 text-left text-xs text-gray-500">Date</th>
                <th className="py-2 px-3 text-right text-xs text-gray-500">Payment</th>
                <th className="py-2 px-3 text-right text-xs text-gray-500">VAT Due</th>
                <th className="py-2 px-3 text-left text-xs text-gray-500">Tax Period</th>
              </tr>
            </thead>
            <tbody>
              {(result.payments as Array<{ date: string; amount: number; vatDue: number; taxPeriod: string }>).map((row, i) => (
                <tr key={i} className="border-t border-gray-50">
                  <td className="py-2 px-3">{row.date}</td>
                  <td className="py-2 px-3 text-right">{formatTZS(row.amount)}</td>
                  <td className="py-2 px-3 text-right font-medium text-orange-700">{formatTZS(row.vatDue)}</td>
                  <td className="py-2 px-3 text-xs text-gray-500">{row.taxPeriod}</td>
                </tr>
              ))}
              <tr className="border-t border-gray-200 bg-gray-50 font-bold">
                <td className="py-2 px-3">Total</td>
                <td className="py-2 px-3 text-right">{formatTZS((result.payments as Array<{amount:number}>).reduce((s,p)=>s+p.amount,0))}</td>
                <td className="py-2 px-3 text-right text-orange-700">{formatTZS(result.totalVAT as number)}</td>
                <td />
              </tr>
            </tbody>
          </table>
          <p className="text-xs text-gray-500">{result.explanation as string}</p>
        </div>
      )}
    </div>
  );
}

const TOOLS: { id: Tool; label: string; icon: JSX.Element; desc: string }[] = [
  { id: 'pricing',      label: 'VAT Pricing',       icon: <Calculator size={18} />,    desc: 'Convert between VAT-exclusive and inclusive prices' },
  { id: 'baddebt',      label: 'Bad Debt',           icon: <FileX size={18} />,         desc: 'S.78 — supplier/customer bad debt adjustments' },
  { id: 'adjustment',   label: 'Adjustments',        icon: <RefreshCw size={18} />,     desc: 'S.75-77 — post-supply adjustment events' },
  { id: 'layby',        label: 'Lay-By Sales',       icon: <Package size={18} />,       desc: 'S.16 — VAT on instalment sales' },
  { id: 'goingconcern', label: 'Going Concern',      icon: <AlertTriangle size={18} />, desc: 'S.20 — sale of business as going concern' },
  { id: 'connected',    label: 'Connected Persons',  icon: <Users size={18} />,         desc: 'S.18 — VAT on below-market related party supplies' },
];

function GoingConcernTool() {
  const [entire, setEntire] = useState<boolean|null>(null);
  const [buyerContinues, setBuyerContinues] = useState<boolean|null>(null);
  const [transferAll, setTransferAll] = useState<boolean|null>(null);
  const [canOperate, setCanOperate] = useState<boolean|null>(null);
  const [result, setResult] = useState<Record<string,unknown>|null>(null);

  async function calculate() {
    if (entire === null || buyerContinues === null || transferAll === null) { toast.error('Answer all questions'); return; }
    try {
      const { data } = await api.post('/calculator/vat-going-concern', { sellingEntireBusiness: entire, buyerContinuingActivity: buyerContinues, transferringEverythingNecessary: transferAll, canOperateSeparately: canOperate ?? undefined });
      setResult(data);
    } catch { toast.error('Failed'); }
  }

  const btnCls = (a: boolean|null, v: boolean) => `flex-1 py-2 text-sm border-2 rounded-lg font-medium ${a===v ? 'border-brand-500 bg-brand-50' : 'border-gray-200'}`;

  return (
    <div className="space-y-5">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
        <strong>S.20 VAT Act:</strong> Sale of a business as a going concern is NOT a supply — no VAT. Input tax on sale costs is fully creditable. Going concern value excluded from apportionment.
      </div>
      {[['Are you selling your entire business?', entire, setEntire],['Is the buyer acquiring it to continue the same economic activity?', buyerContinues, setBuyerContinues],['Are you transferring everything necessary for the business to continue?', transferAll, setTransferAll]].map(([q,v,fn]:any,i) => (
        <div key={i}>
          <p className="label mb-2">{q}</p>
          <div className="flex gap-3">
            <button className={btnCls(v,true)} onClick={()=>fn(true)}>Yes</button>
            <button className={btnCls(v,false)} onClick={()=>fn(false)}>No</button>
          </div>
        </div>
      ))}
      {entire === false && (
        <div>
          <p className="label mb-2">Can the part being sold operate independently as a separate business?</p>
          <div className="flex gap-3">
            <button className={btnCls(canOperate,true)} onClick={()=>setCanOperate(true)}>Yes</button>
            <button className={btnCls(canOperate,false)} onClick={()=>setCanOperate(false)}>No</button>
          </div>
        </div>
      )}
      <button onClick={calculate} className="btn-primary w-full">Check Going Concern Status</button>
      {result && (
        <div className={`rounded-xl border-2 p-4 ${result.qualifies ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
          <p className={`font-bold mb-1 text-lg ${result.qualifies ? 'text-green-700' : 'text-red-700'}`}>{result.qualifies ? '✓ QUALIFIES — No VAT' : '✗ Does Not Qualify — VAT Applies'}</p>
          <p className="text-sm text-gray-700">{result.explanation as string}</p>
          {!!result.qualifies && <><p className="text-xs text-gray-600 mt-2">{result.inputTaxNote as string}</p><p className="text-xs text-gray-600">{result.apportionmentNote as string}</p></>}
          <p className="text-xs text-brand-600 mt-2">{result.legalRef as string}</p>
        </div>
      )}
    </div>
  );
}

function ConnectedPersonsTool() {
  const [actual, setActual] = useState('');
  const [fairMarket, setFairMarket] = useState('');
  const [result, setResult] = useState<Record<string,unknown>|null>(null);

  async function calculate() {
    try {
      const { data } = await api.post('/calculator/vat-connected-persons', { isConnectedPerson: true, actualConsideration: Number(actual), fairMarketValue: Number(fairMarket) });
      setResult(data);
    } catch { toast.error('Failed'); }
  }

  return (
    <div className="space-y-5">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
        <strong>S.18 VAT Act:</strong> Supplies to connected persons at below market value — VAT must be calculated on the FAIR MARKET VALUE. Connected persons include: spouses/relatives, shareholders (10%+), associated companies, partners, trustees/beneficiaries.
      </div>
      <div>
        <label className="label">Actual Consideration Received (TZS)</label>
        <input type="number" className="input-field" value={actual} onChange={e => setActual(e.target.value)} placeholder="What you actually charged" />
      </div>
      <div>
        <label className="label">Fair Market Value of the Supply (TZS)</label>
        <input type="number" className="input-field" value={fairMarket} onChange={e => setFairMarket(e.target.value)} placeholder="What it would sell for to an unconnected party" />
      </div>
      <button onClick={calculate} disabled={!actual || !fairMarket} className="btn-primary w-full">Calculate VAT on Fair Market Value</button>
      {result && (
        <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-4">
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="text-center"><p className="text-xs text-gray-500">VAT Base (FMV × 100/118)</p><p className="text-xl font-bold text-orange-700">{formatTZS(result.vatBase as number)}</p></div>
            <div className="text-center"><p className="text-xs text-gray-500">VAT Due (18%)</p><p className="text-xl font-bold text-red-700">{formatTZS(result.vatAmount as number)}</p></div>
          </div>
          {(result.adjustment as number) > 0 && <p className="text-sm text-orange-700 mb-2">Additional VAT vs actual consideration: <strong>{formatTZS(result.adjustment as number)}</strong></p>}
          <p className="text-sm text-gray-700">{result.explanation as string}</p>
        </div>
      )}
    </div>
  );
}

export default function VatToolsPage() {
  const [active, setActive] = useState<Tool>('pricing');

  const current = TOOLS.find(t => t.id === active)!;

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">VAT Special Tools</h1>
        <p className="text-gray-500 mb-8">Advanced VAT modules — pricing, adjustments, bad debts, lay-by sales, going concern, and connected persons.</p>

        <div className="grid grid-cols-3 gap-2 mb-8">
          {TOOLS.map(t => (
            <button key={t.id} onClick={() => setActive(t.id)}
              className={`flex items-start gap-2 p-3 rounded-xl border-2 text-left transition-colors ${active===t.id ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
              <span className={active===t.id ? 'text-brand-600' : 'text-gray-400'}>{t.icon}</span>
              <div>
                <p className={`text-sm font-semibold ${active===t.id ? 'text-brand-700' : 'text-gray-700'}`}>{t.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{t.desc}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="card">
          <h2 className="font-semibold text-lg mb-4">{current.label}</h2>
          {active === 'pricing'      && <PricingTool />}
          {active === 'baddebt'      && <BadDebtTool />}
          {active === 'adjustment'   && <AdjustmentTool />}
          {active === 'layby'        && <LayByTool />}
          {active === 'goingconcern' && <GoingConcernTool />}
          {active === 'connected'    && <ConnectedPersonsTool />}
        </div>
      </main>
      <Footer />
    </>
  );
}
