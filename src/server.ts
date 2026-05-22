import express from 'express';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

const browserDistFolder = join(process.cwd(), 'dist/app/browser');
const indexHtml = join(browserDistFolder, 'index.html');

const app = express();
app.use(express.json());

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by serving the index.html (CSR Fallback).
 */
app.get(/^(?!\/api).*/, (req, res) => {
  if (existsSync(indexHtml)) {
    res.sendFile(indexHtml);
  } else {
    res.status(503).send('The application is being compiled or the build has failed. Please wait a few seconds and refresh the page.');
  }
});

const PORT = 4000;
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Simplified Server running on http://0.0.0.0:${PORT}`);
}).on('error', (err: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} is busy, the server might already be running.`);
  } else {
    console.error('Server error:', err);
  }
});
