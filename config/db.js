import nanoPkg from 'nano';

const username = process.env.COUCHDB_USER || "admin";
const password = encodeURIComponent(process.env.COUCHDB_PASSWORD || "admin");
const host = process.env.COUCHDB_HOST || "127.0.0.1:5984";

const nano = nanoPkg(`http://${username}:${password}@${host}`);


const DB_NAMES = {
  users: 'users',
  content: 'content',
  calendars: 'calendars'
};

const databases = {};

export async function initializeDatabases() {
  const dbList = await nano.db.list();

  for (const [key, dbName] of Object.entries(DB_NAMES)) {
    if (!dbList.includes(dbName)) {
      await nano.db.create(dbName);
    }
    databases[key] = nano.db.use(dbName);
  }

  return databases;
}
