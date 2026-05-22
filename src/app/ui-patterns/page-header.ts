import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="border-b border-border bg-background/50 backdrop-blur-md sticky top-0 z-50 {{ addClass() }}">
      <div [class]="headerClasses()"
           [class.justify-center]="centered()"
           [class.justify-between]="!centered()">
        <div class="flex flex-col gap-1 min-w-0" [class.items-center]="centered()">
          <div class="flex items-center gap-2">
            <ng-content select="[breadcrumb]"></ng-content>
          </div>
          <div class="flex items-center gap-3">
             <ng-content select="[icon]"></ng-content>
             <div class="flex flex-col">
               <h1 class="text-xl font-bold tracking-tight text-foreground truncate">
                 <ng-content select="[title]"></ng-content>
               </h1>
               <p class="text-xs text-muted-foreground line-clamp-1">
                 <ng-content select="[description]"></ng-content>
               </p>
             </div>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <ng-content select="[actions]"></ng-content>
        </div>
      </div>
      <ng-content select="[tabs]"></ng-content>
    </header>
  `
})
export class PageHeader {
  addClass = input<string>('', { alias: 'class' });
  centered = input<boolean>(false);
  size = input<'xs' | 'small' | 'medium' | 'default' | 'large' | 'full'>('default');

  protected headerClasses(): string {
    const base = 'mx-auto px-6 h-16 sm:h-20 flex items-center gap-4';
    const sizes = {
      xs: 'max-w-2xl',
      small: 'max-w-3xl',
      medium: 'max-w-5xl',
      default: 'max-w-7xl',
      large: 'max-w-(screen-2xl)',
      full: 'max-w-none'
    };
    return `${base} ${sizes[this.size()]}`;
  }
}
