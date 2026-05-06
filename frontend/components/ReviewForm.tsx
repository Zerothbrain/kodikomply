'use client';
import { useState } from 'react';
import { X, Star, Send } from 'lucide-react';
import api from '../lib/api';
import { getUser } from '../lib/auth';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReviewForm({ onClose, onSuccess }: Props) {
  const user = getUser();
  const [name, setName] = useState(user?.name || '');
  const [role, setRole] = useState('');
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim().length < 10) {
      setError('Please write at least 10 characters.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/reviews', { name, role, rating, comment });
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Leave a Review</h3>
            <p className="text-xs text-gray-400 mt-0.5">Your review will appear after approval</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={submit} className="px-6 py-5 space-y-4">

          {/* Star rating */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">Your rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(i => (
                <button
                  key={i}
                  type="button"
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(i)}
                  className="p-0.5 transition-transform hover:scale-110"
                >
                  <Star
                    size={28}
                    className={`transition-colors ${
                      i <= (hover || rating)
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-gray-300 fill-gray-300'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-500 self-center">
                {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][hover || rating]}
              </span>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Your name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="e.g. James Mwangi"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#1a5c38] transition-colors"
            />
          </div>

          {/* Role (optional) */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              Your role <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              value={role}
              onChange={e => setRole(e.target.value)}
              placeholder="e.g. Accountant, Business Owner, HR Manager"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#1a5c38] transition-colors"
            />
          </div>

          {/* Comment */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Your review</label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              required
              rows={4}
              placeholder="Tell others what you found most useful about KodiComply..."
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[#1a5c38] resize-none transition-colors"
            />
            <p className="text-xs text-gray-400 mt-1">{comment.length} characters (minimum 10)</p>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !name.trim() || comment.trim().length < 10}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#1a5c38] text-white rounded-xl font-medium text-sm hover:bg-[#154d2f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send size={15} />
            )}
            {loading ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      </div>
    </div>
  );
}
