export async function parseBody(req) {
  try {
    // Google Cloud Functions automatically parse JSON
    if (req.body && typeof req.body === 'object') {
      return req.body;
    }

    // fallback for plain body
    const text = await new Promise((resolve, reject) => {
      let body = '';
      req.on('data', chunk => {
        body += chunk;
      });
      req.on('end', () => resolve(body));
      req.on('error', reject);
    });

    return JSON.parse(text);
  } catch (err) {
    throw new Error('Invalid JSON body: ' + err.message);
  }
}
