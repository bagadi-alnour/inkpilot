import { useState, useCallback, useRef } from 'react';
import type { StorageConfig, StorageAdapter, UploadedFile } from '@writeflow/types';
import { createStorageAdapter } from '@writeflow/storage';

export interface UseStorageReturn {
  upload: (file: File, path?: string) => Promise<UploadedFile | null>;
  isUploading: boolean;
  progress: number;
  lastUpload: UploadedFile | null;
  error: string | null;
}

export function useStorage(config?: StorageConfig): UseStorageReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastUpload, setLastUpload] = useState<UploadedFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const adapterRef = useRef<StorageAdapter | null>(null);

  if (config && !adapterRef.current) {
    adapterRef.current = createStorageAdapter(config);
  }

  const upload = useCallback(
    async (file: File, path?: string): Promise<UploadedFile | null> => {
      if (!adapterRef.current) {
        setError('Storage not configured');
        return null;
      }

      setIsUploading(true);
      setProgress(0);
      setError(null);

      try {
        setProgress(50);
        const result = await adapterRef.current.put(file, path ?? file.name);
        setProgress(100);
        setLastUpload(result);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed';
        setError(message);
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [],
  );

  return { upload, isUploading, progress, lastUpload, error };
}
