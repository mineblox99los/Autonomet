import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MarkdownPipe } from '../markdown.pipe';
import { Message } from '../services/gemini';

@Component({
  selector: 'app-chat-message',
  standalone: true,
  imports: [CommonModule, MatIconModule, MarkdownPipe],
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
          <div class="flex items-center gap-2 text-[10px] sm:text-[11px] text-zinc-500 mb-1">
            <span>Gemini 3 Flash Preview</span>
            <span class="w-1 h-1 rounded-full bg-zinc-600"></span>
            <span>{{ message().responseTime ? 'Gerada em ' + message().responseTime + 's' : 'Resposta instantânea' }}</span>
          </div>
          
          <div class="flex gap-4 items-start w-full min-w-0">
            <div class="flex-1 bg-gemini-surface border border-gemini-border rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 overflow-hidden min-w-0">
              <div class="prose prose-invert prose-sm max-w-none leading-relaxed text-[14px] sm:text-[15px] markdown-content overflow-x-auto" 
                   [innerHTML]="message().parts | markdown">
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
}
