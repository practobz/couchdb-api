// controllers/adminController.js
import { parseBody } from '../utils/parseBody.js';
import { sendJSON } from '../utils/response.js';
import { v4 as uuidv4 } from 'uuid';

export async function adminSignup(req, res) {
  console.log('🚀 adminSignup handler triggered');

  try {
    const usersDb = req.databases.users;

    // Parse body safely
    const body = await parseBody(req);
    console.log('📦 Parsed body:', body);

    const { email, password } = body;

    if (!email || !password) {
      console.warn('❌ Missing email or password');
      return sendJSON(res, 400, { error: 'Email and password are required' });
    }

    // Normalize email for consistency
    const normalizedEmail = email.trim().toLowerCase();

    // Strong password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/;
    if (!passwordRegex.test(password)) {
      return sendJSON(res, 400, {
        error:
          'Password must be at least 6 characters, include uppercase, lowercase, a digit, and a special symbol.'
      });
    }

    // Check for existing email
    console.log('🔍 Checking for existing user...');
    const existing = await usersDb.find({
      selector: { email: normalizedEmail },
      limit: 1
    });

    if (existing.docs.length > 0) {
      console.warn('⚠️ Email already exists:', normalizedEmail);
      return sendJSON(res, 409, { error: 'Email already exists' });
    }

    // Define default admin permissions
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

    console.log('📤 Inserting user into CouchDB...');
    const result = await usersDb.insert(user);
    console.log('✅ User created with ID:', result.id);

    return sendJSON(res, 201, {
      message: 'Admin registered',
      userId: result.id
    });
  } catch (err) {
    console.error('❌ Error during adminSignup:', err.message);
    return sendJSON(res, 500, {
      error: err.message || 'Failed to create account'
    });
  }
}

export async function login(req, res) {
  console.log('🚀 login handler triggered');

  try {
    const usersDb = req.databases.users;
    const { email, password } = await parseBody(req);
    console.log('📦 Parsed login body:', { email });

    const found = await usersDb.find({
      selector: { email },
      limit: 1
    });

    if (found.docs.length === 0) {
      console.warn('❌ Invalid login - user not found');
      return sendJSON(res, 401, {
        error: 'Invalid credentials or sign up to create account'
      });
    }

    const user = found.docs[0];

    if (!user.isActive) {
      console.warn('⛔ Account is inactive');
      return sendJSON(res, 403, { error: 'Account is inactive' });
    }

    if (user.password !== password) {
      console.warn('❌ Invalid login - password mismatch');
      return sendJSON(res, 401, {
        error: 'Invalid credentials or sign up to create account'
      });
    }

    console.log('✅ Login successful:', user.email);
    return sendJSON(res, 200, {
      message: 'Login successful',
      token: user._id,
      user: {
        _id: user._id,
        role: user.role,
        email: user.email
      }
    });
  } catch (err) {
    console.error('❌ Error during login:', err.message);
    return sendJSON(res, 500, {
      error: err.message || 'Login failed'
    });
  }
}
