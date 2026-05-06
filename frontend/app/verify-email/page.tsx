'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function VerifyEmailPage() {
  const params = useSearchParams();
  const router = useRouter();
  const token  = params.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token found in the link.');
      return;
    }

    fetch(`${API_URL}/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async r => {
        const data = await r.json();
        if (r.ok) {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully!');
          // Update stored user
          try {
            const raw = localStorage.getItem('kodicomply_user');
            if (raw) {
              const u = JSON.parse(raw);
              localStorage.setItem('kodicomply_user', JSON.stringify({ ...u, isEmailVerified: true }));
            }
          } catch { /* silent */ }
          setTimeout(() => router.push('/dashboard'), 2500);
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed. The link may have expired.');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Could not connect to the server. Please try again.');
      });
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-10 max-w-sm w-full text-center">

        {/* KodiComply logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-[#1a5c38] flex items-center justify-center">
            <span className="text-white font-black text-sm">KC</span>
          </div>
          <span className="font-bold text-gray-900 text-lg">KodiComply</span>
        </div>

        {status === 'loading' && (
          <>
            <Loader2 size={48} className="text-[#1a5c38] animate-spin mx-auto mb-4" />
            <h1 className="text-lg font-bold text-gray-900 mb-2">Verifying your email…</h1>
            <p className="text-gray-500 text-sm">Please wait a moment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 size={52} className="text-green-500 mx-auto mb-4" />
            <h1 className="text-lg font-bold text-gray-900 mb-2">Email verified!</h1>
            <p className="text-gray-500 text-sm mb-6">{message}</p>
            <p className="text-gray-400 text-xs mb-4">Redirecting you to the dashboard…</p>
            <Link href="/dashboard" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1a5c38] text-white text-sm rounded-xl font-medium hover:bg-[#154d2f] transition-colors">
              Go to Dashboard
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle size={52} className="text-red-400 mx-auto mb-4" />
            <h1 className="text-lg font-bold text-gray-900 mb-2">Verification failed</h1>
            <p className="text-gray-500 text-sm mb-6">{message}</p>
            <div className="flex flex-col gap-2">
              <Link href="/dashboard" className="px-5 py-2.5 bg-[#1a5c38] text-white text-sm rounded-xl font-medium hover:bg-[#154d2f] transition-colors">
                Go to Dashboard
              </Link>
              <Link href="/auth/login" className="px-5 py-2.5 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50 transition-colors">
                Back to Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
