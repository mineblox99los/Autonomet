import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { GeminiService } from './services/gemini';
import { Home } from './components/home';
import { ChatHistory } from './components/chat-history';
import { ChatInput } from './components/chat-input';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatIconModule, Home, ChatHistory, ChatInput],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  gemini = inject(GeminiService);

  sendMessage(prompt: string) {
    this.gemini.sendMessage(prompt);
  }
}
