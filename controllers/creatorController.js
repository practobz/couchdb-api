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

// ✅ Signup
export async function creatorSignup(req, res) {
  let responded = false;
  try {
    const usersDb = req.databases.users;
    // Add a timeout for parseBody and DB operations
    const timeoutMs = 9000;
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out')), timeoutMs)
    );

    const body = await Promise.race([parseBody(req), timeoutPromise]);
    const { email, password, name, mobile, specialization, experience } = body;


    if (!email || !password) {
      if (!responded) {
        responded = true;
        return sendJSON(res, 400, { error: 'Email and password are required' });
      }
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await Promise.race([
      usersDb.find({ selector: { email: normalizedEmail }, limit: 1 }),
      timeoutPromise
    ]);
    if (existing.docs.length > 0) {
      if (!responded) {
        responded = true;
        return sendJSON(res, 409, { error: 'Email already exists' });
      }
      return;
    }

    const user = {
      _id: uuidv4(),
      email: normalizedEmail,
      password,
      name,                // ✅ newly added
      mobile,              // ✅ newly added
      specialization,      // ✅ newly added
      experience,          // ✅ newly added
      role: 'content_creator',
      permissions: CREATOR_PERMISSIONS,
      isActive: true,
      createdAt: new Date().toISOString()
};


    await Promise.race([usersDb.insert(user), timeoutPromise]);
    if (!responded) {
      responded = true;
      return sendJSON(res, 201, { message: 'Content Creator registered', userId: user._id });
    }
  } catch (err) {
    if (!responded && !res.headersSent) {
      if (err.message === 'Request timed out') {
        res.writeHead(504, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Request timed out' }));
      } else {
        console.error('Creator signup error:', err);
        sendJSON(res, 500, { error: 'Failed to create content creator account' });
      }
    }
  }
}

// ✅ Login
export async function loginCreator(req, res) {
  try {
    const usersDb = req.databases.users;
    const { email, password } = await parseBody(req);

    if (!email || !password) {
      return sendJSON(res, 400, { error: 'Email and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const found = await usersDb.find({ selector: { email: normalizedEmail, role: 'content_creator' }, limit: 1 });

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
      message: 'Content Creator login successful',
      token: user._id,
      user: {
        _id: user._id,
        role: user.role,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Creator login error:', err);
    return sendJSON(res, 500, { error: 'Login failed due to server error' });
  }
}

// ✅ Fetch Content Creators
export async function getCreators(req, res) {
  try {
    const usersDb = req.databases.users;
    const result = await usersDb.find({
      selector: { role: 'content_creator' },
      // Return all fields for creators
      fields: [
        '_id',
        'email',
        'role',
        'name',
        'mobile',
        'specialization',
        'experience',
        'createdAt',
        'isActive'
      ]
    });
    return sendJSON(res, 200, { creators: result.docs });
  } catch (err) {
    console.error('Fetch creators error:', err);
    return sendJSON(res, 500, { error: 'Failed to fetch content creators' });
  }
}

// ✅ Fetch Single Content Creator by ID
export async function getCreatorById(req, res) {
  try {
    const usersDb = req.databases.users;
    const id = req.params?.id || (req.url.split('/').pop());
    if (!id) return sendJSON(res, 400, { error: 'Missing creator id' });
    const doc = await usersDb.get(id);
    if (!doc || doc.role !== 'content_creator') {
      return sendJSON(res, 404, { error: 'Content creator not found' });
    }
    // Return all fields for the creator
    return sendJSON(res, 200, doc);
  } catch (err) {
    return sendJSON(res, 404, { error: 'Content creator not found' });
  }
}
