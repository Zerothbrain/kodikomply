'use client';
import { useState } from 'react';
import Navbar from '../../../components/ui/Navbar';
import Footer from '../../../components/ui/Footer';
import { FileText, User, Building2, Users, CheckCircle } from 'lucide-react';

type EntityType = 'individual' | 'company' | 'partnership';

const CHECKLISTS: Record<EntityType, { item: string; detail: string }[]> = {
  individual: [
    { item: 'TIN registration', detail: 'Ensure your TIN is active and up to date with TRA' },
    { item: 'Income summary for the year', detail: 'Employment, business, investment, rental, and any other income' },
    { item: 'WHT certificates', detail: 'P9 form from employer, WHT certificates from payers (banks, companies)' },
    { item: 'Allowable deductions documentation', detail: 'Retirement fund contributions, donations, business expenses if any' },
    { item: 'Bank statements (if applicable)', detail: 'Supporting evidence for income not covered by certificates' },
    { item: 'Signed by the individual taxpayer', detail: 'Return must be personally signed — cannot be delegated' },
  ],
  company: [
    { item: 'TIN registration', detail: 'Company TIN and business registration documents' },
    { item: 'Audited financial statements', detail: 'Income statement, balance sheet, cash flow — prepared per IFRS or GAAP' },
    { item: 'Capital allowance schedule', detail: 'Depreciation calculations per Third Schedule ITA for all classes' },
    { item: 'WHT certificates received', detail: 'All WHT deducted from company payments received during the year' },
    { item: 'Transfer pricing documentation', detail: 'If related-party transactions exist — S.33 ITA compliance evidence' },
    { item: 'Quarterly installment receipts', detail: 'Evidence of Q1–Q4 installment payments made during the year' },
    { item: 'Loss carryforward schedule', detail: 'If claiming prior year losses — documented loss register' },
    { item: 'Signed by the manager AND certified public accountant', detail: 'Both signatures are MANDATORY for entity returns — S.117 ITA' },
  ],
  partnership: [
    { item: 'Partnership deed / agreement', detail: 'Document showing each partner\'s profit-sharing percentage' },
    { item: 'Partnership income and expenditure account', detail: 'Business income, allowable deductions, net partnership income' },
    { item: 'Partners\' TINs', detail: 'Each partner\'s individual TIN number' },
    { item: 'WHT certificates (partnership level)', detail: 'Any WHT paid by the partnership to be allocated to partners' },
    { item: 'Partner allocation schedule', detail: 'Showing each partner\'s share of income, deductions, and WHT credit' },
    { item: 'Note: Partnership pays no income tax', detail: 'Tax is filed and paid by each individual partner — not by the partnership entity' },
  ],
};

export default function FilingReturnGuidePage() {
  const [entityType, setEntityType] = useState<EntityType>('individual');

  const checklist = CHECKLISTS[entityType];

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-2">
          <FileText size={32} className="text-brand-600" />
          <h1 className="text-3xl font-bold text-gray-900">Return of Income Filing Guide</h1>
        </div>
        <p className="text-gray-500 mb-8">S.117 ITA Cap 332 R.E.2023 — step-by-step guide for filing your annual income tax return.</p>

        {/* Entity selector */}
        <div className="flex gap-3 mb-8">
          {([['individual','Individual','User'],['company','Company','Building2'],['partnership','Partnership','Users']] as const).map(([v,l,_icon]) => {
            const Icon = v === 'individual' ? User : v === 'company' ? Building2 : Users;
            return (
              <button key={v} onClick={() => setEntityType(v)}
                className={`flex-1 flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 transition-colors ${entityType===v ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <Icon size={22} className={entityType===v ? 'text-brand-600' : 'text-gray-400'} />
                <span className={`text-sm font-medium ${entityType===v ? 'text-brand-700' : 'text-gray-600'}`}>{l}</span>
              </button>
            );
          })}
        </div>

        {/* Key facts */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">Deadline</p>
            <p className="text-lg font-bold text-brand-700">30 June</p>
            <p className="text-xs text-gray-500">of the following year</p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">Late Filing Penalty</p>
            <p className="text-sm font-bold text-orange-700">{entityType === 'individual' ? 'TZS 225,000/month' : 'TZS 7,500,000/month'}</p>
            <p className="text-xs text-gray-500">{entityType === 'individual' ? 'Individual' : 'Entity'}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">How to File</p>
            <p className="text-sm font-bold text-green-700">TRA e-Tax Portal</p>
            <p className="text-xs text-gray-500">or TRA offices</p>
          </div>
        </div>

        {/* Self assessment note */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
          <h3 className="font-semibold text-blue-800 mb-2">Self-Assessment (S.120 ITA)</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p>• Filing the return is treated as a self-assessment of your tax liability.</p>
            <p>• If you fail to file, the Commissioner will make an assessment based on available information.</p>
            <p>• Interest and penalties apply automatically on any underpaid amounts from the due date.</p>
            {entityType === 'company' && <p>• Company return MUST be signed by both the <strong>manager</strong> AND a <strong>certified public accountant</strong> — unsigned returns are invalid.</p>}
          </div>
        </div>

        {/* Filing checklist */}
        <div className="card">
          <h2 className="font-semibold text-lg mb-4">Filing Checklist — {entityType === 'individual' ? 'Individual' : entityType === 'company' ? 'Company / Entity' : 'Partnership'}</h2>
          <div className="space-y-3">
            {checklist.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                <CheckCircle size={18} className="text-brand-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900 text-sm">{item.item}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step by step process */}
        <div className="mt-8 card">
          <h2 className="font-semibold text-lg mb-4">Filing Process</h2>
          <div className="space-y-4">
            {[
              { step: 1, title: 'Log in to TRA e-Tax Portal', detail: 'Visit TRA e-Tax and log in with your TIN and password. New users must register first.' },
              { step: 2, title: 'Select "Income Tax Return"', detail: `Choose the correct return type for your entity (${entityType === 'individual' ? 'IT1 for individuals' : entityType === 'company' ? 'IT2 for companies' : 'partnership return'}) and the year of income.` },
              { step: 3, title: 'Complete all income schedules', detail: 'Enter income from all sources, claim all allowable deductions, attach supporting documents.' },
              { step: 4, title: 'Reconcile installments and WHT', detail: 'Enter quarterly installments paid and WHT certificates to calculate final tax payable or refund due.' },
              { step: 5, title: 'Sign and submit', detail: entityType === 'company' ? 'Manager signs, CPA certifies, then submit electronically.' : 'Sign and submit electronically or at TRA offices.' },
              { step: 6, title: 'Pay any balance due', detail: 'Pay any remaining tax liability by the return deadline to avoid late payment interest.' },
            ].map(s => (
              <div key={s.step} className="flex items-start gap-4">
                <span className="w-8 h-8 bg-brand-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">{s.step}</span>
                <div>
                  <p className="font-medium text-gray-900">{s.title}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{s.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Record keeping */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="font-semibold text-green-800 mb-2">Income Tax Records</p>
            <p className="text-3xl font-bold text-green-700 mb-1">7 years</p>
            <p className="text-xs text-green-700">Under the Tax Administration Act (TAA) — keep all income tax records for 7 years from the end of the relevant year of income.</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="font-semibold text-blue-800 mb-2">VAT Records</p>
            <p className="text-3xl font-bold text-blue-700 mb-1">5 years</p>
            <p className="text-xs text-blue-700">Under S.93 VAT Act — VAT records (invoices, adjustment notes, customs docs, VAT account) kept for 5 years. <strong>Different from income tax!</strong></p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
