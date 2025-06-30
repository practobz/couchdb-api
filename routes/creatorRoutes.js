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

  return false;
}
