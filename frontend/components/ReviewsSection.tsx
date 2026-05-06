'use client';
import { useEffect, useState } from 'react';
import { Star, Quote } from 'lucide-react';
import ReviewForm from './ReviewForm';
import { isLoggedIn } from '../lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface Review {
  id: number;
  name: string;
  role: string | null;
  rating: number;
  comment: string;
  createdAt: string;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          size={14}
          className={i <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300 fill-gray-300'}
        />
      ))}
    </div>
  );
}

// Static fallback reviews shown until real ones exist
const FALLBACK_REVIEWS: Review[] = [
  {
    id: -1,
    name: 'James Mwangi',
    role: 'Accountant, Dar es Salaam',
    rating: 5,
    comment: 'Finally a Tanzania tax tool that gets the WHT construction split right. The 3/5 materials and 2/5 services logic is exactly what the ITA says. Saves me 30 minutes per client.',
    createdAt: new Date().toISOString(),
  },
  {
    id: -2,
    name: 'Fatuma Hassan',
    role: 'SME Owner, Arusha',
    rating: 5,
    comment: 'I was confused about whether I needed to register for VAT. The VAT calculator explained it clearly — TZS 200M threshold and the 6-month rule. Very helpful.',
    createdAt: new Date().toISOString(),
  },
  {
    id: -3,
    name: 'Peter Kimaro',
    role: 'HR Manager',
    rating: 5,
    comment: 'The PAYE wizard handles allowances and benefits in kind perfectly. Our payroll processing is now accurate and I can show staff exactly how their tax is calculated.',
    createdAt: new Date().toISOString(),
  },
];

export default function ReviewsSection({ limit }: { limit?: number } = {}) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
    fetch(`${API_URL}/api/reviews`)
      .then(r => r.json())
      .then((data: Review[]) => setReviews(data))
      .catch(() => {});
  }, []);

  const displayed = reviews.length >= 2 ? reviews : FALLBACK_REVIEWS;

  // Average rating
  const avg = displayed.reduce((s, r) => s + r.rating, 0) / displayed.length;
  const avgStr = avg.toFixed(1);

  return (
    <section className="py-20 px-6 bg-white border-t border-gray-100">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-brand-600 text-sm font-semibold uppercase tracking-widest mb-3">What users say</p>
          <h2 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">Trusted by accountants<br />and business owners</h2>
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(i => (
                <Star key={i} size={18} className="text-amber-400 fill-amber-400" />
              ))}
            </div>
            <span className="font-bold text-gray-800 text-lg">{avgStr}</span>
            <span className="text-gray-400 text-sm">· {displayed.length} reviews</span>
          </div>
        </div>

        {/* Cards grid */}
        <div className="grid md:grid-cols-3 gap-5 mb-10">
          {displayed.slice(0, limit ?? 6).map((review, i) => (
            <div
              key={review.id}
              className={`relative bg-white rounded-2xl border p-6 shadow-sm hover:shadow-md transition-shadow cursor-default ${
                i === activeIndex ? 'border-brand-300 ring-1 ring-brand-200' : 'border-gray-100'
              }`}
              onMouseEnter={() => setActiveIndex(i)}
            >
              {/* Quote icon */}
              <div className="absolute -top-3 left-5">
                <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center shadow">
                  <Quote size={12} className="text-white fill-white" />
                </div>
              </div>

              <div className="mt-2">
                <StarRating rating={review.rating} />
                <p className="text-gray-700 text-sm leading-relaxed mt-3 mb-4">&ldquo;{review.comment}&rdquo;</p>
                <div className="border-t border-gray-100 pt-3">
                  <p className="font-semibold text-gray-900 text-sm">{review.name}</p>
                  {review.role && <p className="text-gray-400 text-xs mt-0.5">{review.role}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA to leave a review */}
        <div className="text-center">
          {submitted ? (
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium">
              <Star size={15} className="fill-green-500 text-green-500" />
              Thank you! Your review is pending approval.
            </div>
          ) : loggedIn ? (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#1a5c38] text-white rounded-xl font-medium text-sm hover:bg-[#154d2f] transition-colors shadow-sm"
            >
              <Star size={15} className="fill-white" />
              Leave a Review
            </button>
          ) : (
            <a
              href="/auth/login"
              className="inline-flex items-center gap-2 px-6 py-3 border border-[#1a5c38] text-[#1a5c38] rounded-xl font-medium text-sm hover:bg-green-50 transition-colors"
            >
              <Star size={15} />
              Sign in to leave a review
            </a>
          )}
        </div>
      </div>

      {showForm && (
        <ReviewForm
          onClose={() => setShowForm(false)}
          onSuccess={() => { setShowForm(false); setSubmitted(true); }}
        />
      )}
    </section>
  );
}
