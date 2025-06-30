export function sendJSON(res, statusCode, data) {
  if (res.headersSent) return; // ✅ Prevents double response error

  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });

  res.end(JSON.stringify(data));
}
