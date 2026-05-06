import type { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '../components/ui/Navbar';
import Footer from '../components/ui/Footer';
import ReviewsSection from '../components/ReviewsSection';
import {
  Briefcase, Building2, Receipt, FileCheck,
  Shield, ArrowRight, Zap, Lock, RefreshCw, Star,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'KodiComply — Free Tanzania Tax Calculators | PAYE, VAT, WHT & More',
  description: 'Calculate Tanzania PAYE, VAT, withholding tax, corporate tax, terminal benefits and more. Free, accurate, TRA-aligned calculators with instant results. Hesabu yako ya kodi.',
  alternates: { canonical: 'https://kodicomply.co.tz' },
  openGraph: {
    title: 'KodiComply — Free Tanzania Tax Calculators',
    description: 'PAYE, VAT, WHT, corporate tax and 21+ more calculators for Tanzania. Free, accurate, instant.',
    url: 'https://kodicomply.co.tz',
    type: 'website',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://kodicomply.co.tz/#organization',
      name: 'KodiComply',
      url: 'https://kodicomply.co.tz',
      description: 'Tanzania tax compliance platform with free PAYE, VAT, WHT and corporate tax calculators.',
      foundingLocation: { '@type': 'Place', name: 'Tanzania' },
      areaServed: { '@type': 'Country', name: 'Tanzania' },
    },
    {
      '@type': 'WebSite',
      '@id': 'https://kodicomply.co.tz/#website',
      url: 'https://kodicomply.co.tz',
      name: 'KodiComply',
      publisher: { '@id': 'https://kodicomply.co.tz/#organization' },
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: 'https://kodicomply.co.tz/calculators?q={search_term_string}' },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'WebPage',
      '@id': 'https://kodicomply.co.tz/#webpage',
      url: 'https://kodicomply.co.tz',
      name: 'Free Tanzania Tax Calculators — KodiComply',
      isPartOf: { '@id': 'https://kodicomply.co.tz/#website' },
      about: { '@id': 'https://kodicomply.co.tz/#organization' },
      description: 'Free online Tanzania tax calculators — PAYE, VAT, WHT, corporate tax, terminal benefits, presumptive tax and more.',
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How do I calculate PAYE in Tanzania?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Use the KodiComply PAYE Calculator. Enter gross salary, allowances, and deductions. The calculator applies the First Schedule ITA progressive bands (0%, 8%, 20%, 25%, 30%) and deducts NSSF/PPF contributions automatically.',
          },
        },
        {
          '@type': 'Question',
          name: 'Do I need to register for VAT in Tanzania?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'You must register for VAT if your annual taxable turnover exceeds TZS 200 million. Use the KodiComply VAT Registration Checker to find out instantly.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is the withholding tax rate in Tanzania?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'WHT rates in Tanzania vary by payment type: dividends (5%-10%), interest (10%), royalties (10%), service fees to residents (5%), and non-resident contractors (15%). Use the KodiComply WHT Calculator for exact amounts.',
          },
        },
        {
          '@type': 'Question',
          name: 'What is presumptive tax in Tanzania?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Presumptive tax applies to small businesses with annual turnover below TZS 100 million. Tax is calculated from a table based on turnover rather than profit. KodiComply\'s Presumptive Tax Calculator handles both S.43 and non-S.43 businesses.',
          },
        },
      ],
    },
  ],
};

const featured = [
  {
    icon: Briefcase,
    title: 'Employment Tax (PAYE)',
    desc: 'Progressive bands, allowances, benefits in kind, NSSF.',
    href: '/calculator/employment',
    accent: 'from-blue-500 to-indigo-600',
    tag: 'Most used',
  },
  {
    icon: Receipt,
    title: 'VAT',
    desc: 'Registration check, input/output, apportionment, imports.',
    href: '/calculator/vat',
    accent: 'from-orange-500 to-amber-600',
    tag: null,
  },
  {
    icon: FileCheck,
    title: 'Withholding Tax',
    desc: '18 payment types — dividends, rent, royalties, fees.',
    href: '/calculator/withholding',
    accent: 'from-emerald-500 to-green-600',
    tag: null,
  },
  {
    icon: Building2,
    title: 'Business Income Tax',
    desc: 'Sole traders, companies, depreciation, thin-cap.',
    href: '/calculator/business',
    accent: 'from-violet-500 to-purple-600',
    tag: null,
  },
];

const stats = [
  { n: '21+', label: 'Tax Modules' },
  { n: '100%', label: 'DB-Driven Rates' },
  { n: 'ITA', label: 'Cap 332 R.E.2023' },
  { n: 'VAT', label: 'Act Cap 148' },
];

const trust = [
  { icon: Shield,    text: 'TRA Compliant' },
  { icon: RefreshCw, text: 'Auto-Updated Rates' },
  { icon: Lock,      text: 'Secure & Private' },
  { icon: Zap,       text: 'Instant Results' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="hero-pattern relative overflow-hidden min-h-[85vh] lg:min-h-[92vh] flex items-center">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24 w-full">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

            {/* Copy */}
            <div className="space-y-6 lg:space-y-8">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-sm text-white/90">
                <span className="relative flex h-2 w-2">
                  <span className="animate-pulse-ring absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                TRA Compliant · ITA Cap 332 R.E.2023
              </div>

              <div className="space-y-3">
                <h1 className="text-4xl lg:text-6xl font-bold text-white leading-[1.1] tracking-tight">
                  Tanzania&apos;s most
                  <br />
                  <span className="text-gradient">accurate</span>
                  <br />
                  tax engine.
                </h1>
                <p className="text-base lg:text-lg text-white/70 max-w-md leading-relaxed">
                  PAYE, VAT, WHT, corporate tax and 18 more calculators — built on the exact logic of the Income Tax Act and VAT Act.
                </p>
                <p className="text-sm text-white/40 italic">Hesabu yako ya kodi, rahisi na sahihi.</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/calculator/employment" className="btn-gold text-base px-7 py-3.5">
                  Start Calculating <ArrowRight size={16} />
                </Link>
                <Link href="/auth/register" className="btn-ghost border border-white/25 text-white/85 hover:bg-white/10 hover:text-white px-7 py-3.5 rounded-xl text-base">
                  Free Account
                </Link>
              </div>

              <div className="flex flex-wrap gap-4 pt-1">
                {trust.map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-1.5 text-white/60 text-xs">
                    <Icon size={13} className="text-brand-300" />
                    {text}
                  </div>
                ))}
              </div>
            </div>

            {/* Floating card — desktop only */}
            <div className="hidden lg:flex justify-end">
              <div className="animate-float-slow w-full max-w-sm relative">
                <div className="card-glass shadow-deep">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-white/50 text-xs uppercase tracking-widest font-semibold">PAYE Calculator</p>
                      <p className="text-white font-bold text-lg mt-0.5">Employment Tax</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-brand-500/30 flex items-center justify-center border border-brand-400/30">
                      <Briefcase size={18} className="text-brand-300" />
                    </div>
                  </div>
                  <div className="divider-dark" />
                  <div className="space-y-2.5 text-sm my-4">
                    {[
                      { label: 'Gross Monthly Salary', val: 'TZS 3,500,000', dimmed: false },
                      { label: 'NSSF Contribution',    val: '(TZS 350,000)',  dimmed: true  },
                      { label: 'SDL (4%)',              val: '(TZS 140,000)',  dimmed: true  },
                      { label: 'Taxable Income',        val: 'TZS 3,010,000', dimmed: false },
                    ].map(row => (
                      <div key={row.label} className="flex items-center justify-between">
                        <span className={row.dimmed ? 'text-white/40' : 'text-white/70'}>{row.label}</span>
                        <span className={`num font-semibold ${row.dimmed ? 'text-white/40' : 'text-white/80'}`}>{row.val}</span>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl p-4 mt-4" style={{ background: 'rgba(26,92,56,0.35)', border: '1px solid rgba(42,134,90,0.4)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-brand-300 text-xs font-semibold uppercase tracking-wide">PAYE Due</span>
                      <span className="num text-2xl font-bold text-white">TZS 212,000</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/50 text-xs">Net Take-Home</span>
                      <span className="num text-white/80 font-semibold">TZS 2,798,000</span>
                    </div>
                  </div>
                  <p className="text-white/30 text-xs mt-4">S.81 ITA Cap 332 R.E.2023 · First Schedule</p>
                </div>
                <div className="absolute -top-3 -right-3 bg-gold-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-glow-gold">
                  Live
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none" />
      </section>

      {/* ── Stats bar ─────────────────────────────────────────────────────── */}
      <section className="bg-brand-950 border-y border-brand-900 py-6 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map(({ n, label }) => (
            <div key={label} className="text-center">
              <p className="stat-num text-gold-400">{n}</p>
              <p className="text-xs text-white/40 font-medium mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured calculators ──────────────────────────────────────────── */}
      <section className="py-14 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
            <div>
              <p className="text-brand-600 text-xs font-bold uppercase tracking-widest mb-1">Most Used</p>
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">Popular calculators</h2>
            </div>
            <Link href="/calculators" className="flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700">
              See all 21+ modules <ArrowRight size={15} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {featured.map(({ icon: Icon, title, desc, href, accent, tag }) => (
              <Link
                key={href} href={href}
                className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-5 overflow-hidden flex gap-4 items-start"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center shadow-sm flex-shrink-0 mt-0.5`}>
                  <Icon size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900 text-sm group-hover:text-brand-700 transition-colors">{title}</h3>
                    {tag && <span className="text-[10px] bg-brand-50 text-brand-700 border border-brand-200/60 px-1.5 py-0.5 rounded-full font-semibold">{tag}</span>}
                  </div>
                  <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
                </div>
                <ArrowRight size={15} className="text-gray-300 group-hover:text-brand-500 transition-colors flex-shrink-0 mt-1" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section className="py-14 px-6 bg-white border-t border-gray-100">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-brand-600 text-xs font-bold uppercase tracking-widest mb-2">Simple as 1–2–3</p>
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">From question to answer in seconds</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { step: '01', title: 'Choose a calculator', desc: 'PAYE, VAT, WHT, corporate — pick the right module.' },
              { step: '02', title: 'Enter your numbers', desc: 'Guided wizard questions. Rates load from the database.' },
              { step: '03', title: 'Get compliant results', desc: 'Breakdown with legal references + optional PDF export.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-brand-600 text-white font-bold text-base flex items-center justify-center mx-auto mb-3 shadow-glow-sm num">
                  {step}
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-1.5">{title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/about" className="text-sm text-brand-600 font-semibold hover:underline">
              Why KodiComply? See what makes it different →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Reviews ───────────────────────────────────────────────────────── */}
      <ReviewsSection limit={3} />

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <section className="py-14 px-6 bg-slate-50 border-t border-gray-100">
        <div className="max-w-xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 badge-brand mb-5">
            <Star size={12} /> Free forever · No card required
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">
            Start calculating.<br />Stay compliant.
          </h2>
          <p className="text-gray-500 mb-7 text-sm leading-relaxed">
            Save calculations, track filing deadlines, and generate PDF reports for your clients.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/auth/register" className="btn-primary text-base px-8 py-3.5 inline-flex">
              Create Free Account <ArrowRight size={16} />
            </Link>
            <Link href="/calculator/employment" className="btn-ghost text-base px-6 py-3.5 border border-gray-200 rounded-xl inline-flex">
              Try without signing in
            </Link>
          </div>
          <p className="text-gray-400 text-xs mt-5">
            For informational purposes only. Always verify with a qualified tax professional.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
