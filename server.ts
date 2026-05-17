import express from 'express';
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Health check
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

/**
 * API Route for Key Validation
 */
app.post('/api/validate-key', async (req, res) => {
  try {
    const { apiKey } = req.body;
    if (!apiKey) return res.status(400).json({ valid: false, error: 'Chave ausente' });

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    const result = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: 'echo "ok"',
      config: { maxOutputTokens: 1 }
    });

    if (result.text) {
      res.json({ valid: true });
    } else {
      res.json({ valid: false, error: 'Resposta vazia' });
    }
  } catch (error: any) {
    console.error('Validation Error:', error);
    res.status(200).json({ valid: false, error: error.message || 'Chave inválida' });
  }
});

/**
 * API Route for Gemini Chat (Streaming)
 */
app.post('/api/chat', async (req, res) => {
  console.log('Received chat request:', req.body.model);
  try {
    const { message, history, apiKey, model: requestedModel, systemInstruction } = req.body;
    
    const finalApiKey = apiKey || process.env['GEMINI_API_KEY'];
    const modelToUse = requestedModel || 'gemini-3-flash-preview';
    
    if (!finalApiKey) {
      return res.status(401).json({ 
        error: 'Chave de API não encontrada. Por favor, configure a variável GEMINI_API_KEY nos Secrets do projeto ou use uma chave personalizada no menu lateral.' 
      });
    }

    const ai = new GoogleGenAI({
      apiKey: finalApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const contents = (history || []).map((h: any) => ({
      role: h.role,
      parts: Array.isArray(h.parts) ? h.parts : [{ text: h.parts }]
    }));
    contents.push({ role: 'user', parts: [{ text: message }] });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    const result = await ai.models.generateContentStream({ 
      model: modelToUse,
      contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
        topP: 0.95,
        topK: 64,
      }
    });
    
    for await (const chunk of result) {
      const chunkText = chunk.text;
      if (chunkText) {
        res.write(chunkText);
      }
    }
    
    res.end();
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    const message = error.message || 'Internal Server Error';
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
    redirect: false
  }),
);

/**
 * CSR Fallback
 */
app.get(/.*/, (req, res) => {
  res.sendFile(resolve(browserDistFolder, 'index.html'));
});

/**
 * Start the server
 */
const port = process.env['PORT'] || 3000;
app.listen(port, () => {
  console.log(`Node Server listening on http://localhost:${port}`);
});
