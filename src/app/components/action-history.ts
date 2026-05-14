import { Component, ChangeDetectionStrategy, input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import hljs from 'highlight.js';
import { DomSanitizer } from '@angular/platform-browser';

interface FileAction {
  path: string;
  content: string;
  highlightedContent: string;
}

@Component({
  selector: 'app-action-history',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (actions().length > 0) {
      <div class="my-4 bg-[#1f1f1f] border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
        <div class="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800">
          <span class="text-[11px] font-semibold text-zinc-300 uppercase tracking-widest">Action history</span>
        </div>
        
        <div class="p-4 sm:p-5 flex flex-col gap-4">
          <p class="text-[13px] text-zinc-400">Here are key actions taken for the app:</p>
          
          <div class="flex flex-col gap-2">
            @for (action of actions(); track action.path) {
              <div class="flex flex-col gap-2">
                <button 
                  (click)="toggleFile(action.path)"
                  class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-zinc-800/40 w-full text-left transition-colors group"
                  [class.bg-[#2a2a2a]]="selectedFile() === action.path"
                >
                  <mat-icon class="text-zinc-500 scale-[0.65] group-hover:text-zinc-300">edit</mat-icon>
                  <span class="text-[13px] font-mono text-zinc-300 flex-1 truncate opacity-90 group-hover:opacity-100 font-medium">{{ action.path }}</span>
                  <div class="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/10 shrink-0">
                    <mat-icon class="text-emerald-500 scale-[0.6]">check</mat-icon>
                  </div>
                </button>
                
                @if (selectedFile() === action.path) {
                  <div class="animate-in fade-in zoom-in-95 duration-150">
                    <div class="relative bg-[#2a2a2a] rounded-xl border border-zinc-800/50 shadow-inner">
                      <pre class="m-0 p-4 text-[13px] overflow-x-auto leading-relaxed"><code [innerHTML]="action.highlightedContent"></code></pre>
                      <button 
                        (click)="copyCode(action.content)"
                        class="absolute top-3 right-3 p-2 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all border border-zinc-700/30 z-10"
                        title="Copy code"
                      >
                        <mat-icon class="scale-75">content_copy</mat-icon>
                      </button>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }
    pre code { font-family: 'JetBrains Mono', 'Fira Code', monospace; }
  `]
})
export class ActionHistory {
  messageText = input.required<string>();
  sanitizer = input.required<DomSanitizer>();
  
  selectedFile = signal<string | null>(null);

  actions = computed(() => {
    const text = this.messageText();
    const actions: FileAction[] = [];
    
    const historyRegex = /<action_history>([\s\S]*?)<\/action_history>/g;
    const fileRegex = /<file path="([^"]+)">([\s\S]*?)<\/file>/g;
    
    let historyMatch;
    while ((historyMatch = historyRegex.exec(text)) !== null) {
      const historyContent = historyMatch[1];
      let fileMatch;
      while ((fileMatch = fileRegex.exec(historyContent)) !== null) {
        const path = fileMatch[1];
        const content = fileMatch[2].trim();
        actions.push({
          path,
          content,
          highlightedContent: hljs.highlightAuto(content).value
        });
      }
    }
    
    return actions;
  });

  toggleFile(path: string) {
    if (this.selectedFile() === path) {
      this.selectedFile.set(null);
    } else {
      this.selectedFile.set(path);
    }
  }

  copyCode(code: string) {
    navigator.clipboard.writeText(code);
  }
}
