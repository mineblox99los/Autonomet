import { Component, input, output, model, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BrnDialogImports } from '@spartan-ng/brain/dialog';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideAlertTriangle } from '@ng-icons/lucide';

@Component({
  selector: 'app-text-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BrnDialogImports,
    HlmDialogImports,
    HlmButton,
    HlmInput,
    NgIconComponent
  ],
  providers: [provideIcons({ lucideAlertTriangle })],
  template: `
    <brn-dialog [state]="isOpen() ? 'open' : 'closed'" (closed)="onClosed()">
      <hlm-dialog-content class="sm:max-w-[425px] rounded-2xl border-border bg-card/95 backdrop-blur-xl" *brnDialogContent="let ctx">
        <hlm-dialog-header>
          <div class="flex items-center gap-3 mb-2">
             <div class="size-9 rounded-full bg-destructive/10 flex items-center justify-center border border-destructive/20 shadow-sm">
                <ng-icon name="lucideAlertTriangle" class="text-destructive size-5"></ng-icon>
             </div>
             <h3 hlmDialogTitle class="text-lg font-bold tracking-tight text-destructive">{{ title() }}</h3>
          </div>
          
          <div class="text-sm leading-relaxed text-muted-foreground/80 space-y-3">
            <ng-content></ng-content>
                        <div class="p-3 bg-muted/30 rounded-xl border border-border/50">
               <p class="text-[11px] font-medium leading-normal">
                 To confirm, type <span class="font-bold text-foreground">{{ confirmString() }}</span> in the field below:
               </p>
            </div>
          </div>
        </hlm-dialog-header>

        <div class="py-4">
           <input hlmInput
                  [(ngModel)]="userInput"
                  [placeholder]="confirmPlaceholder()"
                  class="w-full rounded-xl h-11 bg-muted/20 border-border focus:bg-background"
                  autocomplete="off"
                  (keyup.enter)="onEnterPressed()" />
        </div>

        <hlm-dialog-footer class="mt-4 flex flex-col-reverse sm:flex-row gap-3">
          <button hlmBtn variant="ghost" (click)="isOpen.set(false); canceled.emit()" class="flex-1 rounded-xl h-11 font-bold uppercase text-[10px] tracking-widest border border-border/50 hover:bg-muted/50">
            Cancel
          </button>
          <button hlmBtn 
                  variant="destructive" 
                  [disabled]="!isConfirmed() || loading()"
                  (click)="handleConfirm()" 
                  class="flex-1 rounded-xl h-11 font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-destructive/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
            {{ loading() ? loadingLabel() : confirmLabel() }}
          </button>
        </hlm-dialog-footer>
      </hlm-dialog-content>
    </brn-dialog>
  `
})
export class TextConfirmDialog {
  isOpen = model<boolean>(false);
  title = input<string>('Confirmation Required');
  confirmString = input.required<string>();
  confirmPlaceholder = input<string>('Type to confirm');
  confirmLabel = input<string>('Confirm');
  loading = input<boolean>(false);
  loadingLabel = input<string>('Processing...');
  
  confirm = output<void>();
  canceled = output<void>();

  protected userInput = '';

  protected isConfirmed = computed(() => {
    return this.userInput.trim() === this.confirmString().trim();
  });

  protected onClosed() {
    this.isOpen.set(false);
    this.userInput = '';
  }

  protected handleConfirm() {
    if (this.isConfirmed() && !this.loading()) {
      this.confirm.emit();
      this.isOpen.set(false);
    }
  }

  protected onEnterPressed() {
    this.handleConfirm();
  }
}
