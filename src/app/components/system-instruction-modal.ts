import { Component, ChangeDetectionStrategy, output, input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule, FormControl } from '@angular/forms';

@Component({
  selector: 'app-system-instruction-modal',
  standalone: true,
  imports: [CommonModule, MatIconModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <!-- Backdrop -->
      <button 
        tabindex="-1"
        class="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 w-full h-full border-none p-0 cursor-default"
        (click)="closeModal.emit()"
        aria-label="Fechar modal"
      ></button>

      <!-- Modal Content -->
      <div class="relative w-full max-w-xl bg-gemini-surface border border-gemini-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 fade-in duration-300">
        <!-- Header -->
        <div class="px-6 py-5 border-b border-gemini-border flex items-center justify-between bg-white/[0.02] shrink-0">
          <div class="flex items-center gap-3">
            <div>
              <h3 class="text-lg font-semibold text-white tracking-tight">Instruções do Sistema</h3>
              <p class="text-xs text-zinc-500">Personalize o comportamento da IA</p>
            </div>
          </div>
          <button 
            (click)="closeModal.emit()" 
            class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-all"
            aria-label="Fechar"
          >
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <!-- Body -->
        <div class="p-6 overflow-y-auto">
          <div class="mb-5">
            <label for="system-instruction-textarea" class="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2 px-1">
              Personalização
            </label>
            <div class="relative group">
              <textarea
                id="system-instruction-textarea"
                [formControl]="instructionControl"
                placeholder="Ex: Responda sempre em tópicos detalhados..."
                class="w-full h-64 bg-black/20 border border-gemini-border rounded-2xl p-4 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all resize-none font-sans leading-relaxed"
              ></textarea>
              <div class="absolute bottom-4 right-4 flex items-center gap-2 pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity">
                <span class="text-[10px] text-zinc-600 bg-black/40 px-2 py-1 rounded-md border border-white/5">Markdown suportado</span>
              </div>
            </div>
          </div>

          <div class="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4 flex gap-4">
            <p class="text-[11px] leading-relaxed text-zinc-400">
              As instruções do sistema definem como a Superintelligence deve se portar, qual tom deve usar e quais restrições deve seguir em todas as conversas.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-5 bg-white/[0.02] border-t border-gemini-border flex justify-end gap-3 shrink-0">
          <button 
            (click)="closeModal.emit()"
            class="px-5 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
          >
            Cancelar
          </button>
          <button 
            (click)="handleSave()"
            class="px-8 py-2.5 rounded-xl text-sm font-semibold bg-white text-black hover:bg-zinc-200 active:scale-[0.98] transition-all"
          >
            Salvar Instruções
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    textarea::-webkit-scrollbar {
      width: 6px;
    }
    textarea::-webkit-scrollbar-track {
      background: transparent;
    }
    textarea::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 10px;
    }
    textarea::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  `]
})
export class SystemInstructionModal implements OnInit {
  currentInstruction = input<string>('');
  
  save = output<string>();
  closeModal = output<void>();

  instructionControl = new FormControl('');

  ngOnInit() {
    this.instructionControl.setValue(this.currentInstruction());
  }

  handleSave() {
    this.save.emit(this.instructionControl.value || '');
  }
}
