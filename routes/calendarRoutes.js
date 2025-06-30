import { parse } from 'url';
import { sendJSON } from '../utils/response.js';
import { v4 as uuidv4 } from 'uuid';

export default async function calendarRoutes(req, res) {
  const { pathname } = parse(req.url, true);
  const calendarsDb = req.databases.calendars;
  const cleanPath = pathname.replace(/\/+$/, '');

  console.log('🌐 calendarRoutes:', req.method, cleanPath);

  // ✅ GET /calendars
  if (req.method === 'GET' && cleanPath === '/calendars') {
    try {
      const result = await calendarsDb.find({ selector: {} });
      return sendJSON(res, 200, result.docs);
    } catch (err) {
      return sendJSON(res, 500, { error: 'Internal Server Error' });
    }
  }

  // ✅ POST /calendars
  if (req.method === 'POST' && cleanPath === '/calendars') {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', async () => {
      try {
        const data = JSON.parse(body || '{}');
        const calendar = {
          _id: uuidv4(),
          customerId: data.customerId,
          name: data.name || 'Untitled Calendar',
          description: data.description || '',
          contentItems: data.contentItems || [],
          assignedTo: '',
          assignedToName: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await calendarsDb.insert(calendar);
        return sendJSON(res, 201, calendar);
      } catch (err) {
        return sendJSON(res, 500, { error: 'Failed to create calendar' });
      }
    });
    return true;
  }

  // ✅ DELETE /calendars/:calendarId — delete a calendar by _id (placed above PUT!)
  const deleteMatch = cleanPath.match(/^\/calendars\/([a-zA-Z0-9\-]+)$/);
  if (req.method === 'DELETE' && deleteMatch) {
    const calendarId = deleteMatch[1];
    try {
      const calendar = await calendarsDb.get(calendarId);
      await calendarsDb.destroy(calendarId, calendar._rev);
      return sendJSON(res, 200, { success: true });
    } catch (err) {
      return sendJSON(res, 404, { error: 'Calendar not found' });
    }
  }

  // ✅ PUT /calendars/:calendarId — update calendar
  const updateMatch = cleanPath.match(/^\/calendars\/([a-zA-Z0-9\-]+)$/);
  if (req.method === 'PUT' && updateMatch) {
    const calendarId = updateMatch[1];
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', async () => {
      try {
        let calendarDoc = await calendarsDb.get(calendarId);
        const updatedData = JSON.parse(body || '{}');
        const updatedCalendar = {
          ...calendarDoc,
          ...updatedData,
          updatedAt: new Date().toISOString()
        };
        await calendarsDb.insert(updatedCalendar);
        return sendJSON(res, 200, updatedCalendar);
      } catch (err) {
        return sendJSON(res, 500, { error: 'Failed to update calendar' });
      }
    });
    return true;
  }

  // ✅ GET /calendars/customer/:customerId
  const matchByCustomer = cleanPath.match(/^\/calendars\/customer\/([a-zA-Z0-9\-]+)$/);
  if (req.method === 'GET' && matchByCustomer) {
    const customerId = matchByCustomer[1];
    try {
      const result = await calendarsDb.find({ selector: { customerId } });
      return sendJSON(res, 200, result.docs || []);
    } catch (err) {
      return sendJSON(res, 500, { error: 'Failed to fetch calendar by customerId' });
    }
  }

  // ✅ GET /calendar-by-id/:calendarId
  const matchById = cleanPath.match(/^\/calendar-by-id\/([a-zA-Z0-9\-]+)$/);
  if (req.method === 'GET' && matchById) {
    const calendarId = matchById[1];
    try {
      const calendar = await calendarsDb.get(calendarId);
      return sendJSON(res, 200, calendar);
    } catch (err) {
      return sendJSON(res, 404, { error: 'Calendar not found' });
    }
  }

  // ✅ GET /calendars/:calendarId (fetch by id, for frontend compatibility)
  const matchByCalendarId = cleanPath.match(/^\/calendars\/([a-zA-Z0-9\-]+)$/);
  if (req.method === 'GET' && matchByCalendarId) {
    const calendarId = matchByCalendarId[1];
    try {
      const calendar = await calendarsDb.get(calendarId);
      return sendJSON(res, 200, calendar);
    } catch (err) {
      return sendJSON(res, 404, { error: 'Calendar not found' });
    }
  }

  // ✅ PUT /calendars/item/:calendarId/:date/:description
  const itemUpdateMatch = cleanPath.match(/^\/calendars\/item\/([a-zA-Z0-9\-]+)\/(.+?)\/(.+)$/);
  if (req.method === 'PUT' && itemUpdateMatch) {
    const [_, calendarId, date, description] = itemUpdateMatch;
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', async () => {
      try {
        const updatedData = JSON.parse(body || '{}');
        const calendarDoc = await calendarsDb.get(calendarId);
        const decodedDesc = decodeURIComponent(description).trim();
        let found = false;
        calendarDoc.contentItems = calendarDoc.contentItems.map(item => {
          if (item.date === date && item.description.trim() === decodedDesc) {
            found = true;
            return { ...item, ...updatedData };
          }
          return item;
        });

        if (!found) return sendJSON(res, 404, { error: 'Content item not found' });

        await calendarsDb.insert(calendarDoc);
        return sendJSON(res, 200, { success: true });
      } catch (err) {
        return sendJSON(res, 500, { error: 'Failed to update content item' });
      }
    });
    return true;
  }

  // ✅ DELETE /calendars/item/:calendarId/:date/:description
  const itemDeleteMatch = cleanPath.match(/^\/calendars\/item\/([a-zA-Z0-9\-]+)\/(.+?)\/(.+)$/);
  if (req.method === 'DELETE' && itemDeleteMatch) {
    const [_, calendarId, date, description] = itemDeleteMatch;
    try {
      const calendarDoc = await calendarsDb.get(calendarId);
      const decodedDesc = decodeURIComponent(description);
      const originalLength = calendarDoc.contentItems.length;

      calendarDoc.contentItems = calendarDoc.contentItems.filter(
        item => !(item.date === date && item.description === decodedDesc)
      );

      if (calendarDoc.contentItems.length === originalLength) {
        return sendJSON(res, 404, { error: 'Content item not found' });
      }

      await calendarsDb.insert(calendarDoc);
      return sendJSON(res, 200, { success: true });
    } catch (err) {
      return sendJSON(res, 500, { error: 'Failed to delete content item' });
    }
  }

  return false; // fallback
}
