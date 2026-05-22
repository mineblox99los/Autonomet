import { Component, input, signal, forwardRef, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmButton } from '@spartan-ng/helm/button';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideEye, lucideEyeOff, lucideCopy, lucideCheck } from '@ng-icons/lucide';

@Component({
  selector: 'app-data-input',
  standalone: true,
  imports: [CommonModule, FormsModule, HlmInput, HlmButton, NgIconComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DataInput),
      multi: true
    },
    provideIcons({ lucideEye, lucideEyeOff, lucideCopy, lucideCheck })
  ],
  template: `
    <div [class]="containerClassName()">
      <div class="relative flex items-center group">
        <input
          hlmInput
          [type]="inputType()"
          [placeholder]="placeholder()"
          [value]="currentValue()"
          (input)="onInput($event)"
          [readOnly]="readOnly()"
          class="w-full pr-24 bg-muted/20 border-border rounded-xl px-4 h-11 transition-all focus:bg-background"
          [class.border-destructive]="isError()"
          [attr.data-1p-ignore]="ignorePasswordManagers() ? '' : null"
        />
        
        <div class="absolute right-1.5 flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
          @if (reveal()) {
            <button
              hlmBtn
              variant="ghost"
              size="sm"
              class="size-8 p-0 rounded-lg text-muted-foreground/60 hover:text-foreground transition-colors"
              (click)="toggleReveal()"
              type="button"
              [title]="isRevealed() ? 'Ocultar valor' : 'Mostrar valor'"
            >
              <ng-icon [name]="isRevealed() ? 'lucideEyeOff' : 'lucideEye'" class="size-4"></ng-icon>
            </button>
          }
          
          @if (copy()) {
            <button
              hlmBtn
              variant="ghost"
              size="sm"
              class="size-8 p-0 rounded-lg text-muted-foreground/60 hover:text-foreground transition-colors"
              (click)="copyToClipboard()"
              type="button"
              [title]="isCopied() ? 'Copiado!' : 'Copiar para área de transferência'"
            >
              <ng-icon [name]="isCopied() ? 'lucideCheck' : 'lucideCopy'" 
                       [class.text-emerald-500]="isCopied()"
                       class="size-4"></ng-icon>
            </button>
          }
        </div>
      </div>
    </div>
  `
})
export class DataInput implements ControlValueAccessor {
  inputValue = input<string>('', { alias: 'value' });
  internalValue = signal<string>('');
  
  placeholder = input<string>('');
  containerClassName = input<string>('w-full');
  readOnly = input<boolean>(false);
  copy = input<boolean>(false);
  reveal = input<boolean>(false);
  isError = input<boolean>(false);
  ignorePasswordManagers = input<boolean>(true);

  isRevealed = signal(false);
  isCopied = signal(false);

  currentValue = computed(() => this.internalValue() || this.inputValue());

  inputType = computed(() => {
    if (this.reveal() && !this.isRevealed()) {
      return 'password';
    }
    return 'text';
  });

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  onInput(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    this.internalValue.set(val);
    this.onChange(val);
  }

  toggleReveal() {
    this.isRevealed.update(v => !v);
  }

  copyToClipboard() {
    const textToCopy = this.currentValue();
    navigator.clipboard.writeText(textToCopy).then(() => {
      this.isCopied.set(true);
      setTimeout(() => this.isCopied.set(false), 2000);
    });
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    this.internalValue.set(value || '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState?(_isDisabled: boolean): void {
    // Handle disabled state if necessary
  }
}
