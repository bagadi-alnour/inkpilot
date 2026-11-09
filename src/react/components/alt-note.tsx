import type { Editor } from '@tiptap/core';
import { useTranslation } from '@inkpilot/i18n';
import { altStatusAt } from '../../core/extensions/image-upload';

/**
 * Why the alt text fix for the image at `pos` is running or unavailable; nothing when
 * it's idle. The parent re-renders on `storage.imageUpload.altRevision`.
 */
export function AltNote({ editor, pos }: { editor: Editor; pos: number }) {
  const { t } = useTranslation();
  const status = altStatusAt(editor.state, editor.storage.imageUpload, pos);
  if (!status) return null;
  return (
    <p className="ip-drawer-note" role={status === 'pending' ? 'status' : undefined}>
      {t(`alt.${status}`)}
    </p>
  );
}
