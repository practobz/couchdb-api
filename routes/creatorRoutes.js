import { parse } from 'url';
import { creatorSignup, loginCreator, getCreators } from '../controllers/creatorController.js';

export default async function creatorRoutes(req, res) {
 const { pathname, query } = parse(req.url, true);
const normalizedPath = pathname.replace(/\/+$/, ''); // removes trailing slashes

if (req.method === 'GET' && normalizedPath === '/users' && query.role === 'content_creator') {
  console.log('✅ Fetching content creators from creatorRoutes');
  return await getCreators(req, res);
}

// ✅ POST /signup/creator with timeout
if (req.method === 'POST' && pathname === '/signup/creator') {
  let timeout;
  const timeoutMs = 10000; // 10 seconds
  const timeoutPromise = new Promise((_, reject) => {
    timeout = setTimeout(() => {
      if (!res.headersSent) {
        res.writeHead(504, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Request timed out' }));
      }
      reject(new Error('Request timed out'));
    }, timeoutMs);
  });

  try {
    await Promise.race([creatorSignup(req, res), timeoutPromise]);
  } finally {
    clearTimeout(timeout);
  }
  return true;
}

  // ✅ POST /content_creator/login
  if (req.method === 'POST' && pathname === '/content_creator/login') {
    return await loginCreator(req, res);
  }

  return false;
}
