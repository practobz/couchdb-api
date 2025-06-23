// routes/creatorRoutes.js
import { parse } from 'url';
import { parseBody } from '../utils/parseBody.js';
import { sendJSON } from '../utils/response.js';
import { v4 as uuidv4 } from 'uuid';

const CREATOR_PERMISSIONS = [
  'view_assigned_content',
  'upload_content',
  'edit_own_content',
  'view_customer_feedback',
  'respond_to_feedback'
];

export default async function creatorRoutes(req, res) {
  const { pathname } = parse(req.url, true);

  if (req.method === 'POST' && pathname === '/signup/creator') {
    try {
      const usersDb = req.databases.users;
      const body = await parseBody(req);

      const { email, password } = body;
      if (!email || !password) {
        return sendJSON(res, 400, { error: 'Email and password are required' });
      }

      const normalizedEmail = (email || '').trim().toLowerCase();

      const existing = await usersDb.find({ selector: { email: normalizedEmail }, limit: 1 });
      if (existing.docs.length > 0) {
        return sendJSON(res, 409, { error: 'Email already exists' });
      }

      // Ensure role is not overwritten by frontend data
      const user = {
        _id: uuidv4(),
        email: normalizedEmail,
        password,
        role: 'content_creator', // always set role here
        permissions: CREATOR_PERMISSIONS,
        isActive: true,
        createdAt: new Date().toISOString()
      };

      await usersDb.insert(user);
      // Double-check: log the user object for debugging
      console.log('User inserted:', user);

      return sendJSON(res, 201, { message: 'Content Creator registered', userId: user._id });
    } catch (err) {
      return sendJSON(res, 500, { error: err.message || 'Failed to create account' });
    }
  }

  return false;
}
