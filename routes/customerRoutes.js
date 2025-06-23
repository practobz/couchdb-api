import { parse } from 'url';
import { createCustomer } from '../controllers/customerController.js';
import { sendJSON } from '../utils/response.js';

export default async function customerRoutes(req, res) {
  const { pathname } = parse(req.url, true);
  const usersDb = req.databases.users;

  // GET /customer/:id (must be before any other route matching)
  const match = pathname.match(/^\/customer\/([a-zA-Z0-9\-]+)$/);
  if (req.method === 'GET' && match) {
    const id = match[1];
    try {
      // Debug log to verify route is hit and id is correct
      console.log('Fetching customer by id:', id);
      const customer = await usersDb.get(id);
      // Debug log to see what is returned from DB
      console.log('Fetched customer:', customer);
      return sendJSON(res, 200, customer);
    } catch (err) {
      console.error('Customer fetch error:', err);
      return sendJSON(res, 404, { error: 'Customer not found' });
    }
  }

  if (req.method === 'POST' && pathname === '/signup/customer') {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', async () => {
      try {
        const data = JSON.parse(body || '{}');
        await createCustomer(req, res, data);
      } catch (err) {
        const { sendJSON } = await import('../utils/response.js');
        sendJSON(res, 400, { error: 'Invalid request body' });
      }
    });
    return true;
  }

  return false;
}

