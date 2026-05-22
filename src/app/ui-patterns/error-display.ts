import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmButton } from '@spartan-ng/helm/button';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideAlertTriangle, lucideExternalLink } from '@ng-icons/lucide';

export interface SupportFormParams {
  projectRef?: string;
  orgSlug?: string;
  category?: string;
  subject?: string;
  message?: string;
  error?: string;
  sid?: string;
}

@Component({
  selector: 'app-error-display',
  standalone: true,
  imports: [CommonModule, HlmCardImports, HlmButton, NgIconComponent],
  providers: [provideIcons({ lucideAlertTriangle, lucideExternalLink })],
  template: `
    <section hlmCard [class]="'overflow-hidden rounded-2xl border-destructive/20 bg-destructive/5 ' + className()">
      <div hlmCardHeader class="flex flex-row items-center gap-3 p-4 bg-destructive/10 border-b border-destructive/10">
        <div class="size-8 rounded-full bg-destructive/20 flex items-center justify-center text-destructive">
          @if (iconName()) {
             <ng-icon [name]="iconName()!" class="size-4"></ng-icon>
          } @else {
             <ng-icon name="lucideAlertTriangle" class="size-4"></ng-icon>
          }
        </div>
        <h3 hlmCardTitle class="text-sm font-bold text-destructive tracking-tight">{{ title() }}</h3>
      </div>

      <div hlmCardContent class="p-4 space-y-4">
        <div class="rounded-xl bg-black/80 p-4 border border-white/5 shadow-inner">
          <code class="text-[11px] font-mono leading-relaxed text-destructive-foreground break-all whitespace-pre-wrap block">
            {{ errorMessage() }}
          </code>
        </div>
        
        <div class="troubleshooting-slot">
          <ng-content></ng-content>
        </div>
      </div>

      <div hlmCardFooter class="px-4 py-3 bg-muted/20 border-t border-border flex items-center justify-between">
         <button hlmBtn variant="link" 
                 class="h-auto p-0 text-xs font-bold text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
                 (click)="supportClick.emit()">
           {{ supportLabel() }}
           <ng-icon name="lucideExternalLink" class="size-3"></ng-icon>
         </button>
      </div>
    </section>
  `
})
export class ErrorDisplay {
  title = input.required<string>();
  errorMessage = input.required<string>();
  supportLabel = input<string>('Contact support');
  iconName = input<string>();
  className = input<string>('');

  supportClick = output<void>();
}
