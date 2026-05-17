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
 * Health check
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});
app.head('/api/health', (req, res) => {
  res.status(200).end();
});

/**
 * API Route for Key Validation
 */
app.post('/api/validate-key', async (req: express.Request, res: express.Response): Promise<any> => {
  try {
    const { apiKey } = req.body;
    if (!apiKey) return res.status(400).json({ valid: false, error: 'Chave ausente' });

    const ai = new GoogleGenAI({ 
      apiKey, 
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });
    
    // Minimal request to validate key
    await ai.models.generateContent({ 
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: 'hi' }] }] 
    });
    
    return res.json({ valid: true });
  } catch (error: any) {
    console.error('Validation Error:', error);
    return res.status(200).json({ 
      valid: false, 
      error: 'Chave de API inválida ou sem permissão para o modelo Gemini.' 
    });
  }
});

/**
 * API Route for Gemini Chat (Streaming)
 */
app.post('/api/chat', async (req: express.Request, res: express.Response): Promise<any> => {
  try {
    const { message, history, apiKey, systemInstruction, googleSearchEnabled } = req.body;
    const finalApiKey = apiKey || process.env['GEMINI_API_KEY'];
    
    if (!finalApiKey) {
      return res.status(401).json({ error: 'Chave de API não configurada.' });
    }

    const ai = new GoogleGenAI({ 
      apiKey: finalApiKey, 
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    const contents = (history || []).map((h: any) => ({
      role: h.role,
      parts: [{ text: h.parts?.[0]?.text || h.parts || '' }]
    }));
    contents.push({ role: 'user', parts: [{ text: message }] });

    const tools: any[] = [];
    if (googleSearchEnabled) {
      tools.push({ googleSearch: {} });
    }

    res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    // Use correct streaming method and parameter structure
    const result = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents,
      config: {
        systemInstruction,
        tools: tools.length > 0 ? tools : undefined,
        temperature: 1.0,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 8192,
      }
    });
    
    for await (const chunk of result) {
      const chunkText = chunk.text || '';
      const responseData: any = { text: chunkText };
      
      if (chunk.candidates?.[0]?.groundingMetadata) {
        responseData.groundingMetadata = chunk.candidates[0].groundingMetadata;
      }
      
      res.write(JSON.stringify(responseData) + '\n');
    }
    
    res.end();
    return;
  } catch (error: any) {
    console.error('Gemini Stream Error:', error);
    let statusCode = error.status || 500;
    let message = 'Ocorreu um erro ao processar sua solicitação.';

    if (statusCode === 429) {
      message = 'Limite de frequência atingido. Aguarde um momento.';
    } else if (statusCode === 401 || statusCode === 403) {
      message = 'Chave de API inválida ou sem permissão.';
    }

    if (!res.headersSent) {
      return res.status(statusCode).json({ error: message });
    } else {
      res.end();
      return;
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
