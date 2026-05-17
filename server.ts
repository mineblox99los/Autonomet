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
 * Gemini API Proxy
 */
const ai = new GoogleGenAI({
  apiKey: process.env['GEMINI_API_KEY'] || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

app.post('/api/chat', async (req, res) => {
  const { model, contents, config, history, customApiKey } = req.body;

  try {
    let clientAi = ai;
    if (customApiKey) {
      clientAi = new GoogleGenAI({
        apiKey: customApiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }

    const chat = clientAi.chats.create({
      model: model || 'gemini-3-flash-preview',
      config: config,
      history: history || []
    });

    const result = await chat.sendMessageStream({ message: contents });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const chunk of result) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error: any) {
    console.error('Gemini Error:', error);
    res.status(500).json({ error: error.message || 'Internal Server Error', details: error });
    return;
  }
});

app.post('/api/validate-key', async (req, res) => {
  const { key } = req.body;
  if (!key) {
    res.status(400).json({ valid: false, error: 'Chave obrigatória.' });
    return;
  }

  try {
    const aiTest = new GoogleGenAI({ apiKey: key });
    await aiTest.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: 'hi' }] }]
    });
    res.json({ valid: true });
    return;
  } catch (error: any) {
    res.json({ valid: false, error: 'Chave inválida.', debug: error.message });
    return;
  }
});

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
