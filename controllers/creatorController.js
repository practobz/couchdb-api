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

export async function creatorSignup(req, res) {
  const usersDb = req.databases.users;
  const body = await parseBody(req);

  const { email, password } = body;
  if (!email || !password) {
    return sendJSON(res, 400, { error: 'Email and password are required' });
  }

  // Always lowercase and trim email for uniqueness and storage
  const normalizedEmail = (email || '').trim().toLowerCase();

  const existing = await usersDb.find({ selector: { email: normalizedEmail }, limit: 1 });
  if (existing.docs.length > 0) {
    return sendJSON(res, 409, { error: 'Email already exists' });
  }

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
  return sendJSON(res, 201, { message: 'Content Creator registered', userId: user._id });
}
