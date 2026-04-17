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

const PROGRESS_INTERVAL_MS = 200;
const PROGRESS_INCREMENT = 8;
const PROGRESS_CEILING = 90;

export function useStorage(config?: StorageConfig): UseStorageReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastUpload, setLastUpload] = useState<UploadedFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const adapterRef = useRef<StorageAdapter | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  if (config && !adapterRef.current) {
    adapterRef.current = createStorageAdapter(config);
  }

  function clearProgressInterval() {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
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

      intervalRef.current = setInterval(() => {
        setProgress((prev) => {
          const next = prev + PROGRESS_INCREMENT + Math.random() * 4;
          return Math.min(next, PROGRESS_CEILING);
        });
      }, PROGRESS_INTERVAL_MS);

      try {
        const result = await adapterRef.current.put(file, path ?? file.name);
        clearProgressInterval();
        setProgress(100);
        setLastUpload(result);
        return result;
      } catch (err) {
        clearProgressInterval();
        const message = err instanceof Error ? err.message : 'Upload failed';
        setError(message);
        return null;
      } finally {
        clearProgressInterval();
        setIsUploading(false);
      }
    },
    [],
  );

  return { upload, isUploading, progress, lastUpload, error };
}
