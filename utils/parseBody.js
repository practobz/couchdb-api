// utils/parseBody.js
export async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    const MAX_SIZE = 1e6; // 1 MB limit

    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > MAX_SIZE) {
        req.destroy();
        return reject(new Error('Request body too large'));
      }
    });

    req.on('end', () => {
      try {
        const json = JSON.parse(body);
        resolve(json);
      } catch (err) {
        reject(new Error('Invalid JSON body: ' + err.message));
      }
    });

    req.on('error', err => {
      reject(new Error('Request stream error: ' + err.message));
    });
  });
}
