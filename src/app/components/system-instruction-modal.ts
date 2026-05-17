import { Component, ChangeDetectionStrategy, output, input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { GeminiService } from '../services/gemini';

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
              <h3 class="text-lg font-semibold text-white tracking-tight">Personalizar IA</h3>
              <p class="text-xs text-zinc-500">Ajuste o comportamento e as habilidades do Gemini 3</p>
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
        <div class="p-6 overflow-y-auto space-y-6">
          <!-- Instruções Section -->
          <div>
            <label for="system-instruction-textarea" class="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2 px-1">
              Instruções do Sistema
            </label>
            <div class="relative group">
              <textarea
                id="system-instruction-textarea"
                [formControl]="instructionControl"
                placeholder="Ex: Responda sempre em tópicos detalhados..."
                class="w-full h-32 bg-black/20 border border-gemini-border rounded-2xl p-4 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all resize-none font-sans leading-relaxed"
              ></textarea>
              <div class="absolute bottom-4 right-4 flex items-center gap-2 pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity">
                <span class="text-[10px] text-zinc-600 bg-black/40 px-2 py-1 rounded-md border border-white/5">Markdown suportado</span>
              </div>
            </div>
          </div>

          <!-- Structured Output Section (Conditional) -->
          @if (gemini.enabledSkills().structuredOutput) {
            <div class="animate-in slide-in-from-top-2 duration-300">
              <label for="response-schema-textarea" class="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-2 px-1">
                JSON Schema (Structured Output)
              </label>
              <div class="relative group">
                <textarea
                  id="response-schema-textarea"
                  [formControl]="schemaControl"
                  placeholder='Ex: { "type": "object", "properties": { "name": { "type": "string" } } }'
                  class="w-full h-32 bg-black/20 border border-gemini-border rounded-2xl p-4 text-xs font-mono text-blue-300 placeholder:text-zinc-700 outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all resize-none leading-relaxed"
                ></textarea>
                @if (schemaError()) {
                  <div class="absolute top-2 right-2 flex items-center gap-1 text-[9px] text-red-400 bg-red-500/10 px-2 py-1 rounded-md border border-red-500/20">
                    <mat-icon class="!text-[12px] !w-3 !h-3">error_outline</mat-icon>
                    JSON Inválido
                  </div>
                }
              </div>
            </div>
          }

          <!-- Dev Skills Section -->
          <div>
            <div class="block text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-3 px-1">
              Habilidades de IA
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <!-- Skill: structuredOutput -->
              <div class="relative">
                <div class="flex items-center gap-2 w-full p-1 bg-black/10 border border-gemini-border rounded-xl group transition-all" [class.border-blue-400/30]="gemini.enabledSkills().structuredOutput" [class.bg-blue-400/5]="gemini.enabledSkills().structuredOutput">
                  <button (click)="gemini.toggleSkill('structuredOutput')" class="flex-1 flex items-center justify-between py-2 px-3 rounded-lg transition-colors text-left">
                    <span [class.text-blue-400]="gemini.enabledSkills().structuredOutput" class="text-[13px] font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors">structured-output</span>
                    <mat-icon class="scale-90" [class.text-blue-400]="gemini.enabledSkills().structuredOutput" [class.text-zinc-600]="!gemini.enabledSkills().structuredOutput">
                      {{ gemini.enabledSkills().structuredOutput ? 'check_box' : 'check_box_outline_blank' }}
                    </mat-icon>
                  </button>
                  <button (click)="toggleExplanation('structuredOutput', $event)" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-zinc-500 hover:text-blue-400 transition-colors shrink-0">
                    <mat-icon class="!text-[18px] !w-[18px] !h-[18px] flex items-center justify-center">help_outline</mat-icon>
                  </button>
                </div>
                @if (openExplanation() === 'structuredOutput') {
                  <div class="absolute right-0 bottom-full mb-2 w-full sm:w-72 bg-zinc-900 border border-gemini-border rounded-xl shadow-2xl p-4 z-[210] animate-in fade-in zoom-in-95 duration-200">
                    <div class="text-[11px] text-zinc-300 leading-relaxed">
                      <b class="text-blue-400 block mb-1">Saídas Estruturadas (JSON Schema)</b>
                      Força a IA a responder em um formato JSON específico definido por você. Útil para extração de dados e automação.
                    </div>
                  </div>
                }
              </div>

              <!-- Skill: apiDev -->
              <div class="relative">
                <div class="flex items-center gap-2 w-full p-1 bg-black/10 border border-gemini-border rounded-xl group transition-all" [class.border-blue-500/30]="gemini.enabledSkills().apiDev" [class.bg-blue-500/5]="gemini.enabledSkills().apiDev">
                  <button (click)="gemini.toggleSkill('apiDev')" class="flex-1 flex items-center justify-between py-2 px-3 rounded-lg transition-colors text-left">
                    <span [class.text-blue-400]="gemini.enabledSkills().apiDev" class="text-[13px] font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors">gemini-api-dev</span>
                    <mat-icon class="scale-90" [class.text-blue-400]="gemini.enabledSkills().apiDev" [class.text-zinc-600]="!gemini.enabledSkills().apiDev">
                      {{ gemini.enabledSkills().apiDev ? 'check_box' : 'check_box_outline_blank' }}
                    </mat-icon>
                  </button>
                  <button (click)="toggleExplanation('apiDev', $event)" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-zinc-500 hover:text-blue-400 transition-colors shrink-0">
                    <mat-icon class="!text-[18px] !w-[18px] !h-[18px] flex items-center justify-center">help_outline</mat-icon>
                  </button>
                </div>
                @if (openExplanation() === 'apiDev') {
                  <div class="absolute right-0 bottom-full mb-2 w-full sm:w-72 bg-zinc-900 border border-gemini-border rounded-xl shadow-2xl p-4 z-[210] animate-in fade-in zoom-in-95 duration-200">
                    <div class="text-[11px] text-zinc-300 leading-relaxed">
                      <b class="text-blue-400 block mb-1">Especialista em API do Gemini</b>
                      Focado em prompts multimodais, Chamadas de Função e saídas JSON estruturadas. Ideal para quem está construindo aplicações com a API.
                    </div>
                  </div>
                }
               <!-- Skill: liveApi -->
              <div class="relative">
                <div class="flex items-center gap-2 w-full p-1 bg-black/10 border border-gemini-border rounded-xl group transition-all" [class.border-emerald-500/30]="gemini.enabledSkills().liveApi" [class.bg-emerald-500/5]="gemini.enabledSkills().liveApi">
                  <button (click)="gemini.toggleSkill('liveApi')" class="flex-1 flex items-center justify-between py-2 px-3 rounded-lg transition-colors text-left">
                    <span [class.text-emerald-400]="gemini.enabledSkills().liveApi" class="text-[13px] font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors">gemini-live-api-dev</span>
                    <mat-icon class="scale-90" [class.text-emerald-400]="gemini.enabledSkills().liveApi" [class.text-zinc-600]="!gemini.enabledSkills().liveApi">
                      {{ gemini.enabledSkills().liveApi ? 'check_box' : 'check_box_outline_blank' }}
                    </mat-icon>
                  </button>
                  <button (click)="toggleExplanation('liveApi', $event)" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-zinc-500 hover:text-emerald-400 transition-colors shrink-0">
                    <mat-icon class="!text-[18px] !w-[18px] !h-[18px] flex items-center justify-center">help_outline</mat-icon>
                  </button>
                </div>
                @if (openExplanation() === 'liveApi') {
                  <div class="absolute right-0 bottom-full mb-2 w-full sm:w-72 bg-zinc-900 border border-gemini-border rounded-xl shadow-2xl p-4 z-[210] animate-in fade-in zoom-in-95 duration-200">
                    <div class="text-[11px] text-zinc-300 leading-relaxed">
                      <b class="text-emerald-400 block mb-1">Especialista em Live API (Multimodal)</b>
                      Conhecimento profundo em conexões WebSockets para streaming de áudio/vídeo em tempo real e baixíssima latência.
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>

          <div class="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4 flex gap-4">
            <p class="text-[11px] leading-relaxed text-zinc-400">
              As instruções do sistema e habilidades definem como o Gemini 3 deve se portar e quais conhecimentos técnicos deve priorizar em todas as conversas.
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
            Salvar Alterações
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
  `],
  host: {
    '(document:click)': 'onDocumentClick()'
  }
})
export class SystemInstructionModal implements OnInit {
  gemini = inject(GeminiService);
  currentInstruction = input<string>('');
  currentSchema = input<string>('');
  
  save = output<{ instruction: string, schema: string }>();
  closeModal = output<void>();

  instructionControl = new FormControl('');
  schemaControl = new FormControl('');
  openExplanation = signal<string | null>(null);
  schemaError = signal<boolean>(false);

  ngOnInit() {
    this.instructionControl.setValue(this.currentInstruction());
    this.schemaControl.setValue(this.currentSchema());
    
    this.schemaControl.valueChanges.subscribe(val => {
      if (!val) {
        this.schemaError.set(false);
        return;
      }
      try {
        JSON.parse(val);
        this.schemaError.set(false);
      } catch {
        this.schemaError.set(true);
      }
    });
  }

  toggleExplanation(skill: string, event: Event) {
    event.stopPropagation();
    this.openExplanation.update(current => current === skill ? null : skill);
  }

  onDocumentClick() {
    if (this.openExplanation()) {
      this.openExplanation.set(null);
    }
  }

  handleSave() {
    if (this.schemaError()) return;
    this.save.emit({
      instruction: this.instructionControl.value || '',
      schema: this.schemaControl.value || ''
    });
  }
}
