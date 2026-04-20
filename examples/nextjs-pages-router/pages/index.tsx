import Head from 'next/head';
import Link from 'next/link';

export default function HomePage() {
  return (
    <>
      <Head>
        <title>WriteFlow Next.js Demo</title>
        <meta name="description" content="WriteFlow Editor with Next.js Pages Router" />
      </Head>
      <div className="wf-page">
        <header className="wf-header">
          <div>
            <h1 className="wf-title">WriteFlow Next.js (Pages Router)</h1>
            <p className="wf-subtitle">AI-powered editor infrastructure — Pages Router demo</p>
          </div>
        </header>
        <main className="wf-main">
          <p className="wf-lead">
            This example uses the <code>@inkpilot/editor</code> package with the Next.js Pages Router, including a
            mock upload API route.
          </p>
          <Link href="/write" className="wf-cta">
            Open editor →
          </Link>
        </main>
        <footer className="wf-footer">
          Compare with <code>examples/react-basic</code> and <code>examples/nextjs-app-router</code>.
        </footer>
      </div>
    </>
  );
}
