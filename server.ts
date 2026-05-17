import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import cors from 'cors';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';
import { existsSync } from 'node:fs';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
// Try standard locations
let browserDistFolder = resolve(serverDistFolder, 'dist/browser');

if (!existsSync(browserDistFolder)) {
  // If we are already inside dist or somewhere else
  browserDistFolder = resolve(serverDistFolder, '../browser');
}

if (!existsSync(browserDistFolder)) {
  // Fallback to process cwd
  browserDistFolder = resolve(process.cwd(), 'dist/browser');
}

console.log('Using browserDistFolder:', browserDistFolder);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Serve static files from browser folder
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: 'index.html',
    redirect: false
  }),
);

/**
 * CSR Fallback & Angular Integration
 */
const commonEngine = new AngularNodeAppEngine();

app.get(/.*/, (req, res, next) => {
  commonEngine
    .handle(req)
    .then((r) => (r ? writeResponseToNodeResponse(r, res) : next()))
    .catch(next);
});

/**
 * Global 404 for API or other methods
 */
app.use((req, res) => {
  if (req.url.startsWith('/api/')) {
    res.status(404).json({ error: `O ponto de extremidade ${req.method} ${req.url} não foi encontrado.` });
  } else {
    res.status(404).send('Página não encontrada');
  }
});

/**
 * Start the server
 */
const port = process.env['PORT'] || 3000;
if (isMainModule(import.meta.url)) {
  app.listen(port, () => {
    console.log(`Node Server listening on http://localhost:${port}`);
  });
}

/**
 * Export for SSR runner (Required for Angular Dev Server Integration)
 */
export const reqHandler = createNodeRequestHandler(app);

export default app;
