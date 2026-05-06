import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '../../components/ui/Navbar';
import Footer from '../../components/ui/Footer';

export const metadata: Metadata = {
  title: 'All Tanzania Tax Calculators — PAYE, VAT, WHT & 21 More',
  description: 'Browse all 21+ free Tanzania tax calculators: PAYE, VAT, withholding tax, corporate tax, terminal benefits, presumptive tax, penalties, and more. TRA-aligned, instant results.',
  alternates: { canonical: 'https://kodicomply.co.tz/calculators' },
  openGraph: {
    title: 'All Tanzania Tax Calculators | KodiComply',
    description: '21+ free TRA-aligned calculators: PAYE, VAT, WHT, corporate tax, presumptive tax, terminal benefits, penalties and more.',
    url: 'https://kodicomply.co.tz/calculators',
    type: 'website',
  },
};
import {
  Briefcase, Building2, Receipt, FileCheck, TrendingUp, Calculator,
  Shield, Globe, Users, Clock, BarChart3, Zap, FileText, Store,
  ChevronRight, ArrowRight,
} from 'lucide-react';

const groups = [
  {
    category: 'Income Tax',
    color: 'bg-blue-50 border-blue-100',
    iconColor: 'from-blue-500 to-indigo-600',
    items: [
      { href: '/calculator/employment',  icon: Briefcase,  title: 'Employment Tax (PAYE)',  desc: 'Gross salary, allowances, NSSF, SDL, benefits in kind.', tag: 'Most used' },
      { href: '/calculator/business',    icon: Building2,  title: 'Business Income Tax',    desc: 'Sole traders and companies — depreciation, thin-cap, loss carryforward.' },
      { href: '/calculator/corporate',   icon: Building2,  title: 'Corporate Tax',          desc: '6 rate scenarios — DSE listed, assembler, pharma, perpetual loss.' },
      { href: '/calculator/presumptive', icon: Store,      title: 'Presumptive Tax',        desc: 'Small businesses under TZS 100M — S.43 TAA complying and non-complying.' },
      { href: '/calculator/investment',  icon: TrendingUp, title: 'Investment Income',      desc: 'Capital gains, dividends, interest, DSE exemptions, 10% flat rate.' },
      { href: '/calculator/terminal',    icon: Users,      title: 'Terminal Benefits',      desc: '4 contract types — specified, unspecified with/without clause, general.' },
      { href: '/calculator/partnership', icon: Users,      title: 'Partnership Taxation',   desc: 'S.48–51 ITA transparent entity — partner allocation and WHT credits.' },
    ],
  },
  {
    category: 'VAT',
    color: 'bg-orange-50 border-orange-100',
    iconColor: 'from-orange-500 to-amber-600',
    items: [
      { href: '/calculator/vat',               icon: Receipt,   title: 'VAT Calculator',           desc: 'Registration check, input/output tax, apportionment, reverse charge.', tag: null },
      { href: '/calculator/vat-exempt-checker', icon: Shield,    title: 'VAT Exempt Checker',       desc: 'Search 130+ exempt supplies, imports, real estate wizard.', tag: 'New' },
      { href: '/calculator/vat-tools',         icon: BarChart3, title: 'VAT Special Tools',        desc: 'Pricing, bad debt (S.78), going concern (S.20), lay-by (S.16).', tag: 'New' },
      { href: '/calculator/vat-refund',        icon: FileCheck, title: 'VAT Refund Eligibility',   desc: 'Check if you qualify for a VAT refund under S.76 VAT Act.' },
    ],
  },
  {
    category: 'Withholding & Other Taxes',
    color: 'bg-green-50 border-green-100',
    iconColor: 'from-emerald-500 to-green-600',
    items: [
      { href: '/calculator/withholding',        icon: FileCheck, title: 'Withholding Tax (WHT)',      desc: '18 payment types — resident and non-resident, final and non-final.' },
      { href: '/calculator/penalty',            icon: Calculator, title: 'Penalties & Interest',       desc: 'Late filing, late payment, compound interest I=P[(1+r/12)^t−1].' },
      { href: '/calculator/digital-marketplace', icon: Globe,    title: 'Digital Marketplace Tax',    desc: '2% tax on gross payments from Tanzania individuals — S.116 ITA.', tag: 'New' },
      { href: '/calculator/filing-required',    icon: FileText,  title: 'Filing Required Checker',    desc: 'Determine your exact filing obligations based on entity and income.' },
    ],
  },
  {
    category: 'Advanced & Specialised',
    color: 'bg-purple-50 border-purple-100',
    iconColor: 'from-violet-500 to-purple-600',
    items: [
      { href: '/calculator/benefits',   icon: Zap,      title: 'Benefits in Kind',        desc: 'Vehicle, residential, loan benefits — ITA Third Schedule valuation.' },
      { href: '/calculator/retirement', icon: Shield,   title: 'Retirement Fund',         desc: 'Contributions, payments, approved vs unapproved fund treatment.' },
      { href: '/calculator/longterm',   icon: Clock,    title: 'Long-Term Contracts',     desc: 'Income apportionment for multi-year construction contracts.' },
      { href: '/calculator/foreigntax', icon: Globe,    title: 'Foreign Tax Relief',      desc: 'Double-tax credit under treaty and unilateral relief rules.' },
    ],
  },
];

export default function CalculatorsPage() {
  const total = groups.reduce((s, g) => s + g.items.length, 0);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      {/* Header */}
      <div className="bg-brand-950 py-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-brand-300 text-xs font-bold uppercase tracking-widest mb-3">All Modules</p>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3">
            {total}+ Tax Calculators
          </h1>
          <p className="text-white/60 text-sm max-w-lg mx-auto leading-relaxed">
            Every calculator follows the exact statute — Income Tax Act Cap 332 R.E.2023 and VAT Act Cap 148 R.E.2023. No estimates, no shortcuts.
          </p>
        </div>
      </div>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-10">
        <div className="space-y-10">
          {groups.map(group => (
            <div key={group.category}>
              <h2 className="text-base font-bold text-gray-700 mb-4 flex items-center gap-2">
                <span className="w-1 h-5 bg-brand-600 rounded-full inline-block" />
                {group.category}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {group.items.map(({ href, icon: Icon, title, desc, tag }) => (
                  <Link
                    key={href}
                    href={href}
                    className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-4 flex gap-3 items-start"
                  >
                    <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${group.iconColor} flex items-center justify-center shadow-sm flex-shrink-0`}>
                      <Icon size={16} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="font-semibold text-gray-900 text-sm group-hover:text-brand-700 transition-colors">{title}</span>
                        {tag && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                            tag === 'New' ? 'bg-gold-50 text-gold-700 border-gold-200/60' : 'bg-brand-50 text-brand-700 border-brand-200/60'
                          }`}>
                            {tag}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
                    </div>
                    <ChevronRight size={14} className="text-gray-300 group-hover:text-brand-500 transition-colors flex-shrink-0 mt-1" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Quick links */}
        <div className="mt-12 rounded-2xl bg-brand-950 p-6 text-center">
          <p className="text-white/70 text-sm mb-4">Not sure which calculator to use?</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/onboarding" className="btn-gold inline-flex text-sm px-5 py-2.5">
              Set up my Tax Profile <ArrowRight size={14} />
            </Link>
            <Link href="/auth/register" className="btn-ghost border border-white/20 text-white/80 text-sm px-5 py-2.5 rounded-xl inline-flex hover:bg-white/10">
              Create Free Account
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
