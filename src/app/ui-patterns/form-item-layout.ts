import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-form-item-layout',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="rootClasses()">
      <div [class]="labelWrapperClasses()">
        @if (label()) {
          <div class="flex items-center gap-2">
            <label class="text-sm font-bold text-foreground tracking-tight">{{ label() }}</label>
            <ng-content select="[labelAddon]"></ng-content>
          </div>
        }
        @if (description()) {
          <p class="text-xs text-muted-foreground leading-relaxed max-w-sm">{{ description() }}</p>
        }
      </div>
      <div [class]="contentWrapperClasses()">
        <ng-content></ng-content>
        @if (errorMessage()) {
          <p class="text-[10px] text-destructive font-bold mt-1.5">
            {{ errorMessage() }}
          </p>
        }
      </div>
    </div>
  `
})
export class FormItemLayout {
  label = input<string>();
  description = input<string>();
  errorMessage = input<string | null>();
  layout = input<'horizontal' | 'vertical' | 'flex-row-reverse'>('flex-row-reverse');
  className = input<string>('');

  protected rootClasses = computed(() => {
    const base = 'px-8 lg:px-14 py-10 border-b border-white/10 last:border-0 ' + this.className();
    if (this.layout() === 'flex-row-reverse' || this.layout() === 'horizontal') {
      return base + ' grid grid-cols-1 lg:grid-cols-12 gap-x-12 xl:gap-x-20 gap-y-8 items-start';
    }
    return base + ' flex flex-col gap-6';
  });

  protected labelWrapperClasses = computed(() => {
    if (this.layout() === 'flex-row-reverse' || this.layout() === 'horizontal') {
      return 'col-span-1 lg:col-span-5 flex flex-col gap-2';
    }
    return 'flex flex-col gap-2';
  });

  protected contentWrapperClasses = computed(() => {
    if (this.layout() === 'flex-row-reverse' || this.layout() === 'horizontal') {
      return 'col-span-1 lg:col-span-7 w-full';
    }
    return 'w-full';
  });
}
