'use client';
import { useState, useEffect } from 'react';
import Navbar from '../../../components/ui/Navbar';
import Footer from '../../../components/ui/Footer';
import api from '../../../lib/api';
import toast from 'react-hot-toast';
import { Save, X, Pencil } from 'lucide-react';

interface TaxRule { id: number; name: string; rate: number | null; fixedAmount: number | null; description: string | null; }
interface RealEstateRule { id: number; transactionType: string; propertyType: string; condition: string; vatTreatment: string; threshold: number | null; notes: string | null; isActive: boolean; }
interface VehicleRow { id: number; engineSizeFrom: number; engineSizeTo: number | null; monthlyNewVehicle: number; monthlyOldVehicle: number; vehicleAgeThreshold: number; isActive: boolean; }

export default function AdminVatSettingsPage() {
  const [vatSpecial, setVatSpecial] = useState<TaxRule[]>([]);
  const [realEstate, setRealEstate] = useState<RealEstateRule[]>([]);
  const [vehicle, setVehicle] = useState<VehicleRow[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editVal, setEditVal] = useState('');
  const [editingRe, setEditingRe] = useState<number | null>(null);
  const [reForm, setReForm] = useState<Partial<RealEstateRule>>({});
  const [editingVeh, setEditingVeh] = useState<number | null>(null);
  const [vehForm, setVehForm] = useState<Partial<VehicleRow>>({});

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [sp, re, veh] = await Promise.all([
        api.get('/admin/tax-rules?category=VAT_SPECIAL'),
        api.get('/admin/real-estate-vat-rules'),
        api.get('/admin/vehicle-benefit-table'),
      ]);
      setVatSpecial(sp.data);
      setRealEstate(re.data);
      setVehicle(veh.data);
    } catch { toast.error('Failed to load'); }
  }

  async function saveSpecial(id: number, isFixed: boolean) {
    try {
      const payload = isFixed ? { fixedAmount: Number(editVal) } : { rate: Number(editVal) / 100 };
      await api.put(`/admin/tax-rules/${id}`, payload);
      toast.success('Updated'); setEditingId(null); load();
    } catch { toast.error('Save failed'); }
  }

  async function saveRe(id: number) {
    try { await api.put(`/admin/real-estate-vat-rules/${id}`, reForm); toast.success('Updated'); setEditingRe(null); load(); }
    catch { toast.error('Save failed'); }
  }

  async function saveVeh(id: number) {
    try { await api.put(`/admin/vehicle-benefit-table/${id}`, vehForm); toast.success('Updated'); setEditingVeh(null); load(); }
    catch { toast.error('Save failed'); }
  }

  const PROP_LABELS: Record<string, string> = {
    VACANT_LAND: 'Vacant Land', RESIDENTIAL: 'Residential', COMMERCIAL: 'Commercial / Mixed',
    SALE: 'Sale', LEASE: 'Lease', HIRE: 'Hire',
    NEW: 'New Construction', EXISTING_2YR_PLUS: 'Existing ≥2 Years', EXISTING_UNDER_2YR: 'Existing <2 Years',
    DEVELOPER: 'Developer (≤50M threshold)', ANY: 'Any',
  };

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">VAT Special Settings</h1>
          <p className="text-gray-500 text-sm">Manage VAT thresholds, real estate rules, and vehicle benefit tables</p>
        </div>

        {/* VAT Special Rules */}
        <div className="card mb-8">
          <h2 className="font-semibold mb-4">VAT Configuration Values</h2>
          <div className="space-y-2">
            {vatSpecial.map(rule => {
              const isFixed = rule.fixedAmount !== null;
              const displayVal = isFixed ? (rule.fixedAmount ?? 0) : ((rule.rate ?? 0) * 100);
              return (
                <div key={rule.id} className="flex items-center gap-4 bg-gray-50 rounded-lg px-4 py-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{rule.name}</p>
                    {rule.description && <p className="text-xs text-gray-500">{rule.description}</p>}
                  </div>
                  {editingId === rule.id ? (
                    <div className="flex gap-2 items-center">
                      <input type="number" step="0.01" className="input-field w-28 py-1 text-sm" value={editVal} onChange={e => setEditVal(e.target.value)} />
                      <span className="text-xs text-gray-500">{isFixed ? '' : '%'}</span>
                      <button onClick={() => saveSpecial(rule.id, isFixed)} className="text-green-600"><Save size={14} /></button>
                      <button onClick={() => setEditingId(null)} className="text-gray-400"><X size={14} /></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-brand-700">{isFixed ? displayVal.toLocaleString() : `${displayVal.toFixed(0)}%`}</span>
                      <button onClick={() => { setEditingId(rule.id); setEditVal(String(displayVal)); }} className="text-gray-400 hover:text-brand-600"><Pencil size={14} /></button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Real Estate VAT Rules */}
        <div className="card mb-8">
          <h2 className="font-semibold mb-4">Real Estate VAT Rules (Second Schedule VAT Act)</h2>
          <div className="space-y-2">
            {realEstate.map(rule => (
              <div key={rule.id} className="bg-gray-50 rounded-lg p-4">
                {editingRe === rule.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="label text-xs">Transaction</label>
                        <select className="input-field py-1 text-sm" value={reForm.transactionType ?? rule.transactionType} onChange={e => setReForm({...reForm, transactionType: e.target.value})}>
                          <option value="SALE">Sale</option><option value="LEASE">Lease</option><option value="HIRE">Hire</option>
                        </select>
                      </div>
                      <div>
                        <label className="label text-xs">Property Type</label>
                        <select className="input-field py-1 text-sm" value={reForm.propertyType ?? rule.propertyType} onChange={e => setReForm({...reForm, propertyType: e.target.value})}>
                          <option value="VACANT_LAND">Vacant Land</option><option value="RESIDENTIAL">Residential</option><option value="COMMERCIAL">Commercial</option>
                        </select>
                      </div>
                      <div>
                        <label className="label text-xs">VAT Treatment</label>
                        <select className="input-field py-1 text-sm" value={reForm.vatTreatment ?? rule.vatTreatment} onChange={e => setReForm({...reForm, vatTreatment: e.target.value})}>
                          <option value="EXEMPT">EXEMPT</option><option value="TAXABLE">TAXABLE</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="label text-xs">Threshold (TZS, leave blank if N/A)</label>
                      <input type="number" className="input-field py-1 text-sm" value={reForm.threshold ?? rule.threshold ?? ''} onChange={e => setReForm({...reForm, threshold: e.target.value ? Number(e.target.value) : null})} />
                    </div>
                    <div>
                      <label className="label text-xs">Notes</label>
                      <input className="input-field py-1 text-sm" value={reForm.notes ?? rule.notes ?? ''} onChange={e => setReForm({...reForm, notes: e.target.value})} />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => saveRe(rule.id)} className="btn-primary text-xs py-1 flex items-center gap-1"><Save size={12} />Save</button>
                      <button onClick={() => setEditingRe(null)} className="btn-secondary text-xs py-1 flex items-center gap-1"><X size={12} />Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700">{PROP_LABELS[rule.transactionType] ?? rule.transactionType}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-100 text-purple-700">{PROP_LABELS[rule.propertyType] ?? rule.propertyType}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rule.vatTreatment === 'EXEMPT' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{rule.vatTreatment}</span>
                      </div>
                      <p className="text-xs text-gray-500">{PROP_LABELS[rule.condition] ?? rule.condition}{rule.threshold ? ` · Threshold: TZS ${rule.threshold.toLocaleString()}` : ''}</p>
                      {rule.notes && <p className="text-xs text-gray-400 mt-0.5">{rule.notes}</p>}
                    </div>
                    <button onClick={() => { setEditingRe(rule.id); setReForm({}); }} className="p-1.5 text-gray-400 hover:text-brand-600 rounded flex-shrink-0"><Pencil size={14} /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Vehicle Benefit Table */}
        <div className="card">
          <h2 className="font-semibold mb-4">Vehicle Benefit Valuation Table (Third Schedule ITA)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-200 text-xs text-gray-500">
                <th className="text-left py-2 pr-4">Engine Size (cc)</th>
                <th className="text-right py-2 px-4">Monthly (New, TZS)</th>
                <th className="text-right py-2 px-4">Monthly (Old, TZS)</th>
                <th className="text-right py-2 px-4">Age Threshold (yrs)</th>
                <th className="py-2" />
              </tr></thead>
              <tbody>
                {vehicle.map(row => (
                  <tr key={row.id} className={`border-b border-gray-50 ${!row.isActive ? 'opacity-50' : ''}`}>
                    {editingVeh === row.id ? (
                      <td colSpan={5} className="py-3">
                        <div className="grid grid-cols-4 gap-3">
                          <div>
                            <label className="label text-xs">From (cc)</label>
                            <input type="number" className="input-field py-1 text-sm" value={vehForm.engineSizeFrom ?? row.engineSizeFrom} onChange={e => setVehForm({...vehForm, engineSizeFrom: Number(e.target.value)})} />
                          </div>
                          <div>
                            <label className="label text-xs">To (cc, blank=unlimited)</label>
                            <input type="number" className="input-field py-1 text-sm" value={vehForm.engineSizeTo ?? row.engineSizeTo ?? ''} onChange={e => setVehForm({...vehForm, engineSizeTo: e.target.value ? Number(e.target.value) : null})} />
                          </div>
                          <div>
                            <label className="label text-xs">Monthly New (TZS)</label>
                            <input type="number" className="input-field py-1 text-sm" value={vehForm.monthlyNewVehicle ?? row.monthlyNewVehicle} onChange={e => setVehForm({...vehForm, monthlyNewVehicle: Number(e.target.value)})} />
                          </div>
                          <div>
                            <label className="label text-xs">Monthly Old (TZS)</label>
                            <input type="number" className="input-field py-1 text-sm" value={vehForm.monthlyOldVehicle ?? row.monthlyOldVehicle} onChange={e => setVehForm({...vehForm, monthlyOldVehicle: Number(e.target.value)})} />
                          </div>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => saveVeh(row.id)} className="btn-primary text-xs py-1 flex items-center gap-1"><Save size={12} />Save</button>
                          <button onClick={() => setEditingVeh(null)} className="btn-secondary text-xs py-1 flex items-center gap-1"><X size={12} />Cancel</button>
                        </div>
                      </td>
                    ) : (
                      <>
                        <td className="py-2 pr-4 font-medium">{row.engineSizeFrom.toLocaleString()}{row.engineSizeTo ? `–${row.engineSizeTo.toLocaleString()}` : '+'}</td>
                        <td className="text-right py-2 px-4">{row.monthlyNewVehicle.toLocaleString()}</td>
                        <td className="text-right py-2 px-4">{row.monthlyOldVehicle.toLocaleString()}</td>
                        <td className="text-right py-2 px-4">{row.vehicleAgeThreshold}</td>
                        <td className="py-2 text-right">
                          <button onClick={() => { setEditingVeh(row.id); setVehForm({}); }} className="p-1 text-gray-400 hover:text-brand-600 rounded"><Pencil size={14} /></button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
