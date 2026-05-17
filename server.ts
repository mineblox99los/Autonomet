import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, 'dist/browser');

const app = express();
app.use(express.json());

/**
 * API Route for Gemini Chat (Streaming)
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history, apiKey, systemInstruction } = req.body;
    
    let finalApiKey = apiKey || process.env['GEMINI_API_KEY'];
    
    if (!finalApiKey) {
      console.error('ERROR: GEMINI_API_KEY not configured.');
      res.status(401).json({ 
        error: 'Chave de API não encontrada. Por favor, configure a variável GEMINI_API_KEY nos Secrets do projeto ou use uma chave personalizada no menu lateral.' 
      });
      return;
    }

    const genAI = new GoogleGenAI(finalApiKey);

    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash', // Using 2.0 as it's the latest stable
      systemInstruction: systemInstruction
    });

    const chat = model.startChat({ 
      history: history || [],
    });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    const result = await chat.sendMessageStream(message);
    
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        res.write(chunkText);
      }
    }
    
    res.end();
  } catch (error: unknown) {
    console.error('Gemini API Error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    if (!res.headersSent) {
      res.status(500).json({ error: message });
    } else {
      res.end();
    }
  }
});

/**
 * Serve static files from browser folder
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: 'index.html',
  }),
);

/**
 * Angular SSR handler
 */
const commonEngine = new AngularNodeAppEngine();

app.get(/.*/, (req, res, next) => {
  commonEngine
    .handle(req)
    .then((unsafeResponse) =>
      unsafeResponse ? writeResponseToNodeResponse(unsafeResponse, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server
 */
const port = process.env['PORT'] || 3000;
app.listen(port, () => {
  console.log(`Node Server listening on http://localhost:${port}`);
});

/**
 * Export for SSR runner (if needed)
 */
export const reqHandler = createNodeRequestHandler(app);
