// utils/parseBody.js
export async function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    const MAX_SIZE = 1e6; // 1 MB limit (prevent abuse)

    req.on('data', chunk => {
      body += chunk.toString();

      if (body.length > MAX_SIZE) {
        reject(new Error('Request body too large'));
        req.connection.destroy(); // end the stream
      }
    });

    req.on('end', () => {
      try {
        const json = JSON.parse(body);
        resolve(json);
      } catch (err) {
        reject(new Error('Invalid JSON'));
      }
    });

    req.on('error', err => {
      reject(new Error('Error reading request body: ' + err.message));
    });
  });
}
