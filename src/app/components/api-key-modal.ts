import { Component, ChangeDetectionStrategy, output, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-api-key-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div class="bg-gemini-surface border border-gemini-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
        <!-- Header -->
        <div class="px-6 py-5 border-b border-gemini-border flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <mat-icon class="text-blue-400">vpn_key</mat-icon>
            </div>
            <div>
              <h2 class="text-lg font-semibold text-white">Configurar Chave de API</h2>
              <p class="text-xs text-zinc-400">Personalize sua experiência com sua própria chave</p>
            </div>
          </div>
          <button (click)="closeModal.emit()" class="text-zinc-500 hover:text-white transition-colors">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <!-- Body -->
        <div class="p-6">
          <p class="text-sm text-zinc-300 mb-6 leading-relaxed">
            Sua chave é armazenada localmente no seu navegador. Você pode obter uma chave gratuita no 
            <a href="https://aistudio.google.com/api-keys" target="_blank" class="text-blue-400 hover:underline">Google AI Studio</a>.
          </p>

          <div class="space-y-4">
            <div>
              <label for="gemini-api-key" class="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Chave de API Gemini</label>
              <div class="relative">
                <input 
                  id="gemini-api-key"
                  [formControl]="keyControl"
                  [type]="showKey() ? 'text' : 'password'"
                  placeholder="Cole sua chave aqui..."
                  class="w-full bg-black/40 border border-gemini-border rounded-xl px-4 py-3 text-sm text-zinc-200 outline-none focus:border-blue-500/50 transition-all font-mono"
                >
                <button 
                  (click)="showKey.set(!showKey())"
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  <mat-icon class="scale-75">{{ showKey() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </div>
            </div>
          </div>

          <div class="mt-8 flex items-center gap-3">
            <button 
              (click)="save()"
              [disabled]="keyControl.invalid"
              class="flex-1 bg-white text-black font-semibold py-3 rounded-xl hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:grayscale"
            >
              Confirmar Chave
            </button>
            @if (currentKey()) {
              <button 
                (click)="clear()"
                class="px-4 py-3 rounded-xl border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-all"
              >
                Limpar
              </button>
            }
          </div>
        </div>
      </div>
    </div>
  `
})
export class ApiKeyModal {
  currentKey = input<string | null>(null);
  saveKey = output<string>();
  clearKey = output<void>();
  closeModal = output<void>();

  keyControl = new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(20)] });
  showKey = signal(false);

  constructor() {
    // Initial value if provided
    setTimeout(() => {
      if (this.currentKey()) {
        this.keyControl.setValue(this.currentKey()!);
      }
    });
  }

  save() {
    if (this.keyControl.valid) {
      this.saveKey.emit(this.keyControl.value);
    }
  }

  clear() {
    this.clearKey.emit();
  }
}
