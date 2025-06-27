import dotenv from 'dotenv';
dotenv.config();

import url from 'url';
import nano from 'nano';

// ✅ Route Imports
import adminRoutes from './routes/adminRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import creatorRoutes from './routes/creatorRoutes.js';
import calendarRoutes from './routes/calendarRoutes.js';
import gcsRoutes from './routes/gcsRoutes.js'; // ✅ NEW: GCS routes import

import { sendJSON } from './utils/response.js';

// ✅ CouchDB Setup
const username = process.env.COUCHDB_USER || 'admin';
const password = encodeURIComponent(process.env.COUCHDB_PASSWORD || 'admin');
const host = process.env.COUCHDB_HOST || 'localhost:5984';
const couch = nano(`http://${username}:${password}@${host}`);
const usersDb = couch.db.use('users');
const calendarsDb = couch.db.use('calendars');

let dbInitialized = false;

export const myApi = async (req, res) => {
  console.log(`⚡ Request received: ${req.method} ${req.url}`);

  // ✅ Ensure databases are initialized only once
  if (!dbInitialized) {
    console.log('🔄 Initializing databases...');
    try {
      await couch.db.get('users');
    } catch {
      await couch.db.create('users');
    }
    try {
      await couch.db.get('calendars');
    } catch {
      await couch.db.create('calendars');
    }
    dbInitialized = true;
  }

  const parsedUrl = url.parse(req.url, true);
  const { pathname } = parsedUrl;

  // ✅ CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // ✅ Preflight (OPTIONS) Handling
  if (req.method === 'OPTIONS') {
    console.log('🛑 OPTIONS preflight request');
    res.statusCode = 204;
    return res.end();
  }

  // ✅ Attach databases to request
  req.databases = {
    users: usersDb,
    calendars: calendarsDb
  };

  // ✅ Health check
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

  // ✅ Route Matching
  try {
    console.log('➡ Routing to handlers...');
    const handled =
      (await adminRoutes(req, res)) ||
      (await customerRoutes(req, res)) ||
      (await creatorRoutes(req, res)) ||
      (await calendarRoutes(req, res)) ||
      (await gcsRoutes(req, res)); // ✅ GCS route now included

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
