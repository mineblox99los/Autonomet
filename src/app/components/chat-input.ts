import { Component, ChangeDetectionStrategy, output, input, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule, FormControl } from '@angular/forms';

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
  isLoading = input<boolean>(false);
  hasCustomKey = input<boolean>(false);
  currentKey = input<string | null>(null);
  
  send = output<string>();
  openApiKeyModal = output<void>();

  promptControl = new FormControl('');
  isMicDropdownOpen = signal(false);

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

  @HostListener('window:click', ['$event'])
  onWindowClick(event: MouseEvent) {
    if (this.isMicDropdownOpen()) {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        this.isMicDropdownOpen.set(false);
      }
    }
  }
}
