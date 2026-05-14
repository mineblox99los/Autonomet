import { Injectable, signal, computed } from '@angular/core';
import { GoogleGenAI } from '@google/genai';

export interface Message {
  role: 'user' | 'model';
  parts: string;
  responseTime?: number;
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
  private userApiKey = signal<string | null>(localStorage.getItem('user_gemini_api_key'));
  
  private ai = new GoogleGenAI({ 
    apiKey: this.userApiKey() || GEMINI_API_KEY 
  });
  
  private readonly SYSTEM_INSTRUCTION = `Você é a Superintelligence, uma assistente de IA prestativa. Responda de forma concisa e eficaz usando Markdown.
  
Se você for solicitado a criar, modificar ou mostrar código de arquivos, você DEVE usar uma estrutura especial chamada "Action History".
Isso ajuda o usuário a ver as mudanças de forma organizada.

Para usar o Action History, envolva a lista de arquivos entre as tags <action_history> e cada arquivo entre as tags <file path="caminho/do/arquivo.ts">.

Exemplo de uso:
"Claro, aqui estão as mudanças para o seu app:

<action_history>
<file path="src/app/main.ts">
import { bootstrap } from '@angular/core';
// ... código ...
</file>
<file path="src/styles.css">
body { background: #000; }
</file>
</action_history>

Espero que isso ajude!"

Não adicione blocos de código markdown (\` \` \`) dentro da tag <file>, apenas o conteúdo puro do arquivo.`;

  private chatSubject = this.ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: this.SYSTEM_INSTRUCTION,
    }
  });

  private sessions = signal<ChatSession[]>(this.loadSessionsFromStorage());
  private activeSessionId = signal<string | null>(null);

  constructor() {
    // If sessions exist but none is active, we could technically load the last one.
    // But we'll keep the current behavior of starting fresh if history signal is empty.
  }

  private loadSessionsFromStorage(): ChatSession[] {
    const saved = localStorage.getItem('gemini_chat_sessions');
    return saved ? JSON.parse(saved) : [];
  }

  private saveSessionsToStorage() {
    localStorage.setItem('gemini_chat_sessions', JSON.stringify(this.sessions()));
  }

  chatSessions = computed(() => this.sessions().sort((a, b) => b.createdAt - a.createdAt));

  getActiveSessionId() {
    return this.activeSessionId();
  }

  createNewSession() {
    this.chatHistory.set([]);
    this.activeSessionId.set(null);
    // Reset subject
    this.chatSubject = this.ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: this.SYSTEM_INSTRUCTION,
      }
    });
  }

  loadSession(id: string) {
    const session = this.sessions().find(s => s.id === id);
    if (session) {
      this.chatHistory.set(session.messages);
      this.activeSessionId.set(session.id);
      
      // Re-initialize subject with history
      this.chatSubject = this.ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: this.SYSTEM_INSTRUCTION,
        },
        history: session.messages.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.parts }]
        }))
      });
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
    localStorage.setItem('user_gemini_api_key', key);
    this.userApiKey.set(key);
    // Re-initialize with new key
    this.ai = new GoogleGenAI({ apiKey: key });
    this.chatSubject = this.ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: this.SYSTEM_INSTRUCTION,
      }
    });
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

  async sendMessage(prompt: string) {
    if (!prompt.trim() || this.isLoading()) return;

    const trimmedPrompt = prompt.trim();
    this.isLoading.set(true);
    this.elapsedTime.set(0);
    this.workingStatus.set('Working');
    const startTime = performance.now();

    const statusUpdates = [
      'Analyzing request...',
      'Planning response...',
      'Drafting content...',
      'Refining answer...',
      'Finalizing...'
    ];
    let statusIndex = 0;

    this.timerInterval = setInterval(() => {
      const elapsed = parseFloat(((performance.now() - startTime) / 1000).toFixed(1));
      this.elapsedTime.set(elapsed);
      
      // Update status every 3 seconds
      if (Math.floor(elapsed) % 3 === 0 && statusIndex < statusUpdates.length - 1) {
        statusIndex = Math.min(statusUpdates.length - 1, Math.floor(elapsed / 3));
        this.workingStatus.set(statusUpdates[statusIndex]);
      }
    }, 100);
    
    const userMessage: Message = { role: 'user', parts: trimmedPrompt };
    this.chatHistory.update(history => [...history, userMessage]);

    try {
      const response = await this.chatSubject.sendMessage({ message: trimmedPrompt });
      const endTime = performance.now();
      const durationSeconds = parseFloat(((endTime - startTime) / 1000).toFixed(1));

      const modelMessage: Message = { 
        role: 'model', 
        parts: response.text || 'Sem resposta',
        responseTime: durationSeconds
      };
      this.chatHistory.update(history => [...history, modelMessage]);

      // Handle session persistence
      this.persistActiveChat();

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = { 
        role: 'model', 
        parts: 'Erro ao se comunicar com a IA. Por favor, verifique sua chave de API.' 
      };
      this.chatHistory.update(history => [...history, errorMessage]);
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
