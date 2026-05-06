import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '../../components/ui/Navbar';
import Footer from '../../components/ui/Footer';
import ReviewsSection from '../../components/ReviewsSection';

export const metadata: Metadata = {
  title: 'About KodiComply — Tanzania\'s Most Accurate Tax Engine',
  description: 'Learn how KodiComply handles Tanzania\'s most complex tax edge cases — from NSSF/PPF split calculations to VAT apportionment, thin capitalisation, and treaty relief. Built on ITA Cap 332 R.E.2023.',
  alternates: { canonical: 'https://kodicomply.co.tz/about' },
  openGraph: {
    title: 'About KodiComply | Tanzania Tax Compliance Platform',
    description: 'How KodiComply handles Tanzania\'s most complex tax scenarios — built on the exact logic of the Income Tax Act and VAT Act.',
    url: 'https://kodicomply.co.tz/about',
    type: 'website',
  },
};
import {
  BarChart3, FileCheck, Globe, Shield, CheckCircle2, ArrowRight,
  Lock, RefreshCw, Users, Calculator, Building2,
} from 'lucide-react';

const features = [
  {
    icon: BarChart3,
    title: 'Every Rate from the Database',
    desc: 'PAYE bands, WHT rates, depreciation classes, VAT thresholds — all admin-editable. When TRA announces changes, rates update instantly without redeploying code.',
  },
  {
    icon: FileCheck,
    title: 'Full ITA & VAT Act Logic',
    desc: 'Capital gains special rates, thin capitalisation, loss carryforward, going concern, lay-by VAT, partnership transparency — the exact rules, not approximations.',
  },
  {
    icon: Globe,
    title: 'Kiswahili Support',
    desc: 'Full EN/SW language toggle. All labels, results, and guidance available in both English and Kiswahili — no partial translations.',
  },
  {
    icon: Shield,
    title: 'Legal References Included',
    desc: 'Every result cites the exact section — S.116 ITA, VAT Act Cap 148, Third Schedule. Know exactly where your number comes from.',
  },
  {
    icon: Lock,
    title: 'Secure & Private',
    desc: 'Calculations are tied to your account with JWT authentication. No sensitive data is shared with third parties.',
  },
  {
    icon: RefreshCw,
    title: 'Admin-Maintained Rates',
    desc: 'Our admin panel allows instant rate updates when TRA publishes amendments. You always calculate on current law.',
  },
];

const edgeCases = [
  'Pool write-off when depreciation basis < TZS 1,000,000',
  '50% initial allowance for Class 2/3 manufacturing assets',
  'VAT bad debt adjustment after 18-month threshold (S.78)',
  'Thin capitalisation 7:3 debt-equity disallowance',
  'Partnership transparency — income flows to individual partners',
  'Capital gains 10% flat rate above TZS 3,240,000 threshold',
  'WHT construction split: 3/5 materials × 2%, 2/5 services × 5%',
  'Terminal benefits — 4 contract scenarios with different spreading rules',
  'Presumptive tax S.43 TAA complying vs non-complying rates',
  'Digital marketplace 2% tax on gross payments (S.116 ITA)',
];

const vatTools = [
  { label: 'VAT Pricing Tool',        desc: 'Tax-inclusive vs exclusive calculations, tax fraction 18/118' },
  { label: 'Bad Debt Adj. (S.78)',     desc: 'Supplier reclaim after 18 months unpaid and written off' },
  { label: 'Going Concern (S.20)',     desc: 'Zero-rate transfer of business as a going concern' },
  { label: 'Lay-By Sales (S.16)',      desc: 'VAT point for lay-by instalment sales' },
  { label: 'Adjustment Events',        desc: 'Credit notes, price changes, return of goods' },
  { label: 'Connected Persons',        desc: 'Market value rules for related-party transactions' },
];

const who = [
  { icon: Building2, title: 'Business Owners',  desc: 'Know your PAYE, SDL, WHT and corporate obligations upfront — no surprises at filing time.' },
  { icon: Users,     title: 'Accountants',       desc: 'Run multiple scenarios quickly and share PDF breakdowns with clients.' },
  { icon: Calculator, title: 'HR & Payroll',    desc: 'Calculate net salaries, process benefits in kind, and verify SDL correctly every month.' },
  { icon: Shield,    title: 'Tax Consultants',   desc: 'Cross-check calculations against the statute with exact legal references on every result.' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* Header */}
      <div className="bg-brand-950 py-12 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-brand-300 text-xs font-bold uppercase tracking-widest mb-3">Why KodiComply</p>
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3">
            Built on the statute,<br />not approximations.
          </h1>
          <p className="text-white/60 text-sm leading-relaxed max-w-xl mx-auto">
            Most tax tools estimate. KodiComply implements the exact formulas from the Income Tax Act Cap 332 and VAT Act Cap 148 — including the edge cases most accountants still look up.
          </p>
        </div>
      </div>

      <main className="flex-1">

        {/* ── Features grid ──────────────────────────────────────────────── */}
        <section className="py-14 px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-8 text-center">What makes it different</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="bg-gray-50 rounded-2xl border border-gray-100 p-5">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center mb-3">
                    <Icon size={18} className="text-brand-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm mb-1.5">{title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Edge cases ─────────────────────────────────────────────────── */}
        <section className="py-14 px-6 bg-slate-50 border-t border-gray-100">
          <div className="max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-10 items-start">
              <div>
                <p className="text-brand-600 text-xs font-bold uppercase tracking-widest mb-3">Statute-Level Accuracy</p>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 leading-tight">
                  The edge cases other tools miss
                </h2>
                <p className="text-gray-500 text-sm leading-relaxed mb-6">
                  Tanzania tax has dozens of complex rules that only appear in practice. KodiComply handles all of them correctly because every formula is sourced directly from the Act.
                </p>
                <Link href="/calculators" className="btn-primary inline-flex text-sm px-5 py-2.5">
                  Browse all calculators <ArrowRight size={14} />
                </Link>
              </div>
              <div className="space-y-2.5">
                {edgeCases.map(item => (
                  <div key={item} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <CheckCircle2 size={16} className="text-brand-500 flex-shrink-0 mt-0.5" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── VAT Tools highlight ─────────────────────────────────────────── */}
        <section className="py-14 px-6 bg-white border-t border-gray-100">
          <div className="max-w-5xl mx-auto">
            <div className="rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0d1f17 0%, #1a5c38 60%, #0f3320 100%)' }}>
              <div className="grid lg:grid-cols-2 gap-0">
                <div className="p-8 lg:p-12">
                  <p className="text-gold-400 text-xs font-bold uppercase tracking-widest mb-3">VAT Act Cap 148 R.E.2023</p>
                  <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4 leading-tight">
                    Complete VAT toolkit<br />in one place.
                  </h2>
                  <p className="text-white/60 text-sm leading-relaxed mb-7">
                    Six specialised VAT tools covering every scenario — from pricing calculations to bad debt adjustments, going concern transfers, lay-by sales, and connected persons valuation.
                  </p>
                  <div className="space-y-3 mb-8">
                    {vatTools.map(({ label, desc }) => (
                      <div key={label} className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-gold-400 flex-shrink-0 mt-1.5" />
                        <div>
                          <span className="text-white/85 text-sm font-medium">{label}</span>
                          <span className="text-white/45 text-xs"> — {desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link href="/calculator/vat-tools" className="btn-gold inline-flex text-sm px-5 py-2.5">
                    Open VAT Tools <ArrowRight size={14} />
                  </Link>
                </div>
                <div className="hidden lg:flex items-center justify-center p-10">
                  <div className="w-full max-w-xs space-y-4">
                    {[
                      { label: 'Exempt Supplies', color: 'bg-emerald-400', pct: 72 },
                      { label: 'Zero-Rated',       color: 'bg-blue-400',    pct: 18 },
                      { label: 'Standard Rated',   color: 'bg-orange-400',  pct: 10 },
                    ].map(({ label, color, pct }) => (
                      <div key={label}>
                        <div className="flex justify-between text-xs text-white/60 mb-1.5">
                          <span>{label}</span><span className="num">{pct}%</span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    ))}
                    <p className="text-white/30 text-xs pt-2 border-t border-white/10">
                      130+ items · First &amp; Second Schedule VAT Act
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Who it's for ───────────────────────────────────────────────── */}
        <section className="py-14 px-6 bg-slate-50 border-t border-gray-100">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-8 text-center">Who uses KodiComply</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {who.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="bg-white rounded-xl border border-gray-100 p-5 flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
                    <Icon size={18} className="text-brand-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm mb-1">{title}</h3>
                    <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Reviews ────────────────────────────────────────────────────── */}
        <ReviewsSection limit={3} />

        {/* ── CTA ────────────────────────────────────────────────────────── */}
        <section className="py-14 px-6 bg-brand-950">
          <div className="max-w-xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-white mb-3">Ready to calculate correctly?</h2>
            <p className="text-white/60 text-sm mb-6">Free account. No credit card. Instant access to all 21+ calculators.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/auth/register" className="btn-gold inline-flex px-6 py-3">
                Get Started Free <ArrowRight size={15} />
              </Link>
              <Link href="/calculators" className="btn-ghost border border-white/20 text-white/80 px-6 py-3 rounded-xl inline-flex hover:bg-white/10">
                Browse Calculators
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
