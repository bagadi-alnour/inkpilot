import type { Metadata } from 'next';
import '@inkpilot/editor/styles.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'WriteFlow Next.js Demo',
  description: 'WriteFlow Editor with Next.js App Router',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
