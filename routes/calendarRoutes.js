import { parse } from 'url';
import { sendJSON } from '../utils/response.js';
import { v4 as uuidv4 } from 'uuid';

export default async function calendarRoutes(req, res) {
  const { pathname } = parse(req.url, true);
  const calendarsDb = req.databases.calendars;
  const cleanPath = pathname.replace(/\/+$/, '');

  console.log('🌐 calendarRoutes:', req.method, cleanPath);

  // ✅ POST /calendars — create calendar (placed at top to avoid being shadowed)
  // ✅ POST /calendars — create calendar
if (req.method === 'POST' && cleanPath === '/calendars') {
  try {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }

    const body = Buffer.concat(chunks).toString();
    const data = JSON.parse(body || '{}');

    console.log('📥 Parsed data:', data); // DEBUG LOG

    if (!data.customerId) {
      return sendJSON(res, 400, { error: 'Missing required field: customerId' });
    }

    const calendar = {
      _id: uuidv4(),
      customerId: data.customerId,
      name: data.name || 'Untitled Calendar',
      description: data.description || '',
      contentItems: Array.isArray(data.contentItems) ? data.contentItems : [],
      createdAt: new Date().toISOString()
    };

    await req.databases.calendars.insert(calendar);
    return sendJSON(res, 201, calendar);
  } catch (err) {
    console.error('❌ Failed to create calendar:', err);
    return sendJSON(res, 500, { error: 'Failed to create calendar' });
  }
}

  // ✅ GET /calendars or /api/calendars — fetch all calendars
  if (
    req.method === 'GET' &&
    (cleanPath === '/calendars' || cleanPath === '/api/calendars')
  ) {
    try {
      const result = await calendarsDb.find({ selector: {} });
      return sendJSON(res, 200, result.docs);
    } catch (err) {
      console.error('❌ Error fetching calendars:', err);
      return sendJSON(res, 500, { error: 'Internal Server Error fetching calendars' });
    }
  }

  // ✅ GET /calendars/:customerId — fetch specific customer's calendars
  const match = cleanPath.match(/^\/calendars\/([a-zA-Z0-9\-]+)$/);
  if (req.method === 'GET' && match) {
    const customerId = match[1];
    try {
      const result = await calendarsDb.find({ selector: { customerId } });
      const calendars = result.docs || [];

      if (calendars.length === 0) {
        return sendJSON(res, 404, { error: 'No calendar found for this customer' });
      }

      return sendJSON(res, 200, calendars);
    } catch (err) {
      console.error('❌ Error fetching calendar:', err);
      return sendJSON(res, 500, { error: 'Internal Server Error fetching calendar' });
    }
  }

  // ✅ PUT /calendars/item/:calendarId/:date/:description — update content item
  const itemUpdateMatch = cleanPath.match(/^\/calendars\/item\/([a-zA-Z0-9\-]+)\/(.+?)\/(.+)$/);
  if (req.method === 'PUT' && itemUpdateMatch) {
    const [_, calendarId, date, description] = itemUpdateMatch;
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', async () => {
      try {
        const updatedData = JSON.parse(body || '{}');
        const calendarDoc = await calendarsDb.get(calendarId);

        if (!calendarDoc || !Array.isArray(calendarDoc.contentItems)) {
          return sendJSON(res, 404, { error: 'Calendar not found or invalid structure' });
        }

        let found = false;
        const decodedDesc = decodeURIComponent(description).trim();

        calendarDoc.contentItems = calendarDoc.contentItems.map(item => {
          if (item.date === date && item.description.trim() === decodedDesc) {
            found = true;
            return {
              ...item,
              ...updatedData
            };
          }
          return item;
        });

        if (!found) {
          return sendJSON(res, 404, { error: 'Content item to update not found' });
        }

        await calendarsDb.insert(calendarDoc);
        return sendJSON(res, 200, { success: true, message: 'Content item updated' });
      } catch (err) {
        console.error('❌ Error updating content item:', err);
        return sendJSON(res, 500, { error: 'Failed to update content item' });
      }
    });
    return true;
  }

  // ✅ DELETE /calendars/item/:calendarId/:date/:description — delete specific content item
  const itemDeleteMatch = cleanPath.match(/^\/calendars\/item\/([a-zA-Z0-9\-]+)\/(.+?)\/(.+)$/);
  if (req.method === 'DELETE' && itemDeleteMatch) {
    const [_, calendarId, date, description] = itemDeleteMatch;

    try {
      const calendarDoc = await calendarsDb.get(calendarId);
      if (!calendarDoc || !Array.isArray(calendarDoc.contentItems)) {
        return sendJSON(res, 404, { error: 'Calendar not found or invalid structure' });
      }

      const originalLength = calendarDoc.contentItems.length;
      const decodedDesc = decodeURIComponent(description);

      calendarDoc.contentItems = calendarDoc.contentItems.filter(
        item => !(item.date === date && item.description === decodedDesc)
      );

      if (calendarDoc.contentItems.length === originalLength) {
        return sendJSON(res, 404, { error: 'Content item not found' });
      }

      await calendarsDb.insert(calendarDoc);
      return sendJSON(res, 200, { success: true, message: 'Content item deleted' });
    } catch (err) {
      console.error('❌ Error deleting content item:', err);
      return sendJSON(res, 500, { error: 'Failed to delete content item' });
    }
  }

  return false; // No matching route
}
