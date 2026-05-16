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
const browserDistFolder = resolve(serverDistFolder, '../browser');

const app = express();
app.use(express.json());

const commonEngine = new AngularNodeAppEngine();

/**
 * Rota de API para chat com Gemini (Streaming para Tempo Real)
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history, apiKey, systemInstruction } = req.body;
    
    let finalApiKey = apiKey || process.env['GEMINI_API_KEY'];
    
    // Se não encontrou no env, tenta ver se foi injetado via define pelo compilador
    if (!finalApiKey && typeof GEMINI_API_KEY !== 'undefined' && GEMINI_API_KEY !== 'MY_GEMINI_API_KEY') {
      finalApiKey = GEMINI_API_KEY;
    }
    
    if (!finalApiKey) {
      console.error('ERRO: GEMINI_API_KEY não configurada adequadamente.');
      res.status(401).json({ 
        error: 'Chave de API não encontrada. Por favor, configure a variável GEMINI_API_KEY nos Secrets do projeto ou use uma chave personalizada no menu lateral.' 
      });
      return;
    }

    const genAI = new GoogleGenAI({ 
      apiKey: finalApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const chat = genAI.chats.create({ 
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: systemInstruction
      },
      history: history || [],
    });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    const result = await chat.sendMessageStream({ message: message });
    
    for await (const chunk of result) {
      const chunkText = chunk.text;
      if (chunkText) {
        res.write(chunkText);
      }
    }
    
    res.end();
  } catch (error: unknown) {
    console.error('Erro na API Gemini:', error);
    const message = error instanceof Error ? error.message : 'Erro interno no servidor';
    if (!res.headersSent) {
      res.status(500).json({ error: message });
    } else {
      res.end();
    }
  }
});

/**
 * Servir os arquivos estáticos do navegador
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: 'index.html',
  }),
);

/**
 * Lidar com todas as outras rotas usando o motor do Angular (SSR)
 */
app.get(/.*/, (req, res, next) => {
  commonEngine
    .handle(req)
    .then((unsafeResponse) =>
      unsafeResponse ? writeResponseToNodeResponse(unsafeResponse, res) : next(),
    )
    .catch(next);
});

/**
 * Iniciar o servidor se for o módulo principal
 */
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 3000;
  app.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Exportar o handler para o runner de SSR
 */
export const reqHandler = createNodeRequestHandler(app);
