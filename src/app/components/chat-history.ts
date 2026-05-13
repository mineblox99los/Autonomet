import { Component, ChangeDetectionStrategy, input, viewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ChatMessage } from './chat-message';
import { Message } from '../services/gemini';

@Component({
  selector: 'app-chat-history',
  standalone: true,
  imports: [CommonModule, MatIconModule, ChatMessage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-full overflow-y-auto pt-8 pb-64 px-2 scrollbar-thin overflow-x-hidden" #chatContainer>
      <div class="flex flex-col gap-8">
        @for (message of history(); track $index) {
          <app-chat-message [message]="message"></app-chat-message>
        }
        
        @if (isLoading()) {
          <div class="flex flex-col gap-2 mb-8">
            <div class="flex items-center gap-2 text-[11px] text-zinc-600 mb-1">
              <span>Gemini 3 Flash Preview</span>
              <span class="w-1 h-1 rounded-full bg-zinc-600"></span>
              <span>Gerando... {{ elapsedTime() }}s</span>
            </div>
            <div class="flex gap-4 items-center">
              <div class="h-10 w-48 bg-zinc-800/50 rounded-2xl animate-pulse"></div>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class ChatHistory {
  history = input.required<Message[]>();
  isLoading = input.required<boolean>();
  elapsedTime = input<number>(0);
  
  chatContainer = viewChild<ElementRef<HTMLDivElement>>('chatContainer');

  constructor() {
    effect(() => {
      if (this.history().length > 0) {
        setTimeout(() => this.scrollToBottom(), 100);
      }
    });
  }

  private scrollToBottom() {
    const container = this.chatContainer()?.nativeElement;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }
}
