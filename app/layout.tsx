import type {Metadata} from 'next';
import { Playfair_Display, DM_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const playfair = Playfair_Display({ 
  subsets: ['latin'], 
  variable: '--font-serif',
  style: ['normal', 'italic']
});

const dmSans = DM_Sans({ 
  subsets: ['latin'], 
  variable: '--font-dm-sans' 
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'CepatSiaga - AI Emergency Co-pilot',
  description: 'An AI emergency co-pilot that finds the right facility and guides you step by step.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="id" className={`${playfair.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased bg-[#0A1628] text-[#1A1A1A] min-h-screen selection:bg-[#FF3B30]/20 selection:text-black" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
