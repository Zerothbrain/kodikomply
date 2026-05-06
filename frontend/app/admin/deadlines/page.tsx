'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Pencil, Check, X } from 'lucide-react';
import Navbar from '../../../components/ui/Navbar';
import Footer from '../../../components/ui/Footer';
import { isAdmin, isLoggedIn } from '../../../lib/auth';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

interface Deadline { id: number; taxType: string; description: string; dueDayOfMonth: number; dueMonth: number | null; frequency: string; reminderDays: number; notes: string | null; isActive: boolean; }

export default function DeadlinesPage() {
  const router = useRouter();
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<Partial<Deadline>>({});

  useEffect(() => {
    if (!isLoggedIn() || !isAdmin()) { router.push('/auth/login'); return; }
    api.get('/admin/deadlines').then(r => setDeadlines(r.data)).catch(() => toast.error('Failed to load deadlines')).finally(() => setLoading(false));
  }, [router]);

  function startEdit(d: Deadline) { setEditId(d.id); setForm(d); }

  async function save() {
    if (!editId) return;
    try {
      const res = await api.put(`/admin/deadlines/${editId}`, form);
      setDeadlines(dl => dl.map(d => d.id === editId ? res.data : d));
      setEditId(null); setForm({});
      toast.success('Deadline updated');
    } catch { toast.error('Failed to save'); }
  }

  const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="text-gray-500 hover:text-brand-600"><ArrowLeft size={20} /></Link>
          <h1 className="text-2xl font-bold text-gray-900">Filing Deadlines Manager</h1>
        </div>

        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-brand-50 border-b border-brand-100">
              <tr>{['Tax Type', 'Description', 'Due Day', 'Month', 'Frequency', 'Reminder Days', 'Notes', 'Active', ''].map(h => <th key={h} className="text-left py-3 px-4 font-semibold text-brand-700 whitespace-nowrap">{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={9} className="py-8 text-center text-gray-500">Loading...</td></tr>
                : deadlines.map(d => (
                  editId === d.id ? (
                    <tr key={d.id} className="bg-brand-50 border-b">
                      <td className="py-2 px-4 font-medium">{d.taxType}</td>
                      <td className="py-2 px-4"><input className="input-field text-xs" value={form.description ?? ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></td>
                      <td className="py-2 px-4"><input type="number" className="input-field w-16 text-xs" value={form.dueDayOfMonth ?? ''} onChange={e => setForm(f => ({ ...f, dueDayOfMonth: Number(e.target.value) }))} /></td>
                      <td className="py-2 px-4"><input type="number" className="input-field w-16 text-xs" placeholder="null=monthly" value={form.dueMonth ?? ''} onChange={e => setForm(f => ({ ...f, dueMonth: e.target.value ? Number(e.target.value) : null }))} /></td>
                      <td className="py-2 px-4">{d.frequency}</td>
                      <td className="py-2 px-4"><input type="number" className="input-field w-16 text-xs" value={form.reminderDays ?? ''} onChange={e => setForm(f => ({ ...f, reminderDays: Number(e.target.value) }))} /></td>
                      <td className="py-2 px-4"><input className="input-field text-xs" value={form.notes ?? ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value || null }))} /></td>
                      <td className="py-2 px-4"><input type="checkbox" checked={form.isActive ?? true} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} /></td>
                      <td className="py-2 px-4">
                        <div className="flex gap-2">
                          <button onClick={save} className="text-green-600 hover:text-green-800"><Check size={16} /></button>
                          <button onClick={() => { setEditId(null); setForm({}); }} className="text-red-400 hover:text-red-600"><X size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-brand-700">{d.taxType}</td>
                      <td className="py-3 px-4 text-gray-600 text-xs max-w-xs">{d.description}</td>
                      <td className="py-3 px-4 font-mono font-bold">{d.dueDayOfMonth}th</td>
                      <td className="py-3 px-4 text-xs">{d.dueMonth ? MONTHS[d.dueMonth] : 'Following month'}</td>
                      <td className="py-3 px-4"><span className="badge-green text-xs">{d.frequency}</span></td>
                      <td className="py-3 px-4">{d.reminderDays} days</td>
                      <td className="py-3 px-4 text-xs text-gray-500 max-w-xs truncate">{d.notes}</td>
                      <td className="py-3 px-4">{d.isActive ? <span className="badge-green">Active</span> : <span className="badge-red">Inactive</span>}</td>
                      <td className="py-3 px-4"><button onClick={() => startEdit(d)} className="text-blue-500 hover:text-blue-700"><Pencil size={14} /></button></td>
                    </tr>
                  )
                ))}
            </tbody>
          </table>
        </div>
      </main>
      <Footer />
    </div>
  );
}
