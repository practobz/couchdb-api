// backend/controllers/adminController.js
import { parseBody } from '../utils/parseBody.js';
import { sendJSON } from '../utils/response.js';
import { v4 as uuidv4 } from 'uuid';

export async function adminSignup(req, res) {
  try {
    const usersDb = req.databases.users;
    const body = await parseBody(req);

    const { email, password } = body;
    if (!email || !password) {
      return sendJSON(res, 400, { error: 'Email and password are required' });
    }

    // Always lowercase and trim email for uniqueness and storage
    const normalizedEmail = (email || '').trim().toLowerCase();

    // Password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/;
    if (!passwordRegex.test(password)) {
      return sendJSON(res, 400, {
        error:
          'Password must be at least 6 characters, include uppercase, lowercase, a digit, and a special symbol.'
      });
    }

    const existing = await usersDb.find({ selector: { email: normalizedEmail }, limit: 1 });
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
    // Always return the actual error if it's a known error, otherwise generic
    if (err && err.error && typeof err.error === 'string') {
      return sendJSON(res, 400, { error: err.error });
    }
    return sendJSON(res, 500, { error: err.message || 'Failed to create account' });
  }
}

export async function login(req, res) {
  const usersDb = req.databases.users;
  const { email, password } = await parseBody(req);

  // Find user by email
  const found = await usersDb.find({ selector: { email }, limit: 1 });
  if (found.docs.length === 0) {
    return sendJSON(res, 401, { error: 'Invalid credentials or sign up to create account' });
  }

  const user = found.docs[0];
  if (!user.isActive) {
    return sendJSON(res, 403, { error: 'Account is inactive' });
  }
  if (user.password !== password) {
    return sendJSON(res, 401, { error: 'Invalid credentials or sign up to create account' });
  }

  return sendJSON(res, 200, {
    message: 'Login successful',
    token: user._id,
    user: {
      _id: user._id,
      role: user.role,
      email: user.email
    }
  });
}
