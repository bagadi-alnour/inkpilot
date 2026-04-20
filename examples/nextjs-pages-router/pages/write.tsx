import dynamic from 'next/dynamic';
import Head from 'next/head';

const WriteEditorDemo = dynamic(() => import('../components/WriteEditorDemo'), {
  ssr: false,
  loading: () => (
    <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading editor…</div>
  ),
});

export default function WritePage() {
  return (
    <>
      <Head>
        <title>Write — Inkpilot (Pages Router)</title>
        <meta name="description" content="Inkpilot editor demo with Pages Router" />
      </Head>
      <WriteEditorDemo />
    </>
  );
}
