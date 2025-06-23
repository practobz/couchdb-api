import { v4 as uuidv4 } from 'uuid';
import { sendJSON } from '../utils/response.js';

const CUSTOMER_PERMISSIONS = [
  'view_own_content',
  'approve_content',
  'reject_content',
  'comment_on_content',
  'view_own_calendar',
  'manage_social_accounts'
];

export async function createCustomer(req, res, data) {
  try {
    const usersDb = req.databases.users;
    const email = (data.email || '').trim().toLowerCase();

    const existing = await usersDb.find({ selector: { email }, limit: 1 });
    if (existing.docs.length > 0) {
      return sendJSON(res, 409, { error: 'Email already registered' });
    }

    const newUser = {
      _id: uuidv4(),
      email, // always lowercased
      password: data.password,
      role: 'customer', // always set role here
      permissions: CUSTOMER_PERMISSIONS,
      name: data.name,
      mobile: data.mobile,
      address: data.address,
      gstNumber: data.gstNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
    };

    await usersDb.insert(newUser);
    return sendJSON(res, 201, { success: true, user: newUser });
  } catch (err) {
    console.error(err);
    return sendJSON(res, 500, { error: 'Failed to create account' });
  }
}

