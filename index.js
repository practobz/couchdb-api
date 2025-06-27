// index.js
import http from 'http';
import { myApi } from './app.js';

const PORT = process.env.PORT || 8080;

const server = http.createServer((req, res) => {
  myApi(req, res);
});

server.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
