import { parse } from 'url';
import { login, adminSignup } from '../controllers/adminController.js';

export default async function adminRoutes(req, res) {
  const { pathname } = parse(req.url, true);
  const cleanPath = pathname.replace(/\/+$/, ''); // remove trailing slashes

  console.log(`🧭 adminRoutes: ${req.method} ${cleanPath}`);

  try {
    if (req.method === 'POST' && cleanPath === '/signup/admin') {
      console.log('✅ Matched /signup/admin');
      await adminSignup(req, res);
      return true;
    }

    // 🧪 TEMPORARY MOCK TEST HANDLER FOR LOGIN
    if (req.method === 'POST' && cleanPath === '/login') {
      console.log('✅ Matched /login — mock test');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Login test passed' }));
      return true;
    }

  } catch (err) {
    console.error('❌ Error inside adminRoutes:', err);
    if (!res.writableEnded) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error in adminRoutes' }));
    }
    return true;
  }

  return false;
}
