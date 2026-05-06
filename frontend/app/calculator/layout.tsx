import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Tanzania Tax Calculators',
    template: '%s | KodiComply Tanzania',
  },
  description: 'Free, accurate Tanzania tax calculators aligned with TRA rules — PAYE, VAT, WHT, corporate tax, terminal benefits, presumptive tax and more.',
  openGraph: {
    siteName: 'KodiComply',
    locale: 'en_TZ',
    type: 'website',
  },
};

export default function CalculatorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
