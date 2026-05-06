'use client';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import {
  Menu, X, LogOut, User, LayoutDashboard, ChevronDown, Globe,
  Briefcase, Building2, Receipt, FileCheck, TrendingUp, Calculator,
  Shield, Users, Clock, BarChart3, Zap, FileText, Store,
} from 'lucide-react';
import { getUser, clearAuth, isLoggedIn, isAdmin } from '../../lib/auth';
import { useI18n } from '../../lib/i18n';

interface NavItem { href: string; label: string; icon: React.ElementType; tag?: string }

const CALCULATORS: NavItem[] = [
  { href: '/calculator/employment',        label: 'Employment Tax (PAYE)',   icon: Briefcase,  tag: 'Popular' },
  { href: '/calculator/business',          label: 'Business Income Tax',     icon: Building2 },
  { href: '/calculator/presumptive',       label: 'Presumptive Tax',         icon: Store },
  { href: '/calculator/vat',               label: 'VAT',                     icon: Receipt },
  { href: '/calculator/withholding',       label: 'Withholding Tax',         icon: FileCheck },
  { href: '/calculator/investment',        label: 'Investment Income',       icon: TrendingUp },
  { href: '/calculator/terminal',          label: 'Terminal Benefits',       icon: Users },
  { href: '/calculator/corporate',         label: 'Corporate Tax',           icon: Building2 },
  { href: '/calculator/benefits',          label: 'Benefits in Kind',        icon: Zap },
  { href: '/calculator/partnership',       label: 'Partnership Taxation',    icon: Users },
  { href: '/calculator/retirement',        label: 'Retirement Fund',         icon: Shield },
  { href: '/calculator/longterm',          label: 'Long-Term Contracts',     icon: Clock },
  { href: '/calculator/foreigntax',        label: 'Foreign Tax Relief',      icon: Globe },
  { href: '/calculator/penalty',           label: 'Penalties & Interest',    icon: Calculator },
  { href: '/calculator/digital-marketplace', label: 'Digital Marketplace Tax', icon: Globe, tag: 'New' },
];

const VAT_TOOLS: NavItem[] = [
  { href: '/calculator/vat-tools',         label: 'VAT Special Tools',       icon: Receipt,    tag: 'New' },
  { href: '/calculator/vat-exempt-checker',label: 'VAT Exempt Checker',      icon: Shield,     tag: 'New' },
  { href: '/calculator/vat-refund',        label: 'VAT Refund Eligibility',  icon: BarChart3 },
  { href: '/calculator/filing-required',   label: 'Filing Required Checker', icon: FileCheck },
];

const TOOLS: NavItem[] = [
  { href: '/tools/exempt-checker',  label: 'Am I Exempt?',        icon: Shield },
  { href: '/tools/compliance',      label: 'Compliance Checklist', icon: FileCheck },
  { href: '/guide/filing-return',   label: 'Return Filing Guide',  icon: FileText },
  { href: '/reports',              label: 'Reports & History',    icon: BarChart3 },
];

function NavDropdown({ label, items, accent = false }: {
  label: string; items: NavItem[]; accent?: boolean
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={`nav-link ${accent ? 'text-gold-300 hover:text-gold-200' : ''}`}
      >
        {label}
        <ChevronDown size={13} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <div className={`nav-dropdown ${open ? 'nav-dropdown-open' : ''}`}>
        {items.length > 6 ? (
          <div className="grid grid-cols-2 gap-0 p-1">
            {items.map(({ href, label: l, icon: Icon, tag }) => (
              <Link
                key={href} href={href}
                onClick={() => setOpen(false)}
                className="nav-dropdown-item"
              >
                <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Icon size={13} className="text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{l}</p>
                  {tag && <span className="text-[10px] text-gold-600 font-semibold">{tag}</span>}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-1">
            {items.map(({ href, label: l, icon: Icon, tag }) => (
              <Link
                key={href} href={href}
                onClick={() => setOpen(false)}
                className="nav-dropdown-item"
              >
                <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Icon size={13} className="text-gray-600" />
                </div>
                <span className="flex-1">{l}</span>
                {tag && <span className="text-[10px] text-gold-600 font-semibold bg-gold-50 px-1.5 py-0.5 rounded-full">{tag}</span>}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggedIn, setLoggedIn]     = useState(false);
  const [admin, setAdmin]           = useState(false);
  const [userName, setUserName]     = useState('');
  const [scrolled, setScrolled]     = useState(false);
  const { lang, setLang, t }        = useI18n();

  useEffect(() => {
    setLoggedIn(isLoggedIn());
    setAdmin(isAdmin());
    setUserName(getUser()?.name ?? '');
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function handleLogout() { clearAuth(); window.location.href = '/'; }

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-brand-950/95 backdrop-blur-md shadow-deep border-b border-white/5'
          : 'bg-brand-950'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center shadow-glow-sm group-hover:shadow-glow transition-shadow duration-300">
              <span className="text-white font-black text-sm num">KC</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-white font-bold text-base tracking-tight">KodiComply</span>
              <span className="text-white/30 text-[10px] font-medium hidden sm:block">Tanzania Tax Engine</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-0.5">
            <Link href="/calculators" className="nav-link">All Calculators</Link>
            <NavDropdown label={t('nav.calculators')} items={CALCULATORS} />
            <NavDropdown label="VAT Tools" items={VAT_TOOLS} accent />
            <NavDropdown label={t('nav.tools')} items={TOOLS} />
            <Link href="/about" className="nav-link">About</Link>
            {admin && (
              <Link href="/admin" className="nav-link text-gold-300 hover:text-gold-200">
                {t('nav.admin')}
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="hidden lg:flex items-center gap-2">
            {/* Language toggle */}
            <button
              onClick={() => setLang(lang === 'EN' ? 'SW' : 'EN')}
              className="flex items-center gap-1.5 text-xs font-semibold bg-white/8 hover:bg-white/15 border border-white/10 text-white/70 hover:text-white px-3 py-1.5 rounded-lg transition-all duration-200"
            >
              <Globe size={12} />
              {lang === 'EN' ? 'SW' : 'EN'}
            </button>

            {loggedIn ? (
              <div className="flex items-center gap-1">
                <Link href="/dashboard" className="nav-link">
                  <LayoutDashboard size={14} />
                  <span className="hidden xl:inline max-w-24 truncate">{userName}</span>
                </Link>
                <button onClick={handleLogout} className="nav-link text-white/50 hover:text-red-400">
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login" className="nav-link">{t('nav.login')}</Link>
                <Link
                  href="/auth/register"
                  className="bg-brand-500 hover:bg-brand-400 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-200 hover:shadow-glow-sm border border-brand-400/50"
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg bg-white/8 text-white/80 hover:bg-white/15 hover:text-white transition-all"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-white/8 bg-brand-950/98 backdrop-blur-md">
          <div className="px-4 py-4 space-y-1 max-h-[80vh] overflow-y-auto scrollbar-hide">
            <Link href="/calculators" onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-white/90 hover:text-white hover:bg-white/8 rounded-xl transition-colors"
            >
              All 21+ Calculators →
            </Link>
            <Link href="/about" onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/8 rounded-xl transition-colors"
            >
              About KodiComply
            </Link>
            <p className="px-3 py-1 mt-2 text-[10px] font-bold text-white/30 uppercase tracking-widest">Calculators</p>
            {CALCULATORS.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/8 rounded-xl transition-colors"
              >
                <Icon size={15} className="text-white/40 flex-shrink-0" />
                {label}
              </Link>
            ))}

            <p className="px-3 py-1 mt-3 text-[10px] font-bold text-white/30 uppercase tracking-widest">VAT Tools</p>
            {VAT_TOOLS.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/8 rounded-xl transition-colors"
              >
                <Icon size={15} className="text-white/40 flex-shrink-0" />
                {label}
              </Link>
            ))}

            <p className="px-3 py-1 mt-3 text-[10px] font-bold text-white/30 uppercase tracking-widest">Tools & Guides</p>
            {TOOLS.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/8 rounded-xl transition-colors"
              >
                <Icon size={15} className="text-white/40 flex-shrink-0" />
                {label}
              </Link>
            ))}

            {admin && (
              <Link href="/admin" onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-gold-400 hover:text-gold-300 hover:bg-white/8 rounded-xl transition-colors"
              >
                Admin Panel
              </Link>
            )}

            <div className="border-t border-white/10 pt-3 mt-3 space-y-2">
              <button
                onClick={() => setLang(lang === 'EN' ? 'SW' : 'EN')}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-white/60 hover:bg-white/8 rounded-xl transition-colors"
              >
                <Globe size={15} /> Switch to {lang === 'EN' ? 'Kiswahili' : 'English'}
              </button>

              {loggedIn ? (
                <>
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm text-white/70 hover:bg-white/8 rounded-xl transition-colors"
                  >
                    <User size={15} /> {userName}
                  </Link>
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:bg-white/8 rounded-xl transition-colors"
                  >
                    <LogOut size={15} /> Sign out
                  </button>
                </>
              ) : (
                <div className="flex gap-2 px-3">
                  <Link href="/auth/login" onClick={() => setMobileOpen(false)}
                    className="flex-1 text-center py-2.5 text-sm text-white/70 border border-white/15 rounded-xl hover:bg-white/8 transition-colors"
                  >
                    Sign in
                  </Link>
                  <Link href="/auth/register" onClick={() => setMobileOpen(false)}
                    className="flex-1 text-center py-2.5 text-sm font-semibold bg-brand-600 text-white rounded-xl hover:bg-brand-500 transition-colors"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
