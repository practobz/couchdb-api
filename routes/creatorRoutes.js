import { parse } from 'url';
import { creatorSignup, loginCreator, getCreators } from '../controllers/creatorController.js';

export default async function creatorRoutes(req, res) {
 const { pathname, query } = parse(req.url, true);
const normalizedPath = pathname.replace(/\/+$/, ''); // removes trailing slashes

if (req.method === 'GET' && normalizedPath === '/users' && query.role === 'content_creator') {
  console.log('✅ Fetching content creators from creatorRoutes');
  return await getCreators(req, res);
}


  // ✅ POST /signup/creator
  if (req.method === 'POST' && pathname === '/signup/creator') {
    return await creatorSignup(req, res);
  }

  // ✅ POST /content_creator/login
  if (req.method === 'POST' && pathname === '/content_creator/login') {
    return await loginCreator(req, res);
  }

  // ✅ GET /users/:id - fetch single content creator by id
  const match = normalizedPath.match(/^\/users\/([a-zA-Z0-9\-]+)$/);
  if (req.method === 'GET' && match) {
    const id = match[1];
    // Inline logic to fetch only content_creator by id
    try {
      const usersDb = req.databases.users;
      const doc = await usersDb.get(id);
      if (!doc || doc.role !== 'content_creator') {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Content creator not found' }));
        return true;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(doc));
      return true;
    } catch (err) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Content creator not found' }));
      return true;
    }
  }

  return false;
}
