// app.js (for Google Cloud Functions)
import dotenv from 'dotenv';
dotenv.config();

import url from 'url';
import nano from 'nano';

import adminRoutes from './routes/adminRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import creatorRoutes from './routes/creatorRoutes.js';
import calendarRoutes from './routes/calendarRoutes.js';
import gcsRoutes from './routes/gcsRoutes.js';
import contentRoutes from './routes/contentRoutes.js';

import { sendJSON } from './utils/response.js';

// ✅ CouchDB credentials and connection
const username = process.env.COUCHDB_USER || 'admin';
const password = encodeURIComponent(process.env.COUCHDB_PASSWORD || 'admin');
const host = process.env.COUCHDB_HOST || 'localhost:5984';
const couch = nano(`http://${username}:${password}@${host}`);

// ✅ CouchDB databases
const usersDb = couch.db.use('users');
const calendarsDb = couch.db.use('calendars');
const customersDb = couch.db.use('customers');
const submissionsDb = couch.db.use('submissions');

let dbInitialized = false;

// ✅ Exported handler for Google Cloud Function
export const myApi = async (req, res) => {
  console.log(`⚡ Request received: ${req.method} ${req.url}`);

  // 🌐 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    console.log('🛑 OPTIONS preflight request');
    res.statusCode = 204;
    return res.end();
  }

  // 🔄 Initialize databases once
  if (!dbInitialized) {
    console.log('🔄 Initializing databases...');
    const dbNames = ['users', 'calendars', 'customers', 'submissions'];
    for (const name of dbNames) {
      try {
        await couch.db.get(name);
      } catch {
        await couch.db.create(name);
      }
    }
    dbInitialized = true;
  }

  // ✅ Attach databases to request
  req.databases = {
    users: usersDb,
    calendars: calendarsDb,
    customers: customersDb,
    submissions: submissionsDb,
  };

  const parsedUrl = url.parse(req.url, true);
  const { pathname } = parsedUrl;

  // 🔍 Health check
  if (req.method === 'GET' && pathname === '/') {
    return sendJSON(res, 200, { message: '🚀 Cloud Function backend running!' });
  }

  // 🔍 List all databases
  if (req.method === 'GET' && pathname === '/databases') {
    try {
      const dbs = await couch.db.list();
      return sendJSON(res, 200, { databases: dbs });
    } catch (error) {
      console.error('❌ CouchDB error:', error.message);
      return sendJSON(res, 500, { error: 'Failed to connect to CouchDB' });
    }
  }

  // 🛣️ Route handling
  try {
    const handled =
      (await adminRoutes(req, res)) ||
      (await customerRoutes(req, res)) ||
      (await creatorRoutes(req, res)) ||
      (await calendarRoutes(req, res)) ||
      (await gcsRoutes(req, res)) ||
      (await contentRoutes(req, res));

    if (!handled && !res.writableEnded) {
      sendJSON(res, 404, { error: 'Route not found' });
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    if (!res.writableEnded) {
      sendJSON(res, 500, { error: 'Internal Server Error' });
    }
  }
};
