'use client';
import { useState } from 'react';
import Navbar from '../../../components/ui/Navbar';
import Footer from '../../../components/ui/Footer';
import { CheckCircle, Clock, AlertCircle, ChevronDown, ChevronUp, Calendar } from 'lucide-react';

interface ChecklistItem {
  id: number;
  title: string;
  description: string;
  whoMustComply: string;
  deadline: string;
  howToFile: string;
  penalty: string;
  category: 'registration' | 'monthly' | 'quarterly' | 'annual' | 'other';
}

const CHECKLIST: ChecklistItem[] = [
  {
    id: 1, title: 'TIN Registration', category: 'registration',
    description: 'Every person carrying on business or earning income must register for a Taxpayer Identification Number with TRA.',
    whoMustComply: 'All businesses, self-employed individuals, and employees earning above the exemption threshold.',
    deadline: 'Before commencing business or earning income.',
    howToFile: 'Apply at TRA offices or online via TRA e-Tax portal with required documents (ID, business docs).',
    penalty: 'Penalty for failure to register: TZS 100,000 CP fine plus continuing liability.',
  },
  {
    id: 2, title: 'VAT Registration', category: 'registration',
    description: 'Businesses with annual turnover exceeding TZS 200 million must register for VAT under S.27 VAT Act.',
    whoMustComply: 'Any person making taxable supplies exceeding TZS 200,000,000 per year.',
    deadline: 'Within 30 days of exceeding the threshold.',
    howToFile: 'Apply at TRA offices or via e-Tax portal. Voluntary registration available below threshold.',
    penalty: 'Failure to register: 50–100 currency points (CP) fine + possible imprisonment (S.78 VAT Act).',
  },
  {
    id: 3, title: 'PAYE Filing (Monthly)', category: 'monthly',
    description: 'Employers must withhold PAYE from employee salaries and remit to TRA monthly under S.81 ITA.',
    whoMustComply: 'All employers with employees earning above the PAYE threshold (TZS 270,000/month).',
    deadline: '7th of each following month.',
    howToFile: 'File PAYE return and payment via TRA e-Tax portal or at TRA offices. Employee-by-employee payroll detail required.',
    penalty: 'Late filing: 2.5% of tax due per month. Failure to withhold: employer is personally liable for the tax.',
  },
  {
    id: 4, title: 'SDL Filing (Monthly)', category: 'monthly',
    description: 'Skills Development Levy at 4.5% of gross payroll must be paid monthly by employers under SDL Act.',
    whoMustComply: 'Employers with 4 or more employees.',
    deadline: '7th of each following month.',
    howToFile: 'File SDL return with PAYE via e-Tax portal. Rate is 4.5% of total gross emoluments.',
    penalty: 'Late payment: interest and penalties at TRA discretion. Minimum TZS 100,000.',
  },
  {
    id: 5, title: 'WHT Filing (Monthly)', category: 'monthly',
    description: 'Withholding tax deducted from payments (dividends, interest, rent, services) must be remitted monthly under S.81 ITA.',
    whoMustComply: 'Any person making withholding tax payments (WHT agents).',
    deadline: '7th of each following month.',
    howToFile: 'File WHT return via e-Tax portal listing payees, amounts, and tax withheld.',
    penalty: 'Late filing: 2.5% per month. WHT agent is personally liable for unremitted amounts.',
  },
  {
    id: 6, title: 'VAT Return (Monthly)', category: 'monthly',
    description: 'Registered VAT traders must file monthly VAT returns and pay net VAT due under S.35 VAT Act.',
    whoMustComply: 'All VAT-registered businesses.',
    deadline: '20th of each following month.',
    howToFile: 'File VAT return via TRA e-Tax portal showing output tax, input tax, and net payable/refund.',
    penalty: 'Late filing (S.78 TAA): 2.5% of tax due × 2 × months or CP-based penalty, whichever is higher.',
  },
  {
    id: 7, title: 'Quarterly Installment — Q1 (March)', category: 'quarterly',
    description: 'First quarterly installment tax payment — 25% of estimated annual tax liability under S.88 ITA.',
    whoMustComply: 'Businesses and individuals with income not fully subject to withholding tax.',
    deadline: '31 March of the year of income.',
    howToFile: 'File installment return via e-Tax portal. Estimate based on prior year tax or current year projection.',
    penalty: 'Underestimation penalty: 20% of the shortfall between installment and actual tax.',
  },
  {
    id: 8, title: 'Quarterly Installment — Q2 (June)', category: 'quarterly',
    description: 'Second quarterly installment — cumulative 50% of estimated annual tax due.',
    whoMustComply: 'Same as Q1.',
    deadline: '30 June of the year of income.',
    howToFile: 'File via e-Tax portal. Cumulative payments should reach 50% of estimated annual liability.',
    penalty: 'Same as Q1: 20% penalty on shortfall.',
  },
  {
    id: 9, title: 'Quarterly Installment — Q3 (September)', category: 'quarterly',
    description: 'Third quarterly installment — cumulative 75% of estimated annual tax due.',
    whoMustComply: 'Same as Q1.',
    deadline: '30 September of the year of income.',
    howToFile: 'File via e-Tax portal. Cumulative payments should reach 75%.',
    penalty: 'Same as Q1: 20% penalty on shortfall.',
  },
  {
    id: 10, title: 'Quarterly Installment — Q4 (December)', category: 'quarterly',
    description: 'Fourth quarterly installment — cumulative 100% of estimated annual tax due.',
    whoMustComply: 'Same as Q1.',
    deadline: '31 December of the year of income.',
    howToFile: 'File via e-Tax portal. All four installments should cover full estimated liability.',
    penalty: 'Same as Q1: 20% penalty on shortfall.',
  },
  {
    id: 11, title: 'Annual Income Tax Return', category: 'annual',
    description: 'Final income tax return for the year reconciling total income, deductions, and tax liability under S.91 ITA.',
    whoMustComply: 'All taxpayers with income above exemption thresholds (individuals and entities).',
    deadline: '30 June of the following year (6 months after year-end).',
    howToFile: 'File annual return via TRA e-Tax portal with audited accounts (if required), income schedule, and capital allowances.',
    penalty: 'Late filing: TZS 225,000 (individual) or TZS 7.5 million (entity) per month of delay.',
  },
  {
    id: 12, title: 'Presumptive Tax', category: 'annual',
    description: 'Small businesses with turnover under TZS 100 million pay presumptive tax under S.43 ITA instead of standard income tax.',
    whoMustComply: 'Individuals with business turnover between TZS 4 million and TZS 100 million (not VAT registered).',
    deadline: '30 June of the following year.',
    howToFile: 'File presumptive tax return via e-Tax portal. Tax computed on turnover based on prescribed schedule.',
    penalty: 'Same late filing penalties as annual return. S.43-compliant businesses pay reduced rates.',
  },
  {
    id: 13, title: 'EFD Machine Compliance', category: 'other',
    description: 'VAT-registered businesses must use Electronic Fiscal Devices (EFD) for all sales and issue fiscal receipts under EFD Regulations 2010.',
    whoMustComply: 'All VAT-registered businesses making retail sales.',
    deadline: 'Continuous obligation — every transaction.',
    howToFile: 'Purchase approved EFD machine from TRA-authorised supplier. Issue fiscal receipt for every sale.',
    penalty: 'Failure to use EFD: TZS 3 million fine or 3× uncollected tax, whichever is higher. Possible business closure.',
  },
  {
    id: 14, title: 'WCF Contributions', category: 'monthly',
    description: "Workers' Compensation Fund contributions at 0.5% of gross payroll by employers under WCF Act.",
    whoMustComply: 'All employers with employees.',
    deadline: '7th of each following month.',
    howToFile: 'File WCF return and payment at WCF offices or authorised banks.',
    penalty: 'Late payment: surcharge of 5% per month on unpaid contributions.',
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  registration: 'Registration',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annual: 'Annual',
  other: 'Other',
};

const CATEGORY_COLORS: Record<string, string> = {
  registration: 'bg-purple-100 text-purple-700',
  monthly: 'bg-blue-100 text-blue-700',
  quarterly: 'bg-teal-100 text-teal-700',
  annual: 'bg-orange-100 text-orange-700',
  other: 'bg-gray-100 text-gray-600',
};

type Status = 'compliant' | 'review' | 'action';

export default function CompliancePage() {
  const [statuses, setStatuses] = useState<Record<number, Status>>({});
  const [expanded, setExpanded] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>('all');

  function cycleStatus(id: number) {
    setStatuses(prev => {
      const cur = prev[id] ?? 'review';
      const next: Status = cur === 'review' ? 'compliant' : cur === 'compliant' ? 'action' : 'review';
      return { ...prev, [id]: next };
    });
  }

  const filtered = filter === 'all' ? CHECKLIST : CHECKLIST.filter(i => i.category === filter);

  const counts = {
    compliant: Object.values(statuses).filter(s => s === 'compliant').length,
    action: Object.values(statuses).filter(s => s === 'action').length,
    review: CHECKLIST.length - Object.values(statuses).filter(s => s === 'compliant').length - Object.values(statuses).filter(s => s === 'action').length,
  };

  function StatusIcon({ id }: { id: number }) {
    const s = statuses[id] ?? 'review';
    if (s === 'compliant') return <CheckCircle size={22} className="text-green-500" />;
    if (s === 'action') return <AlertCircle size={22} className="text-red-500" />;
    return <Clock size={22} className="text-amber-400" />;
  }

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-2">
          <Calendar size={32} className="text-brand-600" />
          <h1 className="text-3xl font-bold text-gray-900">Tax Compliance Checklist</h1>
        </div>
        <p className="text-gray-500 mb-8">Track your Tanzania tax obligations. Click the status icon on each item to mark it.</p>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-green-700">{counts.compliant}</p>
            <p className="text-sm text-green-600 mt-1">Compliant</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-amber-700">{counts.review}</p>
            <p className="text-sm text-amber-600 mt-1">Needs Review</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-red-700">{counts.action}</p>
            <p className="text-sm text-red-600 mt-1">Action Required</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {['all', 'registration', 'monthly', 'quarterly', 'annual', 'other'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize ${filter === f ? 'bg-brand-600 text-white' : 'bg-white border text-gray-700 hover:border-brand-400'}`}>
              {f === 'all' ? 'All' : CATEGORY_LABELS[f]}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map(item => {
            const status = statuses[item.id] ?? 'review';
            const isExpanded = expanded === item.id;
            return (
              <div key={item.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden ${
                status === 'compliant' ? 'border-green-200' : status === 'action' ? 'border-red-200' : 'border-gray-100'
              }`}>
                <div className="flex items-center p-4 gap-3">
                  <button onClick={() => cycleStatus(item.id)} title="Click to change status">
                    <StatusIcon id={item.id} />
                  </button>
                  <button
                    className="flex-1 flex items-center justify-between text-left"
                    onClick={() => setExpanded(isExpanded ? null : item.id)}
                  >
                    <div>
                      <p className="font-semibold text-gray-900">{item.title}</p>
                      <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{item.description}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[item.category]}`}>
                        {CATEGORY_LABELS[item.category]}
                      </span>
                      {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                    </div>
                  </button>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-50 space-y-3 pt-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Who Must Comply</p>
                      <p className="text-sm text-gray-700">{item.whoMustComply}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Deadline</p>
                        <p className="text-sm text-blue-800">{item.deadline}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">How to File</p>
                        <p className="text-sm text-gray-700">{item.howToFile}</p>
                      </div>
                    </div>
                    <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                      <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-1">Penalty for Non-Compliance</p>
                      <p className="text-sm text-red-700">{item.penalty}</p>
                    </div>
                    <div className="flex gap-2">
                      {(['compliant', 'review', 'action'] as Status[]).map(s => (
                        <button key={s} onClick={() => setStatuses(prev => ({ ...prev, [item.id]: s }))}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize border ${
                            status === s
                              ? s === 'compliant' ? 'bg-green-500 text-white border-green-500'
                              : s === 'action' ? 'bg-red-500 text-white border-red-500'
                              : 'bg-amber-400 text-white border-amber-400'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                          }`}>
                          {s === 'compliant' ? 'Compliant' : s === 'review' ? 'Review' : 'Action Needed'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-10 bg-amber-50 border border-amber-200 rounded-xl p-6">
          <h3 className="font-semibold text-amber-800 mb-2">Note on Status Tracking</h3>
          <p className="text-sm text-amber-700">
            Status is stored locally in your browser session only. For formal compliance tracking, maintain a compliance register and consult a qualified tax advisor or TRA for your specific filing obligations.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
