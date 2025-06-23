import { parse } from 'url';
import { adminSignup, login } from '../controllers/adminController.js';

export default async function adminRoutes(req, res) {
  const { pathname } = parse(req.url, true);
  const cleanPath = pathname.replace(/\/+$/, ''); // remove trailing slashes

  console.log(`🧭 adminRoutes: ${req.method} ${cleanPath}`);

  if (req.method === 'POST' && cleanPath === '/signup/admin') {
    console.log('✅ Matched /signup/admin');
    return await adminSignup(req, res);
  }

  if (req.method === 'POST' && cleanPath === '/login') {
    console.log('✅ Matched /login');
    return await login(req, res);
  }

  return false; // not handled by this route
}
