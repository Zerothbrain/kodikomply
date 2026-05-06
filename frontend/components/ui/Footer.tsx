import Link from 'next/link';
import { Shield, Globe, BarChart3 } from 'lucide-react';

const calcLinks = [
  { href: '/calculator/employment',   label: 'Employment Tax (PAYE)' },
  { href: '/calculator/business',     label: 'Business Income Tax' },
  { href: '/calculator/vat',          label: 'VAT' },
  { href: '/calculator/withholding',  label: 'Withholding Tax' },
  { href: '/calculator/investment',   label: 'Investment Income' },
  { href: '/calculator/corporate',    label: 'Corporate Tax' },
  { href: '/calculator/partnership',  label: 'Partnership Taxation' },
  { href: '/calculator/penalty',      label: 'Penalties & Interest' },
];

const vatLinks = [
  { href: '/calculator/vat-tools',          label: 'VAT Special Tools' },
  { href: '/calculator/vat-exempt-checker', label: 'VAT Exempt Checker' },
  { href: '/calculator/vat-refund',         label: 'VAT Refund Eligibility' },
  { href: '/calculator/digital-marketplace',label: 'Digital Marketplace Tax' },
  { href: '/calculator/filing-required',    label: 'Filing Required Checker' },
];

const toolLinks = [
  { href: '/tools/exempt-checker', label: 'Am I Exempt?' },
  { href: '/tools/compliance',     label: 'Compliance Checklist' },
  { href: '/guide/filing-return',  label: 'Return Filing Guide' },
  { href: '/reports',              label: 'Reports & History' },
  { href: '/auth/register',        label: 'Create Account' },
  { href: '/auth/login',           label: 'Sign In' },
];

export default function Footer() {
  return (
    <footer style={{ background: '#070f0b' }} className="text-white/50 mt-auto border-t border-white/5 pb-24 sm:pb-0">
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4 group">
              <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center shadow-glow-sm">
                <span className="text-white font-black text-sm num">KC</span>
              </div>
              <div>
                <p className="text-white font-bold text-base leading-none">KodiComply</p>
                <p className="text-white/30 text-[11px] mt-0.5">Tanzania Tax Engine</p>
              </div>
            </Link>

            <p className="text-sm leading-relaxed mb-4">
              The most accurate Tanzania tax compliance platform — built on ITA Cap 332 R.E.2023 and VAT Act Cap 148.
            </p>
            <p className="text-xs italic text-white/30 mb-6">
              Hesabu yako ya kodi, rahisi na sahihi.
            </p>

            {/* Compliance badges */}
            <div className="space-y-2">
              {[
                { icon: Shield, text: 'TRA Compliant Calculations' },
                { icon: BarChart3, text: 'Admin-Updated Rates' },
                { icon: Globe, text: 'EN & SW Languages' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-xs">
                  <Icon size={12} className="text-brand-400 flex-shrink-0" />
                  {text}
                </div>
              ))}
            </div>
          </div>

          {/* Calculators */}
          <div>
            <h3 className="text-white text-xs font-bold uppercase tracking-widest mb-4">Calculators</h3>
            <ul className="space-y-2.5">
              {calcLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm hover:text-white transition-colors duration-150">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* VAT Tools */}
          <div>
            <h3 className="text-white text-xs font-bold uppercase tracking-widest mb-4">VAT Tools</h3>
            <ul className="space-y-2.5 mb-8">
              {vatLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm hover:text-white transition-colors duration-150">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>

            <h3 className="text-white text-xs font-bold uppercase tracking-widest mb-4">Tools & Account</h3>
            <ul className="space-y-2.5">
              {toolLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href} className="text-sm hover:text-white transition-colors duration-150">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal references */}
          <div>
            <h3 className="text-white text-xs font-bold uppercase tracking-widest mb-4">Legal Basis</h3>
            <div className="space-y-3 text-xs leading-relaxed">
              {[
                { ref: 'ITA Cap 332 R.E.2023', desc: 'Income Tax Act — PAYE, business income, WHT, capital gains' },
                { ref: 'VAT Act Cap 148', desc: 'Value Added Tax Act — registration, returns, exempt supplies' },
                { ref: 'TAA', desc: 'Tax Administration Act — penalties, record-keeping requirements' },
                { ref: 'First Schedule ITA', desc: 'PAYE bands, WHT rates, presumptive tax tables' },
                { ref: 'Third Schedule ITA', desc: 'Depreciation classes and capital allowance rates' },
                { ref: 'Fifth Schedule ITA', desc: 'Vehicle benefit valuation table by engine size' },
              ].map(({ ref, desc }) => (
                <div key={ref}>
                  <p className="text-white/60 font-semibold">{ref}</p>
                  <p className="text-white/30 text-[11px] mt-0.5">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/8 mt-10 pt-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-xs">
          <p>© {new Date().getFullYear()} KodiComply. For informational purposes only — not legal or tax advice.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
              Built for Tanzania 🇹🇿
            </span>
            <span className="text-white/20">·</span>
            <Link href="/admin" className="hover:text-white/60 transition-colors">Admin</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
