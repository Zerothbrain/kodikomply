import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { I18nProvider } from '../lib/i18n';
import ChatWidget from '../components/ChatWidget';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://kodicomply.co.tz'),
  title: {
    default: 'KodiComply — Tanzania Tax Compliance Platform',
    template: '%s | KodiComply',
  },
  description: 'Free Tanzania tax calculators for PAYE, VAT, WHT, corporate tax, terminal benefits and more — accurate, TRA-aligned, instant results.',
  keywords: ['Tanzania tax', 'PAYE calculator Tanzania', 'VAT calculator Tanzania', 'TRA', 'KodiComply', 'tax compliance Tanzania', 'WHT calculator', 'corporate tax Tanzania', 'hesabu ya kodi'],
  authors: [{ name: 'KodiComply', url: 'https://kodicomply.co.tz' }],
  creator: 'KodiComply',
  publisher: 'KodiComply',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  openGraph: {
    title: 'KodiComply — Tanzania Tax Compliance, Simplified',
    description: 'Free PAYE, VAT, WHT and corporate tax calculators for Tanzania. TRA-aligned, instant, accurate.',
    url: 'https://kodicomply.co.tz',
    siteName: 'KodiComply',
    locale: 'en_TZ',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KodiComply — Tanzania Tax Compliance',
    description: 'Free PAYE, VAT, WHT, corporate tax calculators for Tanzania. Accurate & TRA-aligned.',
    creator: '@kodicomply',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} ${inter.className}`}>
      <body>
        <I18nProvider>
          {children}
          <ChatWidget />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: '500',
                boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
              },
              success: {
                iconTheme: { primary: '#1a5c38', secondary: '#fff' },
              },
            }}
          />
        </I18nProvider>
      </body>
    </html>
  );
}
