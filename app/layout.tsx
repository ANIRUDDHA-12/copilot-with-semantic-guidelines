// Phase 2 — Auth screens
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import ServerGuard from '@/components/ServerGuard/ServerGuard';


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
        <script src="https://browser-analytics-eta.vercel.app/widget.js" data-project-id="7f2db389-fede-4b16-bb5d-3b4d6b54a987" defer></script>
      </body>
    </html>
  );
}
