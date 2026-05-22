import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

type ContainerSize = 'xs' | 'small' | 'medium' | 'default' | 'large' | 'full';

@Component({
  selector: 'app-page-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="containerClasses()" [class.mx-auto]="true">
      <ng-content></ng-content>
    </div>
  `
})
export class PageContainer {
  size = input<ContainerSize>('default');
  addClass = input<string>('', { alias: 'class' });

  protected containerClasses(): string {
    const base = 'px-4 sm:px-6 w-full';
    const sizes = {
      xs: 'max-w-2xl',
      small: 'max-w-3xl',
      medium: 'max-w-5xl',
      default: 'max-w-7xl',
      large: 'max-w-(screen-2xl)',
      full: 'max-w-none'
    };
    
    return `${base} ${sizes[this.size()]} ${this.addClass()}`;
  }
}
