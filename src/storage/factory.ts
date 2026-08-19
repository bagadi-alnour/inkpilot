import type { StorageConfig, StorageAdapter } from '@inkpilot/types';
import { InkpilotError, readProcessEnv } from '@inkpilot/utils';
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

/**
 * Build a StorageConfig from environment variables.
 * Looks for AWS_ACCESS_KEY_ID (or AWS_ACCESS_KEY), AWS_SECRET_ACCESS_KEY,
 * AWS_REGION (or AWS_DEFAULT_REGION), and S3_BUCKET (or AWS_S3_BUCKET).
 * Returns undefined if the minimum required vars (credentials + bucket) are missing.
 * Any explicit overrides in `overrides` take precedence over env vars.
 */
export function resolveStorageFromEnv(
  overrides: Partial<StorageConfig> = {},
): StorageConfig | undefined {
  const accessKeyId = overrides.accessKeyId
    ?? readProcessEnv('AWS_ACCESS_KEY_ID')
    ?? readProcessEnv('AWS_ACCESS_KEY');
  const secretAccessKey = overrides.secretAccessKey
    ?? readProcessEnv('AWS_SECRET_ACCESS_KEY');
  const region = overrides.region
    ?? readProcessEnv('AWS_REGION')
    ?? readProcessEnv('AWS_DEFAULT_REGION')
    ?? 'us-east-1';
  const bucket = overrides.bucket
    || readProcessEnv('S3_BUCKET')
    || readProcessEnv('AWS_S3_BUCKET')
    || '';
  const endpoint = overrides.endpoint
    ?? readProcessEnv('S3_ENDPOINT')
    ?? readProcessEnv('AWS_S3_ENDPOINT');
  const presignedUrlEndpoint = overrides.presignedUrlEndpoint
    ?? readProcessEnv('S3_PRESIGNED_URL_ENDPOINT');

  const hasCredentials = !!(accessKeyId && secretAccessKey);
  const hasPresigned = !!presignedUrlEndpoint;

  if (!hasCredentials && !hasPresigned) return undefined;
  if (!bucket) return undefined;

  return {
    provider: overrides.provider ?? 's3',
    bucket,
    region,
    endpoint,
    basePath: overrides.basePath,
    presignedUrlEndpoint,
    accessKeyId,
    secretAccessKey,
    onUpload: overrides.onUpload,
  };
}
