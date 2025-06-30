import { v4 as uuidv4 } from 'uuid';
import { sendJSON } from '../utils/response.js';
import { parseBody } from '../utils/parseBody.js';

const CUSTOMER_PERMISSIONS = [
  'view_own_content',
  'approve_content',
  'reject_content',
  'comment_on_content',
  'view_own_calendar',
  'manage_social_accounts'
];

// ✅ Create Customer Account
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
      email,
      password: data.password,
      role: 'customer',
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
    console.error('Customer signup error:', err);
    return sendJSON(res, 500, { error: 'Failed to create customer account' });
  }
}

// ✅ Customer Login
export async function loginCustomer(req, res) {
  try {
    const usersDb = req.databases.users;
    const { email, password } = await parseBody(req);

    console.log('[LOGIN] Received:', { email, password }); // Debug log

    if (!email || !password) {
      return sendJSON(res, 400, { error: 'Email and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    console.log('[LOGIN] Normalized email:', normalizedEmail); // Debug log

    const found = await usersDb.find({ selector: { email: normalizedEmail, role: 'customer' }, limit: 1 });
    console.log('[LOGIN] DB found:', found.docs); // Debug log

    if (found.docs.length === 0) {
      return sendJSON(res, 401, { error: 'Invalid credentials or sign up to create account' });
    }

    const user = found.docs[0];
    if (!user.isActive) {
      return sendJSON(res, 403, { error: 'Account is inactive' });
    }

    // Log password comparison for debug (do not log real passwords in production)
    console.log('[LOGIN] Comparing passwords:', user.password, password);

    if (user.password !== password) {
      return sendJSON(res, 401, { error: 'Invalid credentials' });
    }

    return sendJSON(res, 200, {
      message: 'Customer login successful',
      token: user._id,
      user: {
        _id: user._id,
        role: user.role,
        email: user.email,
        name: user.name,
        mobile: user.mobile
      }
    });
  } catch (err) {
    console.error('Customer login error:', err);
    return sendJSON(res, 500, { error: 'Login failed due to server error' });
  }
}
