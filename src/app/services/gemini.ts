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
  systemInstruction = signal<string>(this.isBrowser() ? localStorage.getItem('user_system_instruction') || '' : '');
  
  toggleGoogleSearch() {
    const newValue = !this.isGoogleSearchEnabled();
    this.isGoogleSearchEnabled.set(newValue);
    if (this.isBrowser()) {
      localStorage.setItem('google_search_enabled', String(newValue));
    }
  }

  setSystemInstruction(instruction: string) {
    this.systemInstruction.set(instruction);
    if (this.isBrowser()) {
      localStorage.setItem('user_system_instruction', instruction);
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

  private readonly SYSTEM_INSTRUCTION = ``;

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
      const response = await fetch('/api/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key })
      });
      
      const result = await response.json();
      return result;
    } catch (e: unknown) {
      console.error('Validation error:', e);
      const error = e as { message?: string };
      return { 
        valid: false, 
        error: 'Erro na conexão com o servidor.',
        debug: error.message || e
      };
    }
  }

  private getOptimalConfig() {
    return {
      temperature: 0,
      topP: 0.95,
      systemInstruction: this.systemInstruction()
    };
  }

  async sendMessage(prompt: string) {
    if (!prompt.trim() || this.isLoading()) return;
    if (!this.isBrowser()) return;

    const trimmedPrompt = prompt.trim();
    this.isLoading.set(true);
    this.elapsedTime.set(0);
    this.workingStatus.set('Working');
    const startTime = performance.now();

    // Obter configuração otimizada baseada no prompt
    const smartConfig = this.getOptimalConfig();

    const statusUpdates = [
      'Analisando intenção e calibrando IA...',
      'Meta-sintonizando parâmetros...',
      'Planejando resposta...',
      'Redigindo conteúdo...',
      'Refinando resposta...'
    ];
    let statusIndex = 0;

    this.timerInterval = setInterval(() => {
      const elapsed = parseFloat(((performance.now() - startTime) / 1000).toFixed(1));
      this.elapsedTime.set(elapsed);
      
      if (Math.floor(elapsed) % 2 === 0 && statusIndex < statusUpdates.length - 1) {
        statusIndex = Math.min(statusUpdates.length - 1, Math.floor(elapsed / 2));
        this.workingStatus.set(statusUpdates[statusIndex]);
      }
    }, 100);
    
    const userMessage: Message = { role: 'user', parts: trimmedPrompt };
    this.chatHistory.update(history => [...history, userMessage]);

    try {
      const chatHistory = this.chatHistory().slice(0, -1).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.parts }]
      }));

      const modelMessage: Message = { 
        role: 'model', 
        parts: '',
      };
      this.chatHistory.update(history => [...history, modelMessage]);

      const isSearchEnabled = this.isGoogleSearchEnabled();
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.getSelectedModel(),
          contents: trimmedPrompt,
          config: {
            systemInstruction: smartConfig.systemInstruction,
            tools: [
              ...(isSearchEnabled ? [{ googleSearch: {} }] : []),
              { codeExecution: {} }
            ],
            // Required when combining multiple server-side tools
            toolConfig: isSearchEnabled ? { includeServerSideToolInvocations: true } : undefined,
            temperature: smartConfig.temperature,
            topP: smartConfig.topP,
            topK: 40,
            maxOutputTokens: 65536,
          },
          history: chatHistory,
          customApiKey: this.userApiKey()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro na comunicação com o servidor.');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Não foi possível obter o stream de resposta.');

      const decoder = new TextDecoder();
      let accumulatedText = '';
      let chunksReceived = 0;
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkLines = decoder.decode(value).split('\n');
        for (const line of chunkLines) {
          if (!line.startsWith('data: ')) continue;
          
          const data = line.substring(6).trim();
          if (data === '[DONE]') break;

          try {
            const chunk = JSON.parse(data);
            
            // Extract text from Google GenAI response format
            let chunkText = '';
            if (chunk.candidates?.[0]?.content?.parts) {
              chunkText = chunk.candidates[0].content.parts
                .map((p: { text?: string }) => p.text || '')
                .join('');
            }
            
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
                groundingMetadata: (chunk.candidates?.[0]?.groundingMetadata) as GroundingMetadata
              };
              return updatedHistory;
            });
          } catch {
            // Ignore incomplete JSON chunks
          }
        }
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
