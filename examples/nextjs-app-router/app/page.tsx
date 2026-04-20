import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="wf-page">
      <header className="wf-header">
        <div>
          <h1 className="wf-title">Inkpilot Next.js (App Router)</h1>
          <p className="wf-subtitle">AI-powered editor infrastructure — App Router demo</p>
        </div>
      </header>
      <main className="wf-main">
        <p className="wf-lead">
          This example uses the <code>@inkpilot/editor</code> package with the Next.js App Router, including a
          mock upload API route.
        </p>
        <Link href="/write" className="wf-cta">
          Open editor →
        </Link>
      </main>
      <footer className="wf-footer">
        Compare with <code>examples/react-basic</code> and <code>examples/nextjs-pages-router</code>.
      </footer>
    </div>
  );
}
