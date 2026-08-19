import { resolveAIAvailability } from '@/lib/aiEnv';
import WriteEditorClient from './WriteEditorClient';

export default function WritePage() {
  const availability = resolveAIAvailability();
  return <WriteEditorClient availability={availability} />;
}
