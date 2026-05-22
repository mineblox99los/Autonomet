import { Component, input, output, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrnDialogImports } from '@spartan-ng/brain/dialog';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmButton } from '@spartan-ng/helm/button';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideAlertTriangle } from '@ng-icons/lucide';

@Component({
  selector: 'app-confirmation-modal',
  standalone: true,
  imports: [
    CommonModule,
    BrnDialogImports,
    HlmDialogImports,
    HlmButton,
    NgIconComponent
  ],
  providers: [provideIcons({ lucideAlertTriangle })],
  template: `
    <brn-dialog [state]="isOpen() ? 'open' : 'closed'" (closed)="isOpen.set(false)">
      <hlm-dialog-content class="sm:max-w-[425px] rounded-2xl border-border bg-card/95 backdrop-blur-xl" *brnDialogContent="let ctx">
        <hlm-dialog-header>
          @if (variant() !== 'default') {
            <div class="flex items-center gap-3 mb-2">
               <div class="size-9 rounded-full flex items-center justify-center border border-border/50 shadow-sm" 
                    [class.bg-destructive/10]="variant() === 'destructive'"
                    [class.bg-amber-500/10]="variant() === 'warning'">
                  <ng-icon name="lucideAlertTriangle" 
                           [class.text-destructive]="variant() === 'destructive'"
                           [class.text-amber-500]="variant() === 'warning'"
                           class="size-5"></ng-icon>
               </div>
               <h3 hlmDialogTitle class="text-lg font-bold tracking-tight" [class.text-destructive]="variant() === 'destructive'">{{ title() }}</h3>
            </div>
          }
          
          @if (variant() === 'default') {
            <h3 hlmDialogTitle class="text-lg font-bold tracking-tight">{{ title() }}</h3>
          }
          
          <p hlmDialogDescription class="text-sm leading-relaxed text-muted-foreground/80">
            <ng-content></ng-content>
          </p>
        </hlm-dialog-header>

        <hlm-dialog-footer class="mt-8 flex flex-col-reverse sm:flex-row gap-3">
          <button hlmBtn variant="ghost" (click)="isOpen.set(false); canceled.emit()" class="flex-1 rounded-xl h-11 font-bold uppercase text-[10px] tracking-widest border border-border/50 hover:bg-muted/50">
            {{ cancelLabel() }}
          </button>
          <button hlmBtn 
                  [variant]="variant() === 'destructive' ? 'destructive' : 'default'" 
                  (click)="confirm.emit(); isOpen.set(false)" 
                  class="flex-1 rounded-xl h-11 font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-primary/10"
                  [disabled]="loading()">
            {{ loading() ? loadingLabel() : confirmLabel() }}
          </button>
        </hlm-dialog-footer>
      </hlm-dialog-content>
    </brn-dialog>
  `
})
export class ConfirmationModal {
  isOpen = model<boolean>(false);
  title = input<string>('Confirm action');
  variant = input<'default' | 'destructive' | 'warning'>('default');
  confirmLabel = input<string>('Confirm');
  cancelLabel = input<string>('Cancel');
  loading = input<boolean>(false);
  loadingLabel = input<string>('Processing...');
  
  confirm = output<void>();
  canceled = output<void>();
}
