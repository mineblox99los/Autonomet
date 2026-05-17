import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';

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
    try {
      const response = await fetch('/api/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: key })
      });
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          return { valid: false, error: `Erro no servidor: ${response.status} ${response.statusText}`, debug: null };
        }
        return { valid: false, error: errorData.error || 'Erro interno do servidor', debug: errorData.debug || errorData };
      }
      
      return await response.json() as { valid: boolean; error?: string; debug?: unknown };
    } catch (e: unknown) {
      console.error('Fetch error during key validation:', e);
      const error = e as Error;
      return { valid: false, error: `Erro de conexão: ${error.message || 'Verifique sua internet ou se o servidor está ativo.'}`, debug: e };
    }
  }

  async sendMessage(prompt: string) {
    if (!prompt.trim() || this.isLoading()) return;

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
      const history = this.chatHistory().slice(0, -1).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.parts }]
      }));

      const modelMessage: Message = { 
        role: 'model', 
        parts: '',
      };
      this.chatHistory.update(history => [...history, modelMessage]);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmedPrompt,
          history,
          apiKey: this.userApiKey(),
          systemInstruction: this.SYSTEM_INSTRUCTION,
          googleSearchEnabled: this.isGoogleSearchEnabled()
        })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) throw new Error('No reader found');
      
      let accumulatedText = '';
      let chunksReceived = 0;
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        const chunkStr = decoder.decode(value, { stream: true });
        buffer += chunkStr;

        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the last incomplete line in the buffer

        for (const line of lines) {
          if (!line.trim()) continue;
          
          try {
            const data = JSON.parse(line);
            if (data.text) accumulatedText += data.text;
            
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
                groundingMetadata: data.groundingMetadata || updatedHistory[lastIndex].groundingMetadata
              };
              return updatedHistory;
            });
          } catch (e) {
            console.error('Error parsing NDJSON line:', e, line);
          }
        }

        if (done) break;
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

    } catch (error) {
      console.error('Error sending message:', error);
      let displayMessage = 'Erro ao se comunicar com a IA. Por favor, verifique sua conexão.';
      
      if (error instanceof Error) {
        try {
          const parsedError = JSON.parse(error.message);
          displayMessage = parsedError.error || displayMessage;
        } catch {
          displayMessage = error.message || displayMessage;
        }
      }

      this.chatHistory.update(history => {
        // Remove the empty model message added before if it exists
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
