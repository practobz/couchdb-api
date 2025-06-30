import { parse } from 'url';
import { createCustomer, loginCustomer } from '../controllers/customerController.js';
import { sendJSON } from '../utils/response.js';
import { parseBody } from '../utils/parseBody.js'; // <-- Add this import

export default async function customerRoutes(req, res) {
  const { pathname } = parse(req.url, true);
  const usersDb = req.databases.users;
  const calendarsDb = req.databases.calendars;

  // ✅ GET /customer/:id
  const match = pathname.match(/^\/customer\/([a-zA-Z0-9\-]+)$/);
  if (req.method === 'GET' && match) {
    const id = match[1];
    try {
      const customer = await usersDb.get(id);
      return sendJSON(res, 200, customer);
    } catch (err) {
      return sendJSON(res, 404, { error: 'Customer not found' });
    }
  }

  // ✅ GET /api/customers
  if (req.method === 'GET' && pathname === '/api/customers') {
    try {
      const result = await usersDb.find({
        selector: { role: 'customer' },
        sort: [{ createdAt: 'desc' }]
      });

      const customers = result.docs.map(({ password, ...rest }) => rest);

      const calendarResult = await calendarsDb.list({ include_docs: true });
      const calendars = calendarResult.rows.map(row => row.doc);

      const enrichedCustomers = customers.map((customer) => {
        const calendar = calendars.find(c => c.customerId === customer._id || c.customerId === customer.id);

        let nextDueDate = '';
        let nextDueContent = '';

        if (calendar && Array.isArray(calendar.contentItems)) {
          const upcoming = calendar.contentItems
            .filter(item => new Date(item.date) >= new Date())
            .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

          if (upcoming) {
            nextDueDate = upcoming.date;
            nextDueContent = upcoming.description;
          }
        }

        return {
          ...customer,
          nextDueDate,
          nextDueContent
        };
      });

      return sendJSON(res, 200, { customers: enrichedCustomers });
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      return sendJSON(res, 500, { error: 'Failed to fetch customers' });
    }

    // ✅ Add this outside try-catch block (not inside)
    return true;
  }

  // ✅ POST /signup/customer
  if (req.method === 'POST' && pathname === '/signup/customer') {
    try {
      const data = await parseBody(req);
      await createCustomer(req, res, data);
    } catch (err) {
      sendJSON(res, 400, { error: 'Invalid request body' });
    }
    return true;
  }

  // ✅ POST /customer/login
  if (req.method === 'POST' && pathname === '/customer/login') {
    return await loginCustomer(req, res);
  }

  // ❌ fallback
  return false;
}

