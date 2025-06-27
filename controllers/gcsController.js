import { Storage } from '@google-cloud/storage';
import path from 'path';
import url from 'url';

const storage = new Storage({
  keyFilename: path.join(process.cwd(), 'gcs-key.json'),
});

const bucketName = 'mediaupload-adcore';
const bucket = storage.bucket(bucketName);

export async function getSignedUrl(req, res) {
  try {
    const parsedUrl = url.parse(req.url, true);
    const { filename, contentType } = parsedUrl.query;

    console.log('👉 Generating signed URL for:', filename, 'with contentType:', contentType);

    if (!filename || !contentType) {
      return res.writeHead(400, { 'Content-Type': 'application/json' }).end(
        JSON.stringify({ error: 'Both filename and contentType are required' })
      );
    }

    const file = bucket.file(filename);

    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 5 * 60 * 1000,
      contentType: contentType,
    });

    console.log('✅ Signed URL generated:', signedUrl);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ url: signedUrl }));
  } catch (err) {
    console.error('❌ Error generating signed URL:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Failed to generate signed URL' }));
  }
}
