'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, UserX, User } from 'lucide-react';
import Navbar from '../../../components/ui/Navbar';
import Footer from '../../../components/ui/Footer';
import { isAdmin, isLoggedIn } from '../../../lib/auth';
import { formatDate } from '../../../lib/format';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

interface UserRecord { id: number; name: string; email: string; role: string; isActive: boolean; createdAt: string; _count: { calculations: number }; }

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isLoggedIn() || !isAdmin()) { router.push('/auth/login'); return; }
    api.get('/admin/users').then(r => setUsers(r.data)).catch(() => toast.error('Failed to load users')).finally(() => setLoading(false));
  }, [router]);

  async function deactivate(id: number, name: string) {
    if (!confirm(`Deactivate account for ${name}?`)) return;
    try {
      await api.put(`/admin/users/${id}/deactivate`);
      setUsers(u => u.map(user => user.id === id ? { ...user, isActive: false } : user));
      toast.success('User deactivated');
    } catch { toast.error('Failed to deactivate user'); }
  }

  const filtered = search ? users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())) : users;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/admin" className="text-gray-500 hover:text-brand-600"><ArrowLeft size={20} /></Link>
          <h1 className="text-2xl font-bold text-gray-900">Users Manager</h1>
        </div>

        <div className="flex gap-3 mb-4">
          <input className="input-field max-w-sm" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
          <span className="self-center text-sm text-gray-500">{filtered.length} users</span>
        </div>

        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-brand-50 border-b border-brand-100">
              <tr>{['User', 'Email', 'Role', 'Calculations', 'Joined', 'Status', 'Actions'].map(h => <th key={h} className="text-left py-3 px-4 font-semibold text-brand-700">{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className="py-8 text-center text-gray-500">Loading...</td></tr>
                : filtered.map(u => (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
                          <User size={14} className="text-brand-600" />
                        </div>
                        <span className="font-medium">{u.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{u.email}</td>
                    <td className="py-3 px-4"><span className={u.role === 'ADMIN' ? 'badge-red' : 'badge-green'}>{u.role}</span></td>
                    <td className="py-3 px-4 font-mono">{u._count.calculations}</td>
                    <td className="py-3 px-4 text-xs text-gray-500">{formatDate(u.createdAt)}</td>
                    <td className="py-3 px-4">{u.isActive ? <span className="badge-green">Active</span> : <span className="badge-red">Inactive</span>}</td>
                    <td className="py-3 px-4">
                      {u.isActive && u.role !== 'ADMIN' && (
                        <button onClick={() => deactivate(u.id, u.name)} className="flex items-center gap-1 text-red-400 hover:text-red-600 text-xs">
                          <UserX size={14} />Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </main>
      <Footer />
    </div>
  );
}
