// utils/parseBody.js
export async function parseBody(req) {
  try {
    const text = await req.text();       // ✅ works in Cloud Run
    return JSON.parse(text);             // ✅ parse manually
  } catch (err) {
    throw new Error('Invalid JSON body: ' + err.message);
  }
}
