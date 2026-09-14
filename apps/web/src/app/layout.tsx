import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Timesheet AI - Multi-Tenant Platform',
  description: 'AI-assisted timesheet tracking with intelligent project matching and dynamic authorization',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
