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
            <button class="w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 hover:bg-white/5 transition-colors">
              <mat-icon class="scale-90">mic_none</mat-icon>
            </button>
            <button 
              (click)="toggleDropdown($event)"
              class="w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 hover:bg-white/5 transition-colors"
            >
              <mat-icon class="scale-90">add_circle_outline</mat-icon>
            </button>

            @if (isDropdownOpen()) {
              <div class="absolute bottom-full left-0 mb-3 w-56 bg-gemini-surface border border-gemini-border rounded-xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-200">
                <div class="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-3 px-1">Configurações de API</div>
                <div class="bg-black/40 rounded-lg p-2.5 flex items-center gap-3 mb-3 border border-white/5">
                  <mat-icon class="text-emerald-400 scale-75">vpn_key</mat-icon>
                  <code class="text-[11px] text-zinc-400 truncate">sk-proj-78...</code>
                </div>
                <button class="w-full text-left text-[13px] px-2 py-1.5 rounded-lg text-blue-400 hover:bg-blue-400/5 transition-colors font-medium">
                  Configurar Chave de API
                </button>
              </div>
            }
          </div>
          
          <button 
            (click)="submit()"
            [disabled]="!promptControl.value?.trim() || isLoading()"
            class="w-8 h-8 rounded-full bg-zinc-700 text-zinc-300 flex items-center justify-center hover:bg-zinc-600 transition-all disabled:opacity-20 disabled:grayscale"
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
  send = output<string>();

  promptControl = new FormControl('');
  isDropdownOpen = signal(false);

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

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.isDropdownOpen.update(v => !v);
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
