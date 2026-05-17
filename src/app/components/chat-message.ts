import { Component, ChangeDetectionStrategy, input, inject, computed, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MarkdownPipe } from '../markdown.pipe';
import { Message, GeminiService } from '../services/gemini';
import { ToolTray } from './tool-tray';

@Component({
  selector: 'app-chat-message',
  standalone: true,
  imports: [CommonModule, MatIconModule, MarkdownPipe, ToolTray],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-2 w-full max-w-full group">
      @if (message().role === 'user') {
        <div class="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-gemini-surface/50 text-white border border-gemini-border/50">
          @if (message().images && message().images!.length > 0) {
            <div class="flex flex-wrap gap-2 mb-3">
              @for (img of message().images; track $index) {
                <img 
                  [src]="img.data" 
                  alt="Imagem enviada" 
                  class="max-w-[200px] max-h-[200px] rounded-xl border border-gemini-border shadow-sm cursor-zoom-in hover:opacity-90 transition-opacity"
                  role="button"
                  tabindex="0"
                  (click)="gemini.viewingImage.set(img.data)"
                  (keydown.enter)="gemini.viewingImage.set(img.data)"
                  (keydown.space)="gemini.viewingImage.set(img.data)"
                >
              }
            </div>
          }
          <div class="prose prose-invert prose-sm max-w-none leading-relaxed text-[14px] sm:text-[15px]" 
               [innerHTML]="message().parts | markdown">
          </div>
        </div>
      } @else if (message().role === 'tool') {
        <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/5 border border-indigo-500/10 self-center text-[11px] text-indigo-400 font-medium">
          <mat-icon class="!text-[14px]">auto_awesome</mat-icon>
          Sincronizando resultados das ferramentas...
        </div>
      } @else {
        <div class="flex flex-col gap-1 w-full">
          <!-- Meta Header -->
          <div class="flex items-center gap-2 text-[11px] font-medium text-zinc-500 mb-2 ml-1">
            <span>Gemini 3 Flash</span>
            <span class="w-1 h-1 rounded-full bg-zinc-700"></span>
            <span>{{ message().responseTime ? 'Ran for ' + message().responseTime + 's' : 'Instant response' }}</span>
          </div>

          <!-- Thinking Process (Reasoning) -->
          @if (message().thinking) {
            <div class="mb-3 ml-1 animate-in fade-in slide-in-from-left-2 duration-500">
              <button 
                (click)="isThinkingExpanded.set(!isThinkingExpanded())"
                class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/10 text-blue-400 transition-all group"
              >
                <mat-icon class="!text-[16px] animate-pulse">psychology</mat-icon>
                <span class="text-[11px] font-semibold uppercase tracking-wider">Expandir Raciocínio</span>
                <mat-icon class="!text-[16px] transition-transform duration-300" [class.rotate-180]="isThinkingExpanded()">keyboard_arrow_down</mat-icon>
              </button>
              
              @if (isThinkingExpanded()) {
                <div class="mt-2 p-4 rounded-2xl bg-zinc-900/50 border border-white/5 text-zinc-400 text-xs leading-relaxed font-mono whitespace-pre-wrap animate-in fade-in slide-in-from-top-1 duration-300 max-h-[300px] overflow-y-auto">
                  {{ message().thinking }}
                </div>
              }
            </div>
          }
          
          <div class="flex flex-col gap-1.5 w-full min-w-0">
            <app-tool-tray [steps]="message().steps || []"></app-tool-tray>

            <div class="flex-1 bg-gemini-surface border border-gemini-border rounded-2xl px-3 sm:px-4 pt-2.5 sm:pt-3 pb-2 sm:pb-2.5 overflow-hidden min-w-0">
              
              <div class="prose prose-invert prose-sm max-w-none leading-relaxed text-[14px] sm:text-[15px] markdown-content overflow-x-auto" 
                   [innerHTML]="message().parts | markdown">
              </div>

              @if (isConfigError()) {
                <div class="mt-4 p-4 rounded-xl bg-zinc-800/50 border border-white/10 flex flex-col items-center gap-3 text-center animate-in zoom-in-95 duration-500">
                  <p class="text-[13px] text-zinc-400 font-medium">Configure sua própria chave gratuita para continuar explorando sem limites.</p>
                  <button 
                    (click)="openSettings.emit()"
                    class="px-5 py-2.5 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-bold transition-all active:scale-95"
                  >
                    Configurar Minha Chave de API
                  </button>
                </div>
              }

              <!-- Grounding Sources -->
              @if (message().groundingMetadata; as metadata) {
                @if (metadata.groundingChunks) {
                  <div class="mt-6 pt-4 border-t border-white/5 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div class="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-1.5 ml-1">
                      <mat-icon class="!text-[14px] !w-3.5 !h-3.5">travel_explore</mat-icon>
                      Fontes de Pesquisa
                    </div>
                    <div class="flex flex-wrap gap-2">
                      @for (chunk of metadata.groundingChunks; track $index) {
                        @if (chunk.web) {
                          <a [href]="chunk.web.uri" target="_blank" 
                             class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-900/50 border border-white/5 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all group no-underline">
                            <span class="text-[11px] font-medium text-zinc-400 group-hover:text-blue-400 truncate max-w-[180px]">
                              {{ chunk.web.title || chunk.web.uri }}
                            </span>
                            <mat-icon class="!text-[12px] !w-3 !h-3 text-zinc-600 group-hover:text-blue-400">open_in_new</mat-icon>
                          </a>
                        }
                      }
                    </div>
                  </div>
                }
              }
              
              <!-- Footer Actions -->
              <div class="hidden group-hover:flex items-center gap-3 sm:gap-4 mt-2 transition-all">
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
  openSettings = output<void>();
  gemini = inject(GeminiService);
  isThinkingExpanded = signal(false);

  isConfigError = computed(() => {
    return this.message().parts.includes('CONFIG_REQUIRED') || 
           this.message().parts.includes('Configuração Necessária') ||
           this.message().parts.includes('Limite de Uso Atingido');
  });
}
