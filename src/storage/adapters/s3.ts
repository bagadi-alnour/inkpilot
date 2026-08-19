import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type {
  StorageConfig,
  StorageAdapter,
  UploadedFile,
  PresignedUrlOptions,
} from '@inkpilot/types';
import { InkpilotError, readProcessEnv } from '@inkpilot/utils';
import { generateStoragePath } from '../utils';
import { fetchPresignedUrl, uploadViaPresignedUrl } from '../presigned';

export class S3StorageAdapter implements StorageAdapter {
  private client: S3Client | null = null;
  private config: StorageConfig;

  constructor(config: StorageConfig) {
    const accessKeyId = config.accessKeyId
      ?? readProcessEnv('AWS_ACCESS_KEY_ID')
      ?? readProcessEnv('AWS_ACCESS_KEY');
    const secretAccessKey = config.secretAccessKey
      ?? readProcessEnv('AWS_SECRET_ACCESS_KEY');
    const region = config.region
      ?? readProcessEnv('AWS_REGION')
      ?? readProcessEnv('AWS_DEFAULT_REGION')
      ?? 'us-east-1';
    const bucket = config.bucket
      || readProcessEnv('AWS_S3_BUCKET')
      || readProcessEnv('S3_BUCKET')
      || '';

    this.config = { ...config, region, bucket };

    if (accessKeyId && secretAccessKey) {
      this.client = new S3Client({
        region,
        endpoint: config.endpoint,
        credentials: { accessKeyId, secretAccessKey },
        forcePathStyle: !!config.endpoint,
      });
    }
  }

  /** Public object URL for a key (matches `put()` URL shape for AWS vs path-style custom endpoints). */
  private buildPublicObjectUrl(key: string): string {
    const region = this.config.region ?? 'us-east-1';
    const bucket = this.config.bucket;
    if (this.config.endpoint) {
      const base = this.config.endpoint.replace(/\/$/, '');
      return `${base}/${bucket}/${key}`;
    }
    return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  }

  async put(file: File, path: string): Promise<UploadedFile> {
    const storagePath = generateStoragePath(this.config.basePath, path || file.name);

    if (this.config.presignedUrlEndpoint) {
      const presigned = await fetchPresignedUrl(this.config.presignedUrlEndpoint, {
        filename: storagePath,
        contentType: file.type,
        size: file.size,
      });
      const result = await uploadViaPresignedUrl(file, presigned);
      this.config.onUpload?.(result);
      return result;
    }

    if (!this.client) {
      throw new InkpilotError(
        'Storage not configured: provide presignedUrlEndpoint or direct credentials',
        'STORAGE_NOT_CONFIGURED',
      );
    }

    const buffer = await file.arrayBuffer();
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: storagePath,
        Body: new Uint8Array(buffer),
        ContentType: file.type,
      }),
    );

    const url = this.buildPublicObjectUrl(storagePath);

    const result: UploadedFile = {
      key: storagePath,
      url,
      size: file.size,
      mimeType: file.type,
    };

    this.config.onUpload?.(result);
    return result;
  }

  async get(key: string): Promise<string> {
    if (!this.client) {
      throw new InkpilotError('Direct credentials required for get()', 'CREDENTIALS_REQUIRED');
    }

    const response = await this.client.send(
      new GetObjectCommand({ Bucket: this.config.bucket, Key: key }),
    );

    const body = response.Body as unknown;
    if (
      body &&
      typeof body === 'object' &&
      'transformToString' in body &&
      typeof (body as { transformToString?: unknown }).transformToString === 'function'
    ) {
      return await (body as { transformToString: () => Promise<string> }).transformToString();
    }

    return '';
  }

  async delete(key: string): Promise<void> {
    if (!this.client) {
      throw new InkpilotError('Direct credentials required for delete()', 'CREDENTIALS_REQUIRED');
    }

    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.config.bucket, Key: key }),
    );
  }

  async list(prefix?: string): Promise<UploadedFile[]> {
    if (!this.client) {
      throw new InkpilotError('Direct credentials required for list()', 'CREDENTIALS_REQUIRED');
    }

    const response = await this.client.send(
      new ListObjectsV2Command({
        Bucket: this.config.bucket,
        Prefix: prefix,
      }),
    );

    return (response.Contents ?? []).map((obj) => {
      const key = obj.Key ?? '';
      return {
        key,
        url: this.buildPublicObjectUrl(key),
        size: obj.Size ?? 0,
        mimeType: '',
      };
    });
  }

  async getPresignedUrl(key: string, options?: PresignedUrlOptions): Promise<string> {
    if (!this.client) {
      throw new InkpilotError(
        'Direct credentials required for getPresignedUrl()',
        'CREDENTIALS_REQUIRED',
      );
    }

    const command = new GetObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
      ...(options?.contentType ? { ResponseContentType: options.contentType } : {}),
    });

    return getSignedUrl(this.client, command, {
      expiresIn: options?.expiresIn ?? 3600,
    });
  }
}
