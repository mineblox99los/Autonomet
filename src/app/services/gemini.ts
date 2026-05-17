/* eslint-disable @typescript-eslint/no-explicit-any */
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
  role: 'user' | 'model' | 'tool';
  parts: string;
  images?: { data: string, mimeType: string }[];
  thinking?: string;
  responseTime?: number;
  groundingMetadata?: GroundingMetadata;
  toolCalls?: any[];
  steps?: any[];
}

export interface ChatSession {
  id: string;
  interactionId?: string;
  title: string;
  messages: Message[];
  createdAt: number;
}

export interface Part {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
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
  responseSchema = signal<string>(this.isBrowser() ? localStorage.getItem('gemini_response_schema') || '' : '');
  thinkingLevel = signal<'minimal' | 'low' | 'medium' | 'high'>(this.isBrowser() ? (localStorage.getItem('gemini_thinking_level') as any) || 'low' : 'low');
  
  // New Skills Toggles
  enabledSkills = signal<{
    apiDev: boolean;
    liveApi: boolean;
    interactions: boolean;
    structuredOutput: boolean;
  }>(this.isBrowser() ? this.loadEnabledSkills() : { apiDev: false, liveApi: false, interactions: false, structuredOutput: false });

  private loadEnabledSkills() {
    const saved = localStorage.getItem('gemini_enabled_skills');
    return saved ? JSON.parse(saved) : { apiDev: false, liveApi: false, interactions: false, structuredOutput: false };
  }

  toggleSkill(skill: 'apiDev' | 'liveApi' | 'interactions' | 'structuredOutput') {
    this.enabledSkills.update(prev => {
      const next = { ...prev, [skill]: !prev[skill] };
      if (this.isBrowser()) {
        localStorage.setItem('gemini_enabled_skills', JSON.stringify(next));
      }
      return next;
    });
  }

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

  setResponseSchema(schema: string) {
    this.responseSchema.set(schema);
    if (this.isBrowser()) {
      localStorage.setItem('gemini_response_schema', schema);
    }
  }

  setThinkingLevel(level: 'minimal' | 'low' | 'medium' | 'high') {
    this.thinkingLevel.set(level);
    if (this.isBrowser()) {
      localStorage.setItem('gemini_thinking_level', level);
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
  private interactionId = signal<string | null>(null);

  chatSessions = computed(() => this.sessions().sort((a, b) => b.createdAt - a.createdAt));

  getActiveSessionId() {
    return this.activeSessionId();
  }

  createNewSession() {
    this.chatHistory.set([]);
    this.activeSessionId.set(null);
    this.interactionId.set(null);
  }

  loadSession(id: string) {
    const session = this.sessions().find(s => s.id === id);
    if (session) {
      this.chatHistory.set(session.messages);
      this.activeSessionId.set(session.id);
      this.interactionId.set(session.interactionId || null);
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
  viewingImage = signal<string | null>(null);
  private timerInterval?: ReturnType<typeof setInterval>;

  async validateApiKey(key: string) {
    if (!this.isBrowser()) return { valid: false, error: 'Apenas navegador.' };
    
    try {
      const response = await fetch('/api/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key })
      });
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const result = await response.json();
        return result;
      } else {
        const text = await response.text();
        return { 
          valid: false, 
          error: `Resposta inválida do servidor (${response.status})`,
          debug: text.substring(0, 100)
        };
      }
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
    let combinedInstruction = this.systemInstruction();
    
    // Add Skill-specific instructions if enabled
    const skills = this.enabledSkills();
    if (skills.apiDev) {
      combinedInstruction += `\n\n[SKILL: gemini-api-dev]\nVocê é um especialista em API do Gemini. Priorize o uso das versões mais recentes dos modelos (Gemini 1.5 Pro/Flash). Foque em padrões de prompts multimodais, chamadas de função e saídas estruturadas.`;
    }
    if (skills.liveApi) {
      combinedInstruction += `\n\n[SKILL: gemini-live-api-dev]\nVocê é um especialista em Gemini Live API. Forneça orientações sobre conexões WebSocket, streaming de baixa latência e detecção de atividade de voz (VAD).`;
    }
    if (skills.interactions) {
      combinedInstruction += `\n\n[SKILL: gemini-interactions-api]\nVocê é um especialista em Interactions API. Domine os conceitos de estados de conversação no servidor, execuções em segundo plano e agentes de Deep Research.`;
    }

    return {
      temperature: 0,
      topP: 0.95,
      systemInstruction: combinedInstruction.trim()
    };
  }

  async sendMessage(prompt: string, images?: { data: string, mimeType: string }[]) {
    if ((!prompt.trim() && (!images || images.length === 0)) || this.isLoading()) return;
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
    
    const userMessage: Message = { 
      role: 'user', 
      parts: trimmedPrompt,
      images: images 
    };
    this.chatHistory.update(history => [...history, userMessage]);

    try {
      const chatHistory = this.chatHistory().slice(0, -1).map(m => {
        const parts: Part[] = [{ text: m.parts }];
        if (m.images) {
          m.images.forEach(img => {
            parts.push({
              inlineData: {
                data: img.data.split(',')[1],
                mimeType: img.mimeType
              }
            });
          });
        }
        return {
          role: m.role === 'user' ? 'user' : 'model',
          parts: parts
        };
      });

      const modelMessage: Message = { 
        role: 'model', 
        parts: '',
      };
      this.chatHistory.update(history => [...history, modelMessage]);

      const isSearchEnabled = this.isGoogleSearchEnabled();
      
      // Prepare contents for current message
      const currentParts: Part[] = [{ text: trimmedPrompt }];
      if (images) {
        images.forEach(img => {
          currentParts.push({
            inlineData: {
              data: img.data.split(',')[1],
              mimeType: img.mimeType
            }
          });
        });
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.getSelectedModel(),
          contents: currentParts,
          config: {
            systemInstruction: smartConfig.systemInstruction,
            thinkingLevel: this.thinkingLevel(),
            tools: [
              ...(isSearchEnabled ? [{ googleSearch: {} }] : []),
              { codeExecution: {} },
              {
                functionDeclarations: [
                  {
                    name: 'get_weather',
                    description: 'Gets the current weather for a given location.',
                    parameters: {
                      type: 'object',
                      properties: {
                        location: { type: 'string', description: 'The city and state, e.g. San Francisco, CA' }
                      },
                      required: ['location']
                    }
                  },
                  {
                    name: 'schedule_meeting',
                    description: 'Schedules a meeting with specified attendees at a given time and date.',
                    parameters: {
                      type: 'object',
                      properties: {
                        attendees: { type: 'array', items: { type: 'string' } },
                        date: { type: 'string', description: 'Date (e.g., "2024-07-29")' },
                        time: { type: 'string', description: 'Time (e.g., "15:00")' },
                        topic: { type: 'string', description: 'The meeting topic.' }
                      },
                      required: ['attendees', 'date', 'time', 'topic']
                    }
                  }
                ]
              },
              // Demo MCP Server (Will show in request, but might be skipped by model if not gemini-2.5)
              {
                type: 'mcp_server',
                name: 'Deployment Tracker',
                url: 'https://mcp.example.com/mcp',
                headers: { Authorization: 'Bearer demo-token' }
              }
            ],
            // Required when combining multiple server-side tools
            toolConfig: isSearchEnabled ? { includeServerSideToolInvocations: true } : undefined,
            temperature: smartConfig.temperature,
            topP: smartConfig.topP,
            topK: 40,
            maxOutputTokens: 65536,
            responseFormat: this.enabledSkills().structuredOutput && this.responseSchema() ? {
              type: 'text',
              mime_type: 'application/json',
              schema: JSON.parse(this.responseSchema())
            } : undefined
          },
          history: this.interactionId() ? undefined : chatHistory,
          interactionId: this.interactionId(),
          customApiKey: this.userApiKey()
        })
      });

      if (!response.ok) {
        let errorMessage = 'Erro na comunicação com o servidor.';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            if (response.status === 401 || errorData.error === 'CONFIG_REQUIRED') {
              throw new Error('CONFIG_REQUIRED');
            }
            if (response.status === 429) {
              throw new Error('QUOTA_EXCEEDED');
            }
            errorMessage = errorData.error || errorMessage;
          } else {
            const text = await response.text();
            if (response.status === 413) {
              errorMessage = 'O arquivo ou mensagem é muito grande para ser processado (Limite de 100MB).';
            } else if (text.includes('<!DOCTYPE html>')) {
              errorMessage = `Erro do Servidor (${response.status}): Recebeu uma página HTML em vez de resposta JSON. O servidor pode estar reiniciando ou com erro interno.`;
            } else {
              errorMessage = `Erro ${response.status}: ${text.substring(0, 100)}`;
            }
          }
        } catch (e: any) {
          if (e.message === 'CONFIG_REQUIRED' || e.message === 'QUOTA_EXCEEDED') throw e;
          errorMessage = `Erro do servidor (${response.status})`;
        }
        throw new Error(errorMessage);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Não foi possível obter o stream de resposta.');

      const decoder = new TextDecoder();
      let accumulatedText = '';
      let currentThinking = '';
      let chunksReceived = 0;
      let buffer = '';
      const pendingFunctionCalls: any[] = [];
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          
          const data = line.substring(6).trim();
          if (data === '[DONE]') break;

          try {
            if (data === '[DONE]') break;
            const chunk = JSON.parse(data);
            
            // Handle Interaction API response format
            if (chunk.interaction_id) {
              this.interactionId.set(chunk.interaction_id);
            }
            if (chunk.event_type === 'interaction.created' && chunk.interaction?.id) {
              this.interactionId.set(chunk.interaction.id);
            }

            let groundingMetadata: GroundingMetadata | undefined;

            // 1. Handle step.delta (streaming text/thoughts)
            if (chunk.event_type === 'step.delta' && chunk.delta) {
              const delta = chunk.delta;
              if (delta.type === 'text' && delta.text) {
                accumulatedText += delta.text;
              } else if (delta.type === 'thought' || delta.type === 'thought_summary') {
                const thoughtText = delta.content?.text || delta.text || '';
                if (thoughtText) currentThinking += thoughtText;
              } else if (delta.content?.text) {
                accumulatedText += delta.content.text;
              } else if (delta.parts) {
                accumulatedText += delta.parts.map((p: any) => p.text || '').join('');
              }
            } 
            // 2. Handle step.start / step.stop
            else if (chunk.step) {
              const step = chunk.step;
              const stepActual = step.step || step;

              // Store all steps
              this.chatHistory.update(history => {
                const last = history[history.length - 1];
                const steps = last.steps || [];
                // Check if step already exists by ID
                if (!steps.find((s: any) => s.id === stepActual.id)) {
                  last.steps = [...steps, stepActual];
                }
                return [...history];
              });

              if (stepActual.type === 'function_call') {
                if (!pendingFunctionCalls.find(fc => fc.id === stepActual.id)) {
                  pendingFunctionCalls.push(stepActual);
                }
              }
              
              if ((stepActual.type === 'thought' || stepActual.step_type === 'thought')) {
                const summary = stepActual.summary || stepActual.thought;
                if (Array.isArray(summary)) {
                  currentThinking = summary.map((p: any) => p.text || '').join('');
                } else if (typeof summary === 'string') {
                  currentThinking = summary;
                } else if (summary && summary.text) {
                  currentThinking = summary.text;
                }
              } else if ((stepActual.type === 'model_output' || stepActual.step_type === 'model_output')) {
                const content = stepActual.content || stepActual.model_output?.parts || stepActual.parts || stepActual.model_output;
                if (Array.isArray(content)) {
                  const text = content.map((p: any) => p.text || '').join('');
                  if (text) accumulatedText = text;
                } else if (content && typeof content === 'object') {
                  const text = (content as any).parts?.map((p: any) => p.text || '').join('') || (content as any).text || '';
                  if (text) accumulatedText = text;
                }
                if (stepActual.model_output?.grounding_metadata) {
                  groundingMetadata = stepActual.model_output.grounding_metadata as GroundingMetadata;
                }
              }
            }
            // 3. Handle interaction.completed (final sync)
            else if (chunk.event_type === 'interaction.completed' && chunk.interaction?.steps) {
              const steps = chunk.interaction.steps;
              const modelOutputStep = steps.find((s: any) => s.type === 'model_output' || s.step_type === 'model_output' || s.model_output);
              const thoughtStep = steps.find((s: any) => s.type === 'thought' || s.step_type === 'thought' || s.thought);

              if (modelOutputStep) {
                const content = modelOutputStep.content || modelOutputStep.model_output?.parts || modelOutputStep.parts || modelOutputStep.model_output;
                if (Array.isArray(content)) {
                  const text = content.map((p: any) => p.text || '').join('');
                  if (text) accumulatedText = text;
                } else if (content && typeof content === 'object') {
                  const text = (content as any).parts?.map((p: any) => p.text || '').join('') || (content as any).text || '';
                  if (text) accumulatedText = text;
                }
                if (modelOutputStep.model_output?.grounding_metadata) {
                  groundingMetadata = modelOutputStep.model_output.grounding_metadata as GroundingMetadata;
                }
              }
              if (thoughtStep) {
                const summary = thoughtStep.summary || thoughtStep.thought || thoughtStep.content;
                if (Array.isArray(summary)) {
                  currentThinking = summary.map((p: any) => p.text || '').join('');
                } else if (typeof summary === 'string') {
                  currentThinking = summary;
                } else if (summary && summary.text) {
                  currentThinking = summary.text;
                }
              }
            } 
            // 4. Fallback for standard generateContent candidates
            else if (chunk.candidates?.[0]?.content?.parts) {
              const text = chunk.candidates[0].content.parts
                .map((p: { text?: string }) => p.text || '')
                .join('');
              if (text) accumulatedText += text;
              groundingMetadata = chunk.candidates[0].groundingMetadata as GroundingMetadata;
            } 
            // 5. Very generic fallback for anything that looks like text content
            else if (chunk.text && typeof chunk.text === 'string') {
               accumulatedText += chunk.text;
            } else if (chunk.parts && Array.isArray(chunk.parts)) {
               accumulatedText += chunk.parts.map((p: any) => p.text || '').join('');
            } else if (chunk.content?.parts && Array.isArray(chunk.content.parts)) {
               accumulatedText += chunk.content.parts.map((p: any) => p.text || '').join('');
            } else if (typeof chunk === 'string') {
               accumulatedText += chunk;
            }
            
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
                parts: accumulatedText || updatedHistory[lastIndex].parts,
                thinking: currentThinking || updatedHistory[lastIndex].thinking,
                groundingMetadata: groundingMetadata || updatedHistory[lastIndex].groundingMetadata
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

      // Handle function results and follow-up
      if (pendingFunctionCalls.length > 0) {
        await this.processFunctionCalls(pendingFunctionCalls);
      }

    } catch (error: unknown) {
      console.error('Error sending message:', error);
      let displayMessage = 'Erro ao se comunicar com a IA. Verifique sua chave ou conexão.';
      
      const err = error as { message?: string };
      if (err?.message === 'CONFIG_REQUIRED') {
        displayMessage = '### ⚠️ Configuração Necessária\n\nPara começar a usar o Superintelligence AI, você precisa configurar sua própria chave de API gratuita do Google.\n\n1. Obtenha uma chave no [Google AI Studio](https://aistudio.google.com/app/apikey).\n2. Clique no ícone de engrenagem nas configurações e cole sua chave.';
      } else if (err?.message === 'QUOTA_EXCEEDED') {
        displayMessage = '### ⚠️ Limite de Uso Atingido\n\nSua chave de API atingiu o limite de uso gratuito. Para continuar, aguarde alguns minutos para que o Google libere o uso novamente.';
      } else if (err?.message) {
        // Handle stringified JSON error messages that often come from GenAI
        try {
          const parsedError = JSON.parse(err.message);
          if (parsedError.error?.message?.includes('429') || parsedError.status === 429) {
            displayMessage = '### ⚠️ Limite de Uso Atingido\n\nVocê atingiu o limite de uso gratuito da nossa chave padrão (Quota Exceeded). Para continuar, você pode:\n\n1. **Aguardar alguns minutos** para que o limite seja liberado.\n2. **Configurar sua própria chave** de API gratuita do Google nas configurações.';
          } else {
            displayMessage = parsedError.error?.message || err.message;
          }
        } catch {
          displayMessage = err.message;
        }
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

  private async processFunctionCalls(fcs: any[]) {
    this.workingStatus.set('Executing tools...');
    
    const results = await Promise.all(fcs.map(async fc => {
      let resultData: any;
      
      // Mock execution based on name
      if (fc.name === 'get_weather') {
        const temp = 18 + Math.floor(Math.random() * 10);
        resultData = { 
          temperature: temp, 
          condition: ['Sunny', 'Cloudy', 'Rainy'][Math.floor(Math.random() * 3)],
          location: fc.arguments.location,
          unit: 'celsius',
          advice: temp > 22 ? 'Aproveite o sol!' : 'Pode precisar de um casaco leve.'
        };
      } else if (fc.name === 'schedule_meeting') {
        resultData = { 
          status: 'confirmed', 
          meeting_id: 'MTG-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
          time: fc.arguments.time,
          date: fc.arguments.date,
          link: 'https://meet.google.com/abc-defg-hij'
        };
      } else {
        resultData = { error: 'Service temporarily unavailable', tool: fc.name };
      }

      return {
        type: 'function_result',
        name: fc.name,
        call_id: fc.id,
        result: [{ type: 'text', text: JSON.stringify(resultData) }]
      };
    }));

    // Send results back to model
    this.chatHistory.update(history => [
      ...history,
      { role: 'tool', parts: 'Tool results sent' } as Message
    ]);

    // Automatic turn continuation
    await this.sendToolResults(results);
  }

  private async sendToolResults(results: any[]) {
    this.isLoading.set(true);
    try {
      const smartConfig = this.getOptimalConfig();
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.getSelectedModel(),
          contents: results, // Input is function_result steps
          config: {
            systemInstruction: smartConfig.systemInstruction,
            thinkingLevel: this.thinkingLevel(),
            tools: [
              ...(this.isGoogleSearchEnabled() ? [{ googleSearch: {} }] : []),
              { codeExecution: {} }
            ],
            temperature: smartConfig.temperature,
            topP: smartConfig.topP,
          },
          interactionId: this.interactionId(),
          customApiKey: this.userApiKey()
        })
      });

      if (!response.ok) throw new Error('Falha ao enviar resultados das ferramentas.');

      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let accumulatedText = '';
      let buffer = '';
      
      const modelMessage: Message = { role: 'model', parts: '' };
      this.chatHistory.update(history => [...history, modelMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.substring(6).trim();
          if (data === '[DONE]') break;
          try {
            const chunk = JSON.parse(data);
            if (chunk.event_type === 'step.delta' && chunk.delta?.text) {
              accumulatedText += chunk.delta.text;
            } else if (chunk.candidates?.[0]?.content?.parts?.[0]?.text) {
              accumulatedText += chunk.candidates[0].content.parts[0].text;
            } else if (chunk.interaction?.steps) {
              // Finish turn handling
              const lastStep = chunk.interaction.steps[chunk.interaction.steps.length - 1];
              if (lastStep.type === 'model_output') {
                accumulatedText = lastStep.content?.[0]?.text || lastStep.model_output?.parts?.[0]?.text || '';
              }
            }

            this.chatHistory.update(history => {
              const updated = [...history];
              updated[updated.length - 1] = { ...updated[updated.length - 1], parts: accumulatedText };
              return updated;
            });
          } catch {
            // Ignore incomplete chunks
          }
        }
      }
      this.persistActiveChat();
    } catch (e) {
      console.error('Error sending tool results:', e);
    } finally {
      this.isLoading.set(false);
    }
  }

  private persistActiveChat() {
    const history = this.chatHistory();
    if (history.length === 0) return;

    const currentId = this.activeSessionId();
    const title = history[0].parts.substring(0, 30) + (history[0].parts.length > 30 ? '...' : '');

    if (currentId) {
      this.sessions.update(prev => prev.map(s => s.id === currentId ? { ...s, messages: history, title, interactionId: this.interactionId() || undefined } : s));
    } else {
      const newId = crypto.randomUUID();
      const newSession: ChatSession = {
        id: newId,
        interactionId: this.interactionId() || undefined,
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
