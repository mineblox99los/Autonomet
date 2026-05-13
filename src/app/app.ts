import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { GeminiService } from './services/gemini';
import { Home } from './components/home';
import { ChatHistory } from './components/chat-history';
import { ChatInput } from './components/chat-input';
import { ApiKeyModal } from './components/api-key-modal';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, Home, ChatHistory, ChatInput, ApiKeyModal],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  gemini = inject(GeminiService);
  isApiKeyModalOpen = signal(false);

  sendMessage(prompt: string) {
    this.gemini.sendMessage(prompt);
  }

  saveApiKey(key: string) {
    this.gemini.setApiKey(key);
    this.isApiKeyModalOpen.set(false);
  }

  clearApiKey() {
    localStorage.removeItem('user_gemini_api_key');
    window.location.reload(); // Hard reset for simplicity
  }
}
