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
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

/**
 * Error handling for large payloads or parsing errors before routes
 */
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err && (err.type === 'entity.too.large' || err.status === 413)) {
    res.status(413).json({ error: 'Payload too large', message: 'O arquivo ou conjunto de mensagens é muito grande para ser processado.' });
    return;
  }
  next(err);
});

/**
 * Gemini API Proxy
 */
app.post('/api/chat', async (req, res) => {
  const { model, contents, config, history, customApiKey } = req.body;

  try {
    if (!customApiKey) {
      res.status(401).json({ error: 'CONFIG_REQUIRED', message: 'Por favor, configure sua própria chave de API nas configurações para continuar.' });
      return;
    }

    const clientAi = new GoogleGenAI({
      apiKey: customApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
          'Api-Revision': '2026-05-20',
        }
      }
    });

    const interactionId = req.body.interactionId;
    const contents = req.body.contents;

    const inputData = contents.map((p: any) => {
      if (p.text) return { type: 'text', text: p.text };
      if (p.inlineData) return { type: 'image', data: p.inlineData.data, mime_type: p.inlineData.mimeType };
      return p;
    });

    const streamRequest: any = {
      model: model || 'gemini-3-flash-preview',
      api_version: 'v1beta',
      input: inputData,
      generation_config: {
        temperature: config?.temperature,
        top_p: config?.topP,
        max_output_tokens: config?.maxOutputTokens,
        thinking_level: config?.thinkingLevel || 'low',
        thinking_summaries: 'auto',
      },
      system_instruction: config?.systemInstruction,
      response_format: config?.responseFormat,
      tools: config?.tools?.flatMap((t: any) => {
        if (t.googleSearch) return [{ type: 'google_search' }];
        if (t.codeExecution) return [{ type: 'code_execution' }];
        if (t.functionDeclarations) {
          return t.functionDeclarations.map((fd: any) => ({
            type: 'function',
            ...fd
          }));
        }
        if (t.mcpServer || t.type === 'mcp_server') {
          return [{
            type: 'mcp_server',
            name: t.name,
            url: t.url,
            headers: t.headers,
            allowed_tools: t.allowed_tools
          }];
        }
        return [t];
      }),
      store: true
    };

    if (interactionId) {
      streamRequest.previous_interaction_id = interactionId;
    }

    const streamResult = await clientAi.interactions.create({
      ...streamRequest,
      stream: true
    } as any) as any;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const event of streamResult) {
      if (event) {
        // Safe serialization for Interaction events which can have non-enumerable props
        let data: any;
        try {
          if (typeof (event as any).toJSON === 'function') {
            data = (event as any).toJSON();
          } else {
            // Manual fallback for common Interaction event properties if spread misses them
            data = {
              event_type: (event as any).event_type,
              delta: (event as any).delta,
              step: (event as any).step,
              interaction: (event as any).interaction,
              interaction_id: (event as any).interaction_id,
              index: (event as any).index,
              ...event
            };
          }
        } catch (e) {
          data = { ...event };
        }
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();

  } catch (error: any) {
    console.error('Gemini Error:', error);
    const status = error.status || (error.message?.includes('429') ? 429 : 500);
    res.status(status).json({ 
      error: error.message || 'Internal Server Error',
      status: status,
      details: error 
    });
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
