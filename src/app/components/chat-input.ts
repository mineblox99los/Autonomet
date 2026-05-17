/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, ChangeDetectionStrategy, output, input, signal, HostListener, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { GeminiService } from '../services/gemini';

@Component({
  selector: 'app-chat-input',
  standalone: true,
  imports: [CommonModule, MatIconModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-3 w-full">
      <!-- Input Box -->
      <div class="bg-gemini-surface rounded-[24px] border border-gemini-border focus-within:border-zinc-500 transition-colors px-3 sm:px-4 py-2 shadow-sm">
        <div class="flex items-start">
          <textarea 
            [formControl]="promptControl"
            (keydown.enter)="handleEnter($event)"
            placeholder="Faça perguntas, mande comandos ou peça para criar"
            class="flex-1 bg-transparent border-none outline-none resize-none text-[14px] sm:text-[15px] pt-1.5 placeholder:text-zinc-500 overflow-y-auto leading-relaxed"
            rows="2"
          ></textarea>
        </div>
        
        <div class="flex items-center justify-between pt-2 pb-1">
          <div class="flex items-center gap-1 dropdown-container relative">
            <button 
              (click)="toggleDropdown($event)"
              class="w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 hover:bg-white/5 active:bg-blue-500/30 transition-all font-medium"
              aria-label="Configurações de API"
            >
              <mat-icon class="scale-90">settings</mat-icon>
            </button>

            @if (isDropdownOpen()) {
              <div class="absolute bottom-full left-0 mb-3 w-64 bg-gemini-surface border border-gemini-border rounded-xl shadow-2xl p-2 z-[100] animate-in fade-in zoom-in-95 duration-200">
                <div class="px-3 py-2 border-b border-gemini-border mb-1">
                  <div class="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest leading-none">Status da API</div>
                </div>

                <div class="px-3 py-2">
                  <div class="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest leading-none mb-3">Chave Ativa</div>
                  <div class="bg-black/20 rounded-lg px-2.5 py-2 mb-3 border border-gemini-border">
                    <code class="text-[10px] text-zinc-500 truncate leading-none block">
                      {{ maskedKey() }}
                    </code>
                  </div>

                  <button 
                    (click)="openApiKeyModal.emit()"
                    class="w-full text-left text-xs px-2 py-1.5 rounded-lg text-blue-400 hover:bg-blue-400/5 active:bg-blue-400/10 transition-colors font-medium flex items-center gap-2"
                  >
                    <mat-icon class="!text-[16px]">key</mat-icon>
                    Gerenciar Chave
                  </button>
                </div>
              </div>
            }

            <div class="relative">
              <button 
                (click)="togglePlusDropdown($event)"
                class="w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 hover:bg-white/5 active:bg-blue-500/30 transition-all dropdown-container"
                id="plus-button"
              >
                <mat-icon class="scale-90">add</mat-icon>
              </button>
              
              @if (isPlusDropdownOpen()) {
                <div class="absolute bottom-full left-0 mb-3 w-64 bg-gemini-surface border border-gemini-border rounded-xl shadow-2xl p-2 z-[100] animate-in fade-in zoom-in-95 duration-200">
                  <div class="px-3 py-2 border-b border-gemini-border mb-1">
                    <div class="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest leading-none">Capacidades</div>
                  </div>

                  <div class="px-1 py-1">
                    <button 
                      (click)="gemini.toggleGoogleSearch()"
                      class="w-full text-left px-3 py-2.5 rounded-lg hover:bg-white/5 transition-all flex items-center justify-between group"
                    >
                      <div class="flex items-center gap-3">
                        <div class="flex flex-col">
                          <span class="text-xs font-medium text-zinc-200">Google Search</span>
                          <span class="text-[10px] text-zinc-500">Resultados em tempo real</span>
                        </div>
                      </div>
                      <div 
                        class="w-8 h-4 rounded-full relative transition-colors duration-200 ease-in-out"
                        [class.bg-emerald-500]="gemini.isGoogleSearchEnabled()"
                        [class.bg-zinc-700]="!gemini.isGoogleSearchEnabled()"
                      >
                        <div 
                          class="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform duration-200 ease-in-out shadow-sm"
                          [class.translate-x-4]="gemini.isGoogleSearchEnabled()"
                        ></div>
                      </div>
                    </button>
                  </div>
                </div>
              }
            </div>

            <div class="relative">
              <button 
                (click)="toggleMic($event)"
                class="w-8 h-8 flex items-center justify-center rounded-full transition-all"
                [class.text-blue-400]="isRecording()"
                [class.bg-blue-500/10]="isRecording()"
                [class.text-zinc-400]="!isRecording()"
                [class.hover:bg-white/5]="!isRecording()"
                [class.animate-pulse-blue]="isRecording()"
                id="mic-button"
              >
                <mat-icon class="scale-90">{{ isRecording() ? 'mic' : 'mic_none' }}</mat-icon>
              </button>
              
              @if (isMicNotSupportedOpen()) {
                <div class="absolute bottom-full left-0 mb-3 bg-gemini-surface text-zinc-300 text-[12px] px-4 py-2 rounded-xl border border-gemini-border shadow-2xl whitespace-nowrap animate-in fade-in zoom-in-95 duration-200 z-50">
                  Microfone não suportado no navegador
                </div>
              }
            </div>
          </div>
          
          <button 
            (click)="submit()"
            [disabled]="!promptControl.value?.trim() || isLoading()"
            class="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 active:bg-blue-500/50 transition-all disabled:opacity-20 disabled:grayscale"
          >
            <mat-icon class="scale-90">arrow_upward</mat-icon>
          </button>
        </div>
      </div>
    </div>
  `
})
export class ChatInput {
  gemini = inject(GeminiService);
  isLoading = input<boolean>(false);
  hasCustomKey = input<boolean>(false);
  currentKey = input<string | null>(null);
  
  send = output<string>();
  openApiKeyModal = output<void>();

  promptControl = new FormControl('');
  isMicNotSupportedOpen = signal(false);
  isRecording = signal(false);
  isDropdownOpen = signal(false);
  isPlusDropdownOpen = signal(false);
  
  private recognition: any;

  constructor() {
    this.setupSpeechRecognition();
  }

  private setupSpeechRecognition() {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'pt-BR';

      this.recognition.onstart = () => {
        this.isRecording.set(true);
      };

      this.recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        
        this.promptControl.setValue(transcript);
      };

      this.recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        this.isRecording.set(false);
      };

      this.recognition.onend = () => {
        this.isRecording.set(false);
      };
    }
  }

  maskedKey = computed(() => {
    const key = this.currentKey();
    if (!key) return 'Chave padrão ativada';
    return `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;
  });

  handleEnter(event: Event) {
    event.preventDefault();
    this.submit();
  }

  submit() {
    const value = this.promptControl.value;
    if (value?.trim() && !this.isLoading()) {
      this.send.emit(value.trim());
      this.promptControl.reset();
    }
  }

  toggleMic(event: Event) {
    event.stopPropagation();
    if (!this.recognition) {
      this.isMicNotSupportedOpen.set(true);
      setTimeout(() => this.isMicNotSupportedOpen.set(false), 3000);
      return;
    }

    if (this.isRecording()) {
      this.recognition.stop();
    } else {
      this.closeAllDropdowns();
      try {
        this.recognition.start();
      } catch (e) {
        console.error('Failed to start recognition', e);
      }
    }
  }

  togglePlusDropdown(event: Event) {
    event.stopPropagation();
    const newState = !this.isPlusDropdownOpen();
    this.closeAllDropdowns();
    this.isPlusDropdownOpen.set(newState);
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    const newState = !this.isDropdownOpen();
    this.closeAllDropdowns();
    this.isDropdownOpen.set(newState);
  }

  private closeAllDropdowns() {
    this.isDropdownOpen.set(false);
    this.isPlusDropdownOpen.set(false);
  }

  @HostListener('window:click', ['$event'])
  onWindowClick(event: MouseEvent) {
    if (this.isDropdownOpen() || this.isPlusDropdownOpen()) {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        this.isPlusDropdownOpen.set(false);
        this.isDropdownOpen.set(false);
      }
    }
  }
}
