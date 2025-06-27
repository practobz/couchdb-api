// routes/creatorRoutes.js
import { parse } from 'url';
import { creatorSignup, loginCreator } from '../controllers/creatorController.js';

export default async function creatorRoutes(req, res) {
  const { pathname } = parse(req.url, true);

  // POST /signup/creator
  if (req.method === 'POST' && pathname === '/signup/creator') {
    return await creatorSignup(req, res);
  }

  // POST /content_creator/login
  if (req.method === 'POST' && pathname === '/content_creator/login') {
    return await loginCreator(req, res);
  }

  return false;
}
