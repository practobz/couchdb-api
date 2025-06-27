import { loginAdmin, adminSignup } from '../controllers/adminController.js';

export default async function adminRoutes(req, res) {
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'POST' && pathname === '/signup/admin') {
    return await adminSignup(req, res);
  }

  if (req.method === 'POST' && pathname === '/admin/login') {
    return await loginAdmin(req, res);
  }

  return false;
}
