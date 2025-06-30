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

const username = process.env.COUCHDB_USER || 'admin';
const password = encodeURIComponent(process.env.COUCHDB_PASSWORD || 'admin');
const host = process.env.COUCHDB_HOST || 'localhost:5984';
const couch = nano(`http://${username}:${password}@${host}`);

const usersDb = couch.db.use('users');
const calendarsDb = couch.db.use('calendars');
const customersDb = couch.db.use('customers');
const submissionsDb = couch.db.use('submissions');

let dbInitialized = false;

export const myApi = async (req, res) => {
  console.log(`⚡ Request received: ${req.method} ${req.url}`);

  // Ensure DBs are created only once
  if (!dbInitialized) {
    console.log('🔄 Initializing databases...');
    const dbNames = ['users', 'calendars', 'customers', 'submissions'];
    for (const dbName of dbNames) {
      try {
        await couch.db.get(dbName);
      } catch {
        await couch.db.create(dbName);
      }
    }
    dbInitialized = true;
  }

  const parsedUrl = url.parse(req.url, true);
  const { pathname } = parsedUrl;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight request handling
  if (req.method === 'OPTIONS') {
    console.log('🛑 OPTIONS preflight request');
    res.statusCode = 204;
    return res.end();
  }

  // Attach DBs to request
  req.databases = {
    users: usersDb,
    calendars: calendarsDb,
    customers: customersDb,
    submissions: submissionsDb,
  };

  // Health check
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

  // 🔀 Route handling
  try {
    console.log('➡ Routing to handlers...');
    const handled =
      (await calendarRoutes(req, res)) ||
      (await customerRoutes(req, res)) ||
      (await adminRoutes(req, res)) ||
      (await creatorRoutes(req, res)) ||
      (await gcsRoutes(req, res)) ||
      (await contentRoutes(req, res));

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
