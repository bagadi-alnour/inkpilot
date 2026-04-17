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
} from '@writeflow/types';
import { WriteFlowError } from '@writeflow/utils';
import { generateStoragePath } from '../utils';
import { fetchPresignedUrl, uploadViaPresignedUrl } from '../presigned';

export class S3StorageAdapter implements StorageAdapter {
  private client: S3Client | null = null;
  private config: StorageConfig;

  constructor(config: StorageConfig) {
    this.config = config;

    if (config.accessKeyId && config.secretAccessKey) {
      this.client = new S3Client({
        region: config.region ?? 'us-east-1',
        endpoint: config.endpoint,
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        },
        forcePathStyle: !!config.endpoint,
      });
    }
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
      throw new WriteFlowError(
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

    const url = this.config.endpoint
      ? `${this.config.endpoint}/${this.config.bucket}/${storagePath}`
      : `https://${this.config.bucket}.s3.${this.config.region ?? 'us-east-1'}.amazonaws.com/${storagePath}`;

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
      throw new WriteFlowError('Direct credentials required for get()', 'CREDENTIALS_REQUIRED');
    }

    const response = await this.client.send(
      new GetObjectCommand({ Bucket: this.config.bucket, Key: key }),
    );

    return (await response.Body?.transformToString()) ?? '';
  }

  async delete(key: string): Promise<void> {
    if (!this.client) {
      throw new WriteFlowError('Direct credentials required for delete()', 'CREDENTIALS_REQUIRED');
    }

    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.config.bucket, Key: key }),
    );
  }

  async list(prefix?: string): Promise<UploadedFile[]> {
    if (!this.client) {
      throw new WriteFlowError('Direct credentials required for list()', 'CREDENTIALS_REQUIRED');
    }

    const response = await this.client.send(
      new ListObjectsV2Command({
        Bucket: this.config.bucket,
        Prefix: prefix,
      }),
    );

    return (response.Contents ?? []).map((obj) => ({
      key: obj.Key ?? '',
      url: `https://${this.config.bucket}.s3.${this.config.region ?? 'us-east-1'}.amazonaws.com/${obj.Key ?? ''}`,
      size: obj.Size ?? 0,
      mimeType: '',
    }));
  }

  async getPresignedUrl(key: string, options?: PresignedUrlOptions): Promise<string> {
    if (!this.client) {
      throw new WriteFlowError(
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
