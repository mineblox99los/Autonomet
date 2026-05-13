import { Injectable, signal } from '@angular/core';
import { GoogleGenAI } from '@google/genai';

export interface Message {
  role: 'user' | 'model';
  parts: string;
  responseTime?: number;
}

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private userApiKey = signal<string | null>(localStorage.getItem('user_gemini_api_key'));
  
  private ai = new GoogleGenAI({ 
    apiKey: this.userApiKey() || GEMINI_API_KEY 
  });
  
  private chatSubject = this.ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: "Você é o Gemini, um assistente de IA prestativo. Responda de forma concisa e eficaz usando Markdown.",
    }
  });

  setApiKey(key: string) {
    localStorage.setItem('user_gemini_api_key', key);
    this.userApiKey.set(key);
    // Re-initialize with new key
    this.ai = new GoogleGenAI({ apiKey: key });
    this.chatSubject = this.ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: "Você é o Gemini, um assistente de IA prestativo. Responda de forma concisa e eficaz usando Markdown.",
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
  private timerInterval?: ReturnType<typeof setInterval>;

  async sendMessage(prompt: string) {
    if (!prompt.trim() || this.isLoading()) return;

    const trimmedPrompt = prompt.trim();
    this.isLoading.set(true);
    this.elapsedTime.set(0);
    const startTime = performance.now();

    this.timerInterval = setInterval(() => {
      this.elapsedTime.set(parseFloat(((performance.now() - startTime) / 1000).toFixed(1)));
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
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = { 
        role: 'model', 
        parts: 'Erro ao se comunicar com o Gemini. Por favor, verifique sua chave de API.' 
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
}
