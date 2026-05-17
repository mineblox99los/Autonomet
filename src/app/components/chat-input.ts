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
      <div class="bg-gemini-surface rounded-[24px] border border-gemini-border focus-within:border-zinc-500 transition-all px-3 sm:px-4 py-2 shadow-sm relative">
        <!-- Previews Inside -->
        @if (selectedImages().length > 0) {
          <div class="flex flex-wrap gap-2 pt-2 pb-3 border-b border-gemini-border/30 mb-2">
            @for (img of selectedImages(); track $index) {
              <div class="relative group">
                <button (click)="openPreview($index, img.data)" class="block overflow-hidden rounded-xl border border-gemini-border hover:border-zinc-400 transition-colors">
                  <img [src]="img.data" alt="Preview da imagem" class="w-14 h-14 object-cover">
                </button>
                <button 
                  (click)="removeImage($index)"
                  class="absolute -top-1.5 -right-1.5 bg-zinc-800 text-white rounded-full w-5 h-5 flex items-center justify-center border border-gemini-border shadow-md active:scale-90 transition-transform p-0"
                >
                  <mat-icon class="!text-[14px] !w-[14px] !h-[14px] !leading-[14px] flex items-center justify-center">close</mat-icon>
                </button>
              </div>
            }
          </div>
        }

        <div class="flex items-start">
          <textarea 
            [formControl]="promptControl"
            (keydown.enter)="handleEnter($event)"
            placeholder="Faça perguntas ou anexe imagens (máx. 10)"
            class="flex-1 bg-transparent border-none outline-none resize-none text-[14px] sm:text-[15px] pt-1.5 placeholder:text-zinc-500 overflow-y-auto leading-relaxed"
            rows="2"
          ></textarea>
        </div>
        
        <div class="flex items-center justify-between pt-2 pb-1">
          <div class="flex items-center gap-1 dropdown-container relative">
            <input 
              type="file" 
              #fileInput 
              (change)="onFileSelected($event)" 
              accept="image/*" 
              multiple 
              class="hidden"
            >
            <button 
              (click)="fileInput.click()"
              [disabled]="selectedImages().length >= 10"
              class="w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 hover:bg-white/5 active:bg-blue-500/30 transition-all disabled:opacity-30 disabled:grayscale"
              aria-label="Anexar imagem"
            >
              <mat-icon class="scale-90">add_photo_alternate</mat-icon>
            </button>

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
                    (click)="openSystemInstructionModal.emit()"
                    class="w-full text-center text-xs px-2 py-2 rounded-xl text-zinc-300 bg-white/[0.05] border border-white/[0.05] hover:bg-white/10 active:bg-white/20 transition-all font-medium mb-2"
                  >
                    Personalizar IA
                  </button>

                  <button 
                    (click)="openApiKeyModal.emit()"
                    class="w-full text-center text-xs px-2 py-2 rounded-xl text-zinc-300 bg-white/[0.05] border border-white/[0.05] hover:bg-white/10 active:bg-white/20 transition-all font-medium"
                  >
                    Gerenciar Chave
                  </button>
                </div>
              </div>
            }

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

    <!-- Image Preview Modal -->
    @if (previewState(); as state) {
      <div class="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
        <div class="relative max-w-full max-h-full flex flex-col items-center gap-4">
          <img [src]="state.data" alt="Visualização ampliada" class="max-w-full max-h-[80vh] rounded-2xl shadow-2xl border border-white/10 object-contain">
          
          <div class="flex items-center gap-3">
            <button 
              (click)="removeImageFromPreview(state.index)"
              class="flex items-center gap-2 px-6 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-full border border-red-500/30 transition-all font-medium active:scale-95"
            >
              <mat-icon>delete_outline</mat-icon>
              <span>Remover</span>
            </button>
            <button 
              (click)="closePreview()"
              class="flex items-center gap-2 px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full border border-white/10 transition-all font-medium active:scale-95"
            >
              <mat-icon>close</mat-icon>
              <span>Fechar</span>
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class ChatInput {
  gemini = inject(GeminiService);
  isLoading = input<boolean>(false);
  hasCustomKey = input<boolean>(false);
  currentKey = input<string | null>(null);
  
  send = output<{ prompt: string, images?: { data: string, mimeType: string }[] }>();
  openApiKeyModal = output<void>();
  openSystemInstructionModal = output<void>();

  promptControl = new FormControl('');
  selectedImages = signal<{ data: string, mimeType: string }[]>([]);
  previewState = signal<{ index: number, data: string } | null>(null);
  isMicNotSupportedOpen = signal(false);
  isRecording = signal(false);
  isDropdownOpen = signal(false);
  
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
    const images = this.selectedImages();
    if ((value?.trim() || images.length > 0) && !this.isLoading()) {
      this.send.emit({ 
        prompt: value?.trim() || '', 
        images: images.length > 0 ? images : undefined 
      });
      this.promptControl.reset();
      this.selectedImages.set([]);
    }
  }

  async onFileSelected(event: any) {
    const files = event.target.files as FileList;
    if (!files) return;

    const currentCount = this.selectedImages().length;
    const remaining = 10 - currentCount;
    
    if (remaining <= 0) return;

    for (const file of Array.from(files).slice(0, remaining)) {
      if (!file.type.startsWith('image/')) continue;

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        this.selectedImages.update(imgs => {
          if (imgs.length >= 10) return imgs;
          return [...imgs, { 
            data: base64, 
            mimeType: file.type 
          }];
        });
      };
      reader.readAsDataURL(file);
    }
    // Clear input so same file can be selected again
    event.target.value = '';
  }

  removeImage(index: number) {
    this.selectedImages.update(imgs => imgs.filter((_, i) => i !== index));
  }

  openPreview(index: number, data: string) {
    this.previewState.set({ index, data });
  }

  closePreview() {
    this.previewState.set(null);
  }

  removeImageFromPreview(index: number) {
    this.removeImage(index);
    this.closePreview();
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

  toggleDropdown(event: Event) {
    event.stopPropagation();
    const newState = !this.isDropdownOpen();
    this.closeAllDropdowns();
    this.isDropdownOpen.set(newState);
  }

  private closeAllDropdowns() {
    this.isDropdownOpen.set(false);
  }

  @HostListener('window:click', ['$event'])
  onWindowClick(event: MouseEvent) {
    if (this.isDropdownOpen()) {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        this.isDropdownOpen.set(false);
      }
    }
  }
}
