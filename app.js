import dotenv from 'dotenv';
dotenv.config();

import url from 'url';
import { parse } from 'querystring';
import nano from 'nano';

import adminRoutes from './routes/adminRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import creatorRoutes from './routes/creatorRoutes.js';
import { sendJSON } from './utils/response.js';

// CouchDB config
const username = process.env.COUCHDB_USER || 'admin';
const password = encodeURIComponent(process.env.COUCHDB_PASSWORD || 'admin');
const host = process.env.COUCHDB_HOST || 'localhost:5984';
const couch = nano(`http://${username}:${password}@${host}`);
const usersDb = couch.db.use('users');

// Create DB if not exists on cold start
const ensureUsersDb = async () => {
  try {
    await couch.db.get('users');
  } catch {
    await couch.db.create('users');
  }
};

await ensureUsersDb();

// ✅ Cloud Function entry point
export const myApi = async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const { pathname } = parsedUrl;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  req.databases = { users: usersDb };

  if (req.method === 'GET' && pathname === '/') {
    return res.status(200).json({ message: '🚀 Cloud Function backend running!' });
  }

  if (req.method === 'GET' && pathname === '/databases') {
    try {
      const dbs = await couch.db.list();
      return sendJSON(res, 200, { databases: dbs });
    } catch (error) {
      console.error('Error connecting to CouchDB:', error.message);
      return sendJSON(res, 500, { error: 'Failed to connect to CouchDB' });
    }
  }

  const handled =
    await customerRoutes(req, res) ||
    await adminRoutes(req, res) ||
    await creatorRoutes(req, res);

  if (!handled && !res.writableEnded) {
    sendJSON(res, 404, { error: 'Route not found' });
  }
};
