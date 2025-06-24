// utils/parseBody.js
export async function parseBody(req) {
  try {
    const text = await req.text(); // 👈 Cloud Function compatible
    return JSON.parse(text);
  } catch (err) {
    throw new Error('Invalid JSON body: ' + err.message);
  }
}
