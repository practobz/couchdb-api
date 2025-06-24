import dotenv from 'dotenv';
dotenv.config();

import url from 'url';
import nano from 'nano';

import adminRoutes from './routes/adminRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import creatorRoutes from './routes/creatorRoutes.js';
import { sendJSON } from './utils/response.js';

const username = process.env.COUCHDB_USER || 'admin';
const password = encodeURIComponent(process.env.COUCHDB_PASSWORD || 'admin');
const host = process.env.COUCHDB_HOST || 'localhost:5984';
const couch = nano(`http://${username}:${password}@${host}`);
const usersDb = couch.db.use('users');

let dbInitialized = false;

export const myApi = async (req, res) => {
  console.log(`⚡ Request received: ${req.method} ${req.url}`);

  if (!dbInitialized) {
    console.log('🔄 Initializing users DB...');
    try {
      await couch.db.get('users');
    } catch {
      await couch.db.create('users');
    }
    dbInitialized = true;
  }

  const parsedUrl = url.parse(req.url, true);
  const { pathname } = parsedUrl;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    console.log('🛑 OPTIONS preflight request');
    res.statusCode = 204;
    return res.end();
  }

  req.databases = { users: usersDb };

  if (req.method === 'GET' && pathname === '/') {
    return sendJSON(res, 200, { message: '🚀 Cloud Function backend running!' });
  }

  if (req.method === 'GET' && pathname === '/databases') {
    try {
      const dbs = await couch.db.list();
      return sendJSON(res, 200, { databases: dbs });
    } catch (error) {
      console.error('❌ CouchDB error:', error.message);
      return sendJSON(res, 500, { error: 'Failed to connect to CouchDB' });
    }
  }

  try {
    console.log('➡ Routing to handlers...');
    const handled =
      (await adminRoutes(req, res)) ||
      (await customerRoutes(req, res)) ||
      (await creatorRoutes(req, res));

    console.log('✅ Route handled result:', handled);

    if (!handled && !res.writableEnded) {
      console.log('❌ No route matched');
      sendJSON(res, 404, { error: 'Route not found' });
    }
  } catch (err) {
    console.error('❌ Unexpected error in myApi:', err);
    if (!res.writableEnded) {
      sendJSON(res, 500, { error: 'Internal Server Error' });
    }
  }
};
