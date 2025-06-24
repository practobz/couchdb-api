import { parse } from 'url';
import { adminSignup, login } from '../controllers/adminController.js';

export default async function adminRoutes(req, res) {
  const { pathname } = parse(req.url, true);
  const cleanPath = pathname.replace(/\/+$/, '');

  if (req.method === 'POST' && cleanPath === '/signup/admin') {
    await adminSignup(req, res);
    return true;
  }

  if (req.method === 'POST' && cleanPath === '/login') {
    await login(req, res);
    return true;
  }

  return false;
}
