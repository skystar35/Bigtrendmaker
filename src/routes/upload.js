import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export function uploadRoutes(app, storageDir) {
  app.post('/v1/upload/presign_s3', async (req, reply) => {
    const b = req.body ?? {};
    const key = b.key || `uploads/${Date.now()}.bin`;
    const contentType = b.contentType || 'application/octet-stream';
    if (!process.env.AWS_REGION || !process.env.S3_BUCKET || !process.env.AWS_ACCESS_KEY_ID) {
      // Dev mock
      return { url: `https://example.dev/mock-presign/${encodeURIComponent(key)}`, method:'PUT', headers:{ 'Content-Type': contentType } };
    }
    const s3 = new S3Client({ region: process.env.AWS_REGION });
    const cmd = new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key, ContentType: contentType });
    const url = await getSignedUrl(s3, cmd, { expiresIn: 900 });
    return { url, method:'PUT', headers:{ 'Content-Type': contentType } };
  });
}
