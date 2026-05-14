import { Component, ChangeDetectionStrategy, input, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { MarkdownPipe } from '../markdown.pipe';
import { Message } from '../services/gemini';
import { ActionHistory } from './action-history';

@Component({
  selector: 'app-chat-message',
  standalone: true,
  imports: [CommonModule, MatIconModule, MarkdownPipe, ActionHistory],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-2 w-full max-w-full group">
      @if (message().role === 'user') {
        <div class="flex justify-end">
          <div class="max-w-[90%] sm:max-w-[85%] px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-gemini-surface border border-gemini-border text-white shadow-sm">
            <div class="prose prose-invert prose-sm max-w-none leading-relaxed text-[14px] sm:text-[15px]" 
                 [innerHTML]="message().parts | markdown">
            </div>
          </div>
        </div>
      } @else {
        <div class="flex flex-col gap-1 w-full">
          <!-- Meta Header -->
          <div class="flex items-center gap-2 text-[11px] font-medium text-zinc-500 mb-2 ml-1">
            <span>Superintelligence AI</span>
            <span class="w-1 h-1 rounded-full bg-zinc-700"></span>
            <span>{{ message().responseTime ? 'Ran for ' + message().responseTime + 's' : 'Instant response' }}</span>
          </div>
          
          <div class="flex gap-4 items-start w-full min-w-0">
            <div class="flex-1 bg-[#1f1f1f] border border-zinc-800 rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 overflow-hidden min-w-0">
              
              <!-- Action History (if any) -->
              <app-action-history [messageText]="message().parts" [sanitizer]="sanitizer"></app-action-history>

              <div class="prose prose-invert prose-sm max-w-none leading-relaxed text-[14px] sm:text-[15px] markdown-content overflow-x-auto" 
                   [innerHTML]="cleanParts() | markdown">
              </div>
              
              <!-- Footer Actions -->
              <div class="flex items-center gap-3 sm:gap-4 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div class="flex items-center gap-1 text-[10px] sm:text-[11px] text-zinc-500 cursor-pointer hover:text-white transition-colors">
                  <mat-icon class="scale-75">flag</mat-icon>
                  <span class="hidden sm:inline">Checkpoint</span>
                </div>
                <div class="flex-1"></div>
                <button class="text-zinc-500 hover:text-white transition-colors">
                  <mat-icon class="scale-75">content_copy</mat-icon>
                </button>
                <button class="text-zinc-500 hover:text-white transition-colors">
                  <mat-icon class="scale-75">share</mat-icon>
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class ChatMessage {
  message = input.required<Message>();
  sanitizer = inject(DomSanitizer);

  cleanParts = computed(() => {
    return this.message().parts.replace(/<action_history>[\s\S]*?<\/action_history>/g, '').trim();
  });
}
