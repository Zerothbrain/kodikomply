import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Sign In',
    template: '%s | KodiComply',
  },
  description: 'Sign in or create a free KodiComply account to access Tanzania tax calculators, filing deadlines, reports, and the AI Tax Assistant.',
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
