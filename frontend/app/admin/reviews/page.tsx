'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Star, Check, X, Trash2, Eye, EyeOff, RefreshCw } from 'lucide-react';
import Navbar from '../../../components/ui/Navbar';
import Footer from '../../../components/ui/Footer';
import { isLoggedIn, isAdmin } from '../../../lib/auth';
import api from '../../../lib/api';
import toast from 'react-hot-toast';

interface Review {
  id: number;
  name: string;
  role: string | null;
  rating: number;
  comment: string;
  isPublished: boolean;
  createdAt: string;
  user: { email: string; name: string } | null;
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={13} className={i <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />
      ))}
    </div>
  );
}

export default function AdminReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'published'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn() || !isAdmin()) { router.push('/auth/login'); }
  }, [router]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/reviews/admin');
      setReviews(res.data);
    } catch { toast.error('Failed to load reviews'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const publish = async (id: number) => {
    try {
      await api.put(`/reviews/admin/${id}/publish`);
      setReviews(r => r.map(x => x.id === id ? { ...x, isPublished: true } : x));
      toast.success('Review published');
    } catch { toast.error('Failed'); }
  };

  const unpublish = async (id: number) => {
    try {
      await api.put(`/reviews/admin/${id}/unpublish`);
      setReviews(r => r.map(x => x.id === id ? { ...x, isPublished: false } : x));
      toast.success('Review unpublished');
    } catch { toast.error('Failed'); }
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this review permanently?')) return;
    try {
      await api.delete(`/reviews/admin/${id}`);
      setReviews(r => r.filter(x => x.id !== id));
      toast.success('Deleted');
    } catch { toast.error('Failed'); }
  };

  const filtered = reviews.filter(r => {
    if (filter === 'pending') return !r.isPublished;
    if (filter === 'published') return r.isPublished;
    return true;
  });

  const pending = reviews.filter(r => !r.isPublished).length;
  const published = reviews.filter(r => r.isPublished).length;
  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '—';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center">
              <Star size={20} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Reviews</h1>
              <p className="text-sm text-gray-500">Approve, hide, or delete user reviews</p>
            </div>
          </div>
          <button onClick={load} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Pending', value: pending, color: 'text-orange-600' },
            { label: 'Published', value: published, color: 'text-green-600' },
            { label: 'Avg Rating', value: avgRating, color: 'text-amber-500' },
          ].map(k => (
            <div key={k.label} className="bg-white rounded-xl border p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">{k.label}</p>
              <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-white border rounded-xl p-1 mb-5 w-fit">
          {(['all', 'pending', 'published'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                filter === f ? 'bg-[#1a5c38] text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {f} {f === 'pending' && pending > 0 && (
                <span className="ml-1 bg-orange-500 text-white text-[10px] rounded-full px-1.5 py-0.5">{pending}</span>
              )}
            </button>
          ))}
        </div>

        {/* Reviews list */}
        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center text-gray-400 text-sm">
            No {filter === 'all' ? '' : filter} reviews yet
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(review => (
              <div key={review.id} className={`bg-white rounded-xl border p-5 ${!review.isPublished ? 'border-orange-200 bg-orange-50/30' : ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <StarDisplay rating={review.rating} />
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        review.isPublished ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {review.isPublished ? 'Published' : 'Pending'}
                      </span>
                    </div>
                    <p className="text-gray-800 text-sm leading-relaxed mb-3">&ldquo;{review.comment}&rdquo;</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-gray-700">{review.name}</span>
                      {review.role && <span className="text-gray-400 text-xs">· {review.role}</span>}
                      {review.user && <span className="text-gray-400 text-xs">· {review.user.email}</span>}
                      <span className="text-gray-400 text-xs">· {new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {!review.isPublished ? (
                      <button
                        onClick={() => publish(review.id)}
                        title="Publish"
                        className="flex items-center gap-1 px-3 py-1.5 bg-[#1a5c38] text-white text-xs rounded-lg hover:bg-[#154d2f] transition-colors"
                      >
                        <Check size={13} /> Publish
                      </button>
                    ) : (
                      <button
                        onClick={() => unpublish(review.id)}
                        title="Unpublish"
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <EyeOff size={13} /> Hide
                      </button>
                    )}
                    <button
                      onClick={() => remove(review.id)}
                      title="Delete"
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
