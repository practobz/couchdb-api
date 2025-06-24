export async function parseBody(req) {
  try {
    const buffers = [];
    for await (const chunk of req) {
      buffers.push(chunk);
    }
    const raw = Buffer.concat(buffers).toString('utf8');
    return JSON.parse(raw);
  } catch (err) {
    throw new Error('Invalid JSON body: ' + err.message);
  }
}
