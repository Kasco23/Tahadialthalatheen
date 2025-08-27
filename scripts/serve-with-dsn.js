/* Simple static server to serve dist/ and a /netlify/functions/get-sentry-dsn endpoint
   Usage:
     SENTRY_DSN=<your_dsn> node scripts/serve-with-dsn.js
*/

import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DIST = path.join(__dirname, '..', 'dist');

const port = process.env.PORT || 5173;

function sendFile(res, filePath) {
  // Set proper MIME type based on file extension
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.html': 'text/html',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
  };

  if (mimeTypes[ext]) {
    res.setHeader('Content-Type', mimeTypes[ext]);
  }

  const stream = fs.createReadStream(filePath);
  stream.on('error', () => {
    res.statusCode = 404;
    res.end('Not found');
  });
  stream.pipe(res);
}

const server = http.createServer((req, res) => {
  // CORS headers for all requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  // Sentry DSN endpoint
  if (req.url === '/.netlify/functions/get-sentry-dsn') {
    const dsn = process.env.SENTRY_DSN || '';
    res.setHeader('Content-Type', 'application/json');
    if (!dsn) {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: 'SENTRY_DSN not set' }));
      return;
    }
    res.end(JSON.stringify({ dsn }));
    return;
  }

  // Mock monitoring endpoints for local testing
  if (req.url.startsWith('/.netlify/functions/')) {
    const functionName = req.url.split('/').pop();
    res.setHeader('Content-Type', 'application/json');

    // Simulate function responses with monitoring context
    const mockResponse = {
      success: true,
      function: functionName,
      timestamp: new Date().toISOString(),
      monitoring: {
        sentryInitialized: true,
        environment: 'development',
        tags: {
          function: functionName,
          platform: 'netlify-functions',
        },
      },
    };

    // Add some latency to simulate real function calls
    setTimeout(
      () => {
        res.end(JSON.stringify(mockResponse));
      },
      Math.random() * 100 + 50,
    );
    return;
  }

  // Serve static files from dist
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = path.join(DIST, decodeURIComponent(urlPath));
  if (filePath.indexOf(DIST) !== 0) {
    res.statusCode = 400;
    res.end('Invalid path');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // fallback to index.html for SPA
      sendFile(res, path.join(DIST, 'index.html'));
      return;
    }
    sendFile(res, filePath);
  });
});

server.listen(port, () => {
  console.log(`Serving dist/ on http://localhost:${port}`);
  console.log(
    'Endpoint /.netlify/functions/get-sentry-dsn returns SENTRY_DSN from env',
  );
});
