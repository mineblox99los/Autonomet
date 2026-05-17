import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { GoogleGenAI } from '@google/genai';

export interface GroundingChunk {
  web?: {
    uri: string;
    title?: string;
  };
}

export interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
}

export interface Message {
  role: 'user' | 'model';
  parts: string;
  thinking?: string;
  responseTime?: number;
  groundingMetadata?: GroundingMetadata;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private userApiKey = signal<string | null>(this.isBrowser() ? localStorage.getItem('user_gemini_api_key') : null);
  isGoogleSearchEnabled = signal<boolean>(this.isBrowser() ? localStorage.getItem('google_search_enabled') === 'true' : false);
  
  toggleGoogleSearch() {
    const newValue = !this.isGoogleSearchEnabled();
    this.isGoogleSearchEnabled.set(newValue);
    if (this.isBrowser()) {
      localStorage.setItem('google_search_enabled', String(newValue));
    }
  }

  getSelectedModel() {
    return 'gemini-3-flash-preview';
  }

  setSelectedModel(modelId: string) {
    // No-op as we only use one model
    console.log('Selected model:', modelId);
  }
  
  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private loadSessionsFromStorage(): ChatSession[] {
    if (!this.isBrowser()) return [];
    const saved = localStorage.getItem('gemini_chat_sessions');
    return saved ? JSON.parse(saved) : [];
  }

  private saveSessionsToStorage() {
    if (!this.isBrowser()) return;
    localStorage.setItem('gemini_chat_sessions', JSON.stringify(this.sessions()));
  }

  private readonly SYSTEM_INSTRUCTION = `Você é a Superintelligence, uma assistente de IA de última geração com capacidades avançadas de raciocínio, execução de código e pesquisa em tempo real.

Responda de forma concisa e eficaz usando Markdown. Você possui as seguintes capacidades "Full Potential":
1. **Pesquisa Google**: Você pode realizar pesquisas em tempo real para fornecer informações atualizadas.
2. **Execução de Código**: Você pode executar blocos de código para validar algoritmos ou realizar cálculos complexos.
3. **Visualização de Dados**: Se solicitado a criar gráficos ou visualizações, você pode sugerir o uso da biblioteca D3.js.

Se você for solicitado a criar, modificar ou mostrar código de arquivos, você DEVE usar a estrutura "Action History":
<action_history>
<file path="caminho/do/arquivo.ts">
// conteúdo
</file>
</action_history>

Não use blocos de código markdown (\` \` \`) dentro da tag <file>.`;

  private sessions = signal<ChatSession[]>(this.loadSessionsFromStorage());
  private activeSessionId = signal<string | null>(null);

  chatSessions = computed(() => this.sessions().sort((a, b) => b.createdAt - a.createdAt));

  getActiveSessionId() {
    return this.activeSessionId();
  }

  createNewSession() {
    this.chatHistory.set([]);
    this.activeSessionId.set(null);
  }

  loadSession(id: string) {
    const session = this.sessions().find(s => s.id === id);
    if (session) {
      this.chatHistory.set(session.messages);
      this.activeSessionId.set(session.id);
    }
  }

  deleteSession(id: string) {
    this.sessions.update(prev => prev.filter(s => s.id !== id));
    this.saveSessionsToStorage();
    if (this.activeSessionId() === id) {
      this.createNewSession();
    }
  }

  setApiKey(key: string) {
    if (this.isBrowser()) {
      localStorage.setItem('user_gemini_api_key', key);
    }
    this.userApiKey.set(key);
  }

  getApiKey() {
    return this.userApiKey();
  }

  hasCustomKey() {
    return !!this.userApiKey();
  }

  chatHistory = signal<Message[]>([]);
  isLoading = signal(false);
  elapsedTime = signal(0);
  workingStatus = signal<string>('Working');
  private timerInterval?: ReturnType<typeof setInterval>;

  async validateApiKey(key: string) {
    if (!this.isBrowser()) return { valid: false, error: 'Apenas navegador.' };
    
    try {
      const ai = new GoogleGenAI({ apiKey: key });
      
      // Minimal test request
      await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: 'hi' }] }]
      });
      
      return { valid: true };
    } catch (e: unknown) {
      console.error('Validation error:', e);
      const error = e as { message?: string };
      return { 
        valid: false, 
        error: 'Chave de API inválida ou erro na conexão com o Gemini.',
        debug: error.message || e
      };
    }
  }

  async sendMessage(prompt: string) {
    if (!prompt.trim() || this.isLoading()) return;
    if (!this.isBrowser()) return;

    const apiKey = this.userApiKey();
    if (!apiKey) {
      this.chatHistory.update(history => [...history, { 
        role: 'model', 
        parts: 'Por favor, configure sua chave de API nas configurações.' 
      }]);
      return;
    }

    const trimmedPrompt = prompt.trim();
    this.isLoading.set(true);
    this.elapsedTime.set(0);
    this.workingStatus.set('Working');
    const startTime = performance.now();

    const statusUpdates = [
      'Analisando solicitação...',
      'Planejando resposta...',
      'Redigindo conteúdo...',
      'Refinando resposta...',
      'Finalizando...'
    ];
    let statusIndex = 0;

    this.timerInterval = setInterval(() => {
      const elapsed = parseFloat(((performance.now() - startTime) / 1000).toFixed(1));
      this.elapsedTime.set(elapsed);
      
      if (Math.floor(elapsed) % 3 === 0 && statusIndex < statusUpdates.length - 1) {
        statusIndex = Math.min(statusUpdates.length - 1, Math.floor(elapsed / 3));
        this.workingStatus.set(statusUpdates[statusIndex]);
      }
    }, 100);
    
    const userMessage: Message = { role: 'user', parts: trimmedPrompt };
    this.chatHistory.update(history => [...history, userMessage]);

    try {
      const ai = new GoogleGenAI({ apiKey });
      
      const chatHistory = this.chatHistory().slice(0, -1).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.parts }]
      }));

      const modelMessage: Message = { 
        role: 'model', 
        parts: '',
      };
      this.chatHistory.update(history => [...history, modelMessage]);

      const chat = ai.chats.create({
        model: this.getSelectedModel(),
        config: {
          systemInstruction: this.SYSTEM_INSTRUCTION,
          tools: this.isGoogleSearchEnabled() ? [{ googleSearch: {} }] : undefined,
          temperature: 1.0,
          topP: 0.95,
          topK: 64,
          maxOutputTokens: 8192,
        },
        history: chatHistory
      });

      const result = await chat.sendMessageStream({ message: trimmedPrompt });
      
      let accumulatedText = '';
      let chunksReceived = 0;
      
      for await (const chunk of result) {
        const chunkText = chunk.text || '';
        accumulatedText += chunkText;
        
        chunksReceived++;
        if (chunksReceived === 1) {
          this.workingStatus.set('Responding...');
          if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = undefined;
          }
        }

        this.chatHistory.update(history => {
          const lastIndex = history.length - 1;
          const updatedHistory = [...history];
          updatedHistory[lastIndex] = { 
            ...updatedHistory[lastIndex], 
            parts: accumulatedText,
            groundingMetadata: (chunk.candidates?.[0]?.groundingMetadata as unknown) as GroundingMetadata
          };
          return updatedHistory;
        });
      }

      const endTime = performance.now();
      const durationSeconds = parseFloat(((endTime - startTime) / 1000).toFixed(1));

      this.chatHistory.update(history => {
        const lastIndex = history.length - 1;
        const updatedHistory = [...history];
        updatedHistory[lastIndex] = { ...updatedHistory[lastIndex], responseTime: durationSeconds };
        return updatedHistory;
      });

      this.persistActiveChat();

    } catch (error: unknown) {
      console.error('Error sending message:', error);
      let displayMessage = 'Erro ao se comunicar com a IA. Verifique sua chave ou conexão.';
      
      const err = error as { message?: string };
      if (err?.message) {
        displayMessage = err.message;
      }

      this.chatHistory.update(history => {
        const lastMessage = history[history.length - 1];
        if (lastMessage && lastMessage.role === 'model' && !lastMessage.parts) {
          return [...history.slice(0, -1), { 
            role: 'model', 
            parts: displayMessage 
          }];
        }
        return [...history, { 
          role: 'model', 
          parts: displayMessage 
        }];
      });
    } finally {
      this.isLoading.set(false);
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = undefined;
      }
    }
  }

  private persistActiveChat() {
    const history = this.chatHistory();
    if (history.length === 0) return;

    const currentId = this.activeSessionId();
    const title = history[0].parts.substring(0, 30) + (history[0].parts.length > 30 ? '...' : '');

    if (currentId) {
      this.sessions.update(prev => prev.map(s => s.id === currentId ? { ...s, messages: history, title } : s));
    } else {
      const newId = crypto.randomUUID();
      const newSession: ChatSession = {
        id: newId,
        title,
        messages: history,
        createdAt: Date.now()
      };
      this.sessions.update(prev => [newSession, ...prev]);
      this.activeSessionId.set(newId);
    }
    this.saveSessionsToStorage();
  }
}
