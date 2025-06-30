import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import url from 'url';
import nano from 'nano';

import adminRoutes from './routes/adminRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import creatorRoutes from './routes/creatorRoutes.js';
import calendarRoutes from './routes/calendarRoutes.js';
import gcsRoutes from './routes/gcsRoutes.js';
import contentRoutes from './routes/contentRoutes.js';

import { sendJSON } from './utils/response.js';

// ✅ CouchDB connection
const username = process.env.COUCHDB_USER || 'admin';
const password = encodeURIComponent(process.env.COUCHDB_PASSWORD || 'admin');
const host = process.env.COUCHDB_HOST || 'localhost:5984';
const couch = nano(`http://${username}:${password}@${host}`);

const usersDb = couch.db.use('users');
const calendarsDb = couch.db.use('calendars');
const customersDb = couch.db.use('customers');
const submissionsDb = couch.db.use('submissions');

let dbInitialized = false;

// ✅ Create HTTP server
const server = http.createServer(async (req, res) => {
  console.log(`⚡ Request received: ${req.method} ${req.url}`);

  // 🌐 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  // 🛠️ Initialize databases (once)
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

  // 📦 Attach DBs to request
  req.databases = {
    users: usersDb,
    calendars: calendarsDb,
    customers: customersDb,
    submissions: submissionsDb,
  };

  const parsedUrl = url.parse(req.url, true);
  const { pathname } = parsedUrl;

  // ✅ Health check route
  if (req.method === 'GET' && pathname === '/') {
    return sendJSON(res, 200, { message: '🚀 Cloud Run backend is running!' });
  }

  // ✅ DB listing
  if (req.method === 'GET' && pathname === '/databases') {
    try {
      const dbs = await couch.db.list();
      return sendJSON(res, 200, { databases: dbs });
    } catch (error) {
      console.error('❌ CouchDB error:', error.message);
      return sendJSON(res, 500, { error: 'Failed to connect to CouchDB' });
    }
  }

  // 🔁 Route handling
  try {
    const handled =
      (await calendarRoutes(req, res)) ||
      (await customerRoutes(req, res)) ||
      (await adminRoutes(req, res)) ||
      (await creatorRoutes(req, res)) ||
      (await gcsRoutes(req, res)) ||
      (await contentRoutes(req, res));

    if (!handled && !res.writableEnded) {
      sendJSON(res, 404, { error: 'Route not found' });
    }
  } catch (err) {
    console.error('❌ Server error:', err);
    if (!res.writableEnded) {
      sendJSON(res, 500, { error: 'Internal Server Error' });
    }
  }
});

// ✅ REQUIRED: Listen on Cloud Run port
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
