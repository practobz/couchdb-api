import dotenv from 'dotenv';
dotenv.config();
import nano from 'nano';

const couchURL = process.env.COUCH_URL;
const nanoInstance = nano(couchURL);

const DB_NAMES = {
  users: 'users',
  content: 'content',
  calendars: 'calendars',
};

const databases = {};

export async function initializeDatabases() {
  const dbList = await nanoInstance.db.list();

  for (const [key, dbName] of Object.entries(DB_NAMES)) {
    if (!dbList.includes(dbName)) {
      await nanoInstance.db.create(dbName);
    }
    databases[key] = nanoInstance.db.use(dbName);
  }

  return databases;
}
