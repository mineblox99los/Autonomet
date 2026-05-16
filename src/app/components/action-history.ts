import { Component, ChangeDetectionStrategy, input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import hljs from 'highlight.js';
import { DomSanitizer } from '@angular/platform-browser';

interface FileAction {
  path: string;
  content: string;
  highlightedContent: string;
  isComplete: boolean;
}

@Component({
  selector: 'app-action-history',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (actions().length > 0) {
      <div class="bg-gemini-surface border border-gemini-border rounded-xl overflow-hidden scale-in">
        <div class="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/5">
          <div class="flex items-center gap-2">
            <mat-icon class="text-blue-400 scale-[0.6] animate-pulse">history</mat-icon>
            <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Action History</span>
          </div>
        </div>
        
        <div class="p-3 flex flex-col gap-3">
          <div class="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
            @for (action of actions(); track action.path) {
              <div class="flex flex-col gap-2">
                <button 
                  (click)="toggleFile(action.path)"
                  class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 active:bg-blue-500/20 active:ring-1 active:ring-blue-500/30 w-full text-left transition-all group relative overflow-hidden"
                  [class.bg-white/10]="selectedFile() === action.path"
                >
                  <!-- Progress animation background for incomplete files -->
                  @if (!action.isComplete) {
                    <div class="absolute inset-0 bg-blue-500/5 animate-pulse"></div>
                  }

                  <mat-icon [class.text-blue-400]="!action.isComplete" [class.text-zinc-500]="action.isComplete" class="scale-[0.65] group-hover:text-zinc-300">
                    {{ action.isComplete ? 'edit' : 'sync' }}
                  </mat-icon>
                  
                  <span class="text-[13px] font-mono text-zinc-400 flex-1 truncate opacity-90 group-hover:opacity-100 font-medium z-10">{{ action.path }}</span>
                  
                  <div class="flex items-center justify-center w-5 h-5 rounded-full shrink-0 z-10" 
                       [class.bg-emerald-500/10]="action.isComplete"
                       [class.bg-blue-500/10]="!action.isComplete">
                    @if (action.isComplete) {
                      <mat-icon class="text-emerald-500 !text-[12px] !w-3 !h-3 flex items-center justify-center animate-in zoom-in duration-300">check</mat-icon>
                    } @else {
                      <div class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                    }
                  </div>
                </button>
                
                @if (selectedFile() === action.path) {
                  <div class="animate-in fade-in zoom-in-95 duration-150">
                    <div class="relative bg-black/20 rounded-xl border border-white/5 shadow-inner">
                      <pre class="m-0 p-4 text-[12px] overflow-x-auto leading-relaxed"><code [innerHTML]="action.highlightedContent"></code></pre>
                      <button 
                        (click)="copyCode(action.content)"
                        class="absolute top-3 right-3 p-2 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 active:bg-blue-500/40 text-zinc-400 hover:text-white transition-all border border-zinc-700/30 z-10"
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
    .scale-in { animation: scaleIn 0.3s ease-out; }
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.98); }
      to { opacity: 1; transform: scale(1); }
    }
    .custom-scrollbar::-webkit-scrollbar {
      width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.02);
      border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.15);
    }
  `]
})
export class ActionHistory {
  messageText = input.required<string>();
  sanitizer = input.required<DomSanitizer>();
  
  selectedFile = signal<string | null>(null);

  actions = computed(() => {
    const text = this.messageText();
    const actions: FileAction[] = [];
    
    // Improved regex to handle streaming content
    // We look for everything from the first <action_history> tag
    const historyIndex = text.indexOf('<action_history>');
    if (historyIndex === -1) return [];

    let historyContent = text.substring(historyIndex + '<action_history>'.length);
    const historyEndIndex = historyContent.indexOf('</action_history>');
    if (historyEndIndex !== -1) {
      historyContent = historyContent.substring(0, historyEndIndex);
    }

    // Match all <file path="..."> tags
    const fileTagRegex = /<file path="([^"]+)">/g;
    let fileMatch;
    const matches: {path: string, startIndex: number}[] = [];
    
    while ((fileMatch = fileTagRegex.exec(historyContent)) !== null) {
      matches.push({
        path: fileMatch[1],
        startIndex: fileMatch.index + fileMatch[0].length
      });
    }

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const nextMatchIndex = i + 1 < matches.length ? historyContent.indexOf('<file path="', match.startIndex) : -1;
      
      let rawContent = '';
      let isComplete = false;
      
      const endIndex = historyContent.indexOf('</file>', match.startIndex);
      
      if (endIndex !== -1 && (nextMatchIndex === -1 || endIndex < nextMatchIndex)) {
        // File tag is properly closed before the next file tag starts
        rawContent = historyContent.substring(match.startIndex, endIndex);
        isComplete = true;
      } else {
        // File is still being generated or closed tag is missing in current chunk
        const limit = nextMatchIndex !== -1 ? nextMatchIndex : historyContent.length;
        rawContent = historyContent.substring(match.startIndex, limit);
        isComplete = false;
      }

      const cleanContent = rawContent.trim();
      actions.push({
        path: match.path,
        content: cleanContent,
        highlightedContent: cleanContent ? hljs.highlightAuto(cleanContent).value : '',
        isComplete
      });
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
