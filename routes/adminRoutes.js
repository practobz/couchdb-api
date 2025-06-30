import { loginAdmin, adminSignup } from '../controllers/adminController.js';

export default async function adminRoutes(req, res) {
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'POST' && pathname === '/signup/admin') {
    return await adminSignup(req, res);
  }

  if (req.method === 'POST' && pathname === '/admin/login') {
    return await loginAdmin(req, res);
  }

  // Example route handler for GET /users?role=content_creator
  if (req.method === 'GET' && req.url.startsWith('/users')) {
    const urlObj = new URL(req.url, `http://${req.headers.host}`);
    const role = urlObj.searchParams.get('role');
    const usersDb = req.databases.users;

    let selector = {};
    if (role) {
      selector.role = role;
    }

    try {
      const result = await usersDb.find({ selector });
      // Return only the docs array (array of users)
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result.docs));
      return true;
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to fetch users' }));
      return true;
    }
  }

  return false;
}
