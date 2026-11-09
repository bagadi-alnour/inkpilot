import { isDemoLang } from '@/lib/content';
import { realProvider } from '@/lib/model';
import { Demo } from './demo';

/** `?theme=light` and `?lang=ar` pick the variant, so screenshots can link straight to one. */
export default async function Page({ searchParams }: { searchParams: Promise<{ theme?: string; lang?: string }> }) {
  const { theme, lang } = await searchParams;
  return <Demo theme={theme === 'light' ? 'light' : 'dark'} lang={isDemoLang(lang) ? lang : 'en'} provider={realProvider()} />;
}
