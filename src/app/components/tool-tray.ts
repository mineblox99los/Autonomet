import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export interface Step {
  id: string;
  type: string;
  name?: string;
  arguments?: Record<string, unknown>;
}

@Component({
  selector: 'app-tool-tray',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (steps().length > 0) {
      <div class="flex flex-col gap-2 my-2 animate-in fade-in slide-in-from-top-2 duration-500">
        @for (step of steps(); track step.id) {
          @if (step.type === 'function_call') {
            <div class="flex items-center gap-3 px-4 py-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
              <div class="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                <mat-icon class="!text-[18px]">build</mat-icon>
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-[10px] font-bold uppercase tracking-widest text-indigo-400/70 mb-0.5">Executando Ferramenta</div>
                <div class="text-[14px] font-mono font-medium truncate">{{ step.name }}</div>
                <div class="text-[11px] text-indigo-300/60 font-mono mt-1 truncate">
                  args: {{ stringifyArgs(step.arguments) }}
                </div>
              </div>
              <div class="shrink-0">
                <div class="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></div>
              </div>
            </div>
          } @else if (step.type === 'google_search_retrieval') {
             <div class="flex items-center gap-3 px-4 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
              <div class="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <mat-icon class="!text-[18px]">search</mat-icon>
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-[10px] font-bold uppercase tracking-widest text-emerald-400/70 mb-0.5">Google Search</div>
                <div class="text-[14px] font-medium truncate">Pesquisando informações em tempo real...</div>
              </div>
              <mat-icon class="text-emerald-500/50">check_circle</mat-icon>
            </div>
          }
        }
      </div>
    }
  `,
  styles: [`
    :host { display: block; width: 100%; }
  `]
})
export class ToolTray {
  steps = input.required<Step[]>();

  stringifyArgs(args: unknown): string {
    try {
      return JSON.stringify(args).substring(0, 100);
    } catch {
      return '...';
    }
  }
}
