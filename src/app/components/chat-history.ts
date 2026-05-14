import { Component, ChangeDetectionStrategy, input, viewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ChatMessage } from './chat-message';
import { Message } from '../services/gemini';
import { PromotionCard } from './promotion-card';

@Component({
  selector: 'app-chat-history',
  standalone: true,
  imports: [CommonModule, MatIconModule, ChatMessage, PromotionCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-full overflow-y-auto pt-8 pb-64 px-2 scrollbar-thin overflow-x-hidden" #chatContainer>
      <div class="flex flex-col gap-8">
        @for (message of history(); track $index) {
          <app-chat-message [message]="message"></app-chat-message>
          
          <!-- Intelligent Ad Injection -->
          @if ($index > 0 && ($index + 1) % 4 === 0) {
            <div class="max-w-[400px] mx-auto w-full">
              <app-promotion-card 
                title="Cloud Dashboard" 
                description="Gerencie sua infraestrutura com alto desempenho e segurança."
                icon="cloud"
                buttonText="Ver Projetos"
                adId="cloud-ad-001"
              ></app-promotion-card>
            </div>
          }
        }
        
        @if (isLoading()) {
          <div class="flex flex-col gap-3 mb-12 animate-in fade-in duration-500">
            <div class="flex items-center gap-2 text-[12px] text-zinc-500 font-medium ml-1">
              <span>Superintelligence AI</span>
              <span class="w-1 h-1 rounded-full bg-zinc-700"></span>
              <span>Running for {{ elapsedTime() }}s</span>
            </div>
            
            <div class="flex items-center gap-3 ml-1">
              <div class="relative flex items-center justify-center">
                <!-- Outer colored ring with animation -->
                <div class="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 border-r-emerald-500 border-b-amber-500 border-l-rose-500 animate-spin duration-[3s]"></div>
                <!-- Inner black circle -->
                <div class="w-7 h-7 rounded-full bg-gemini-bg flex items-center justify-center z-10 m-[2px]">
                  <mat-icon class="scale-75 text-zinc-100">auto_awesome</mat-icon>
                </div>
              </div>
              <span class="text-[14px] font-medium text-zinc-200 tracking-wide">{{ status() }}</span>
            </div>

            <!-- Placeholder for preparing content -->
            <div class="ml-10 flex flex-col gap-2">
              <div class="h-2 w-48 bg-zinc-800/40 rounded-full animate-pulse"></div>
              <div class="h-2 w-32 bg-zinc-800/40 rounded-full animate-pulse delay-75"></div>
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
  status = input<string>('Working');
  
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
