// Phase 2 — Auth screens
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import ServerGuard from '@/components/ServerGuard/ServerGuard';
import Script from 'next/script';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Aegis — Document Intelligence',
  description:
    'Upload your PDFs. Ask questions in natural language. Get precise answers with full context.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <ServerGuard />
        {children}
        <Script 
          src="https://feedloop.io/widget.js" 
          data-project-id="1b56680a-3a79-4fce-9de5-ed8e2b74d47a"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
