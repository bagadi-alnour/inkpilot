import { useRef, useCallback } from 'react';
import { useTranslation } from '@writeflow/i18n';

interface ImageUploadProps {
  onUpload: (file: File) => void;
  isUploading: boolean;
  progress: number;
}

export function ImageUploadButton({ onUpload, isUploading, progress }: ImageUploadProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onUpload(file);
        e.target.value = '';
      }
    },
    [onUpload],
  );

  return (
    <>
      <button
        type="button"
        className="wf-toolbar-btn"
        onClick={handleClick}
        disabled={isUploading}
        title={t('toolbar.image')}
        aria-label={t('toolbar.image')}
      >
        {isUploading ? <span className="wf-spinner" /> : '🖼'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        style={{ display: 'none' }}
        aria-hidden="true"
      />
    </>
  );
}
