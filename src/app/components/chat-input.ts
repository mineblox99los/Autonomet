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
              aria-label="Opções e modelos"
            >
              <mat-icon class="scale-90">add_circle_outline</mat-icon>
            </button>

            @if (isDropdownOpen()) {
              <div class="absolute bottom-full left-0 mb-3 w-64 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-2 z-[100] animate-in fade-in zoom-in-95 duration-200">
                <div class="px-3 py-2 border-b border-white/5 mb-2">
                  <div class="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest leading-none">Modelos Gemini</div>
                </div>

                <div class="space-y-1 mb-3">
                  @for (model of gemini.availableModels; track model.id) {
                    <button 
                      (click)="selectModel(model.id, $event)"
                      class="w-full text-left px-3 py-2 rounded-lg transition-all flex flex-col gap-0.5"
                      [class]="gemini.getSelectedModel() === model.id ? 'bg-blue-500/10 border border-blue-500/20' : 'hover:bg-white/5 border border-transparent'"
                    >
                      <div class="flex items-center justify-between w-full">
                        <span class="text-sm font-medium" [class.text-blue-400]="gemini.getSelectedModel() === model.id" [class.text-zinc-200]="gemini.getSelectedModel() !== model.id">
                          {{ model.name }}
                        </span>
                        @if (gemini.getSelectedModel() === model.id) {
                          <mat-icon class="!text-[16px] text-blue-400">check</mat-icon>
                        }
                      </div>
                      <span class="text-[10px] text-zinc-500">{{ model.description }}</span>
                    </button>
                  }
                </div>

                <div class="px-3 py-2 border-t border-white/5 mt-2">
                  <div class="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest leading-none mb-3">Ajustes de API</div>
                  <div class="bg-black/20 rounded-lg px-2.5 py-2 mb-3 border border-white/5">
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
                (click)="toggleMicDropdown($event)"
                class="w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 hover:bg-white/5 active:bg-blue-500/30 transition-all"
                id="mic-button"
              >
                <mat-icon class="scale-90">mic_none</mat-icon>
              </button>
              
              @if (isMicDropdownOpen()) {
                <div class="absolute bottom-full left-0 mb-3 bg-gemini-surface text-zinc-300 text-[12px] px-3 py-1.5 rounded-lg border border-gemini-border shadow-xl whitespace-nowrap animate-in fade-in zoom-in-95 duration-200 z-50">
                  Em desenvolvimento
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
  isMicDropdownOpen = signal(false);
  isDropdownOpen = signal(false);

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

  toggleMicDropdown(event: Event) {
    event.stopPropagation();
    this.isMicDropdownOpen.update(v => !v);
    if (this.isMicDropdownOpen()) {
      setTimeout(() => this.isMicDropdownOpen.set(false), 3000);
    }
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.isDropdownOpen.update(v => !v);
  }

  selectModel(modelId: string, event: Event) {
    event.stopPropagation();
    this.gemini.setSelectedModel(modelId);
    this.isDropdownOpen.set(false);
  }

  @HostListener('window:click', ['$event'])
  onWindowClick(event: MouseEvent) {
    if (this.isMicDropdownOpen() || this.isDropdownOpen()) {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        this.isMicDropdownOpen.set(false);
        this.isDropdownOpen.set(false);
      }
    }
  }
}
