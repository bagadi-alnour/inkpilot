import type { StorageConfig, StorageAdapter } from '@inkpilot/types';
import { InkpilotError } from '@inkpilot/utils';
import { S3StorageAdapter } from './adapters/s3';

export function createStorageAdapter(config: StorageConfig): StorageAdapter {
  switch (config.provider) {
    case 's3':
      return new S3StorageAdapter(config);
    case 'gcs':
      throw new InkpilotError('GCS adapter coming in v0.2', 'ADAPTER_NOT_AVAILABLE');
    case 'azure':
      throw new InkpilotError('Azure adapter coming in v0.2', 'ADAPTER_NOT_AVAILABLE');
    default:
      throw new InkpilotError(`Unknown storage provider: ${config.provider as string}`, 'UNKNOWN_PROVIDER');
  }
}
