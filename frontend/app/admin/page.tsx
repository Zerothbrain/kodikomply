'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Settings, Users, Shield, Receipt, Building2, Clock, AlertTriangle, FileText, Percent, Tag, Globe, Package, Languages, MessageCircle, Star, Mail } from 'lucide-react';
import Navbar from '../../components/ui/Navbar';
import Footer from '../../components/ui/Footer';
import { isAdmin, isLoggedIn } from '../../lib/auth';
import api from '../../lib/api';

interface Stats { users: number; calculations: number; taxRules: number; }

const adminLinks = [
  { href: '/admin/tax-rules', label: 'Tax Rules', desc: 'PAYE bands, SDL, depreciation, interest rates', icon: Settings, color: 'bg-blue-50 text-blue-600' },
  { href: '/admin/withholding-rates', label: 'Withholding Rates', desc: 'WHT rates for resident and non-resident payments', icon: Percent, color: 'bg-purple-50 text-purple-600' },
  { href: '/admin/corporate-rates', label: 'Corporate Rates', desc: 'All 6 corporate tax rate scenarios', icon: Building2, color: 'bg-orange-50 text-orange-600' },
  { href: '/admin/deductions', label: 'Deductions', desc: 'Allowable deductions with conditions and caps', icon: Tag, color: 'bg-green-50 text-green-600' },
  { href: '/admin/exemptions', label: 'Exemptions', desc: 'Income exemptions with eligibility criteria', icon: Shield, color: 'bg-teal-50 text-teal-600' },
  { href: '/admin/deadlines', label: 'Filing Deadlines', desc: 'PAYE, VAT, WHT, quarterly installment dates', icon: Clock, color: 'bg-yellow-50 text-yellow-600' },
  { href: '/admin/users', label: 'Users', desc: 'Manage registered users and view history', icon: Users, color: 'bg-red-50 text-red-600' },
  { href: '/admin/paye-bands', label: 'PAYE Bands', desc: 'Progressive income tax bands and rates', icon: Receipt, color: 'bg-indigo-50 text-indigo-600' },
  { href: '/admin/depreciation', label: 'Depreciation', desc: 'Capital allowance classes and rates', icon: Settings, color: 'bg-slate-50 text-slate-600' },
  { href: '/admin/presumptive', label: 'Presumptive Tax', desc: 'Small business and agriculture presumptive tables', icon: FileText, color: 'bg-lime-50 text-lime-600' },
  { href: '/admin/penalties', label: 'Penalty Settings', desc: 'Late filing and late payment penalty rates', icon: AlertTriangle, color: 'bg-red-50 text-red-600' },
  { href: '/admin/vat-exemptions', label: 'VAT Exempt Supplies', desc: 'Manage exempt, zero-rated, and taxable supply classifications', icon: Tag, color: 'bg-green-50 text-green-600' },
  { href: '/admin/vat-imports', label: 'VAT Exempt Imports', desc: 'First Schedule VAT Act — exempt import items', icon: Package, color: 'bg-cyan-50 text-cyan-600' },
  { href: '/admin/vat-settings', label: 'VAT Special Settings', desc: 'Real estate rules, vehicle benefits, bad debt thresholds', icon: Settings, color: 'bg-emerald-50 text-emerald-600' },
  { href: '/admin/digital-services', label: 'Digital Services', desc: 'S.116 ITA digital marketplace service types and settings', icon: Globe, color: 'bg-violet-50 text-violet-600' },
  { href: '/admin/benefits-in-kind', label: 'Benefits in Kind', desc: 'Benefit types, valuations, and exemption thresholds', icon: Tag, color: 'bg-pink-50 text-pink-600' },
  { href: '/admin/retirement-funds', label: 'Retirement Funds', desc: 'Approved retirement funds and exemption limits', icon: Shield, color: 'bg-amber-50 text-amber-600' },
  { href: '/admin/exempt-amounts', label: 'Exempt Amounts', desc: 'Second Schedule exemption amounts by category', icon: Shield, color: 'bg-teal-50 text-teal-600' },
  { href: '/admin/translations', label: 'Translations', desc: 'Swahili / English translation keys', icon: Languages, color: 'bg-orange-50 text-orange-600' },
  { href: '/admin/chat', label: 'AI Chat Manager', desc: 'Usage stats, system prompt editor, rate limits', icon: MessageCircle, color: 'bg-green-50 text-green-700' },
  { href: '/admin/reviews', label: 'Reviews', desc: 'Approve, hide, or delete user reviews', icon: Star, color: 'bg-amber-50 text-amber-600' },
  { href: '/admin/email-templates', label: 'Email Templates', desc: 'Edit verification, summary, and welcome email HTML', icon: Mail, color: 'bg-sky-50 text-sky-600' },
];

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({ users: 0, calculations: 0, taxRules: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn() || !isAdmin()) { router.push('/auth/login'); return; }
    Promise.all([
      api.get('/admin/users').then(r => r.data.length),
      api.get('/admin/calculations').then(r => r.data.length),
      api.get('/admin/tax-rules').then(r => r.data.length),
    ]).then(([users, calculations, taxRules]) => {
      setStats({ users, calculations, taxRules });
    }).catch(() => {}).finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Shield size={20} className="text-brand-600" />
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          </div>
          <p className="text-gray-500 text-sm">Manage all tax rules, rates, deadlines, and users. Changes take effect immediately on all calculations.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Registered Users', value: loading ? '—' : stats.users, icon: Users, color: 'text-blue-600' },
            { label: 'Total Calculations', value: loading ? '—' : stats.calculations, icon: FileText, color: 'text-purple-600' },
            { label: 'Tax Rules', value: loading ? '—' : stats.taxRules, icon: Settings, color: 'text-brand-600' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card">
              <div className="flex items-center gap-3">
                <Icon size={20} className={color} />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Admin sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {adminLinks.map(({ href, label, desc, icon: Icon, color }) => (
            <Link key={href} href={href} className="card hover:shadow-md transition-shadow group">
              <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
                <Icon size={20} />
              </div>
              <h3 className="font-bold text-gray-900 group-hover:text-brand-600 transition-colors">{label}</h3>
              <p className="text-gray-500 text-sm mt-1">{desc}</p>
            </Link>
          ))}
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex gap-3">
          <AlertTriangle size={20} className="text-yellow-600 shrink-0 mt-0.5" />
          <p className="text-yellow-800 text-sm">All tax rule changes are live immediately. Ensure changes are accurate before saving. Tax rates are sourced from the Tanzania Revenue Authority.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
