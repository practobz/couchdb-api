import { getSignedUrl } from '../controllers/gcsController.js';
import { parse } from 'url';

export default async function gcsRoutes(req, res) {
  const parsedUrl = parse(req.url, true);

  if (req.method === 'GET' && parsedUrl.pathname === '/api/gcs/generate-upload-url') {
    return await getSignedUrl(req, res);
  }

  return false; // Route not matched
}
