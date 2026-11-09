import { describeModel } from '@/lib/model';
import WriteEditorClient from './WriteEditorClient';

export default function WritePage() {
  return <WriteEditorClient modelLabel={describeModel()} />;
}
