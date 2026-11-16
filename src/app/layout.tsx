import type { Metadata, Viewport } from 'next';
import { Instrument_Serif, Noto_Sans_Symbols_2 } from 'next/font/google';
import './globals.css';

// Both fonts are downloaded at build time and served from this site, so the symbols look the same on every device.
const serif = Instrument_Serif({ weight: '400', style: ['normal', 'italic'], subsets: ['latin'], variable: '--font-serif', display: 'swap' });
const symbols = Noto_Sans_Symbols_2({ weight: '400', subsets: ['symbols'], variable: '--font-symbols', display: 'swap' });

export const metadata: Metadata = {
  title: 'Soul Blueprint',
  description: 'A guided reading of everything your birth says about you.',
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#3F1521' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${symbols.variable}`}>
      <body>{children}</body>
    </html>
  );
}
