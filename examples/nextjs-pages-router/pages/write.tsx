import dynamic from 'next/dynamic';
import Head from 'next/head';
import type { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import type { AIAvailability } from '@/lib/aiEnv';
import { resolveAIAvailability } from '@/lib/aiEnv';

const WriteEditorDemo = dynamic(() => import('../components/WriteEditorDemo'), {
  ssr: false,
  loading: () => (
    <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading editor…</div>
  ),
});

type WritePageProps = {
  availability: AIAvailability;
};

export const getServerSideProps: GetServerSideProps<WritePageProps> = async () => {
  return await Promise.resolve({
    props: {
      availability: resolveAIAvailability(),
    },
  });
};

export default function WritePage({
  availability,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <>
      <Head>
        <title>Write — Inkpilot (Pages Router)</title>
        <meta name="description" content="Inkpilot editor demo with Pages Router" />
      </Head>
      <WriteEditorDemo availability={availability} />
    </>
  );
}
