import { parse } from 'url';
import { parseBody } from '../utils/parseBody.js';
import { sendJSON } from '../utils/response.js';

export default async function contentRoutes(req, res) {
  const { pathname } = parse(req.url, true);

  // ✅ POST: Save content submission
  if (req.method === 'POST' && pathname === '/api/content-submissions') {
    try {
      const { assignment_id, caption, hashtags, notes, images } = await parseBody(req);

      if (!assignment_id || !Array.isArray(images) || images.length === 0) {
        return sendJSON(res, 400, { error: 'assignment_id and images[] required' });
      }

      const db = req.databases.submissions;
      const result = await db.insert({
        type: 'submission',
        assignment_id,
        caption,
        hashtags,
        notes,
        images,
        created_at: new Date().toISOString()
      });

      return sendJSON(res, 201, { message: 'saved', id: result.id });
    } catch (err) {
      console.error('❌ Error:', err);
      return sendJSON(res, 500, { error: 'DB insert failed' });
    }
  }

  // ✅ GET: Fetch all content submissions
  if (req.method === 'GET' && pathname === '/api/content-submissions') {
  try {
    const db = req.databases.submissions;
    const result = await db.list({ include_docs: true });

    if (!result || !Array.isArray(result.rows)) {
      throw new Error('Invalid response from CouchDB');
    }

    const submissions = result.rows
      .map(r => r.doc)
      .filter(doc => doc && doc.type === 'submission'); // optional filter

    return sendJSON(res, 200, submissions);
  } catch (err) {
    console.error('❌ Failed to fetch submissions:', err);
    return sendJSON(res, 500, { error: 'Failed to fetch submissions' });
  }
}


  return false; // No matching route
}
