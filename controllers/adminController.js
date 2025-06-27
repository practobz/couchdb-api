import { v4 as uuidv4 } from 'uuid';
import { parseBody } from '../utils/parseBody.js';
import { sendJSON } from '../utils/response.js';

// === Admin Signup ===
export async function adminSignup(req, res) {
  try {
    const usersDb = req.databases.users;
    const body = await parseBody(req);
    const { email, password } = body;

    if (!email || !password) {
      return sendJSON(res, 400, { error: 'Email and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await usersDb.find({
      selector: { email: normalizedEmail },
      limit: 1
    });

    if (existing.docs.length > 0) {
      return sendJSON(res, 409, { error: 'Email already exists' });
    }

    const ADMIN_PERMISSIONS = [
      'view_all_content',
      'manage_customers',
      'manage_content_creators',
      'assign_content',
      'view_analytics',
      'manage_system_settings',
      'manage_users'
    ];

    const user = {
      _id: uuidv4(),
      email: normalizedEmail,
      password,
      role: 'admin',
      permissions: ADMIN_PERMISSIONS,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    const result = await usersDb.insert(user);
    return sendJSON(res, 201, { message: 'Admin registered', userId: result.id });
  } catch (err) {
    console.error('Admin signup error:', err);
    return sendJSON(res, 500, { error: 'Failed to create admin account' });
  }
}

// === Admin Login ===
export async function loginAdmin(req, res) {
  try {
    const usersDb = req.databases.users;
    const { email, password } = await parseBody(req);

    if (!email || !password) {
      return sendJSON(res, 400, { error: 'Email and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const found = await usersDb.find({
      selector: { email: normalizedEmail, role: 'admin' },
      limit: 1
    });

    if (found.docs.length === 0) {
      return sendJSON(res, 401, { error: 'Invalid credentials or sign up to create account' });
    }

    const user = found.docs[0];

    if (!user.isActive) {
      return sendJSON(res, 403, { error: 'Account is inactive' });
    }

    if (user.password !== password) {
      return sendJSON(res, 401, { error: 'Invalid credentials' });
    }

    return sendJSON(res, 200, {
      message: 'Admin login successful',
      token: user._id,
      user: {
        _id: user._id,
        role: user.role,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Admin login error:', err);
    return sendJSON(res, 500, { error: 'Login failed due to server error' });
  }
}
