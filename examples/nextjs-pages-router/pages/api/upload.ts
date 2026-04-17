import type { NextApiRequest, NextApiResponse } from 'next';

type PresignedBody = {
  filename?: string;
  contentType?: string;
  size?: number;
};

/**
 * Mock presigned-URL response for local demos. Replace with a real signer in production.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = (typeof req.body === 'object' && req.body !== null ? req.body : {}) as PresignedBody;
  const filename = typeof body.filename === 'string' && body.filename.length > 0 ? body.filename : 'upload.bin';

  return res.status(200).json({
    uploadUrl: 'https://httpbin.org/put',
    publicUrl: `https://example.com/demo/${encodeURIComponent(filename)}`,
    key: filename,
  });
}
