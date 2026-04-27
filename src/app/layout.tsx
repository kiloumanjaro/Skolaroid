import type { Metadata } from 'next';
import { Kalam, Patrick_Hand, Grape_Nuts } from 'next/font/google';
import { MainShell } from '@/components/main-shell';
import { QueryProvider } from '@/providers/query-provider';
import '@/styles/globals.css';

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: 'Skolaroid - Turn Your Memories Into Skolaroids',
  description:
    'A living memory platform for University of the Philippines Cebu. Preserve, celebrate, and explore achievements and shared experiences of every batch.',
};

const kalam = Kalam({
  variable: '--font-kalam',
  display: 'swap',
  subsets: ['latin'],
  weight: ['400', '700'],
});

const patrickHand = Patrick_Hand({
  variable: '--font-hand',
  display: 'swap',
  subsets: ['latin'],
  weight: '400',
});

const grapeNuts = Grape_Nuts({
  variable: '--font-dancing',
  display: 'swap',
  subsets: ['latin'],
  weight: '400',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${patrickHand.className} ${kalam.variable} ${patrickHand.variable} ${grapeNuts.variable} antialiased`}
      >
        <QueryProvider>
          <MainShell>{children}</MainShell>
        </QueryProvider>
      </body>
    </html>
  );
}
