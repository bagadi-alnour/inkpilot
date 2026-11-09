import type { Metadata } from 'next';
import '@inkpilot/editor/styles.css';
import './demo.css';

export const metadata: Metadata = {
  title: 'Inkpilot demo',
  description: 'A React editor where SEO checks and AI fixes work together. Try the loop: find an issue, fix it with AI, accept, publish.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
