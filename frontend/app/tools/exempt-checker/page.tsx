'use client';
import { useState, useEffect } from 'react';
import Navbar from '../../../components/ui/Navbar';
import Footer from '../../../components/ui/Footer';
import api from '../../../lib/api';
import { CheckCircle, XCircle, HelpCircle, Search } from 'lucide-react';

interface ExemptAmount {
  id: number;
  name: string;
  description: string;
  applicableTo: string;
  conditions: string | null;
  legalReference: string | null;
  isActive: boolean;
}

export default function ExemptCheckerPage() {
  const [amounts, setAmounts] = useState<ExemptAmount[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'INDIVIDUAL' | 'ENTITY'>('ALL');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    api.get('/calculator/exempt-amounts')
      .then(r => { setAmounts(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = amounts.filter(a => {
    const matchSearch = search === '' ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.description.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'ALL' || a.applicableTo === filter || a.applicableTo === 'ALL';
    return matchSearch && matchFilter && a.isActive;
  });

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-2">
          <CheckCircle size={32} className="text-green-600" />
          <h1 className="text-3xl font-bold text-gray-900">Am I Exempt?</h1>
        </div>
        <p className="text-gray-500 mb-8">
          Check if your income qualifies for exemption under the Second Schedule of the Income Tax Act.
        </p>

        <div className="flex gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input-field pl-9"
              placeholder="Search exempt amounts..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {(['ALL', 'INDIVIDUAL', 'ENTITY'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === f ? 'bg-brand-600 text-white' : 'bg-white border text-gray-700 hover:border-brand-400'}`}>
                {f === 'ALL' ? 'All' : f === 'INDIVIDUAL' ? 'Individuals' : 'Entities'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : (
          <>
            <p className="text-sm text-gray-400 mb-4">{filtered.length} exemption{filtered.length !== 1 ? 's' : ''} found</p>
            <div className="space-y-3">
              {filtered.map(item => (
                <div key={item.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <button
                    onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                    className="w-full flex items-start justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <CheckCircle size={20} className="text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        item.applicableTo === 'ALL' ? 'bg-blue-100 text-blue-700' :
                        item.applicableTo === 'INDIVIDUAL' ? 'bg-purple-100 text-purple-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {item.applicableTo === 'ALL' ? 'All taxpayers' : item.applicableTo === 'INDIVIDUAL' ? 'Individuals' : 'Entities'}
                      </span>
                      <HelpCircle size={16} className="text-gray-300" />
                    </div>
                  </button>
                  {expanded === item.id && (
                    <div className="px-4 pb-4 border-t border-gray-50">
                      {item.conditions && (
                        <div className="mt-3">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Conditions</p>
                          <p className="text-sm text-gray-700 bg-yellow-50 rounded-lg p-3 border border-yellow-100">{item.conditions}</p>
                        </div>
                      )}
                      {item.legalReference && (
                        <p className="text-xs text-brand-600 font-medium mt-3">📋 {item.legalReference}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="text-center py-12">
                  <XCircle size={40} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-400">No exemptions match your search.</p>
                </div>
              )}
            </div>
          </>
        )}

        <div className="mt-10 bg-amber-50 border border-amber-200 rounded-xl p-6">
          <h3 className="font-semibold text-amber-800 mb-2">Important Note</h3>
          <p className="text-sm text-amber-700">
            This tool provides general guidance based on the Second Schedule of the Income Tax Act Cap 332 R.E. 2023.
            Exemptions may have conditions, limits, or recent amendments. Always consult a qualified tax professional
            or contact TRA for your specific circumstances.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
