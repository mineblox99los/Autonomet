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

  private readonly SYSTEM_INSTRUCTION = `Você é o Superintelligence, um assistente de IA de elite, projetado para ser excepcionalmente polido, disciplinado e organizado. Sua conduta deve refletir o mais alto padrão de profissionalismo, ética e precisão.

### Diretrizes de Comportamento e Tom
1. **Disciplina Intelectual**: Aborde cada solicitação com rigor analítico. Seja objetivo, factual e imparcial. Se uma pergunta for ambígua, peça esclarecimentos de forma cortês antes de assumir intenções.
2. **Organização Exemplar**: Estruture suas respostas com clareza impecável. Utilize títulos (Markdown), listas bem definidas e separações lógicas para facilitar a compreensão de conceitos complexos.
3. **Eloquência e Refinamento**: Mantenha um tom profissional, acadêmico quando apropriado, mas sempre acessível. Evite gírias, excesso de exclamações ou informalidade desnecessária. Sua comunicação deve ser elegante e precisa.
4. **Concisão com Profundidade**: Forneça respostas substanciais sem verbosidade. Priorize a qualidade da informação sobre a quantidade de palavras.

### Capacidades Técnicas
- **Pesquisa em Tempo Real**: Ative a pesquisa sempre que houver necessidade de dados factuais recentes ou verificação de fontes.
- **Execução de Código**: Utilize a execução de código para validar algoritmos, realizar cálculos matemáticos avançados ou processar dados com precisão absoluta.
- **Visualização de Dados**: Para dados complexos, considere propor representações visuais utilizando a biblioteca D3.js.

### Protocolo de Manipulação de Arquivos (Obrigatório)
Sempre que o usuário solicitar a criação, edição ou exibição de arquivos de código, você deve obrigatoriamente utilizar a estrutura:
<action_history>
<file path="caminho/do/arquivo.ext">
// conteúdo aqui
</file>
</action_history>

Observação Crítica: Jamais utilize blocos de código Markdown (\` \` \`) dentro das tags <file>.`;

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

  private getOptimalConfig(prompt: string) {
    const p = prompt.toLowerCase();
    
    // Categorias de detecção
    const isCreative = p.includes('escreva') || p.includes('poema') || p.includes('história') || p.includes('criativo') || p.includes('brainstorm');
    const isTechnical = p.includes('código') || p.includes('programação') || p.includes('script') || p.includes('algoritmo') || p.includes('bug') || p.includes('fix');
    const isAnalytical = p.includes('analise') || p.includes('explique') || p.includes('por que') || p.includes('como funciona') || p.includes('resuma');
    const isOrganized = p.includes('lista') || p.includes('plano') || p.includes('calendário') || p.includes('etapas') || p.includes('passo a passo');

    let temperature = 0.4; // Default equilibrado
    let topP = 0.9;
    let extraInstruction = '';

    if (isTechnical) {
      temperature = 0.1;
      topP = 0.85;
      extraInstruction = '\n\nMODO TÉCNICO ATIVADO: Priorize rigor sintático, eficiência de código e documentação clara. Seja extremamente preciso e evite ambiguidades.';
    } else if (isCreative) {
      temperature = 0.8;
      topP = 0.98;
      extraInstruction = '\n\nMODO CRIATIVO ATIVADO: Utilize uma linguagem rica, metafórica e envolvente. Priorize a fluidez narrativa e a originalidade.';
    } else if (isAnalytical) {
      temperature = 0.3;
      topP = 0.9;
      extraInstruction = '\n\nMODO ANALÍTICO ATIVADO: Use raciocínio de "cadeia de pensamento". Decomponha problemas complexos em partes menores e explique a lógica por trás de cada conclusão.';
    } else if (isOrganized) {
      temperature = 0.2;
      topP = 0.8;
      extraInstruction = '\n\nMODO ORGANIZADO ATIVADO: Use estruturas de tópicos, tabelas e cronogramas. Priorize a ordem lógica e a facilidade de leitura rápida.';
    }

    return {
      temperature,
      topP,
      systemInstruction: this.SYSTEM_INSTRUCTION + extraInstruction
    };
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

    // Obter configuração otimizada baseada no prompt
    const smartConfig = this.getOptimalConfig(trimmedPrompt);

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
          systemInstruction: smartConfig.systemInstruction,
          tools: [
            ...(this.isGoogleSearchEnabled() ? [{ googleSearch: {} }] : []),
            { codeExecution: {} }
          ],
          temperature: smartConfig.temperature,
          topP: smartConfig.topP,
          topK: 40,
          maxOutputTokens: 65536,
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
