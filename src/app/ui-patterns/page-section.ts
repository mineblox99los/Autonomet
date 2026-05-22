import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-page-section',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section [class]="sectionClasses()">
      <div class="flex flex-col gap-1 flex-1 min-w-0" [class.items-center]="centered()" [class.text-center]="centered()">
        <h2 class="text-xl font-bold text-foreground">
          <ng-content select="[title]"></ng-content>
        </h2>
        <p class="text-sm text-muted-foreground leading-relaxed max-w-2xl" [class.mx-auto]="centered()">
          <ng-content select="[description]"></ng-content>
        </p>
        <div class="mt-2">
           <ng-content select="[aside]"></ng-content>
        </div>
      </div>
      <div class="flex-1 w-full">
        <ng-content></ng-content>
      </div>
    </section>
  `
})
export class PageSection {
  orientation = input<'vertical' | 'horizontal'>('vertical');
  centered = input<boolean>(false);

  protected sectionClasses(): string {
    const base = 'flex flex-col gap-8 py-8 first:pt-0';
    const orientation = this.orientation() === 'horizontal' ? 'lg:flex-row lg:items-start lg:text-left' : '';
    const alignment = this.centered() ? 'items-center' : '';
    return `${base} ${orientation} ${alignment}`;
  }
}
