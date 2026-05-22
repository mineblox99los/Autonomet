import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrnPopoverImports } from '@spartan-ng/brain/popover';
import { HlmPopoverImports } from '@spartan-ng/helm/popover';
import { HlmButton } from '@spartan-ng/helm/button';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideHelpCircle } from '@ng-icons/lucide';

@Component({
  selector: 'app-info-tooltip',
  standalone: true,
  imports: [
    CommonModule,
    BrnPopoverImports,
    HlmPopoverImports,
    HlmButton,
    NgIconComponent
  ],
  providers: [provideIcons({ lucideHelpCircle })],
  template: `
    <hlm-popover>
      <button hlmBtn variant="ghost" size="sm" hlmPopoverTrigger 
              class="size-5 p-0 rounded-full text-muted-foreground/60 hover:text-foreground transition-colors"
              [aria-label]="label()">
        <ng-icon name="lucideHelpCircle" class="size-3.5"></ng-icon>
      </button>
      <div *brnPopoverContent="let ctx" hlmPopoverContent 
           class="w-72 max-w-[calc(100vw-2rem)] p-4 shadow-xl border-border bg-popover text-popover-foreground">
         <div class="flex flex-col gap-1">
           @if (title()) {
             <h4 class="font-bold text-sm tracking-tight">{{ title() }}</h4>
           }
           <p class="text-[11px] leading-relaxed text-muted-foreground">
             <ng-content></ng-content>
           </p>
         </div>
      </div>
    </hlm-popover>
  `
})
export class InfoTooltip {
  title = input<string>('');
  label = input<string>('Mais informações');
}
