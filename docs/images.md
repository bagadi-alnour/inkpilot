# Images

Inkpilot doesn't store files. You pass an uploader, a function that stores a file and returns its URL.

```ts
type ImageUploader = (
  file: File,
  context: { signal: AbortSignal; width: number; height: number },
) => Promise<{ src: string; width?: number; height?: number }>;

<Editor image={{ upload: myUploader }} />
```

`src` must be `https://`, root-relative (`/uploads/x.png`) or a `data:image/` URL. Anything else fails the upload.

## Presigned URLs

`presignedUpload(endpoint)` covers S3, R2, GCS and anything else that signs PUT URLs, without a storage SDK in the browser:

1. It POSTs `{ filename, contentType, size }` to `endpoint`.
2. Your endpoint returns `{ uploadUrl, publicUrl, headers? }`.
3. It PUTs the file to `uploadUrl` (with `headers` if given) and inserts `publicUrl`.

```ts
// app/api/upload/route.ts, S3 example
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export async function POST(request: Request) {
  const { filename, contentType, size } = await request.json();
  if (!contentType?.startsWith('image/') || size > 5_000_000) return Response.json({ error: 'Images up to 5 MB' }, { status: 400 });
  const key = `uploads/${crypto.randomUUID()}-${filename}`;
  const uploadUrl = await getSignedUrl(s3, new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType }), { expiresIn: 300 });
  return Response.json({ uploadUrl, publicUrl: `https://${BUCKET}.s3.amazonaws.com/${key}` });
}
```

The contract matches 0.1's `presignedUrlEndpoint`, so existing endpoints keep working.

## What happens on insert

Dropped images land where you drop them. Pasted and picked images go at the cursor.

1. The image shows a local preview right away.
2. Images above `maxFileSize` or `maxWidth` are scaled and re-encoded on a canvas. PNG becomes WebP, which keeps transparency. GIF and SVG pass through. If re-encoding would make the file bigger, the original is kept.
3. Your uploader runs. On success the preview is swapped for your URL. On failure the image is removed and `onUploadError(error, file)` is called once.

Undo and redo stay correct while uploads run:

| Sequence | Result |
|---|---|
| insert, undo, upload finishes, redo | image with the uploaded URL |
| upload succeeds, undo, redo | image with the uploaded URL |
| upload fails, undo, redo | nothing comes back |
| image deleted while uploading | it stays deleted |

Publishing waits for uploads. The publish button shows "Uploading N image(s)…", and the content is checked so no local `blob:` preview is ever published.

## Without an uploader

Images are embedded as data URLs. That's fine for a demo, but it makes pages heavy, so the editor shows an "Image embedded in the page" check with the size.

## Alt text

With AI configured, Inkpilot asks the `alt` task for a description after each upload. It uses `visionModel` on the handler, or `model` if that isn't set. The browser sends the image bytes and the server never fetches URLs. A suggestion is applied only if the image still has no alt text, so anything the writer typed wins.

For existing images without alt text, the "Image without alt text" check has a Fix button. That one has to read the image in the browser, so it needs CORS on remote images.

When a suggestion can't be made, the check says why instead of failing silently:

- The browser couldn't load the image (usually a host without CORS). The Fix button goes away for that image.
- The handler has no model that reads images. Set `visionModel: false` when your `model` is text-only: the `alt` task then answers 501, and the Fix button goes away for every image.
- Any other failure (network, model error) keeps the Fix button, so the writer can try again.

Set `autoAltText: false` to turn the automatic request off.
