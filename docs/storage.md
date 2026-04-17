# Storage setup

## Overview

Image uploads target object storage. The recommended path is **presigned URLs**: the browser asks your backend for a short-lived upload URL, then **PUT**s the file directly to S3. A second mode uses **direct** AWS credentials inside a **server-only** adapter—never expose keys to the client.

## `StorageConfig`

```typescript
import type { StorageConfig } from "@writeflow/editor";

const storage: StorageConfig = {
  provider: "s3",
  bucket: "my-app-uploads",
  region: "us-east-1",
  endpoint: undefined, // optional S3-compatible endpoint
  basePath: "uploads/", // optional key prefix

  // Recommended for browser apps:
  presignedUrlEndpoint: "/api/upload",

  // Server-only (never in client bundles):
  // accessKeyId: "...",
  // secretAccessKey: "...",

  onUpload: (file) => console.log("Uploaded:", file.url),
};
```

## Two modes

| Mode | How it works | Where to use |
| ---- | ------------ | ------------ |
| **Presigned URL** | Editor `POST`s metadata to `presignedUrlEndpoint`; response includes `uploadUrl`, `publicUrl`, `key`; file is uploaded with `PUT`. | Client-side editors, static sites, Next.js client components |
| **Direct** | `accessKeyId` + `secretAccessKey` construct an SDK client; `put` sends the object from the server process. | API routes, Server Actions, SSR-only code paths |

If neither presigned nor credentials are valid, uploads fail with a configuration error.

## Presigned URL flow

1. Client calls `POST presignedUrlEndpoint` with JSON body:

```typescript
interface PresignedUrlRequest {
  filename: string;
  contentType: string;
  size: number;
}
```

2. Server returns:

```typescript
interface PresignedUrlResponse {
  uploadUrl: string; // PUT target
  publicUrl: string; // canonical URL for <img src>
  key: string; // object key in the bucket
}
```

3. The adapter `PUT`s the `File` to `uploadUrl` with `Content-Type` set to the file’s type.

## Example: Next.js App Router route

```typescript
// app/api/upload/route.ts
import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const client = new S3Client({ region: process.env.AWS_REGION });

export async function POST(req: Request) {
  const { filename, contentType, size } = await req.json();

  const Key = `uploads/${Date.now()}-${filename}`;
  const Bucket = process.env.S3_BUCKET!;

  const command = new PutObjectCommand({
    Bucket,
    Key,
    ContentType: contentType,
    ContentLength: size,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 60 });
  const publicUrl = `https://${Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${Key}`;

  return NextResponse.json({ uploadUrl, publicUrl, key: Key });
}
```

Tune signing, CORS, and public URL shape to match your bucket (CloudFront, path-style endpoints, etc.).

## `useStorage`

Headless uploads outside the default image pipeline:

```tsx
import { useStorage } from "@writeflow/editor";

const { upload, isUploading, progress, lastUpload, error } = useStorage({
  provider: "s3",
  bucket: "my-bucket",
  region: "us-east-1",
  presignedUrlEndpoint: "/api/upload",
});

const result = await upload(file);
if (result) console.log(result.url);
```

## Security

- **Never** put `accessKeyId` / `secretAccessKey` (or Azure/GCS equivalents) in code that ships to the browser.
- Lock down the presigned endpoint: authenticate the user, validate `contentType` and `size`, and scope keys per tenant.
- Prefer short expiry on presigned URLs and least-privilege IAM for `s3:PutObject` on a prefix.

## Notes

- `StorageProvider` also lists `"gcs"` and `"azure"`; ensure your deployment uses the adapter that matches your cloud.
- `createStorageAdapter` is exported if you need the same resolution logic as the editor.
