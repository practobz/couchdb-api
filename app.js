import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
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

// Server setup
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const { pathname } = parsedUrl;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  req.databases = { users: usersDb };

  // Built-in routes for testing/debug
  if (req.method === 'GET' && pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ message: '🚀 Backend running successfully!' }));
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

  // App routes
  const handled =
    await customerRoutes(req, res) ||
    await adminRoutes(req, res) ||
    await creatorRoutes(req, res);

  if (!handled && !res.writableEnded) {
    sendJSON(res, 404, { error: 'Route not found' });
  }
});

// Create DB if not exists and start server
couch.db.get('users')
  .catch(() => couch.db.create('users'))
  .then(() => {
const PORT = process.env.PORT || 8080;

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
    });
  });
