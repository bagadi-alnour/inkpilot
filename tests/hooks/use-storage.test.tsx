import { renderHook, act, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useStorage } from '../../src/react/hooks/use-storage';

const createStorageAdapterMock = vi.hoisted(() => vi.fn());

vi.mock('@inkpilot/storage', () => ({
  createStorageAdapter: createStorageAdapterMock,
}));

describe('useStorage', () => {
  beforeEach(() => {
    createStorageAdapterMock.mockReset();
  });

  it('recreates the adapter when storage config changes', async () => {
    const adapterA = {
      put: vi.fn().mockResolvedValue({ key: 'a', url: 'https://a', size: 1, mimeType: 'image/png' }),
      get: vi.fn(),
      delete: vi.fn(),
      list: vi.fn(),
      getPresignedUrl: vi.fn(),
    };
    const adapterB = {
      put: vi.fn().mockResolvedValue({ key: 'b', url: 'https://b', size: 1, mimeType: 'image/png' }),
      get: vi.fn(),
      delete: vi.fn(),
      list: vi.fn(),
      getPresignedUrl: vi.fn(),
    };

    createStorageAdapterMock
      .mockReturnValueOnce(adapterA)
      .mockReturnValueOnce(adapterB);

    const file = new File(['x'], 'demo.png', { type: 'image/png' });

    const { result, rerender } = renderHook(
      ({ bucket }) =>
        useStorage({
          provider: 's3',
          bucket,
          presignedUrlEndpoint: '/api/upload',
        }),
      { initialProps: { bucket: 'first-bucket' } },
    );

    await act(async () => {
      await result.current.upload(file, 'first-path');
    });

    rerender({ bucket: 'second-bucket' });

    await waitFor(() => {
      expect(createStorageAdapterMock).toHaveBeenCalledTimes(2);
    });

    await act(async () => {
      await result.current.upload(file, 'second-path');
    });

    expect(adapterA.put).toHaveBeenCalledWith(file, 'first-path');
    expect(adapterB.put).toHaveBeenCalledWith(file, 'second-path');
  });
});
