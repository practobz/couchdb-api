import { parseBody } from '../utils/parseBody.js';
import { sendJSON } from '../utils/response.js';

export async function loginAdmin(req, res) {
  try {
    console.log('🔐 Admin login initiated');

    const usersDb = req.databases?.users;
    if (!usersDb) {
      console.error('❌ usersDb not found');
      return sendJSON(res, 500, { error: 'Database connection error' });
    }

    const { email, password } = await parseBody(req);
    console.log('📧 Email:', email);

    if (!email || !password) {
      return sendJSON(res, 400, { error: 'Email and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const found = await usersDb.find({
      selector: { email: normalizedEmail, role: 'admin' },
      limit: 1,
    });

    console.log('🧾 DB result:', found);

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
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('💥 loginAdmin error:', err);
    return sendJSON(res, 500, { error: 'Login failed due to server error' });
  }
}
